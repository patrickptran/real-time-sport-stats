import { Router } from "express";

export const matchesRouter = Router();

// Example route to get all matches
matchesRouter.get("/", (req, res) => {
  res.status(200).json({ message: "List of matches will be here" });
});
