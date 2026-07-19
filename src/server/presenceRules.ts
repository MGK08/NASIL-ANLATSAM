/** Bağlantı durumuna dayalı kurallar: kurucu devri ve "yerine geçme". */
import type { Room } from "../types/game";

export const OFFLINE_AFTER_MS = 30_000;

export function isOnline(presence: Record<string, number>, userId: string | null | undefined, now = Date.now()): boolean {
  if (!userId) return false;
  const seen = presence[userId];
  return !!seen && now - seen < OFFLINE_AFTER_MS;
}

/**
 * Kurucu çevrimiçiyse kurucu; değilse sıradaki BAĞLI oyuncu (tur sırasına göre).
 * Kimse bağlı değilse kurucu olarak kalır (yetki boşta bırakılmaz).
 */
export function effectiveHostUserId(room: Room, presence: Record<string, number>, now = Date.now()): string | null {
  if (isOnline(presence, room.hostUserId, now)) return room.hostUserId;

  const ordered = room.turnOrder.length
    ? room.turnOrder.map((id) => room.slots[id]).filter(Boolean)
    : Object.values(room.slots).sort((a, b) => a.teamId.localeCompare(b.teamId) || a.turnPosition - b.turnPosition);

  for (const s of ordered) {
    if (s?.claimedByUserId && isOnline(presence, s.claimedByUserId, now)) return s.claimedByUserId;
  }
  return room.hostUserId;
}

/** Slot sahibi düşmüş mü? Boş slot her zaman alınabilir. */
export function isSlotTakeoverable(room: Room, slotId: string, presence: Record<string, number>, now = Date.now()): boolean {
  const slot = room.slots[slotId];
  if (!slot) return false;
  if (!slot.claimedByUserId) return true;
  // Hiç bağlantı kaydı yoksa emin olamayız -> dolu slot alınamaz (yanlışlıkla çalmayı önler)
  if (Object.keys(presence).length === 0) return false;
  return !isOnline(presence, slot.claimedByUserId, now);
}

/** İstemciye: slotId -> son görülme (ms) */
export function presenceBySlot(room: Room, presence: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of Object.values(room.slots)) {
    if (s.claimedByUserId && presence[s.claimedByUserId]) out[s.slotId] = presence[s.claimedByUserId];
  }
  return out;
}
