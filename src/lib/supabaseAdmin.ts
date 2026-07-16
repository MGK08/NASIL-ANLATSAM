/**
 * SUNUCU istemcisi (service role). RLS'i bypass eder — yetkili yazma burada.
 * ⚠️ Bu dosya ASLA istemci bileşenine import edilmez. Sadece API route /
 * server action içinden çağrılır.
 */
import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
