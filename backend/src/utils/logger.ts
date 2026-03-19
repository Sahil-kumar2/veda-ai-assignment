/**
 * Logger utility
 *
 * A lightweight, timestamped console logger.
 * Exposes the same API surface as Winston/Pino so it can be swapped
 * for a structured logger in production without changing call sites.
 */

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

const formatMessage = (level: LogLevel, message: string): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
};

export const logger = {
  info: (message: string): void => {
    console.log(formatMessage("INFO", message));
  },

  warn: (message: string): void => {
    console.warn(formatMessage("WARN", message));
  },

  error: (message: string): void => {
    console.error(formatMessage("ERROR", message));
  },

  debug: (message: string): void => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatMessage("DEBUG", message));
    }
  },
};
