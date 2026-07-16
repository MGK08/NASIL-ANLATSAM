/**
 * REALTIME ABONELİĞİ (istemci).
 * Bir oda koduna abone olur; rooms/slots tablolarında herhangi bir değişiklik
 * olduğunda odanın güncel halini (GET /api/room/[code]) yeniden çeker ve
 * onChange'e verir. Böylece tüm ekranlar aynı anda güncellenir.
 */
import { supabase } from "../lib/supabaseClient";
import { getRoom } from "../lib/api";
import type { Room } from "../types/game";

export function subscribeRoom(code: string, onChange: (room: Room | null) => void): () => void {
  let active = true;

  const refetch = async () => {
    const room = await getRoom(code);
    if (active) onChange(room);
  };

  // İlk yükleme
  refetch();

  const channel = supabase
    .channel(`room:${code}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `code=eq.${code}` }, refetch)
    .on("postgres_changes", { event: "*", schema: "public", table: "slots", filter: `room_code=eq.${code}` }, refetch)
    .subscribe();

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}
