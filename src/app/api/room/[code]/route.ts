/** GET /api/room/[code] — odanın güncel durumu + kim çevrimiçi bilgisi. */
import { SupabaseRoomRepo } from "../../../../server/supabaseRoomRepo";
import { presenceBySlot, effectiveHostUserId } from "../../../../server/presenceRules";
import { jsonCors, optionsResponse } from "../../../../server/cors";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }): Promise<Response> {
  try {
    const { code } = await ctx.params;
    const repo = new SupabaseRoomRepo();
    const room = await repo.loadRoom(code);
    if (!room) return jsonCors({ ok: false, reason: "not_found" }, 404);
    const raw = await repo.loadPresence(code);
    return jsonCors(
      { ...room, presence: presenceBySlot(room, raw), effectiveHostUserId: effectiveHostUserId(room, raw) },
      200
    );
  } catch {
    return jsonCors({ ok: false, reason: "server_error" }, 500);
  }
}

export async function OPTIONS(): Promise<Response> {
  return optionsResponse();
}
