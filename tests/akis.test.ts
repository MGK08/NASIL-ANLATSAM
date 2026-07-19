/**
 * UÇTAN UCA AKIŞ TESTİ — sunucu + kurallar birlikte.
 * Tabu şeridi, duraklatma, geri alma, çift sayım koruması,
 * düşen oyuncunun yerine geçme ve kurucu devri.
 */
import { handleAction } from "../src/server/handleAction";
import type { RoomRepo } from "../src/server/roomRepo";
import type { Room, TeamSetup } from "../src/types/game";
import { DEFAULT_SETTINGS, GamePhase, TurnStatus } from "../src/types/game";

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => (c ? (pass++, console.log("  ✓", m)) : (fail++, console.log("  ✗ HATA:", m)));

class Repo implements RoomRepo {
  rooms = new Map<string, Room>();
  presence: Record<string, number> = {};
  deck: string[];
  constructor(deck: string[]) { this.deck = deck; }
  async fetchDeckCardIds(): Promise<string[]> { return [...this.deck]; }
  async fetchCard(): Promise<null> { return null; }
  async loadRoom(code: string): Promise<Room | null> {
    const r = this.rooms.get(code); return r ? structuredClone(r) : null;
  }
  async insertRoom(room: Room): Promise<void> { this.rooms.set(room.code, structuredClone(room)); }
  async saveRoom(room: Room): Promise<void> { this.rooms.set(room.code, structuredClone(room)); }
  async loadPresence(): Promise<Record<string, number>> { return { ...this.presence }; }
}

const setup: TeamSetup = {
  hostName: "Ali",
  teamA: { name: "Kırmızılar", color: "#FF4A5F", playerNames: ["Ali", "Ayşe"], captainIndex: 1 },
  teamB: { name: "Maviler", color: "#3B82F6", playerNames: ["Veli", "Zeynep"], captainIndex: 0 },
};

