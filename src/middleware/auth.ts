import { Request, Response, NextFunction } from "express";
import {
  extractTokenFromHeader,
  verifyToken,
  TokenPayload,
} from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = payload;
  next();
};

export const optionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
};
