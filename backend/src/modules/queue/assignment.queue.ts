import { Queue } from "bullmq";
import { config } from "../../config/env";
import { logger } from "../../utils/logger";

export const ASSIGNMENT_QUEUE_NAME = "assignment-generation";

export const bullmqConnection = {
  host: config.redis.host,
  port: config.redis.port,
  username: config.redis.username,
  password: config.redis.password,
  tls: config.redis.url?.startsWith("rediss://") ? {} : undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

let assignmentQueue: Queue | null = null;

const getAssignmentQueue = (): Queue => {
  if (assignmentQueue) {
    return assignmentQueue;
  }

  assignmentQueue = new Queue(ASSIGNMENT_QUEUE_NAME, {
    connection: bullmqConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: {
        count: 100,
      },
      removeOnFail: {
        count: 200,
      },
    },
  });

  assignmentQueue.on("error", (err: Error & { code?: string }) => {
    logger.error(
      `[Queue] assignment-generation error: ${err.message || err.code || String(err)}`
    );
  });

  return assignmentQueue;
};

export interface AssignmentJobPayload {
  assignmentId: string;
  payload: {
    title: string;
    dueDate: string;
    questionTypes: string[];
    questionDistribution?: {
      type: string;
      count: number;
      marksPerQuestion: number;
    }[];
    referenceMaterials?: {
      fileName: string;
      mimeType: string;
      size: number;
      extractedText: string;
    }[];
    totalQuestions: number;
    totalMarks: number;
    instructions?: string;
  };
}

interface AddAssignmentJobOptions {
  jobId?: string;
}

export const addAssignmentJob = async (
  data: AssignmentJobPayload,
  options?: AddAssignmentJobOptions
): Promise<void> => {
  const queue = getAssignmentQueue();
  const resolvedJobId = options?.jobId ?? data.assignmentId;
  const job = await queue.add(
    `generate:${data.assignmentId}`,
    data,
    { jobId: resolvedJobId }
  );

  logger.info(
    `[Queue] Job enqueued -> id: ${job.id} | assignmentId: ${data.assignmentId}`
  );
};
