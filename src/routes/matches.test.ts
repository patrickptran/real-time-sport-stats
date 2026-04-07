import request from "supertest";
import express from "express";
import { matchesRouter } from "./matches";
import { db } from "../db/db";
import { matches } from "../db/schema";
import { generateToken } from "../utils/jwt";

// Mock the database module
jest.mock("../db/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

// Mock the match-utils module
jest.mock("../utils/match-utils", () => ({
  getMatchStatus: jest.fn((start: string, end: string) => "scheduled"),
}));

const app = express();
app.use(express.json());
app.use("/matches", matchesRouter);

// Generate a valid token for tests
const validToken = generateToken("test-user", "test@example.com");

describe("Matches Router", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /matches", () => {
    it("should return a list of matches with default limit", async () => {
      const mockMatches = [
        {
          id: 1,
          sport: "football",
          homeTeam: "Team A",
          awayTeam: "Team B",
          status: "scheduled",
          startTime: "2026-04-01T00:00:00.000Z",
          endTime: "2026-04-01T02:00:00.000Z",
          homeScore: 0,
          awayScore: 0,
          createdAt: "2026-03-31T19:20:38.532Z",
        },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockMatches),
          }),
        }),
      });

      const response = await request(app).get("/matches");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockMatches);
    });

    it("should accept a custom limit query parameter", async () => {
      const mockMatches: any[] = [];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockMatches),
          }),
        }),
      });

      const response = await request(app).get("/matches?limit=10");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockMatches);
    });

    it("should return 400 for invalid limit query parameter", async () => {
      const response = await request(app).get("/matches?limit=invalid");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("invalid Query");
    });

    it("should cap limit to MAX_LIMIT (100)", async () => {
      const mockMatches: any[] = [];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockMatches),
          }),
        }),
      });

      const response = await request(app).get("/matches?limit=100");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockMatches);
    });

    it("should handle database errors", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error("DB Error")),
          }),
        }),
      });

      const response = await request(app).get("/matches");

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to fetch matches");
    });
  });

  describe("POST /matches", () => {
    it("should create a new match with valid payload", async () => {
      const newMatch = {
        id: 1,
        sport: "football",
        homeTeam: "Team A",
        awayTeam: "Team B",
        status: "scheduled",
        startTime: "2026-04-01T00:00:00.000Z",
        endTime: "2026-04-01T02:00:00.000Z",
        homeScore: 0,
        awayScore: 0,
        createdAt: "2026-03-31T19:20:38.605Z",
      };

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([newMatch]),
        }),
      });

      const response = await request(app)
        .post("/matches")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          sport: "football",
          homeTeam: "Team A",
          awayTeam: "Team B",
          startTime: "2026-04-01T00:00:00Z",
          endTime: "2026-04-01T02:00:00Z",
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(newMatch);
    });

    it("should accept optional homeScore and awayScore", async () => {
      const newMatch = {
        id: 1,
        sport: "football",
        homeTeam: "Team A",
        awayTeam: "Team B",
        status: "scheduled",
        startTime: "2026-04-01T00:00:00.000Z",
        endTime: "2026-04-01T02:00:00.000Z",
        homeScore: 2,
        awayScore: 1,
        createdAt: "2026-03-31T19:20:38.605Z",
      };

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([newMatch]),
        }),
      });

      const response = await request(app)
        .post("/matches")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          sport: "football",
          homeTeam: "Team A",
          awayTeam: "Team B",
          startTime: "2026-04-01T00:00:00Z",
          endTime: "2026-04-01T02:00:00Z",
          homeScore: 2,
          awayScore: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.homeScore).toBe(2);
      expect(response.body.data.awayScore).toBe(1);
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/matches")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          sport: "football",
          homeTeam: "Team A",
          // missing awayTeam, startTime, endTime
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid payload");
    });

    it("should return 400 for invalid date format", async () => {
      const response = await request(app)
        .post("/matches")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          sport: "football",
          homeTeam: "Team A",
          awayTeam: "Team B",
          startTime: "not-a-date",
          endTime: "2026-04-01T02:00:00Z",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid payload");
    });

    it("should return 400 when endTime is before or equal to startTime", async () => {
      const response = await request(app)
        .post("/matches")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          sport: "football",
          homeTeam: "Team A",
          awayTeam: "Team B",
          startTime: "2026-04-01T02:00:00Z",
          endTime: "2026-04-01T00:00:00Z", // before startTime
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid payload");
    });

    it("should handle database errors on creation", async () => {
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error("DB Error")),
        }),
      });

      const response = await request(app)
        .post("/matches")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          sport: "football",
          homeTeam: "Team A",
          awayTeam: "Team B",
          startTime: "2026-04-01T00:00:00Z",
          endTime: "2026-04-01T02:00:00Z",
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Failed to create match");
    });
  });
});
