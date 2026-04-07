import rateLimit from "express-rate-limit";

// General API rate limiter - moderate limits for most endpoints
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks or static assets if any
    return req.path === "/" || req.path.startsWith("/health");
  },
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: "Too many authentication attempts, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins against the limit
  skip: (req) => {
    // Allow token verification to be less restricted
    return req.path === "/auth/verify";
  },
});

// Rate limiter for WebSocket connections (more lenient)
export const wsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Allow 10 WebSocket connection attempts per minute
  message: {
    error: "Too many WebSocket connection attempts, please try again later.",
    retryAfter: "1 minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Note: This is for HTTP upgrade requests to WebSocket
});

// Strict rate limiter for sensitive operations (creating matches, etc.)
export const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 sensitive operations per windowMs
  message: {
    error: "Too many operations, please slow down.",
    retryAfter: "5 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for API endpoints that create/modify data
export const createLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // Limit each IP to 30 create operations per windowMs
  message: {
    error: "Too many create operations, please try again later.",
    retryAfter: "10 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom rate limiter for testing (very permissive)
export const testLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // Very high limit for testing
  message: {
    error: "Rate limit exceeded in test environment",
    retryAfter: "1 minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
});
