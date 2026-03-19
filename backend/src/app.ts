import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { isAllowedOrigin } from "./config/cors";

import healthRoute from "./routes/health.route";
import assignmentRoutes from "./modules/assignment/assignment.routes";

import errorHandler from "./middleware/errorHandler";
import notFound from "./middleware/notFound";

export const createApp = (): Application => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS blocked for origin: ${origin ?? "unknown"}`));
      },
      credentials: true,
    })
  );
  app.use(morgan("dev"));
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/health", healthRoute);
  app.use("/api/v1/assignments", assignmentRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
