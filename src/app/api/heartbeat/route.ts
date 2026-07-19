/** POST /api/heartbeat — "buradayım" sinyali (bağlantı takibi). */
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST(req: Request): Promise<Response> {
  try {
    const { code, userId } = await req.json();
    if (!code || !userId) return new Response(JSON.stringify({ ok: false }), { status: 400 });
    await supabaseAdmin.from("presence").upsert(
      { room_code: String(code), user_id: String(userId), last_seen_at: new Date().toISOString() },
      { onConflict: "room_code,user_id" }
    );
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
}
