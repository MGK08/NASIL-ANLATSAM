/** Bağlantı kuralları: kurucu devri + düşen oyuncunun yerine geçme. */
import { effectiveHostUserId, isSlotTakeoverable, isOnline, OFFLINE_AFTER_MS } from "../src/server/presenceRules";
import type { Room, PlayerSlot } from "../src/types/game";
import { GamePhase } from "../src/types/game";

let pass = 0, fail = 0;
function ok(cond: boolean, msg: string) {
  if (cond) { pass++; console.log("  ✓ " + msg); }
  else { fail++; console.log("  ✗ HATA: " + msg); }
}

const NOW = 1_700_000_000_000;
const slot = (id: string, user: string | null, team: "teamA" | "teamB", pos: number, host = false): PlayerSlot => ({
  slotId: id, name: id, teamId: team, turnPosition: pos, isHost: host, isCaptain: false,
  claimedByUserId: user, connected: true,
});

const room = {
  code: "12345678",
  hostUserId: "u_host",
  phase: GamePhase.PLAYING,
  settings: {} as never,
  teams: {} as never,
  slots: {
    s1: slot("s1", "u_host", "teamA", 0, true),
    s2: slot("s2", "u_ali", "teamA", 1),
    s3: slot("s3", "u_veli", "teamB", 0),
    s4: slot("s4", null, "teamB", 1),
  },
  round: 1,
  turnOrder: ["s1", "s3", "s2"],
  turnIndex: 0,
  activeTurn: null,
  deckCardIds: [],
  usedCardIds: [],
  winnerTeamId: null,
  createdAt: NOW,
  updatedAt: NOW,
} as unknown as Room;

console.log("\n[1] Çevrimiçi tespiti");
ok(isOnline({ u_ali: NOW - 5_000 }, "u_ali", NOW), "5 sn önce görülen bağlı sayılır");
ok(!isOnline({ u_ali: NOW - 45_000 }, "u_ali", NOW), "45 sn önce görülen düşmüş sayılır");
ok(OFFLINE_AFTER_MS === 30_000, "eşik 30 saniye");

console.log("\n[2] Kurucu devri");
ok(effectiveHostUserId(room, { u_host: NOW - 3_000, u_ali: NOW - 1_000 }, NOW) === "u_host",
   "kurucu bağlıysa yetki onda");
ok(effectiveHostUserId(room, { u_veli: NOW - 1_000, u_ali: NOW - 1_000 }, NOW) === "u_veli",
   "kurucu düşünce yetki tur sırasındaki ilk bağlı oyuncuya geçer");
ok(effectiveHostUserId(room, { u_host: NOW - 1_000, u_veli: NOW - 1_000 }, NOW) === "u_host",
   "kurucu geri dönünce yetki ona geri gelir");
ok(effectiveHostUserId(room, {}, NOW) === "u_host", "kimse bağlı değilse yetki kurucuda kalır");

console.log("\n[3] Yerine geçme");
ok(isSlotTakeoverable(room, "s4", { u_host: NOW }, NOW), "boş slot alınabilir");
ok(!isSlotTakeoverable(room, "s2", { u_ali: NOW - 2_000, u_host: NOW }, NOW), "bağlı oyuncunun yeri alınamaz");
ok(isSlotTakeoverable(room, "s2", { u_ali: NOW - 60_000, u_host: NOW }, NOW), "düşen oyuncunun yeri alınabilir");
ok(!isSlotTakeoverable(room, "s2", {}, NOW), "bağlantı kaydı hiç yoksa dolu slot alınamaz (güvenli taraf)");

console.log(`\n==== presence: ${pass} geçti, ${fail} kaldı ====`);
if (fail > 0) process.exit(1);
