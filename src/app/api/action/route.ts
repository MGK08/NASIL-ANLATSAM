/** POST /api/action — yetkili aksiyon uç noktası. */
import type { GameAction } from "../../../types/game";
import { handleAction } from "../../../server/handleAction";
import { SupabaseRoomRepo } from "../../../server/supabaseRoomRepo";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { action?: GameAction };
    if (!body?.action) return json({ ok: false, reason: "missing_action" }, 400);
    const repo = new SupabaseRoomRepo();
    const result = await handleAction(repo, body.action);
    return json(result, result.ok ? 200 : 400);
  } catch (e) {
    return json({ ok: false, reason: "server_error" }, 500);
  }
}
