import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { logger } from "../utils/logger";
import { isAllowedOrigin } from "../config/cors";

export type AssignmentRealtimeStatus = "processing" | "completed" | "failed";

export interface AssignmentUpdatePayload {
  assignmentId: string;
  status: AssignmentRealtimeStatus;
  result?: Record<string, unknown>;
  error?: string;
}

interface ClientToServerEvents {
  subscribe: (payload: { assignmentId: string }) => void;
}

interface ServerToClientEvents {
  "assignment:update": (payload: AssignmentUpdatePayload) => void;
}

type AssignmentSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;

export const assignmentRoom = (assignmentId: string): string =>
  `assignment:${assignmentId}`;

export const initSocketServer = (
  httpServer: HttpServer
): SocketIOServer<ClientToServerEvents, ServerToClientEvents> => {
  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Socket CORS blocked for origin: ${origin ?? "unknown"}`));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60_000,
    pingInterval: 25_000,
  });

  io.on("connection", (socket: AssignmentSocket) => {
    logger.info(`[WS] Client connected: ${socket.id}`);

    socket.on("subscribe", ({ assignmentId }) => {
      if (!assignmentId || !/^[a-zA-Z0-9_-]{6,64}$/.test(assignmentId)) {
        logger.warn(`[WS] Invalid subscribe payload from socket ${socket.id}`);
        return;
      }
      const room = assignmentRoom(assignmentId);
      void socket.join(room);
      logger.info(`[WS] Socket ${socket.id} subscribed to room: ${room}`);
    });

    socket.on("disconnect", (reason) => {
      logger.info(`[WS] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  logger.info("[WS] Socket.IO initialized");
  return io;
};

export const getSocketServer = (): SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents
> => {
  if (!io) {
    throw new Error("Socket server is not initialized. Call initSocketServer first.");
  }

  return io;
};
