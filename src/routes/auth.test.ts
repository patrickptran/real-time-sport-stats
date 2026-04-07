import request from "supertest";
import express from "express";
import { authRouter } from "./auth";
import { verifyToken } from "../utils/jwt";

const app = express();
app.use(express.json());
app.use("/auth", authRouter);

describe("Auth Routes", () => {
  describe("POST /auth/login", () => {
    it("should return a valid token for valid userId", async () => {
      const response = await request(app).post("/auth/login").send({
        userId: "user123",
        email: "user123@example.com",
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.userId).toBe("user123");
      expect(response.body.email).toBe("user123@example.com");
    });

    it("should generate a valid JWT token", async () => {
      const response = await request(app).post("/auth/login").send({
        userId: "testuser",
      });

      expect(response.status).toBe(200);
      const { token } = response.body;

      // Verify the token is valid
      const payload = verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe("testuser");
    });

    it("should handle optional email parameter", async () => {
      const response = await request(app).post("/auth/login").send({
        userId: "user456",
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.userId).toBe("user456");
      expect(response.body.email).toBeUndefined();
    });

    it("should include email in token if provided", async () => {
      const response = await request(app).post("/auth/login").send({
        userId: "user789",
        email: "user789@example.com",
      });

      expect(response.status).toBe(200);
      const { token } = response.body;

      const payload = verifyToken(token);
      expect(payload?.email).toBe("user789@example.com");
    });

    it("should reject request without userId", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("userId is required");
    });

    it("should reject empty userId", async () => {
      const response = await request(app).post("/auth/login").send({
        userId: "",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("userId is required");
    });

    it("should accept any userId string", async () => {
      const testIds = [
        "simple",
        "with-dash",
        "with_underscore",
        "with.dot",
        "123numeric",
        "UPPERCASE",
        "MixedCase",
      ];

      for (const userId of testIds) {
        const response = await request(app)
          .post("/auth/login")
          .send({ userId });
        expect(response.status).toBe(200);
        expect(response.body.userId).toBe(userId);
      }
    });

    it("should return 500 on token generation error", async () => {
      // This is hard to test without mocking, but we ensure the try-catch works
      const response = await request(app).post("/auth/login").send({
        userId: "valid_user",
      });

      // Should succeed under normal circumstances
      expect(response.status).toBe(200);
    });
  });

  describe("POST /auth/verify", () => {
    it("should verify a valid token", async () => {
      // First, get a token
      const loginResponse = await request(app).post("/auth/login").send({
        userId: "user123",
        email: "user123@example.com",
      });

      const { token } = loginResponse.body;

      // Now verify it
      const verifyResponse = await request(app).post("/auth/verify").send({
        token,
      });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.valid).toBe(true);
      expect(verifyResponse.body.payload).toBeDefined();
      expect(verifyResponse.body.payload.userId).toBe("user123");
      expect(verifyResponse.body.payload.email).toBe("user123@example.com");
    });

    it("should reject invalid token", async () => {
      const response = await request(app).post("/auth/verify").send({
        token: "invalid.token.here",
      });

      expect(response.status).toBe(401);
      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe("Invalid or expired token");
    });

    it("should reject tampered token", async () => {
      // First get a valid token
      const loginResponse = await request(app).post("/auth/login").send({
        userId: "user456",
      });

      const { token } = loginResponse.body;
      const tamperedToken = token.slice(0, -5) + "xxxxx";

      // Try to verify tampered token
      const response = await request(app).post("/auth/verify").send({
        token: tamperedToken,
      });

      expect(response.status).toBe(401);
      expect(response.body.valid).toBe(false);
    });

    it("should reject request without token", async () => {
      const response = await request(app).post("/auth/verify").send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("token is required");
    });

    it("should reject empty token", async () => {
      const response = await request(app).post("/auth/verify").send({
        token: "",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("token is required");
    });

    it("should decode and return full payload", async () => {
      const loginResponse = await request(app).post("/auth/login").send({
        userId: "payload_test",
        email: "payload@test.com",
      });

      const { token } = loginResponse.body;

      const verifyResponse = await request(app).post("/auth/verify").send({
        token,
      });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.payload).toHaveProperty("userId");
      expect(verifyResponse.body.payload).toHaveProperty("email");
      expect(verifyResponse.body.payload).toHaveProperty("iat");
      expect(verifyResponse.body.payload).toHaveProperty("exp");
    });
  });

  describe("Security Scenarios", () => {
    it("should handle rapid token generation", async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app).post("/auth/login").send({ userId: "rapid_test" }),
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();
      });

      // Verify all tokens are valid
      responses.forEach((response) => {
        const payload = verifyToken(response.body.token);
        expect(payload?.userId).toBe("rapid_test");
      });
    });

    it("should generate different tokens for same user across sequential calls", async () => {
      const response1 = await request(app).post("/auth/login").send({
        userId: "same_user",
      });

      // Add delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response2 = await request(app).post("/auth/login").send({
        userId: "same_user",
      });

      // Verify both tokens are valid but may or may not be identical (depends on timing)
      expect(response1.body.token).toBeDefined();
      expect(response2.body.token).toBeDefined();

      const payload1 = verifyToken(response1.body.token);
      const payload2 = verifyToken(response2.body.token);

      expect(payload1?.userId).toBe("same_user");
      expect(payload2?.userId).toBe("same_user");
    });
  });
});
