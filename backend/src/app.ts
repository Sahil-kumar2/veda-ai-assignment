import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config/env";

// Routes
import healthRoute from "./routes/health.route";
import assignmentRoutes from "./modules/assignment/assignment.routes";

// Middleware
import errorHandler from "./middleware/errorHandler";
import notFound from "./middleware/notFound";

/**
 * createApp — builds and configures the Express application.
 *
 * Keeping this as a factory function (rather than a bare module-level app)
 * makes it trivial to spin up a fresh instance in tests.
 */
export const createApp = (): Application => {
  const app = express();

  // ─── Security & Parsing ───────────────────────────────────────────────────
  app.use(helmet());                              // Sets secure HTTP headers
  app.use(
    cors({
      origin: config.corsOrigin ? config.corsOrigin.split(",").map((v) => v.trim()) : true,
      credentials: true,
    })
  );
  app.use(morgan("dev"));                         // HTTP request logger
  app.use(express.json({ limit: "10kb" }));       // Body parser with size limit
  app.use(express.urlencoded({ extended: true }));

  // ─── Routes ───────────────────────────────────────────────────────────────
  app.use("/health", healthRoute);
  app.use("/api/v1/assignments", assignmentRoutes);

  // ─── Error Handlers (must be LAST) ────────────────────────────────────────
  app.use(notFound);        // 404 for unmatched routes
  app.use(errorHandler);    // Global error handler

  return app;
};
