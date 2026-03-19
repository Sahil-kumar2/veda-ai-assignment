import { Router } from "express";
import {
  createAssignmentHandler,
  getAssignmentHandler,
  regenerateAssignmentHandler,
} from "./assignment.controller";
import { uploadReferenceFiles } from "./upload.middleware";

/**
 * Assignment Router — mounted at /api/v1/assignments in app.ts
 *
 * POST /api/v1/assignments        → createAssignmentHandler
 * GET  /api/v1/assignments/:id    → getAssignmentHandler
 */
const router = Router();

router.post("/", uploadReferenceFiles, createAssignmentHandler);
router.get("/:id", getAssignmentHandler);
router.post("/:id/regenerate", regenerateAssignmentHandler);

export default router;
