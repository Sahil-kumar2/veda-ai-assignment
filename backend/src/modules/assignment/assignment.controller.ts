import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { createAssignmentSchema } from "./assignment.validation";
import {
  createAssignment,
  getAssignmentById,
  regenerateAssignment,
} from "./assignment.service";
import { extractReferenceMaterials } from "./fileExtraction";

const parseJsonArrayField = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

/**
 * Assignment Controller
 *
 * Each handler:
 *   1. Validates input (delegates to Zod schema)
 *   2. Calls the service layer (no DB code here)
 *   3. Returns a standardised ApiResponse
 *
 * All methods are wrapped in asyncHandler so errors bubble up
 * to the global errorHandler without try/catch clutter.
 */

// ─── POST /api/v1/assignments ─────────────────────────────────────────────────

/**
 * createAssignmentHandler
 *
 * - Validates request body with Zod
 * - Calls createAssignment() service (persists + enqueues)
 * - Returns 201 with the new assignmentId
 */
export const createAssignmentHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Validate — Zod returns a discriminated union (success | error)
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const referenceMaterials = extractReferenceMaterials(files);
    const payload = {
      ...req.body,
      questionTypes: parseJsonArrayField(req.body.questionTypes),
      questionDistribution: parseJsonArrayField(req.body.questionDistribution),
      referenceMaterials: referenceMaterials.length > 0 ? referenceMaterials : undefined,
    };
    const parsed = createAssignmentSchema.safeParse(payload);

    if (!parsed.success) {
      // Flatten Zod issues into a readable array of error strings
      const errors = parsed.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      throw new ApiError(422, "Validation failed", errors);
    }

    const assignment = await createAssignment(parsed.data);

    res.status(201).json(
      new ApiResponse(201, "Assignment created and queued for generation", {
        success: true,
        assignmentId: assignment._id.toString(),
      })
    );
  }
);

// ─── GET /api/v1/assignments/:id ──────────────────────────────────────────────

/**
 * getAssignmentHandler
 *
 * - Reads :id from route params
 * - Calls getAssignmentById() service (throws 400/404 if invalid/missing)
 * - Returns the full assignment document
 */
export const getAssignmentHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Assignment ID is required");
    }

    const assignment = await getAssignmentById(id);

    res.status(200).json(
      new ApiResponse(200, "Assignment fetched successfully", {
        assignmentId: assignment._id.toString(),
        status: assignment.status,
        result: assignment.result ?? null,
        assignment,
      })
    );
  }
);

export const regenerateAssignmentHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Assignment ID is required");
    }

    const assignment = await regenerateAssignment(id);

    res.status(202).json(
      new ApiResponse(202, "Assignment re-queued for generation", {
        success: true,
        assignmentId: assignment._id.toString(),
        status: assignment.status,
      })
    );
  }
);
