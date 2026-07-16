/**
 * TARAYICI istemcisi (anon key). Yalnızca okuma + Realtime abonelikleri.
 * Yazma işlemleri bununla YAPILMAZ; sunucudaki API route'larından geçer.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anon, {
  realtime: { params: { eventsPerSecond: 20 } },
});
