import { Assignment } from "./assignment.model";
import { IAssignment, IAssignmentDocument } from "./assignment.types";
import { CreateAssignmentInput } from "./assignment.validation";
import { addAssignmentJob } from "../queue/assignment.queue";
import { ApiError } from "../../utils/ApiError";
import { logger } from "../../utils/logger";
import { redisClient } from "../../config/redis";

/**
 * Assignment Service
 *
 * All database interactions live here.
 * Controllers call service methods — they never touch the DB directly.
 * This separation makes unit testing and DB swapping straightforward.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const ASSIGNMENT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

const assignmentCacheKey = (id: string): string => `assignment:${id}`;

export const invalidateAssignmentCache = async (id: string): Promise<void> => {
  try {
    await redisClient.del(assignmentCacheKey(id));
  } catch (error) {
    const err = error as Error;
    logger.warn(`[Cache] Failed to invalidate assignment ${id}: ${err.message}`);
  }
};

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * createAssignment
 *
 * 1. Persists the assignment with status = "pending"
 * 2. Enqueues a BullMQ job for async AI processing
 * 3. Returns the saved document
 *
 * If the queue fails, the assignment still exists in the DB
 * so the job can be re-enqueued from an admin panel later.
 */
export const createAssignment = async (
  input: CreateAssignmentInput
): Promise<IAssignmentDocument> => {
  // Step 1 — Persist to MongoDB
  const assignment = await Assignment.create({
    ...input,
    status: ASSIGNMENT_STATUS.PENDING,
  } satisfies IAssignment);

  logger.info(`[Service] Assignment created: ${assignment._id}`);

  // Step 2 — Enqueue for AI processing
  try {
    await addAssignmentJob({
      assignmentId: assignment._id.toString(),
      payload: {
        title: input.title,
        dueDate: input.dueDate.toISOString(),
        questionTypes: input.questionTypes,
        questionDistribution: input.questionDistribution,
        referenceMaterials: input.referenceMaterials,
        totalQuestions: input.totalQuestions,
        totalMarks: input.totalMarks,
        instructions: input.instructions,
      },
    });
  } catch (queueError) {
    const err = queueError as Error;
    // Log the queue failure but don't fail the HTTP request.
    // The DB record exists — ops can re-trigger the job manually.
    logger.error(
      `[Service] Failed to enqueue assignment ${assignment._id}: ${err.message}`
    );
  }

  return assignment;
};

/**
 * getAssignmentById
 *
 * Fetches a single assignment by its MongoDB ObjectId string.
 * Throws ApiError(404) if not found so the controller stays clean.
 */
export const getAssignmentById = async (
  id: string
): Promise<IAssignmentDocument> => {
  // Guard against invalid ObjectId format to avoid a Mongoose CastError
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(400, `"${id}" is not a valid assignment ID`);
  }

  const cacheKey = assignmentCacheKey(id);
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as IAssignmentDocument;
    }
  } catch (error) {
    const err = error as Error;
    logger.warn(`[Cache] Failed to read assignment ${id}: ${err.message}`);
  }

  const assignment = await Assignment.findById(id).lean<IAssignmentDocument>();

  if (!assignment) {
    throw new ApiError(404, `Assignment with id "${id}" not found`);
  }

  try {
    const ttlSeconds = assignment.status === "completed" ? 300 : 30;
    await redisClient.set(cacheKey, JSON.stringify(assignment), "EX", ttlSeconds);
  } catch (error) {
    const err = error as Error;
    logger.warn(`[Cache] Failed to write assignment ${id}: ${err.message}`);
  }

  return assignment;
};

export const regenerateAssignment = async (
  id: string
): Promise<IAssignmentDocument> => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(400, `"${id}" is not a valid assignment ID`);
  }

  const assignment = await Assignment.findById(id);
  if (!assignment) {
    throw new ApiError(404, `Assignment with id "${id}" not found`);
  }

  assignment.status = ASSIGNMENT_STATUS.PENDING;
  assignment.result = null;
  await assignment.save();

  await invalidateAssignmentCache(id);

  try {
    await addAssignmentJob({
      assignmentId: assignment._id.toString(),
      payload: {
        title: assignment.title,
        dueDate: assignment.dueDate.toISOString(),
        questionTypes: assignment.questionTypes,
        questionDistribution: assignment.questionDistribution,
        referenceMaterials: assignment.referenceMaterials,
        totalQuestions: assignment.totalQuestions,
        totalMarks: assignment.totalMarks,
        instructions: assignment.instructions,
      },
    }, {
      // Regeneration must use a fresh job id so BullMQ doesn't dedupe old completed jobs.
      jobId: `${assignment._id.toString()}:regen:${Date.now()}`,
    });
  } catch (queueError) {
    const err = queueError as Error;
    logger.error(
      `[Service] Failed to enqueue regenerated assignment ${assignment._id}: ${err.message}`
    );
  }

  return assignment;
};
