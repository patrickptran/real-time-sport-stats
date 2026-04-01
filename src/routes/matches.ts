import { Router } from "express";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches";
import { db } from "../db/db";
import { matches } from "../db/schema";
import { getMatchStatus } from "../utils/match-utils";
import { desc } from "drizzle-orm";

export const matchesRouter = Router();

const MAX_LIMIT = 100;

// Example route to get all matches
matchesRouter.get("/", async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid Query",
      details: parsed.error.issues,
    });
  }
  const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);

    res.json({ data });
  } catch (e) {
    res.status(500).json({
      error: "Failed to fetch matches",
    });
  }
});

matchesRouter.post("/", async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid payload",
      details: parsed.error.issues,
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
