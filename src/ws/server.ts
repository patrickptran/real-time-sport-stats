import { Server, WebSocket, WebSocketServer } from "ws";
import {
  verifyToken,
  extractTokenFromHeader,
  TokenPayload,
} from "../utils/jwt";

interface AuthenticatedWebSocket extends WebSocket {
  isAlive?: boolean;
  userId?: string;
}

const sendJson = (socket: WebSocket, payload: any) => {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
};

const broadcast = (wss: WebSocketServer, payload: any) => {
  for (let client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(JSON.stringify(payload));
  }
};

export const attachWebSocketServer = (server: any) => {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", (socket: AuthenticatedWebSocket, request) => {
    // Extract and verify JWT token from query params or headers
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    const token =
      url.searchParams.get("token") ||
      extractTokenFromHeader(request.headers.authorization);

    if (!token) {
      sendJson(socket, {
        type: "error",
        message: "Missing authentication token",
      });
      socket.close(1008, "Unauthorized");
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      sendJson(socket, { type: "error", message: "Invalid or expired token" });
      socket.close(1008, "Unauthorized");
      return;
    }

    // Attach user info to socket
    socket.userId = payload.userId;
    socket.isAlive = true;

    socket.on("pong", () => {
      socket.isAlive = true;
    });

    sendJson(socket, { type: "welcome", userId: payload.userId });
    socket.on("error", console.error);
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      // @ts-ignore
      if (ws.isAlive === false) return ws.terminate();
      // @ts-ignore
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  function broadcastMatchCreated(match: any) {
    broadcast(wss, { type: "match_created", data: match });
  }

  return { broadcastMatchCreated };
};
