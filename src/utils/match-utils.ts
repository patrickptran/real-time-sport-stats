import { Match, MATCH_STATUS } from "../validation/matches";

export function getMatchStatus(
  startTime: string,
  endTime?: string | null,
  now = new Date(),
): string {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : null;
  if (Number.isNaN(start.getTime()) || (end && Number.isNaN(end.getTime()))) {
    return ""; // Invalid date
  }

  if (now < start) {
    return MATCH_STATUS.SCHEDULED;
  }
  if (end && now >= end) {
    return MATCH_STATUS.FINISHED;
  }
  return MATCH_STATUS.LIVE;
}

export async function syncMatchStatus(
  match: Match,
  updateStatus: (status: string) => Promise<void>,
) {
  const nextStatus = getMatchStatus(match.startTime, match.endTime);
  if (!nextStatus) {
    return match.status;
  }

  if (match.status !== nextStatus) {
    await updateStatus(nextStatus);
    match.status = nextStatus;
  }
  return match.status;
}
