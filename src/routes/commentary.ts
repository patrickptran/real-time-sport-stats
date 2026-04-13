import { Router } from "express";
import {
  listMatchesQuerySchema,
  matchIdParamSchema,
} from "../validation/matches";
import { createCommentarySchema } from "../validation/commentary";
import { commentary } from "../db/schema";
import { db } from "../db/db";
import { eq, desc } from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = 100;

commentaryRouter.get("/", async (req, res) => {
  const paramsResult = matchIdParamSchema.safeParse(req.params);

  if (!paramsResult.success) {
    return res.status(400).json({
      error: "Invalid match ID",
      details: paramsResult.error.issues,
    });
  }

  const queryResult = listMatchesQuerySchema.safeParse(req.body);

  if (!queryResult.success) {
    return res.status(400).json({
      error: "Invalid Query parameters",
      details: queryResult.error.issues,
    });
  }

  try {
    const { id: matchId } = paramsResult.data;
    const { limit = 10 } = queryResult.data;
    const safeLimit = Math.min(limit, MAX_LIMIT);

    const result = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(safeLimit);

    res.status(200).json({ data: result });
  } catch (e) {
    console.error("Failed to get commentaries", e);

    res.status(500).json({ error: "Failed to get commentaries", details: e });
  }
});

commentaryRouter.post("/", async (req, res) => {
  const paramsResult = matchIdParamSchema.safeParse(req.params);

  if (!paramsResult.success) {
    return res.status(400).json({
      error: "Invalid match ID",
      details: paramsResult.error.issues,
    });
  }

  const bodyResult = createCommentarySchema.safeParse(req.body);

  if (!bodyResult.success) {
    return res.status(400).json({
      error: "Invalid Commentary payload",
      details: bodyResult.error.issues,
    });
  }

  try {
    const { minutes, ...rest } = bodyResult.data;

    const [result] = await db
      .insert(commentary)
      .values({
        matchId: paramsResult.data.id,
        minutes,
        ...rest,
      })
      .returning();

    if (res.app.locals.broadcastCommentary) {
      res.app.locals.broadcastCommentary(result.matchId, result);
    }

    res.status(201).json({ data: result });
  } catch (e) {
    console.error("Failed to create commentary", e);

    res.status(500).json({ error: "Failed to create commentary", details: e });
  }
});
