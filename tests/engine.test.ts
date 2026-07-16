import { createRoom } from "../src/engine/createRoom";
import { applyAction, validateAction } from "../src/engine/rulesEngine";
import type { Room, GameAction, TeamSetup } from "../src/types/game";
import { GamePhase, TurnStatus, DEFAULT_SETTINGS } from "../src/types/game";

let pass = 0, fail = 0;
function ok(cond: boolean, msg: string) {
  if (cond) { pass++; console.log("  ✓", msg); }
  else { fail++; console.log("  ✗ HATA:", msg); }
}
function slotByName(room: Room, name: string) {
  return Object.values(room.slots).find((s) => s.name === name)!;
}
// validateAction geçtiyse uygula, geçmezse hata fırlat
function step(room: Room, action: GameAction, now = 1000): Room {
  const v = validateAction(room, action);
  if (!v.ok) throw new Error(`validate reddetti: ${action.type} -> ${v.reason}`);
  return applyAction(room, action, now);
}

const setup: TeamSetup = {
  hostName: "Ali",
  teamA: { name: "Kırmızılar", color: "#FF4A5F", playerNames: ["Ali", "Ayşe"], captainIndex: 1 },
  teamB: { name: "Maviler", color: "#3B82F6", playerNames: ["Veli", "Zeynep"], captainIndex: 0 },
};

console.log("\n[1] createRoom");
let room = createRoom({
  code: "12345678",
  hostUserId: "u_ali",
  settings: { ...DEFAULT_SETTINGS, targetScore: 3, turnDurationSec: 60 },
  setup,
  deckCardIds: ["c001", "c002", "c003", "c004", "c005", "c006", "c007", "c008"],
});
ok(room.phase === GamePhase.LOBBY, "oda LOBBY'de başlar");
ok(slotByName(room, "Ali").claimedByUserId === "u_ali", "host kendi slotunu sahiplenir");
ok(slotByName(room, "Ali").isHost === true, "teamA ilk isim = host");
ok(slotByName(room, "Ayşe").isCaptain === true, "teamA kaptanı Ayşe");
ok(slotByName(room, "Veli").isCaptain === true, "teamB kaptanı Veli");

console.log("\n[2] Slot sahiplenme (isim seçme)");
room = step(room, { type: "CLAIM_SLOT", code: room.code, slotId: slotByName(room, "Ayşe").slotId, userId: "u_ayse" });
room = step(room, { type: "CLAIM_SLOT", code: room.code, slotId: slotByName(room, "Veli").slotId, userId: "u_veli" });
room = step(room, { type: "CLAIM_SLOT", code: room.code, slotId: slotByName(room, "Zeynep").slotId, userId: "u_zey" });
ok(Object.values(room.slots).every((s) => s.claimedByUserId), "tüm isimler seçildi (soluk)");
const takenSlot = slotByName(room, "Veli").slotId;
ok(!validateAction(room, { type: "CLAIM_SLOT", code: room.code, slotId: takenSlot, userId: "u_x" }).ok, "dolu slot tekrar seçilemez");

console.log("\n[3] İsim değiştirme");
const r2 = applyAction(room, { type: "CLAIM_SLOT", code: room.code, slotId: slotByName(room, "Ayşe").slotId, userId: "u_veli" });
ok(slotByName(r2, "Veli").claimedByUserId === null, "isim değişince eski slot serbest kalır");

console.log("\n[4] START_GAME");
ok(!validateAction(room, { type: "START_GAME", code: room.code, byUserId: "u_veli" }).ok, "host olmayan başlatamaz");
room = step(room, { type: "START_GAME", code: room.code, byUserId: "u_ali" });
ok(room.phase === GamePhase.PLAYING, "oyun PLAYING'e geçti");
ok(room.turnOrder.length === 4, "sıra 4 kişilik");
const order = room.turnOrder.map((id) => room.slots[id].name);
ok(JSON.stringify(order) === JSON.stringify(["Ali", "Veli", "Ayşe", "Zeynep"]), "sıra dönüşümlü: " + order.join(","));
ok(room.activeTurn!.status === TurnStatus.READY, "ilk anlatan READY (Başla bekler)");
ok(room.slots[room.activeTurn!.explainerSlotId].name === "Ali", "ilk anlatan Ali");

