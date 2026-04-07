import { Request, Response, NextFunction } from "express";
import { authMiddleware, optionalAuthMiddleware } from "./auth";
import { generateToken } from "../utils/jwt";

describe("Auth Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnValue(undefined);
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
  });

  describe("authMiddleware", () => {
    it("should allow request with valid Bearer token", () => {
      const token = generateToken("user123", "test@example.com");
      mockRequest.headers = { authorization: `Bearer ${token}` };

      authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
      expect((mockRequest as any).user).toBeDefined();
      expect((mockRequest as any).user?.userId).toBe("user123");
    });

    it("should reject request without authorization header", () => {
      mockRequest.headers = {};

      authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Missing authorization token",
      });
    });

    it("should reject request with invalid token format", () => {
      mockRequest.headers = { authorization: "InvalidFormat token" };

      authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Missing authorization token",
      });
    });

    it("should reject request with tampered token", () => {
      const token = generateToken("user123");
      const tamperedToken = token.slice(0, -5) + "xxxxx"; // tamper with signature
      mockRequest.headers = { authorization: `Bearer ${tamperedToken}` };

      authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Invalid or expired token",
      });
    });

    it("should attach user payload to request", () => {
      const token = generateToken("user456", "user456@example.com");
      mockRequest.headers = { authorization: `Bearer ${token}` };

      authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );

      expect((mockRequest as any).user).toEqual({
        userId: "user456",
        email: "user456@example.com",
        iat: expect.any(Number),
        exp: expect.any(Number),
      });
    });

    it("should reject malformed authorization header", () => {
      mockRequest.headers = { authorization: "Bearer" }; // no token

      authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
    });
  });

  describe("optionalAuthMiddleware", () => {
    it("should allow request without authorization header", () => {
      mockRequest.headers = {};

      optionalAuthMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );

      expect(mockNext).toHaveBeenCalled();
      expect((mockRequest as any).user).toBeUndefined();
    });

    it("should attach user payload if valid token provided", () => {
      const token = generateToken("user789", "user789@example.com");
      mockRequest.headers = { authorization: `Bearer ${token}` };

      optionalAuthMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );

      expect(mockNext).toHaveBeenCalled();
      expect((mockRequest as any).user).toBeDefined();
      expect((mockRequest as any).user?.userId).toBe("user789");
    });

    it("should skip invalid token and continue", () => {
      const tamperedToken = "Bearer invalid.token.here";
      mockRequest.headers = { authorization: tamperedToken };

      optionalAuthMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );

      expect(mockNext).toHaveBeenCalled();
      expect((mockRequest as any).user).toBeUndefined(); // No user attached
    });

    it("should always call next()", () => {
      mockRequest.headers = {};

      optionalAuthMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction,
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
