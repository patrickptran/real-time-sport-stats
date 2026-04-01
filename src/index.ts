import express from "express";
import { matchesRouter } from "./routes/matches";
import http from "http";
import { attachWebSocketServer } from "./ws/server";

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "0.0.0.0";

const app = express();

const server = http.createServer(app);

// Use JSON middleware
app.use(express.json());

// Root GET route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Real-Time Sport Broadcast Server!" });
});

app.use("/matches", matchesRouter);

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

// Start the server
app.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server is running on ${baseUrl}`);
  console.log(`WebSocket is running on ${baseUrl.replace(/^http/, "ws")}/ws`);
});
