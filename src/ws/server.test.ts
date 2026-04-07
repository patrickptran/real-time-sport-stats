import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { attachWebSocketServer } from "./server";
import { generateToken } from "../utils/jwt";

describe("WebSocket Server Authentication", () => {
  let server: any;
  let port: number;

  beforeEach((done) => {
    server = createServer();
    port = 8001 + Math.floor(Math.random() * 1000); // Random port to avoid conflicts

    const { broadcastMatchCreated } = attachWebSocketServer(server);

    server.listen(port, done);
  });

  afterEach((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  it("should accept connection with valid token in query params", (done) => {
    const token = generateToken("user123", "test@example.com");
    const ws = new WebSocket(`ws://localhost:${port}/ws?token=${token}`);

    ws.on("open", () => {
      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
      done();
    });

    ws.on("error", (error) => {
      done(error);
    });
  });

  it("should receive welcome message with userId after authentication", (done) => {
    const token = generateToken("user456", "user456@example.com");
    const ws = new WebSocket(`ws://localhost:${port}/ws?token=${token}`);

    ws.on("message", (data: Buffer) => {
      const message = JSON.parse(data.toString());
      if (message.type === "welcome") {
        expect(message.userId).toBe("user456");
        ws.close();
        done();
      }
    });

    ws.on("error", (error) => {
      done(error);
    });
  });

  it("should reject connection without token", (done) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`);

    let receivedError = false;
    let closed = false;

    ws.on("close", (code) => {
      closed = true;
      expect(code).toBe(1008); // Policy violation code
      if (receivedError) {
        done();
      }
    });

    ws.on("message", (data: Buffer) => {
      const message = JSON.parse(data.toString());
      if (message.type === "error") {
        receivedError = true;
        expect(message.message).toContain("authentication token");
        if (closed) {
          done();
        }
      }
    });

    ws.on("error", (error) => {
      // Expected to reject
    });

    // Timeout fallback
    setTimeout(() => {
      if (closed && receivedError) {
        done();
      }
    }, 1000);
  });

  it("should reject connection with invalid token", (done) => {
    const ws = new WebSocket(
      `ws://localhost:${port}/ws?token=invalid.token.here`,
    );

    let receivedError = false;
    let closed = false;

    ws.on("close", (code) => {
      closed = true;
      expect(code).toBe(1008);
      if (receivedError) {
        done();
      }
    });

    ws.on("message", (data: Buffer) => {
      const message = JSON.parse(data.toString());
      if (message.type === "error") {
        receivedError = true;
        expect(message.message).toContain("Invalid or expired");
        if (closed) {
          done();
        }
      }
    });

    setTimeout(() => {
      if (closed && receivedError) {
        done();
      }
    }, 1000);
  });

  it("should accept connection with token in Authorization header", (done) => {
    const token = generateToken("user789");
    const ws = new WebSocket(`ws://localhost:${port}/ws`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    ws.on("open", () => {
      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
      done();
    });

    ws.on("error", (error) => {
      done(error);
    });
  });

  it("should prefer token from query params over header", (done) => {
    const tokenQuery = generateToken("user_from_query");
    const tokenHeader = generateToken("user_from_header");

    const ws = new WebSocket(`ws://localhost:${port}/ws?token=${tokenQuery}`, {
      headers: {
        Authorization: `Bearer ${tokenHeader}`,
      },
    });

    ws.on("message", (data: Buffer) => {
      const message = JSON.parse(data.toString());
      if (message.type === "welcome") {
        expect(message.userId).toBe("user_from_query");
        ws.close();
        done();
      }
    });

    ws.on("error", (error) => {
      done(error);
    });
  });

  it("should reject tampered token", (done) => {
    const token = generateToken("user123");
    const tamperedToken = token.slice(0, -5) + "xxxxx";

    const ws = new WebSocket(
      `ws://localhost:${port}/ws?token=${tamperedToken}`,
    );

    let receivedError = false;
    let closed = false;

    ws.on("close", (code) => {
      closed = true;
      expect(code).toBe(1008);
      if (receivedError) {
        done();
      }
    });

    ws.on("message", (data: Buffer) => {
      const message = JSON.parse(data.toString());
      if (message.type === "error") {
        receivedError = true;
        if (closed) {
          done();
        }
      }
    });

    setTimeout(() => {
      if (closed && receivedError) {
        done();
      }
    }, 1000);
  });

  it("should maintain connection after successful authentication", (done) => {
    const token = generateToken("user123");
    const ws = new WebSocket(`ws://localhost:${port}/ws?token=${token}`);

    let messageCount = 0;

    ws.on("message", () => {
      messageCount++;
      if (messageCount === 1) {
        // Got welcome message, now check if connection stays open
        setTimeout(() => {
          expect(ws.readyState).toBe(WebSocket.OPEN);
          ws.close();
          done();
        }, 100);
      }
    });

    ws.on("error", (error) => {
      done(error);
    });
  });
});
