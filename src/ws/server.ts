import { Server, WebSocket, WebSocketServer } from "ws";

declare global {
  namespace WebSocket {
    interface WebSocket {
      isAlive?: boolean;
    }
  }
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

  wss.on("conection", (socket) => {
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });

    sendJson(socket, { type: "welcome" });
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