// Kartların tahmin edilebilir olması için desteyi sabitliyoruz
room.deckCardIds = ["c001", "c002", "c003", "c004", "c005", "c006", "c007", "c008"];
room.usedCardIds = [];

console.log("\n[5] START_TURN");
ok(!validateAction(room, { type: "START_TURN", code: room.code, byUserId: "u_veli" }).ok, "sırası olmayan başlatamaz");
room = step(room, { type: "START_TURN", code: room.code, byUserId: "u_ali" }, 1000);
ok(room.activeTurn!.status === TurnStatus.ACTIVE, "tur ACTIVE");
ok(room.activeTurn!.currentCardId === "c001", "ilk kart c001");
ok(room.activeTurn!.endsAt === 1000 + 60000, "bitiş süresi doğru (60sn)");

console.log("\n[6] Doğru bilme (+1) ve yeni kart");
room = step(room, { type: "CORRECT_GUESS", code: room.code, byUserId: "u_ali" });
ok(room.teams.teamA.score === 1, "teamA skoru 1");
ok(room.activeTurn!.currentCardId === "c002", "sonraki kart c002");

console.log("\n[7] Pas limiti (3 hak)");
room = step(room, { type: "PASS_CARD", code: room.code, byUserId: "u_ali" }); // c002 pas -> c003
room = step(room, { type: "PASS_CARD", code: room.code, byUserId: "u_ali" }); // c003 -> c004
room = step(room, { type: "PASS_CARD", code: room.code, byUserId: "u_ali" }); // c004 -> c005
ok(room.activeTurn!.usedPasses === 3, "3 pas kullanıldı");
ok(!validateAction(room, { type: "PASS_CARD", code: room.code, byUserId: "u_ali" }).ok, "4. pas reddedilir");
ok(room.activeTurn!.currentCardId === "c005", "pas sonrası kart c005");

console.log("\n[8] Tabu (rakip kaptan) -1");
ok(!validateAction(room, { type: "TABOO_VIOLATION", code: room.code, byUserId: "u_ali" }).ok, "anlatan tabu basamaz");
ok(!validateAction(room, { type: "TABOO_VIOLATION", code: room.code, byUserId: "u_zey" }).ok, "kaptan olmayan tabu basamaz");
room = step(room, { type: "TABOO_VIOLATION", code: room.code, byUserId: "u_veli" }); // rakip kaptan Veli
ok(room.teams.teamA.score === 0, "tabu ile skor 1->0 (altına inmez)");
ok(room.activeTurn!.tabooCardIds.length === 1, "tabu kartı kaydedildi");

console.log("\n[9] Süre bitti -> sıradaki anlatana geç (yarım kart sayılmaz)");
room = step(room, { type: "END_TURN", code: room.code });
ok(room.slots[room.activeTurn!.explainerSlotId].name === "Veli", "sıra Veli'ye geçti");
ok(room.activeTurn!.status === TurnStatus.READY, "yeni tur READY");
ok(room.activeTurn!.usedPasses === 0, "yeni turda pas hakkı sıfırlandı");

console.log("\n[10] Kazanma (hedef puana anında ulaşma, target=3)");
// Veli'nin turu: 3 doğru -> teamB 3 puana ulaşır ve kazanır
room = step(room, { type: "START_TURN", code: room.code, byUserId: "u_veli" }, 5000);
room = step(room, { type: "CORRECT_GUESS", code: room.code, byUserId: "u_veli" });
room = step(room, { type: "CORRECT_GUESS", code: room.code, byUserId: "u_veli" });
ok(room.phase === GamePhase.PLAYING, "2 doğruda henüz bitmedi");
room = step(room, { type: "CORRECT_GUESS", code: room.code, byUserId: "u_veli" });
ok(room.phase === GamePhase.FINISHED, "3. doğruda oyun FINISHED");
ok(room.winnerTeamId === "teamB", "kazanan teamB");

console.log("\n[11] Tekrar oyna (skorlar sıfırlanır)");
room = step(room, { type: "RESTART_GAME", code: room.code, byUserId: "u_ali" });
ok(room.teams.teamA.score === 0 && room.teams.teamB.score === 0, "skorlar sıfırlandı");
ok(room.phase === GamePhase.PLAYING && room.winnerTeamId === null, "yeni oyun başladı");

console.log(`\n==== SONUÇ: ${pass} geçti, ${fail} kaldı ====`);
if (fail > 0) process.exit(1);
