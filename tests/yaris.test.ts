/**
 * YARIŞ TESTİ — "aynı kelime iki takıma geldi" hatası.
 * İki istemci aynı anda yazarsa, eski kopyayı kaydeden istek
 * "bu kart kullanıldı" bilgisini siliyordu. İyimser kilit bunu önler.
 */
import { handleAction } from "../src/server/handleAction";
import { ConflictError, type RoomRepo } from "../src/server/roomRepo";
import type { Room, TeamSetup } from "../src/types/game";
import { DEFAULT_SETTINGS } from "../src/types/game";

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => (c ? (pass++, console.log("  ✓", m)) : (fail++, console.log("  ✗ HATA:", m)));

/** Supabase'in sürüm kontrolünü taklit eden repo. */
class VersionedRepo implements RoomRepo {
  rooms = new Map<string, Room>();
  version = new Map<string, number>();
  deck: string[];
  /** true ise loadRoom hep ilk (bayat) kopyayı döndürür -> yarış senaryosu */
  freeze: Room | null = null;
  constructor(deck: string[]) { this.deck = deck; }
  async fetchDeckCardIds(): Promise<string[]> { return [...this.deck]; }
  async fetchCard(): Promise<null> { return null; }
  async loadRoom(code: string): Promise<Room | null> {
    if (this.freeze) return structuredClone(this.freeze);
    const r = this.rooms.get(code);
    if (!r) return null;
    const clone = structuredClone(r);
    clone.updatedAt = this.version.get(code)!;
    return clone;
  }
  async insertRoom(room: Room): Promise<void> {
    this.rooms.set(room.code, structuredClone(room));
    this.version.set(room.code, 1);
  }
  async saveRoom(room: Room, opts?: { expectedUpdatedAt?: number }): Promise<void> {
    const cur = this.version.get(room.code)!;
    if (opts?.expectedUpdatedAt && opts.expectedUpdatedAt !== cur) throw new ConflictError();
    this.rooms.set(room.code, structuredClone(room));
    this.version.set(room.code, cur + 1);
  }
}

const setup: TeamSetup = {
  hostName: "Ali",
  teamA: { name: "Kırmızılar", color: "#FF4A5F", playerNames: ["Ali", "Ayşe"], captainIndex: 1 },
  teamB: { name: "Maviler", color: "#3B82F6", playerNames: ["Veli", "Zeynep"], captainIndex: 0 },
};

async function main() {
  const deste = Array.from({ length: 40 }, (_, i) => "c" + String(i + 1).padStart(3, "0"));
  const repo = new VersionedRepo(deste);
  const T = 1_700_000_000_000;

  const created = await handleAction(repo, {
    type: "CREATE_ROOM", hostUserId: "u_ali",
    settings: { ...DEFAULT_SETTINGS, targetScore: 50 }, setup,
  }, T);
  const code = (created as { code: string }).code;
  const r0 = (await repo.loadRoom(code))!;
  const slotOf = (n: string) => Object.values(r0.slots).find((s) => s.name === n)!.slotId;
  await handleAction(repo, { type: "CLAIM_SLOT", code, slotId: slotOf("Ayşe"), userId: "u_ayse" }, T);
  await handleAction(repo, { type: "CLAIM_SLOT", code, slotId: slotOf("Veli"), userId: "u_veli" }, T);
  await handleAction(repo, { type: "CLAIM_SLOT", code, slotId: slotOf("Zeynep"), userId: "u_zey" }, T);
  await handleAction(repo, { type: "START_GAME", code, byUserId: "u_ali" }, T);
  await handleAction(repo, { type: "START_TURN", code, byUserId: "u_ali" }, T);

  console.log("\n[1] Bayat kopyadan gelen yazma engellenir");
  const bayat = (await repo.loadRoom(code))!;          // sürüm N
  await handleAction(repo, { type: "CORRECT_GUESS", code, byUserId: "u_ali" }, T + 1000); // sürüm N+1
  let catisma = false;
  try {
    await repo.saveRoom(bayat, { expectedUpdatedAt: bayat.updatedAt }); // eski sürümle yazmayı dene
  } catch (e) { catisma = (e as Error).name === "ConflictError"; }
  ok(catisma, "eski sürümle yazma reddedildi (kayıp güncelleme önlendi)");

  console.log("\n[2] Eş zamanlı istekler -> hiçbir kart tekrar etmiyor");
  const gorulen: string[] = [];
  for (let i = 0; i < 5; i++) {
    const r = (await repo.loadRoom(code))!;
    gorulen.push(r.activeTurn!.currentCardId!);
    // aynı anda iki istek: biri çakışır, tekrar denenip doğru uygulanır
    await Promise.all([
      handleAction(repo, { type: "CORRECT_GUESS", code, byUserId: "u_ali" }, T + 2000 + i * 10),
      handleAction(repo, { type: "PASS_CARD", code, byUserId: "u_ali" }, T + 2000 + i * 10 + 5),
    ]);
  }
  const son = (await repo.loadRoom(code))!;
  gorulen.push(son.activeTurn!.currentCardId!);
  const tekrar = gorulen.filter((c, i) => gorulen.indexOf(c) !== i);
  ok(tekrar.length === 0, "aynı kelime iki kez gelmedi (görülen: " + gorulen.join(",") + ")");
  ok(son.usedCardIds.length === new Set(son.usedCardIds).size, "kullanılan kart listesinde tekrar yok");
  ok(son.usedCardIds.length >= gorulen.length - 1, "kullanılan kart kaydı kaybolmadı");

  console.log(`\n==== yarış: ${pass} geçti, ${fail} kaldı ====`);
  if (fail > 0) process.exit(1);
}
main();
