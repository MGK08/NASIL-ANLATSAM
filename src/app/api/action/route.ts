/** POST /api/action — tüm oyun aksiyonlarının tek girişi. */
import { handleAction } from "../../../server/handleAction";
import { SupabaseRoomRepo } from "../../../server/supabaseRoomRepo";
import { jsonCors, optionsResponse } from "../../../server/cors";
import type { GameAction } from "../../../types/game";

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { action?: GameAction };
    if (!body?.action) return jsonCors({ ok: false, reason: "missing_action" }, 400);
    const result = await handleAction(new SupabaseRoomRepo(), body.action);
    return jsonCors(result, result.ok ? 200 : 400);
  } catch {
    return jsonCors({ ok: false, reason: "server_error" }, 500);
  }
}

export async function OPTIONS(): Promise<Response> {
  return optionsResponse();
}
