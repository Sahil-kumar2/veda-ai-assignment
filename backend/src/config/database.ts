import mongoose from "mongoose";
import { config } from "./env";
import { logger } from "../utils/logger";

/**
 * Establishes Mongoose connection.
 * Atlas-friendly defaults are configurable via env.
 */
export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      dbName: config.mongo.dbName,
      autoIndex: !config.isProd,
      maxPoolSize: config.mongo.maxPoolSize,
      minPoolSize: config.mongo.minPoolSize,
      serverSelectionTimeoutMS: config.mongo.serverSelectionTimeoutMS,
      socketTimeoutMS: config.mongo.socketTimeoutMS,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected. Reconnecting...");
    });

    mongoose.connection.on("error", (err: Error) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });
  } catch (error) {
    const err = error as Error;
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

