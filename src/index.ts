import express from "express";
import { matchesRouter } from "./routes/matches";
import { authRouter } from "./routes/auth";
import http from "http";
import { attachWebSocketServer } from "./ws/server";
import helmet from "helmet";
import {
  generalLimiter,
  authLimiter,
  createLimiter,
} from "./middleware/rate-limit";

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "0.0.0.0";

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting - apply general limits to all routes
app.use(generalLimiter);

const server = http.createServer(app);

// Use JSON middleware
app.use(express.json());

// Root GET route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Real-Time Sport Broadcast Server!" });
});

// Auth routes - strict rate limiting for security
app.use("/auth", authLimiter, authRouter);

// Matches routes - stricter limits for create operations
app.use("/matches", createLimiter, matchesRouter);

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

// Start the server
server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server is running on ${baseUrl}`);
  console.log(`WebSocket is running on ${baseUrl.replace(/^http/, "ws")}/ws`);
});
