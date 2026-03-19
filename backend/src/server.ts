import http from "http";
import { createApp } from "./app";
import { connectDB } from "./config/database";
import { connectRedis } from "./config/redis";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import { initSocketServer } from "./websocket/socket";

/**
 * bootstrap — server entry point.
 *
 * Startup order:
 *  1. Connect MongoDB (fatal on failure)
 *  2. Connect Redis   (non-fatal — queues will fail gracefully)
 *  3. Create Express app
 *  4. Wrap in native http.Server so Socket.IO can share the same port
 *  5. Attach Socket.IO to the HTTP server
 *  6. Start listening
 *
 * Graceful shutdown handles SIGTERM (Docker stop) and SIGINT (Ctrl+C).
 */
const bootstrap = async (): Promise<void> => {
  try {
    // 1. Database connections
    await connectDB();
    const isRedisConnected = await connectRedis();

    if (isRedisConnected) {
      await import("./modules/queue/worker");
      logger.info("Background worker started");
    } else {
      logger.warn("Worker not started because Redis is unavailable");
    }

    // 2. Express app
    const app = createApp();

    // 3. HTTP server (wraps Express so Socket.IO can share port 5000)
    const httpServer = http.createServer(app);

    // 4. Socket.IO — must init BEFORE listen()
    initSocketServer(httpServer);

    // 5. Start listening
    httpServer.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} [${config.env}]`);
      logger.info(`🔌 WebSocket ready on ws://localhost:${config.port}`);
    });

    // ─── Graceful Shutdown ───────────────────────────────────────────────────
    const shutdown = (signal: string): void => {
      logger.warn(`\n⚠️  ${signal} received — shutting down gracefully`);

      httpServer.close(() => {
        logger.info("✅  HTTP + WebSocket server closed");
        process.exit(0);
      });

      setTimeout(() => {
        logger.error("❌  Shutdown timeout — forcing exit");
        process.exit(1);
      }, 10_000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT",  () => shutdown("SIGINT"));

    process.on("unhandledRejection", (reason: unknown) => {
      logger.error(`Unhandled Promise Rejection: ${String(reason)}`);
      process.exit(1);
    });

    process.on("uncaughtException", (err: Error) => {
      logger.error(`Uncaught Exception: ${err.message}`);
      process.exit(1);
    });
  } catch (error) {
    const err = error as Error;
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

bootstrap();
