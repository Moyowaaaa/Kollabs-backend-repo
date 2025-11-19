import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/db";
import cors from "cors";
import type { Express, Request, Response } from "express";

import ErrorLogger from "./middleware/ErrorLogger";
import httpLogger from "./lib/log/morgan.log";
import logger from "./lib/log/winston.log";

// Routes

dotenv.config();

const app: Express = express();

const allowedOrigins: string[] = [
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

app.use(httpLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(ErrorLogger);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    port: port,
    pid: process.pid,
    uptime: process.uptime(),
  });
});

console.log("Starting server...");

const port = process.env.PORT || 8081;

app.listen(port, () => {
  logger.info(`App running on port ${port}.....`);
  void connectDB().catch((error: unknown) => {
    console.error("Database connection failed. Exiting...", error);
    process.exit(1);
  });
});

process.on("uncaughtException", (err: Error) => {
  console.error("There was an uncaught error", err);
  process.exit(1);
});

process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    console.error("Unhandled rejection at:", promise, "reason:", reason);
  }
);
