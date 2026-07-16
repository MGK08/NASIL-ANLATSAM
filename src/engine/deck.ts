import type { Room } from "../types/game";

/** Fisher–Yates karıştırma. Test için rng enjekte edilebilir. */
export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sıradaki kartı çeker. Kullanılmamış ilk kartı verir; deste bitmişse
 * (350 kart tükendiyse) used listesini sıfırlayıp baştan başlar (yeniden karışım etkisi).
 */
export function drawNextCard(room: Room): { cardId: string; usedCardIds: string[] } {
  const remaining = room.deckCardIds.filter((id) => !room.usedCardIds.includes(id));
  if (remaining.length === 0) {
    const first = room.deckCardIds[0];
    return { cardId: first, usedCardIds: [first] };
  }
  const cardId = remaining[0];
  return { cardId, usedCardIds: [...room.usedCardIds, cardId] };
}
