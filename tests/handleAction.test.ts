import { handleAction } from "../src/server/handleAction";
import type { RoomRepo } from "../src/server/roomRepo";
import type { Room, TeamSetup } from "../src/types/game";
import { DEFAULT_SETTINGS, GamePhase } from "../src/types/game";

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => (c ? (pass++, console.log("  ✓", m)) : (fail++, console.log("  ✗ HATA:", m)));

/** Supabase yerine bellek-içi sahte repo (DB'yi taklit eder, klonlar). */
class InMemoryRepo implements RoomRepo {
  rooms = new Map<string, Room>();
  deck: string[];
  constructor(deck: string[]) { this.deck = deck; }
  async fetchDeckCardIds(): Promise<string[]> { return [...this.deck]; }
  async fetchCard(): Promise<null> { return null; }
  async loadRoom(code: string): Promise<Room | null> {
    const r = this.rooms.get(code);
    return r ? structuredClone(r) : null;
  }
  async insertRoom(room: Room): Promise<void> { this.rooms.set(room.code, structuredClone(room)); }
  async saveRoom(room: Room): Promise<void> { this.rooms.set(room.code, structuredClone(room)); }
}

const setup: TeamSetup = {
  hostName: "Ali",
  teamA: { name: "Kırmızılar", color: "#FF4A5F", playerNames: ["Ali", "Ayşe"], captainIndex: 1 },
  teamB: { name: "Maviler", color: "#3B82F6", playerNames: ["Veli", "Zeynep"], captainIndex: 0 },
};

async function main() {
  const repo = new InMemoryRepo(["c001", "c002", "c003", "c004", "c005"]);

  console.log("\n[1] CREATE_ROOM");
  const created = await handleAction(repo, {
    type: "CREATE_ROOM", hostUserId: "u_ali",
    settings: { ...DEFAULT_SETTINGS, targetScore: 5 }, setup,
  });
  ok(created.ok === true && !!created.code, "oda oluştu, kod döndü");
  const code = (created as { code: string }).code;
  ok(/^\d{8}$/.test(code), "kod 8 haneli ve sadece rakam: " + code);

  const room1 = await repo.loadRoom(code);
  ok(room1 !== null, "oda DB'de bulunuyor");
  const hostSlot = Object.values(room1!.slots).find((s) => s.isHost)!;
  ok(hostSlot.claimedByUserId === "u_ali", "host kendi slotunu sahiplenmiş");

  console.log("\n[2] Katılım: isim listesinden seçme (CLAIM_SLOT)");
  const ayseSlot = Object.values(room1!.slots).find((s) => s.name === "Ayşe")!;
  const veliSlot = Object.values(room1!.slots).find((s) => s.name === "Veli")!;
  const zeynepSlot = Object.values(room1!.slots).find((s) => s.name === "Zeynep")!;

  ok((await handleAction(repo, { type: "CLAIM_SLOT", code, slotId: ayseSlot.slotId, userId: "u_ayse" })).ok, "Ayşe seçildi");
  // aynı slotu başka biri seçemez
  const clash = await handleAction(repo, { type: "CLAIM_SLOT", code, slotId: ayseSlot.slotId, userId: "u_x" });
  ok(clash.ok === false && (clash as { reason: string }).reason === "slot_taken", "dolu slot reddedildi (slot_taken)");

  await handleAction(repo, { type: "CLAIM_SLOT", code, slotId: veliSlot.slotId, userId: "u_veli" });
  await handleAction(repo, { type: "CLAIM_SLOT", code, slotId: zeynepSlot.slotId, userId: "u_zey" });
  const room2 = await repo.loadRoom(code);
  ok(Object.values(room2!.slots).every((s) => s.claimedByUserId), "tüm isimler seçildi");

  console.log("\n[3] Yetki: host olmayan başlatamaz / bilinmeyen oda");
  const notHost = await handleAction(repo, { type: "START_GAME", code, byUserId: "u_veli" });
  ok(notHost.ok === false && (notHost as { reason: string }).reason === "host_only", "host olmayan reddedildi");
  const badRoom = await handleAction(repo, { type: "START_GAME", code: "00000000", byUserId: "u_ali" });
  ok(badRoom.ok === false && (badRoom as { reason: string }).reason === "room_not_found", "bilinmeyen oda reddedildi");

  console.log("\n[4] START_GAME + START_TURN (uçtan uca)");
  // çift sayı now -> yazı-tura teamA'ya düşer (test deterministik kalsın)
  ok((await handleAction(repo, { type: "START_GAME", code, byUserId: "u_ali" }, 1_700_000_000_000)).ok, "host oyunu başlattı");
  const room3 = await repo.loadRoom(code);
  ok(room3!.phase === GamePhase.PLAYING, "oyun PLAYING");
  ok(room3!.slots[room3!.activeTurn!.explainerSlotId].name === "Ali", "ilk anlatan Ali");
  ok((await handleAction(repo, { type: "START_TURN", code, byUserId: "u_ali" })).ok, "Ali turu başlattı");
  const room4 = await repo.loadRoom(code);
  ok(room4!.activeTurn!.currentCardId !== null, "ilk kart çekildi: " + room4!.activeTurn!.currentCardId);

  console.log(`\n==== handleAction: ${pass} geçti, ${fail} kaldı ====`);
  if (fail > 0) process.exit(1);
}
main();
