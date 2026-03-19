import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const normalizeEnvValue = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.replace(/^["']|["']$/g, "");
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("5000"),
  MONGO_URI: z.string({ required_error: "MONGO_URI is required in .env" }),
  MONGO_DB_NAME: z.string().optional(),
  MONGO_MAX_POOL_SIZE: z.string().default("20"),
  MONGO_MIN_POOL_SIZE: z.string().default("2"),
  MONGO_SERVER_SELECTION_TIMEOUT_MS: z.string().default("8000"),
  MONGO_SOCKET_TIMEOUT_MS: z.string().default("45000"),

  REDIS_URL: z.string().optional(),
  REDIS_USERNAME: z.string().optional(),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().default("6379"),
  REDIS_PASSWORD: z.string().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  GROQ_API_KEY: z.string({ required_error: "GROQ_API_KEY is required in .env" }),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),
  GROQ_BASE_URL: z.string().default("https://api.groq.com/openai/v1"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const redisUrl = normalizeEnvValue(parsed.data.REDIS_URL);
const parsedRedisUrl = redisUrl ? new URL(redisUrl) : null;

export const config = {
  env: parsed.data.NODE_ENV,
  port: parseInt(parsed.data.PORT, 10),
  mongoUri: parsed.data.MONGO_URI,
  mongo: {
    dbName: normalizeEnvValue(parsed.data.MONGO_DB_NAME),
    maxPoolSize: parseInt(parsed.data.MONGO_MAX_POOL_SIZE, 10),
    minPoolSize: parseInt(parsed.data.MONGO_MIN_POOL_SIZE, 10),
    serverSelectionTimeoutMS: parseInt(parsed.data.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10),
    socketTimeoutMS: parseInt(parsed.data.MONGO_SOCKET_TIMEOUT_MS, 10),
  },
  redis: {
    url: redisUrl,
    host: parsedRedisUrl?.hostname ?? parsed.data.REDIS_HOST,
    port: parsedRedisUrl?.port
      ? parseInt(parsedRedisUrl.port, 10)
      : parseInt(parsed.data.REDIS_PORT, 10),
    username: parsedRedisUrl?.username || normalizeEnvValue(parsed.data.REDIS_USERNAME),
    password: parsedRedisUrl?.password || parsed.data.REDIS_PASSWORD,
  },
  groq: {
    apiKey: normalizeEnvValue(parsed.data.GROQ_API_KEY) as string,
    model: parsed.data.GROQ_MODEL,
    baseUrl: normalizeEnvValue(parsed.data.GROQ_BASE_URL) as string,
  },
  corsOrigin: normalizeEnvValue(parsed.data.CORS_ORIGIN) as string,
  isDev: parsed.data.NODE_ENV === "development",
  isProd: parsed.data.NODE_ENV === "production",
} as const;
