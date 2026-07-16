/** Bir kullanıcının oyun ekranındaki rolünü belirler (arayüz + sunucu ortak kullanır). */
import type { Room, ViewRole } from "../types/game";

export function viewRole(room: Room, userId: string): ViewRole | "none" {
  const mySlot = Object.values(room.slots).find((s) => s.claimedByUserId === userId);
  const t = room.activeTurn;
  if (!mySlot || !t) return "none";
  if (mySlot.slotId === t.explainerSlotId) return "explainer";
  if (mySlot.teamId === t.teamId) return "teammate";
  // rakip takım
  const capId = room.teams[mySlot.teamId].captainSlotId;
  if (mySlot.slotId === capId) return "opponentCaptain";
  return "opponent";
}
