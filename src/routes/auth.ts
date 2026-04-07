import { Router } from "express";
import { generateToken } from "../utils/jwt";

export const authRouter = Router();

// Simple login endpoint - in production, verify against a user database
authRouter.post("/login", (req, res) => {
  const { userId, email } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const token = generateToken(userId, email);
    res.json({ token, userId, email });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// Verify token endpoint
authRouter.post("/verify", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "token is required" });
  }

  import("../utils/jwt").then(({ verifyToken }) => {
    const payload = verifyToken(token);
    if (payload) {
      res.json({ valid: true, payload });
    } else {
      res.status(401).json({ valid: false, error: "Invalid or expired token" });
    }
  });
});
