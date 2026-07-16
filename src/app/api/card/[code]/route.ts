/** GET /api/card/[code]?userId=... — aktif kartı yalnızca YETKİLİ role verir. */
import { SupabaseRoomRepo } from "../../../../server/supabaseRoomRepo";
import { viewRole } from "../../../../engine/roles";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }): Promise<Response> {
  try {
    const { code } = await ctx.params;
    const userId = new URL(req.url).searchParams.get("userId") ?? "";
    const repo = new SupabaseRoomRepo();
    const room = await repo.loadRoom(code);
    if (!room || !room.activeTurn?.currentCardId) return json({ ok: false, reason: "no_card" }, 404);

    const role = viewRole(room, userId);
    // Anlatanın kendi takımı kartı göremez
    if (role === "teammate" || role === "none") return json({ ok: false, reason: "forbidden" }, 403);

    const card = await repo.fetchCard(room.activeTurn.currentCardId);
    if (!card) return json({ ok: false, reason: "card_not_found" }, 404);
    return json(card, 200);
  } catch {
    return json({ ok: false, reason: "server_error" }, 500);
  }
}
