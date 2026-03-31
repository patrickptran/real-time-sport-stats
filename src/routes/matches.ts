import { Router } from "express";
import { createMatchSchema } from "../validation/matches";
import { db } from "../db/db";
import { matches } from "../db/schema";
import { getMatchStatus } from "../utils/match-utils";
export const matchesRouter = Router();

// Example route to get all matches
matchesRouter.get("/", (req, res) => {
  res.status(200).json({ message: "List of matches will be here" });
});

matchesRouter.post("/", async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid payload",
      details: JSON.stringify(parsed.error),
    });
  }

  try {
    const status = getMatchStatus(
      parsed.data.startTime,
      parsed.data.endTime,
    ) as "scheduled" | "live" | "finished";

    const [event] = await db
      .insert(matches)
      .values({
        ...parsed.data,
        startTime: new Date(parsed.data.startTime),
        endTime: new Date(parsed.data.endTime),
        homeScore: parsed.data.homeScore ?? 0,
        awayScore: parsed.data.awayScore ?? 0,
        status: status,
      })
      .returning();

    res.status(201).json({ data: event });
  } catch (e) {
    res.status(500).json({
      error: "Failed to create match",
      details: JSON.stringify(e),
    });
  }
});
