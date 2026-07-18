import type { PlayerSlot, TeamId } from "../types/game";
import { MIN_PLAYERS_PER_TEAM } from "../types/game";

function sortedByPosition(slots: PlayerSlot[], team: TeamId): PlayerSlot[] {
  return slots
    .filter((s) => s.teamId === team)
    .sort((a, b) => a.turnPosition - b.turnPosition);
}

/**
 * Anlatma sırasını üretir: takımlar arası DÖNÜŞÜMLÜ (A0, B0, A1, B1, ...).
 * Takımlar farklı sayıdaysa kalanlar sona eklenir. Döngüsellik turnIndex ile sağlanır.
 */
export function buildTurnOrder(
  slots: Record<string, PlayerSlot>,
  firstTeam: TeamId = "teamA"
): string[] {
  const all = Object.values(slots);
  const first = sortedByPosition(all, firstTeam);
  const second = sortedByPosition(all, firstTeam === "teamA" ? "teamB" : "teamA");
  const order: string[] = [];
  const max = Math.max(first.length, second.length);
  for (let i = 0; i < max; i++) {
    if (i < first.length) order.push(first[i].slotId);
    if (i < second.length) order.push(second[i].slotId);
  }
  return order;
}

/** Bir sonraki anlatanın indeksi (döngüsel). */
export function nextTurnIndex(order: string[], current: number): number {
  if (order.length === 0) return 0;
  return (current + 1) % order.length;
}

/** Tüm slotlar sahiplenildi mi? (tüm isimler soluk) */
export function allSlotsClaimed(slots: Record<string, PlayerSlot>): boolean {
  const all = Object.values(slots);
  return all.length > 0 && all.every((s) => s.claimedByUserId !== null);
}

/** Her iki takımda da en az MIN_PLAYERS_PER_TEAM sahiplenmiş oyuncu var mı? */
export function hasEnoughPlayers(slots: Record<string, PlayerSlot>): boolean {
  const all = Object.values(slots);
  const claimed = (t: TeamId) =>
    all.filter((s) => s.teamId === t && s.claimedByUserId !== null).length;
  return claimed("teamA") >= MIN_PLAYERS_PER_TEAM && claimed("teamB") >= MIN_PLAYERS_PER_TEAM;
}
