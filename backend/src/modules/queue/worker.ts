import { Job, Worker } from "bullmq";
import { logger } from "../../utils/logger";
import { Assignment } from "../assignment/assignment.model";
import { AssignmentOutput } from "../ai/schema";
import { buildPrompt } from "../ai/promptBuilder";
import { callLLM } from "../ai/llmClient";
import { parseLLMResponse } from "../ai/parser";
import {
  ASSIGNMENT_QUEUE_NAME,
  AssignmentJobPayload,
  bullmqConnection,
} from "./assignment.queue";
import { emitAssignmentUpdate } from "../../websocket/emitter";
import { invalidateAssignmentCache } from "../assignment/assignment.service";

const markProcessing = async (assignmentId: string): Promise<void> => {
  await Assignment.findByIdAndUpdate(assignmentId, { status: "processing" });
  await invalidateAssignmentCache(assignmentId);
  logger.info(`[Worker] [${assignmentId}] status -> processing`);
};

const markCompleted = async (
  assignmentId: string,
  result: AssignmentOutput
): Promise<void> => {
  await Assignment.findByIdAndUpdate(assignmentId, {
    status: "completed",
    result,
  });
  await invalidateAssignmentCache(assignmentId);
  logger.info(`[Worker] [${assignmentId}] status -> completed`);
};

const markFailed = async (
  assignmentId: string,
  errorMessage: string
): Promise<void> => {
  await Assignment.findByIdAndUpdate(assignmentId, {
    status: "failed",
    result: { error: errorMessage },
  });
  await invalidateAssignmentCache(assignmentId);
  logger.error(`[Worker] [${assignmentId}] status -> failed: ${errorMessage}`);
};

const processAssignmentJob = async (
  job: Job<AssignmentJobPayload>
): Promise<void> => {
  const { assignmentId, payload } = job.data;

  logger.info(
    `[Worker] Job started id=${job.id} assignmentId=${assignmentId} attempt=${
      job.attemptsMade + 1
    }`
  );

  try {
    await markProcessing(assignmentId);
    emitAssignmentUpdate({
      assignmentId,
      status: "processing",
    });

    const messages = buildPrompt(payload);
    const llmResponse = await callLLM(messages);
    const structured = parseLLMResponse(llmResponse.raw);

    await markCompleted(assignmentId, structured);
    emitAssignmentUpdate({
      assignmentId,
      status: "completed",
      result: structured as unknown as Record<string, unknown>,
    });

    logger.info(`[Worker] [${assignmentId}] job completed`);
  } catch (error) {
    const err = error as Error;
    await markFailed(assignmentId, err.message);
    emitAssignmentUpdate({
      assignmentId,
      status: "failed",
      error: err.message,
    });
    throw error;
  }
};

const worker = new Worker<AssignmentJobPayload>(
  ASSIGNMENT_QUEUE_NAME,
  processAssignmentJob,
  {
    connection: bullmqConnection,
    concurrency: 3,
    limiter: {
      max: 10,
      duration: 60_000,
    },
  }
);

worker.on("completed", (job: Job) => {
  logger.info(`[Worker] job ${job.id} completed`);
});

worker.on("failed", (job: Job | undefined, err: Error & { code?: string }) => {
  logger.error(
    `[Worker] job ${job?.id} failed at attempt ${
      (job?.attemptsMade ?? 0) + 1
    }: ${err.message || err.code || String(err)}`
  );
});

worker.on("error", (err: Error & { code?: string }) => {
  logger.error(`[Worker] connection error: ${err.message || err.code || String(err)}`);
});

worker.on("stalled", (jobId: string) => {
  logger.warn(`[Worker] job ${jobId} stalled and will be retried`);
});

export { worker };
