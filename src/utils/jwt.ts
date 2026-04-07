import jwt, { SignOptions } from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface TokenPayload {
  userId: string;
  email?: string;
  iat?: number;
  exp?: number;
}

// Generate a JWT token
export const generateToken = (
  userId: string,
  email?: string,
  expiresIn: string | number = "24h",
): string => {
  const options: SignOptions & { expiresIn: string | number } = {
    expiresIn: expiresIn as any,
  };
  return jwt.sign({ userId, email }, SECRET, options);
};

// Verify and decode a JWT token
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

// Extract token from Authorization header
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
};
