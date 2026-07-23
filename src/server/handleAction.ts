/**
 * YETKİLİ ORKESTRASYON.
 * İstemciden gelen aksiyonu alır: odayı yükler -> doğrular -> uygular -> kaydeder.
 * CREATE_ROOM özel: benzersiz kod üretir, desteyi çeker, yeni oda oluşturur.
 * Repo enjekte edildiği için hem gerçek Supabase hem de bellek-içi (test) ile çalışır.
 */
import type { GameAction } from "../types/game";
import { createRoom } from "../engine/createRoom";
import { applyAction, validateAction } from "../engine/rulesEngine";
import { generateRoomCode } from "../lib/roomCode";
import { ConflictError, type RoomRepo } from "./roomRepo";
import { effectiveHostUserId, isSlotTakeoverable } from "./presenceRules";

export type ActionResult = { ok: true; code?: string } | { ok: false; reason: string };

async function generateUniqueCode(repo: RoomRepo): Promise<string | null> {
  for (let i = 0; i < 12; i++) {
    const code = generateRoomCode();
    if ((await repo.loadRoom(code)) === null) return code;
  }
  return null;
}

/**
 * Aksiyonu uygular. Araya başka bir yazma girerse (ConflictError)
 * odayı yeniden okuyup baştan dener — böylece hiçbir güncelleme kaybolmaz.
 */
export async function handleAction(
  repo: RoomRepo,
  action: GameAction,
  now: number = Date.now()
): Promise<ActionResult> {
  for (let deneme = 0; deneme < 4; deneme++) {
    try {
      return await handleActionOnce(repo, action, now);
    } catch (e) {
      if ((e as Error)?.name !== "ConflictError") throw e;
      // Kısa bekleyip tazelenmiş veriyle tekrar dene
      await new Promise((r) => setTimeout(r, 40 + deneme * 60));
      now = Date.now();
    }
  }
  return { ok: false, reason: "conflict_retry_failed" };
}

async function handleActionOnce(
  repo: RoomRepo,
  action: GameAction,
  now: number
): Promise<ActionResult> {
  if (action.type === "CREATE_ROOM") {
    const code = await generateUniqueCode(repo);
    if (!code) return { ok: false, reason: "code_gen_failed" };
    const deckCardIds = await repo.fetchDeckCardIds(action.settings.deckId);
    if (deckCardIds.length === 0) return { ok: false, reason: "deck_empty" };
    const room = createRoom({
      code,
      hostUserId: action.hostUserId,
      settings: action.settings,
      setup: action.setup,
      deckCardIds,
      now,
    });
    await repo.insertRoom(room);
    return { ok: true, code };
  }

  // Diğer tüm aksiyonlar bir oda gerektirir
  const code = "code" in action ? action.code : undefined;
  if (!code) return { ok: false, reason: "missing_code" };
  const room = await repo.loadRoom(code);
  if (!room) return { ok: false, reason: "room_not_found" };

  // Kurucu düştüyse yetkiler geçici olarak sıradaki bağlı oyuncuya geçer.
  // (DB'deki hostUserId değişmez; kurucu dönünce yetkiler kendiliğinden geri gelir.)
  const presence = repo.loadPresence ? await repo.loadPresence(code) : {};
  const effHost = effectiveHostUserId(room, presence, now);
  const roomForValidation = effHost === room.hostUserId ? room : { ...room, hostUserId: effHost };

  // Yerine geçme: gerçekten düşmüş mü?
  if (action.type === "TAKEOVER_SLOT") {
    const okToTake = isSlotTakeoverable(room, action.slotId, presence, now);
    if (!okToTake) return { ok: false, reason: "slot_owner_online" };
  }

  const v = validateAction(roomForValidation, action);
  if (!v.ok) return { ok: false, reason: v.reason };

  const next = applyAction(room, action, now);
  const slotsChanged = JSON.stringify(room.slots) !== JSON.stringify(next.slots);
  await repo.saveRoom(next, { slots: slotsChanged, expectedUpdatedAt: room.updatedAtRaw ?? room.updatedAt });
  return { ok: true };
}
