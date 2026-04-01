import { z } from "zod";

export const MATCH_STATUS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  FINISHED: "finished",
};

type MatchStatus = (typeof MATCH_STATUS)[keyof typeof MATCH_STATUS];

export interface Match {
  id: number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  status: MatchStatus;
  startTime: string; // ISO timestamp
  endTime?: string | null; // optional
  homeScore: number;
  awayScore: number;
  createdAt: Date; // ISO timestamp
}

export interface MatchCreateInput {
  sport: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  endTime: string | null;
  homeScore?: number;
  awayScore?: number;
}

export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createMatchSchema = z
  .object({
    sport: z.string().min(1),
    homeTeam: z.string().min(1),
    awayTeam: z.string().min(1),
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startTime),
      end = new Date(data.endTime);

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "endTime must be after startTime",
        path: ["endTime"],
      });
    }
  });

export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});
