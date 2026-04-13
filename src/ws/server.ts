import { WebSocket, WebSocketServer, RawData } from "ws";
import { verifyToken, extractTokenFromHeader } from "../utils/jwt";

interface AuthenticatedWebSocket extends WebSocket {
  isAlive?: boolean;
  userId?: string;
  subscriptions?: Set<string>;
}

const matchSubscribers = new Map<string, Set<AuthenticatedWebSocket>>();

function subscribe(matchId: string, socket: AuthenticatedWebSocket) {
  if (!matchSubscribers.has(matchId)) {
    matchSubscribers.set(matchId, new Set());
  }
  matchSubscribers.get(matchId)?.add(socket);
}
function unsubscribe(matchId: string, socket: AuthenticatedWebSocket) {
  if (!matchSubscribers.has(matchId)) return;

  matchSubscribers.get(matchId)?.delete(socket);

  if (matchSubscribers.get(matchId)?.size === 0) {
    matchSubscribers.delete(matchId);
  }
}

function cleanUpSubscriptions(socket: AuthenticatedWebSocket) {
  for (const matchId of socket.subscriptions || []) {
    unsubscribe(matchId, socket);
  }
}

function broadcastToMatch(matchId: string, payload: any) {
  const subscribers = matchSubscribers.get(matchId);

  if (!subscribers || subscribers.size === 0) return;

  const message = JSON.stringify(payload);

  for (const socket of subscribers) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  }
}

const sendJson = (socket: WebSocket, payload: any) => {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
};

const broadcastToAll = (wss: WebSocketServer, payload: any) => {
  for (let client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(JSON.stringify(payload));
  }
};

const handleMessage = (socket: AuthenticatedWebSocket, data: RawData) => {
  let message;

  try {
    message = JSON.parse(data.toString());
  } catch (err) {
    sendJson(socket, { type: "error", message: "Invalid JSON" });
  }

  if (message?.type === "subscribe" && Number.isInteger(message.matchId)) {
    subscribe(message.matchId, socket);
    socket.subscriptions?.add(message.matchId);
    sendJson(socket, { type: "subscribed", matchId: message.matchId });
  }

  if (message?.type === "unsubscribe" && Number.isInteger(message.matchId)) {
    unsubscribe(message.matchId, socket);
    socket.subscriptions?.delete(message.matchId);
    sendJson(socket, { type: "unsubscribed", matchId: message.matchId });
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

    socket.subscriptions = new Set<string>();

    sendJson(socket, { type: "welcome", userId: payload.userId });
    socket.on("message", (data) => {
      handleMessage(socket, data);
    });

    socket.on("error", () => {
      socket.terminate();
      console.error;
    });
    socket.on("close", () => {
      cleanUpSubscriptions(socket);
    });
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
    broadcastToAll(wss, { type: "match_created", data: match });
  }

  function broadcastCommentary(matchId: string, commentary: any) {
    broadcastToMatch(matchId, { type: "commentary", data: commentary });
  }

  return { broadcastMatchCreated, broadcastCommentary };
};
