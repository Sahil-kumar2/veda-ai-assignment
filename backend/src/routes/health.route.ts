import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /health
 *
 * Health check endpoint — used by load balancers, Docker, and monitoring
 * tools (e.g., UptimeRobot) to verify the server is running.
 *
 * Returns:
 *   - status: "ok"
 *   - uptime: seconds the process has been running
 *   - timestamp: current UTC ISO string
 *   - environment: NODE_ENV
 */
router.get("/", (_req: Request, res: Response): void => {
  res.status(200).json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development",
  });
});

export default router;
