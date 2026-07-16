import { createRoom } from "../src/engine/createRoom";
import { mapRoomToRows, mapRowsToRoom, type DbRoomRow } from "../src/server/roomMapper";
import type { TeamSetup } from "../src/types/game";
import { DEFAULT_SETTINGS, GamePhase } from "../src/types/game";

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => (c ? (pass++, console.log("  ✓", m)) : (fail++, console.log("  ✗ HATA:", m)));

const setup: TeamSetup = {
  hostName: "Ali",
  teamA: { name: "Kırmızılar", color: "#FF4A5F", playerNames: ["Ali", "Ayşe"], captainIndex: 1 },
  teamB: { name: "Maviler", color: "#3B82F6", playerNames: ["Veli", "Zeynep"], captainIndex: 0 },
};

console.log("\n[roomMapper] gidiş-dönüş (Room -> DB satırları -> Room)");
const original = createRoom({
  code: "99887766",
  hostUserId: "u_ali",
  settings: DEFAULT_SETTINGS,
  setup,
  deckCardIds: ["c001", "c002", "c003"],
  now: 1000,
});

const { roomRow, slotRows } = mapRoomToRows(original);
// DB'nin ekleyeceği zaman damgalarını taklit et (ISO string)
const dbRoomRow: DbRoomRow = { ...roomRow, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" };
const back = mapRowsToRoom(dbRoomRow, slotRows);

ok(back.code === original.code, "code korunur");
ok(back.phase === GamePhase.LOBBY, "phase korunur");
ok(Object.keys(back.slots).length === 4, "4 slot geri geldi");
ok(back.teams.teamA.name === "Kırmızılar" && back.teams.teamB.name === "Maviler", "takım isimleri korunur");
ok(back.teams.teamA.captainSlotId === original.teams.teamA.captainSlotId, "kaptan slotId korunur");
ok(JSON.stringify(back.deckCardIds.sort()) === JSON.stringify(["c001", "c002", "c003"]), "deste id'leri korunur");
const hostSlot = Object.values(back.slots).find((s) => s.isHost)!;
ok(hostSlot.claimedByUserId === "u_ali" && hostSlot.name === "Ali", "host slotu sahiplenilmiş halde korunur");
ok(typeof back.createdAt === "number", "created_at sayıya (ms) dönüştü");

console.log(`\n==== roomMapper: ${pass} geçti, ${fail} kaldı ====`);
if (fail > 0) process.exit(1);
