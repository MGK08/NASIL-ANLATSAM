/** GET /api/room/[code] — odanın güncel durumunu (Room) döndürür. */
import { SupabaseRoomRepo } from "../../../../server/supabaseRoomRepo";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }): Promise<Response> {
  try {
    const { code } = await ctx.params;
    const repo = new SupabaseRoomRepo();
    const room = await repo.loadRoom(code);
    if (!room) return json({ ok: false, reason: "not_found" }, 404);
    return json(room, 200);
  } catch (e) {
    return json({ ok: false, reason: "server_error" }, 500);
  }
}