async function main() {
  const repo = new Repo(["c001", "c002", "c003", "c004", "c005", "c006"]);
  const T = 1_700_000_000_000; // çift sayı -> yazı-tura Kırmızılar'a düşer

  const created = await handleAction(repo, {
    type: "CREATE_ROOM", hostUserId: "u_ali",
    settings: { ...DEFAULT_SETTINGS, targetScore: 20 }, setup,
  }, T);
  const code = (created as { code: string }).code;
  const r0 = (await repo.loadRoom(code))!;
  const slotOf = (name: string) => Object.values(r0.slots).find((s) => s.name === name)!.slotId;

  // Herkes ismini seçsin
  await handleAction(repo, { type: "CLAIM_SLOT", code, slotId: slotOf("Ayşe"), userId: "u_ayse" }, T);
  await handleAction(repo, { type: "CLAIM_SLOT", code, slotId: slotOf("Veli"), userId: "u_veli" }, T);
  await handleAction(repo, { type: "CLAIM_SLOT", code, slotId: slotOf("Zeynep"), userId: "u_zey" }, T);

  console.log("\n[1] Oyun başlar, yazı-tura sonucu sıraya yansır");
  ok((await handleAction(repo, { type: "START_GAME", code, byUserId: "u_ali" }, T)).ok, "kurucu başlattı");
  let r = (await repo.loadRoom(code))!;
  ok(r.phase === GamePhase.PLAYING, "oyun PLAYING");
  const ilkAnlatan = r.slots[r.activeTurn!.explainerSlotId].name;
  ok(ilkAnlatan === "Ali", "çift zamanda yazı-tura Kırmızılar'a düştü (ilk anlatan Ali)");

  await handleAction(repo, { type: "START_TURN", code, byUserId: "u_ali" }, T);
  r = (await repo.loadRoom(code))!;
  const kart1 = r.activeTurn!.currentCardId!;
  ok(r.activeTurn!.status === TurnStatus.ACTIVE, "tur aktif, kart geldi");

  console.log("\n[2] Rakip kaptan tabu bildirir -> -1, süre durur, şerit açılır");
  const t1 = T + 10_000; // 10 sn geçti
  const rep = await handleAction(repo, { type: "TABOO_VIOLATION", code, byUserId: "u_veli", cardId: kart1 }, t1);
  ok(rep.ok, "rakip kaptan (Veli) tabu bildirdi");
  r = (await repo.loadRoom(code))!;
  ok(r.teams.teamA.score === 0, "puan 0'ın altına inmedi");
  ok(!!r.activeTurn!.pausedAt, "süre duraklatıldı");
  ok(r.activeTurn!.currentCardId === kart1, "şerit boyunca kart ekranda kaldı");
  const kalan = r.activeTurn!.pausedRemainingMs!;
  ok(kalan > 0 && kalan <= DEFAULT_SETTINGS.turnDurationSec * 1000, "kalan süre saklandı: " + Math.round(kalan / 1000) + " sn");

  console.log("\n[3] Çift sayım koruması");
  ok(!(await handleAction(repo, { type: "TABOO_VIOLATION", code, byUserId: "u_ali", cardId: kart1 }, t1 + 500)).ok,
     "şerit açıkken anlatanın ikinci bildirimi reddedildi");
  ok(!(await handleAction(repo, { type: "CORRECT_GUESS", code, byUserId: "u_ali" }, t1 + 600)).ok,
     "duraklatılmışken Anlattım çalışmadı");
  ok(!(await handleAction(repo, { type: "END_TURN", code }, t1 + 700)).ok,
     "duraklatılmışken süre bitmiş sayılmadı");

  console.log("\n[4] Geri al (yalnızca bildiren kişi)");
  ok(!(await handleAction(repo, { type: "UNDO_TABOO", code, byUserId: "u_zey" }, t1 + 800)).ok,
     "başkası geri alamadı");
  ok((await handleAction(repo, { type: "UNDO_TABOO", code, byUserId: "u_veli" }, t1 + 900)).ok, "bildiren geri aldı");
  r = (await repo.loadRoom(code))!;
  ok(r.teams.teamA.score === 0, "puan iade edildi (zaten 0'dı)");
  ok(r.activeTurn!.tabooCardIds.length === 0, "tabu kaydı silindi");
  ok(!r.activeTurn!.pausedAt, "süre yeniden akıyor");
  ok(r.activeTurn!.currentCardId === kart1, "aynı karttan devam edildi");

  console.log("\n[5] Tekrar tabu -> şerit bitince yeni kart, süre kaldığı yerden");
  await handleAction(repo, { type: "CORRECT_GUESS", code, byUserId: "u_ali" }, t1 + 1000); // skor 1
  r = (await repo.loadRoom(code))!;
  const kart2 = r.activeTurn!.currentCardId!;
  ok(r.teams.teamA.score === 1, "doğru bilme +1");
  await handleAction(repo, { type: "TABOO_VIOLATION", code, byUserId: "u_veli", cardId: kart2 }, t1 + 2000);
  r = (await repo.loadRoom(code))!;
  ok(r.teams.teamA.score === 0, "tabu -1 uygulandı");
  const kalan2 = r.activeTurn!.pausedRemainingMs!;
  const t2 = t1 + 2000 + 5000; // 5 sn şerit
  ok((await handleAction(repo, { type: "RESUME_AFTER_TABOO", code }, t2)).ok, "şerit bitti, devam edildi");
  r = (await repo.loadRoom(code))!;
  ok(r.activeTurn!.currentCardId !== kart2, "yeni kart geldi");
  ok(!r.activeTurn!.pausedAt, "süre akıyor");
  ok(Math.abs((r.activeTurn!.endsAt! - t2) - kalan2) < 5, "duraklatılan süre kaybolmadı (kaldığı yerden)");

  console.log("\n[6] Eski karta ait geç istek yok sayılır");
  ok(!(await handleAction(repo, { type: "TABOO_VIOLATION", code, byUserId: "u_veli", cardId: kart2 }, t2 + 100)).ok,
     "ekranı yenilenmemiş kaptanın geç isteği reddedildi");

  console.log("\n[7] Duraklat / devam (rakip kaptan)");
  ok(!(await handleAction(repo, { type: "PAUSE_TURN", code, byUserId: "u_ali" }, t2 + 200)).ok, "anlatan duraklatamadı");
  ok((await handleAction(repo, { type: "PAUSE_TURN", code, byUserId: "u_veli" }, t2 + 300)).ok, "rakip kaptan duraklattı");
  ok(!(await handleAction(repo, { type: "RESUME_TURN", code, byUserId: "u_zey" }, t2 + 400)).ok, "başkası devam ettiremedi");
  ok((await handleAction(repo, { type: "RESUME_TURN", code, byUserId: "u_veli" }, t2 + 500)).ok, "rakip kaptan devam ettirdi");

  console.log("\n[8] Düşen oyuncunun yerine geçme");
  const t3 = t2 + 10_000;
  repo.presence = { u_ali: t3 - 1000, u_veli: t3 - 1000, u_zey: t3 - 1000, u_ayse: t3 - 1000 };
  ok(!(await handleAction(repo, { type: "TAKEOVER_SLOT", code, slotId: slotOf("Ayşe"), userId: "u_yeni" }, t3)).ok,
     "bağlı oyuncunun yeri alınamadı");
  repo.presence.u_ayse = t3 - 60_000; // Ayşe 60 sn'dir sessiz
  ok((await handleAction(repo, { type: "TAKEOVER_SLOT", code, slotId: slotOf("Ayşe"), userId: "u_yeni" }, t3)).ok,
     "düşen oyuncunun (Ayşe) yerine geçildi");
  r = (await repo.loadRoom(code))!;
  ok(r.slots[slotOf("Ayşe")].claimedByUserId === "u_yeni", "isim yeni cihaza geçti");
  ok(r.phase === GamePhase.PLAYING, "oyun bu sırada bitmedi");

  console.log("\n[9] Kurucu düşerse yetki devri, dönünce geri gelir");
  repo.presence = { u_ali: t3 - 60_000, u_veli: t3 - 1000, u_zey: t3 - 1000, u_yeni: t3 - 1000 };
  ok((await handleAction(repo, { type: "END_GAME", code, byUserId: "u_veli" }, t3)).ok,
     "kurucu düşünce sıradaki bağlı oyuncu oyunu bitirebildi");
  r = (await repo.loadRoom(code))!;
  ok(r.phase === GamePhase.FINISHED, "oyun bitti");
  repo.presence.u_ali = t3; // kurucu geri döndü
  ok((await handleAction(repo, { type: "RESTART_GAME", code, byUserId: "u_ali" }, t3 + 1000)).ok,
     "kurucu dönünce yetkileri geri geldi");
  ok(!(await handleAction(repo, { type: "END_GAME", code, byUserId: "u_veli" }, t3 + 1100)).ok,
     "kurucu bağlıyken başkası bitiremedi");

  console.log(`\n==== akış: ${pass} geçti, ${fail} kaldı ====`);
  if (fail > 0) process.exit(1);
}
main();
