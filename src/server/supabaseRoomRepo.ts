/** RoomRepo'nun Supabase (service role) implementasyonu. Yalnızca sunucuda kullanılır. */
import type { Room, Card } from "../types/game";
import type { RoomRepo } from "./roomRepo";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { mapRowsToRoom, mapRoomToRows, type DbRoomRow, type DbSlotRow } from "./roomMapper";

export class SupabaseRoomRepo implements RoomRepo {
  async fetchDeckCardIds(deckId: string): Promise<string[]> {
    const { data, error } = await supabaseAdmin.from("cards").select("id").eq("deck_id", deckId);
    if (error) throw new Error("fetchDeckCardIds: " + error.message);
    return (data ?? []).map((r: { id: string }) => r.id);
  }

  async fetchCard(cardId: string): Promise<Card | null> {
    const { data, error } = await supabaseAdmin
      .from("cards").select("id, main_word, forbidden_words, category").eq("id", cardId).maybeSingle();
    if (error) throw new Error("fetchCard: " + error.message);
    if (!data) return null;
    return {
      id: data.id,
      mainWord: data.main_word,
      forbiddenWords: data.forbidden_words as string[],
      category: data.category ?? undefined,
    };
  }

  async loadRoom(code: string): Promise<Room | null> {
    const { data: roomRow, error } = await supabaseAdmin
      .from("rooms").select("*").eq("code", code).maybeSingle();
    if (error) throw new Error("loadRoom(rooms): " + error.message);
    if (!roomRow) return null;
    const { data: slotRows, error: sErr } = await supabaseAdmin
      .from("slots").select("*").eq("room_code", code);
    if (sErr) throw new Error("loadRoom(slots): " + sErr.message);
    return mapRowsToRoom(roomRow as DbRoomRow, (slotRows ?? []) as DbSlotRow[]);
  }

  async insertRoom(room: Room): Promise<void> {
    const { roomRow, slotRows } = mapRoomToRows(room);
    const { error: rErr } = await supabaseAdmin.from("rooms").insert(roomRow);
    if (rErr) throw new Error("insertRoom(rooms): " + rErr.message);
    const { error: sErr } = await supabaseAdmin.from("slots").insert(slotRows);
    if (sErr) throw new Error("insertRoom(slots): " + sErr.message);
  }

  async saveRoom(room: Room, opts?: { slots?: boolean }): Promise<void> {
    const { roomRow, slotRows } = mapRoomToRows(room);
    const { error: rErr } = await supabaseAdmin.from("rooms").update(roomRow).eq("code", room.code);
    if (rErr) throw new Error("saveRoom(rooms): " + rErr.message);

    // Slotlar degismediyse (oyun ici aksiyonlar) hic yazma -> 1-2 tur daha az gidis-donus.
    if (opts && opts.slots === false) return;

    // İKİ AŞAMALI slot yazımı:
    // "bir kişi tek isim tutabilir" kısıtını ihlal etmemek için önce BOŞALTILANLARI
    // (claimed = null) yaz, sonra SAHİPLENİLENLERİ (claimed != null) yaz. Böylece
    // aynı kullanıcı iki satırda geçici olarak görünmez.
    const releases = slotRows.filter((s) => s.claimed_by_user_id === null);
    const claims = slotRows.filter((s) => s.claimed_by_user_id !== null);

    if (releases.length) {
      const { error } = await supabaseAdmin.from("slots").upsert(releases, { onConflict: "slot_id" });
      if (error) throw new Error("saveRoom(slots.releases): " + error.message);
    }
    if (claims.length) {
      const { error } = await supabaseAdmin.from("slots").upsert(claims, { onConflict: "slot_id" });
      if (error) throw new Error("saveRoom(slots.claims): " + error.message);
    }
  }
}
