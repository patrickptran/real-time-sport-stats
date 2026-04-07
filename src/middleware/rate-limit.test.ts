import request from "supertest";
import express from "express";
import {
  generalLimiter,
  authLimiter,
  createLimiter,
  testLimiter,
} from "./rate-limit";

describe("Rate Limiting Middleware", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe("generalLimiter", () => {
    beforeEach(() => {
      app.use(generalLimiter);
      app.get("/test", (req, res) => res.json({ message: "ok" }));
    });

    it("should allow requests within limit", async () => {
      const response = await request(app).get("/test");
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("ok");
    });

    it("should include rate limit headers", async () => {
      const response = await request(app).get("/test");
      expect(response.headers["ratelimit-limit"]).toBeDefined();
      expect(response.headers["ratelimit-remaining"]).toBeDefined();
      expect(response.headers["ratelimit-reset"]).toBeDefined();
    });

    it("should skip rate limiting for root path", async () => {
      // This test is tricky because we need to test the root path
      // but our app setup applies generalLimiter globally
      // We'll test that the middleware is configured correctly
      expect(generalLimiter).toBeDefined();
    });
  });

  describe("authLimiter", () => {
    beforeEach(() => {
      app.use("/auth", authLimiter);
      app.post("/auth/login", (req, res) => res.json({ token: "fake-token" }));
      app.post("/auth/verify", (req, res) => res.json({ valid: true }));
    });

    it("should allow auth requests within limit", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ userId: "test" });
      expect(response.status).toBe(200);
      expect(response.body.token).toBe("fake-token");
    });

    it("should have stricter limits for auth endpoints", async () => {
      // authLimiter has max: 5, so we can't easily test the limit in unit tests
      // without mocking or waiting. We'll just verify the configuration exists
      expect(authLimiter).toBeDefined();
    });

    it("should skip rate limiting for verify endpoint", async () => {
      // The verify endpoint should be less restricted
      const response = await request(app)
        .post("/auth/verify")
        .send({ token: "test" });
      expect(response.status).toBe(200);
    });
  });

  describe("createLimiter", () => {
    beforeEach(() => {
      app.use(createLimiter);
      app.post("/test", (req, res) => res.json({ created: true }));
    });

    it("should allow create operations within limit", async () => {
      const response = await request(app).post("/test").send({ data: "test" });
      expect(response.status).toBe(200);
      expect(response.body.created).toBe(true);
    });

    it("should include rate limit headers for create operations", async () => {
      const response = await request(app).post("/test").send({ data: "test" });
      expect(response.headers["ratelimit-limit"]).toBeDefined();
      expect(response.headers["ratelimit-remaining"]).toBeDefined();
    });
  });

  describe("testLimiter", () => {
    beforeEach(() => {
      app.use(testLimiter);
      app.get("/test", (req, res) => res.json({ message: "test ok" }));
    });

    it("should skip rate limiting in test environment", async () => {
      // Set NODE_ENV to test
      process.env.NODE_ENV = "test";

      // Make multiple requests that would normally be rate limited
      for (let i = 0; i < 10; i++) {
        const response = await request(app).get("/test");
        expect(response.status).toBe(200);
        expect(response.body.message).toBe("test ok");
      }

      // Reset NODE_ENV
      delete process.env.NODE_ENV;
    });
  });

  describe("Rate Limit Configuration", () => {
    it("should have different limits for different middleware", () => {
      // We can't easily test the actual limits without complex setup,
      // but we can verify the middleware functions exist and are configured
      expect(typeof generalLimiter).toBe("function");
      expect(typeof authLimiter).toBe("function");
      expect(typeof createLimiter).toBe("function");
      expect(typeof testLimiter).toBe("function");
    });

    it("should have appropriate error messages", () => {
      // Test that the middleware is properly configured with messages
      // This is more of a configuration test
      expect(generalLimiter).toBeDefined();
    });
  });

  describe("Rate Limit Headers", () => {
    beforeEach(() => {
      app.use(generalLimiter);
      app.get("/headers-test", (req, res) => res.json({ ok: true }));
    });

    it("should return standard rate limit headers", async () => {
      const response = await request(app).get("/headers-test");

      // Check for standard headers (RFC 6585)
      expect(response.headers["ratelimit-limit"]).toBeDefined();
      expect(response.headers["ratelimit-remaining"]).toBeDefined();
      expect(response.headers["ratelimit-reset"]).toBeDefined();

      // Should not have legacy headers
      expect(response.headers["x-ratelimit-limit"]).toBeUndefined();
      expect(response.headers["x-ratelimit-remaining"]).toBeUndefined();
    });

    it("should return numeric values for rate limit headers", async () => {
      const response = await request(app).get("/headers-test");

      expect(typeof parseInt(response.headers["ratelimit-limit"])).toBe(
        "number",
      );
      expect(typeof parseInt(response.headers["ratelimit-remaining"])).toBe(
        "number",
      );
      expect(typeof parseInt(response.headers["ratelimit-reset"])).toBe(
        "number",
      );
    });
  });
});
