// Type definitions for seed.ts

/**
 * Configuration and environment variables
 */
export interface SeedConfig {
  DELAY_MS: number;
  NEW_MATCH_DELAY_MIN_MS: number;
  NEW_MATCH_DELAY_MAX_MS: number;
  DEFAULT_MATCH_DURATION_MINUTES: number;
  FORCE_LIVE: boolean;
  API_URL: string;
}

/**
 * Raw seed data structure from JSON file
 */
export interface RawSeedData {
  commentary?: CommentaryEntry[];
  feed?: CommentaryEntry[];
  matches?: SeedMatch[];
}

/**
 * Parsed seed data structure
 */
export interface ParsedSeedData {
  feed: CommentaryEntry[];
  matches: SeedMatch[];
}

/**
 * Match data from the API/database
 */
export interface MatchData {
  id: number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  status: "scheduled" | "live" | "finished";
  startTime: string;
  endTime: string | null;
  homeScore: number;
  awayScore: number;
  createdAt: string;
}

/**
 * Seed match definition for creating new matches
 */
export interface SeedMatch {
  id?: number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  startTime?: string;
  endTime?: string;
  homeScore?: number;
  awayScore?: number;
}

/**
 * Commentary entry from seed data
 */
export interface CommentaryEntry {
  matchId?: number;
  minute?: number;
  sequence?: number;
  period?: string;
  eventType?: string;
  actor?: string;
  team?: string;
  message?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

/**
 * Processed commentary payload for API insertion
 */
export interface CommentaryPayload {
  message: string;
  minutes?: number;
  sequence?: number;
  period?: string;
  eventType?: string;
  actor?: string;
  team?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

/**
 * Match times structure
 */
export interface MatchTimes {
  startTime: string;
  endTime: string;
}

/**
 * Match state tracking during seeding
 */
export interface MatchState {
  match: MatchData;
  score: {
    home: number;
    away: number;
  };
  fakeNext: "home" | "away";
}

/**
 * Match entry with state
 */
export interface MatchEntry {
  match: MatchData;
  score: {
    home: number;
    away: number;
  };
  fakeNext: "home" | "away";
}

/**
 * Score delta for match updates
 */
export interface ScoreDelta {
  home: number;
  away: number;
}

/**
 * Cricket innings information
 */
export interface CricketInningsInfo {
  rank: number;
  battingTeam: string | null;
}

/**
 * Feed processing options
 */
export interface FeedProcessingOptions {
  randomize?: boolean;
  cricketNormalization?: boolean;
}

/**
 * Seed execution statistics
 */
export interface SeedStats {
  matchesCreated: number;
  matchesFound: number;
  commentaryInserted: number;
  errors: string[];
}

/**
 * API response structure
 */
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
}

/**
 * Matches list API response
 */
export interface MatchesResponse extends ApiResponse<MatchData[]> {}

/**
 * Single match API response
 */
export interface MatchResponse extends ApiResponse<MatchData> {}

/**
 * Commentary creation API response
 */
export interface CommentaryResponse extends ApiResponse<
  CommentaryEntry & { id: number }
> {}

/**
 * Seed data file structure
 */
export interface SeedDataFile {
  commentary?: CommentaryEntry[];
  feed?: CommentaryEntry[];
  matches?: SeedMatch[];
}

/**
 * Commentary insertion result
 */
export interface CommentaryInsertResult extends Omit<
  CommentaryEntry,
  "matchId"
> {
  id: number;
  matchId?: number;
  createdAt?: string;
}

/**
 * Match creation payload
 */
export interface MatchCreatePayload {
  sport: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  endTime: string;
  homeScore?: number;
  awayScore?: number;
}

/**
 * Feed expansion result
 */
export interface ExpandedFeedResult {
  entries: CommentaryEntry[];
  matchCount: number;
  totalEntries: number;
}

/**
 * Randomization configuration
 */
export interface RandomizationConfig {
  interleaveMatches?: boolean;
  maintainSequence?: boolean;
  cricketAware?: boolean;
}

/**
 * Error types for seeding
 */
export type SeedError =
  | "INVALID_SEED_DATA"
  | "API_CONNECTION_FAILED"
  | "MATCH_CREATION_FAILED"
  | "COMMENTARY_INSERTION_FAILED"
  | "INVALID_MATCH_DATA"
  | "FILE_READ_ERROR";

/**
 * Seed error with context
 */
export interface SeedErrorWithContext extends Error {
  type: SeedError;
  context?: Record<string, any>;
}

/**
 * Utility types for cricket processing
 */
export type CricketPeriod =
  | "1st innings"
  | "2nd innings"
  | "3rd innings"
  | "4th innings"
  | string;

/**
 * Team designation
 */
export type TeamDesignation = "home" | "away" | "neutral";

/**
 * Match status for seeding logic
 */
export type MatchStatusForSeeding = "eligible" | "ineligible" | "force_live";
