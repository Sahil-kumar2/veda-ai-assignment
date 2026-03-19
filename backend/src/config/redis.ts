import Redis from "ioredis";
import { config } from "./env";
import { logger } from "../utils/logger";

const redisClient = config.redis.url
  ? new Redis(config.redis.url, {
      username: config.redis.username,
      password: config.redis.password,
      tls: config.redis.url.startsWith("rediss://") ? {} : undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    })
  : new Redis({
      host: config.redis.host,
      port: config.redis.port,
      username: config.redis.username,
      password: config.redis.password,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

redisClient.on("connect", () => {
  logger.info("Redis connected");
});

redisClient.on("ready", () => {
  logger.info("Redis ready to receive commands");
});

redisClient.on("error", (err: Error & { code?: string }) => {
  const details = err.message || err.code || String(err);
  logger.error(`Redis error: ${details}`);
});

redisClient.on("reconnecting", () => {
  logger.warn("Redis reconnecting...");
});

export const connectRedis = async (): Promise<boolean> => {
  try {
    await redisClient.connect();
    return true;
  } catch (error) {
    const err = error as Error & { code?: string };
    logger.error(`Redis connection failed: ${err.message || err.code || String(err)}`);
    return false;
  }
};

export { redisClient };
