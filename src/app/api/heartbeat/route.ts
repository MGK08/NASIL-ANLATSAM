/** POST /api/heartbeat — "buradayım" sinyali (bağlantı takibi). */
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { jsonCors, optionsResponse } from "../../../server/cors";

export async function POST(req: Request): Promise<Response> {
  try {
    const { code, userId } = (await req.json()) as { code?: string; userId?: string };
    if (!code || !userId) return jsonCors({ ok: false }, 400);
    await supabaseAdmin.from("presence").upsert(
      { room_code: String(code), user_id: String(userId), last_seen_at: new Date().toISOString() },
      { onConflict: "room_code,user_id" }
    );
    return jsonCors({ ok: true }, 200);
  } catch {
    return jsonCors({ ok: false }, 500);
  }
}

export async function OPTIONS(): Promise<Response> {
  return optionsResponse();
}
