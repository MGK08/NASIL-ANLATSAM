/** İstemci -> sunucu yardımcıları. */
import type { GameAction, Room, Card } from "../types/game";

export type ActionResult = { ok: true; code?: string } | { ok: false; reason: string };

export async function postAction(action: GameAction): Promise<ActionResult> {
  const res = await fetch("/api/action", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action }),
  });
  return res.json();
}

export async function getRoom(code: string): Promise<Room | null> {
  const res = await fetch(`/api/room/${code}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function getCard(code: string, userId: string): Promise<Card | null> {
  const res = await fetch(`/api/card/${code}?userId=${encodeURIComponent(userId)}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}
