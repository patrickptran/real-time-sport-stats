import {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  TokenPayload,
} from "./jwt";

describe("JWT Utils", () => {
  describe("generateToken()", () => {
    it("should generate a valid JWT token", () => {
      const token = generateToken("user123", "test@example.com");
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT has 3 parts: header.payload.signature
    });

    it("should generate different tokens for different users", () => {
      const token1 = generateToken("user1");
      const token2 = generateToken("user2");
      expect(token1).not.toBe(token2);
    });

    it("should include userId and email in token payload", () => {
      const token = generateToken("user123", "test@example.com");
      const payload = verifyToken(token);
      expect(payload?.userId).toBe("user123");
      expect(payload?.email).toBe("test@example.com");
    });

    it("should handle undefined email", () => {
      const token = generateToken("user123");
      const payload = verifyToken(token);
      expect(payload?.userId).toBe("user123");
      expect(payload?.email).toBeUndefined();
    });

    it("should set expiration time", () => {
      const token = generateToken("user123", "test@example.com", "1h");
      const payload = verifyToken(token);
      expect(payload?.exp).toBeDefined();
      expect(payload?.iat).toBeDefined();
    });
  });

  describe("verifyToken()", () => {
    it("should verify a valid token", () => {
      const token = generateToken("user123", "test@example.com");
      const payload = verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe("user123");
    });

    it("should return null for invalid token", () => {
      const payload = verifyToken("invalid.token.here");
      expect(payload).toBeNull();
    });

    it("should return null for tampered token", () => {
      const token = generateToken("user123");
      const tampered = token.slice(0, -10) + "tamperedaa";
      const payload = verifyToken(tampered);
      expect(payload).toBeNull();
    });

    it("should return null for expired token", () => {
      // Create token that expires immediately
      const token = generateToken("user123", "test@example.com", "0s");

      // Wait a bit for token to expire
      return new Promise((resolve) => {
        setTimeout(() => {
          const payload = verifyToken(token);
          expect(payload).toBeNull();
          resolve(payload);
        }, 100);
      });
    });

    it("should correctly decode token payload", () => {
      const token = generateToken("user456", "user456@example.com");
      const payload = verifyToken(token) as TokenPayload;
      expect(payload.userId).toBe("user456");
      expect(payload.email).toBe("user456@example.com");
      expect(typeof payload.iat).toBe("number");
      expect(typeof payload.exp).toBe("number");
    });
  });

  describe("extractTokenFromHeader()", () => {
    it("should extract token from Bearer authorization header", () => {
      const token = generateToken("user123");
      const header = `Bearer ${token}`;
      const extracted = extractTokenFromHeader(header);
      expect(extracted).toBe(token);
    });

    it("should return null for missing header", () => {
      const extracted = extractTokenFromHeader(undefined);
      expect(extracted).toBeNull();
    });

    it("should return null for empty header", () => {
      const extracted = extractTokenFromHeader("");
      expect(extracted).toBeNull();
    });

    it("should return null for missing Bearer prefix", () => {
      const token = generateToken("user123");
      const extracted = extractTokenFromHeader(token);
      expect(extracted).toBeNull();
    });

    it("should return null for invalid Bearer format", () => {
      const extracted = extractTokenFromHeader("Basic sometoken");
      expect(extracted).toBeNull();
    });

    it("should return null for malformed Bearer header", () => {
      const extracted = extractTokenFromHeader("Bearer token extra parts");
      expect(extracted).toBeNull();
    });

    it("should be case-sensitive for Bearer", () => {
      const token = generateToken("user123");
      const extracted = extractTokenFromHeader(`bearer ${token}`); // lowercase
      expect(extracted).toBeNull();
    });
  });

  describe("Token lifecycle", () => {
    it("should be able to generate and verify token in sequence", () => {
      const userId = "user789";
      const email = "user789@example.com";

      // Generate
      const token = generateToken(userId, email);
      expect(token).toBeDefined();

      // Extract from header
      const header = `Bearer ${token}`;
      const extracted = extractTokenFromHeader(header);
      expect(extracted).toBe(token);

      // Verify
      const payload = verifyToken(token);
      expect(payload?.userId).toBe(userId);
      expect(payload?.email).toBe(email);
    });
  });
});
