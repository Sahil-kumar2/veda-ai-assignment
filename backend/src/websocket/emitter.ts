import { logger } from "../utils/logger";
import {
  assignmentRoom,
  AssignmentUpdatePayload,
  getSocketServer,
} from "./socket";

export const emitAssignmentUpdate = (payload: AssignmentUpdatePayload): void => {
  try {
    const io = getSocketServer();
    const room = assignmentRoom(payload.assignmentId);
    io.to(room).emit("assignment:update", payload);
    logger.info(
      `[WS] assignment:update emitted to ${room} with status=${payload.status}`
    );
  } catch (error) {
    const err = error as Error;
    logger.warn(`[WS] Failed to emit assignment update (non-fatal): ${err.message}`);
  }
};
