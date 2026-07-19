/**
 * REALTIME ABONELİĞİ (istemci) — yedekli.
 *
 * Birincil yol: Supabase realtime (rooms/slots değişince odayı yeniden çeker).
 * Ancak mobilde bu bağlantı kopabilir (ekran kapanması, şebeke değişimi,
 * uygulamanın arka plana atılması). O yüzden üç yedek katman var:
 *   1) Düzenli yoklama (poll) — bağlantı ölse bile ekran güncel kalır.
 *   2) Uygulamaya geri dönünce / pencere odaklanınca anında yeniden çekme.
 *   3) İnternet geri gelince ve kanal hata verince yeniden abone olma.
 */
import { supabase } from "../lib/supabaseClient";
import { getRoom, sendHeartbeat } from "../lib/api";
import { getUserId } from "../lib/identity";
import type { Room } from "../types/game";

const POLL_MS = 4000;
const HEARTBEAT_MS = 10000;

export function subscribeRoom(code: string, onChange: (room: Room | null) => void): () => void {
  let active = true;
  let inFlight = false;
  let channel: ReturnType<typeof supabase.channel> | null = null;

  const refetch = async () => {
    if (!active || inFlight) return;
    inFlight = true;
    try {
      const room = await getRoom(code);
      if (active && room) onChange(room);
    } catch {
      /* geçici ağ hatası — bir sonraki yoklama düzeltir */
    } finally {
      inFlight = false;
    }
  };

  const connect = () => {
    if (!active) return;
    if (channel) supabase.removeChannel(channel);
    channel = supabase
      .channel(`room:${code}:${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `code=eq.${code}` }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "slots", filter: `room_code=eq.${code}` }, refetch)
      .subscribe((status) => {
        // Kanal koptuysa/hata verdiyse tazele ve yeniden bağlan
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          refetch();
          setTimeout(connect, 2000);
        }
      });
  };

  // Uygulamaya geri dönüldüğünde / internet gelince anında tazele
  const onWake = () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    beat();
    refetch();
    connect();
  };

  const beat = () => { const uid = getUserId(); if (uid) sendHeartbeat(code, uid); };

  refetch();
  connect();
  beat();

  const poll = setInterval(refetch, POLL_MS);
  const hb = setInterval(beat, HEARTBEAT_MS);
  if (typeof window !== "undefined") {
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("online", onWake);
  }

  return () => {
    active = false;
    clearInterval(poll);
    clearInterval(hb);
    if (typeof window !== "undefined") {
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("online", onWake);
    }
    if (channel) supabase.removeChannel(channel);
  };
}
