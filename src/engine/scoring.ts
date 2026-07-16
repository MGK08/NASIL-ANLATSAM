import type { Room, TeamId, ActiveTurn } from "../types/game";

/**
 * Bir turun NET puanı (özet/gösterim için).
 * Skor zaten CORRECT_GUESS/TABOO_VIOLATION anında işlendiği için bu,
 * tur sonu özetinde "+3" gibi göstermek içindir.
 */
export function turnPoints(turn: ActiveTurn, room: Room): number {
  const { correctPoints, tabooPenalty } = room.settings;
  return turn.correctCardIds.length * correctPoints - turn.tabooCardIds.length * tabooPenalty;
}

/** Hedef puana ulaşan takım (anında kontrol). Yoksa null. */
export function checkWinner(room: Room): TeamId | null {
  const target = room.settings.targetScore;
  const a = room.teams.teamA.score;
  const b = room.teams.teamB.score;
  if (a >= target && a >= b) return "teamA";
  if (b >= target) return "teamB";
  return null;
}
