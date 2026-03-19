import { config } from "./env";

const allowedOrigins = config.corsOrigin
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const matchOriginPattern = (origin: string, pattern: string): boolean => {
  if (!pattern.includes("*")) return origin === pattern;

  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`, "i").test(origin);
};

export const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true; // allow curl/postman/same-origin non-browser requests
  return allowedOrigins.some((pattern) => matchOriginPattern(origin, pattern));
};

export const getAllowedOrigins = (): string[] => [...allowedOrigins];

