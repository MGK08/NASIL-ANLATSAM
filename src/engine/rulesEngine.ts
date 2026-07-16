import type { Room, GameAction, PlayerSlot, TeamId, ActiveTurn } from "../types/game";
import { GamePhase, TurnStatus } from "../types/game";
import { buildTurnOrder, nextTurnIndex, allSlotsClaimed, hasEnoughPlayers } from "./turnOrder";
import { drawNextCard } from "./deck";
import { checkWinner } from "./scoring";

/* ---------- yardımcılar ---------- */
function clone(room: Room): Room {
  return structuredClone(room);
}
function slotOfUser(room: Room, userId: string): PlayerSlot | undefined {
  return Object.values(room.slots).find((s) => s.claimedByUserId === userId);
}
function otherTeam(t: TeamId): TeamId {
  return t === "teamA" ? "teamB" : "teamA";
}
function currentExplainer(room: Room): PlayerSlot | undefined {
  const id = room.activeTurn?.explainerSlotId;
  return id ? room.slots[id] : undefined;
}
function freshTurn(explainerSlotId: string, teamId: TeamId): ActiveTurn {
  return {
    explainerSlotId,
    teamId,
    status: TurnStatus.READY,
    currentCardId: null,
    startedAt: null,
    endsAt: null,
    correctCardIds: [],
    passedCardIds: [],
    tabooCardIds: [],
    usedPasses: 0,
  };
}
/** Sıradaki anlatanı hazırlar (READY). Kazanan varsa FINISHED'e geçmez; onu applyAction yönetir. */
function advanceToNextExplainer(room: Room): void {
  room.turnIndex = nextTurnIndex(room.turnOrder, room.turnIndex);
  const nextSlotId = room.turnOrder[room.turnIndex];
  const teamId = room.slots[nextSlotId].teamId;
  room.round += 1;
  room.activeTurn = freshTurn(nextSlotId, teamId);
  room.phase = GamePhase.PLAYING;
}

/* ============================================================
 * DOĞRULAMA — aksiyon uygulanmadan önce izin/kural kontrolü
 * ============================================================ */
export function validateAction(
  room: Room,
  action: GameAction
): { ok: true } | { ok: false; reason: string } {
  switch (action.type) {
    case "CLAIM_SLOT": {
      if (room.phase !== GamePhase.LOBBY) return { ok: false, reason: "lobby_only" };
      const slot = room.slots[action.slotId];
      if (!slot) return { ok: false, reason: "slot_not_found" };
      if (slot.claimedByUserId && slot.claimedByUserId !== action.userId)
        return { ok: false, reason: "slot_taken" };
      return { ok: true };
    }
    case "RELEASE_SLOT":
      if (room.phase !== GamePhase.LOBBY) return { ok: false, reason: "lobby_only" };
      return { ok: true };

    case "START_GAME": {
      if (room.phase !== GamePhase.LOBBY) return { ok: false, reason: "lobby_only" };
      if (action.byUserId !== room.hostUserId) return { ok: false, reason: "host_only" };
      if (!allSlotsClaimed(room.slots)) return { ok: false, reason: "not_all_claimed" };
      if (!hasEnoughPlayers(room.slots)) return { ok: false, reason: "min_2_per_team" };
      return { ok: true };
    }

    case "START_TURN": {
      const ex = currentExplainer(room);
      if (!ex) return { ok: false, reason: "no_active_turn" };
      if (ex.claimedByUserId !== action.byUserId) return { ok: false, reason: "not_your_turn" };
      if (room.activeTurn?.status !== TurnStatus.READY) return { ok: false, reason: "not_ready" };
      return { ok: true };
    }

    case "CORRECT_GUESS":
    case "PASS_CARD": {
      const ex = currentExplainer(room);
      if (!ex || ex.claimedByUserId !== action.byUserId) return { ok: false, reason: "not_explainer" };
      if (room.activeTurn?.status !== TurnStatus.ACTIVE) return { ok: false, reason: "turn_not_active" };
      if (action.type === "PASS_CARD" && room.activeTurn.usedPasses >= room.settings.passLimit)
        return { ok: false, reason: "no_passes_left" };
      return { ok: true };
    }

    case "TABOO_VIOLATION": {
      if (room.activeTurn?.status !== TurnStatus.ACTIVE) return { ok: false, reason: "turn_not_active" };
      const opp = otherTeam(room.activeTurn.teamId);
      const capSlotId = room.teams[opp].captainSlotId;
      const capSlot = capSlotId ? room.slots[capSlotId] : undefined;
      if (!capSlot || capSlot.claimedByUserId !== action.byUserId)
        return { ok: false, reason: "only_opponent_captain" };
      return { ok: true };
    }

    case "END_TURN":
      // Yalnızca aktif tur bitirilebilir; ilk END_TURN sonrası status READY olur,
      // ikinci (çift) END_TURN reddedilir -> yanlışlıkla iki tur atlanmaz.
      if (room.activeTurn?.status !== TurnStatus.ACTIVE) return { ok: false, reason: "turn_not_active" };
      return { ok: true };
    case "NEXT_TURN":
      if (!room.activeTurn) return { ok: false, reason: "no_active_turn" };
      return { ok: true };

    case "END_GAME":
    case "RESTART_GAME":
      if (action.byUserId !== room.hostUserId) return { ok: false, reason: "host_only" };
      return { ok: true };

    case "RECONNECT":
      return { ok: true };

    default:
      return { ok: false, reason: "unknown_action" };
  }
}

/* ============================================================
 * UYGULAMA — saf reducer: (room, action) => yeni room
 * ============================================================ */
export function applyAction(room: Room, action: GameAction, now: number = Date.now()): Room {
  const r = clone(room);
  r.updatedAt = now;

  switch (action.type) {
    case "CLAIM_SLOT": {
      // Kullanıcı başka slot tutuyorsa önce bırak (isim değiştirme)
      const prev = slotOfUser(r, action.userId);
      if (prev) { prev.claimedByUserId = null; prev.connected = false; }
      const slot = r.slots[action.slotId];
      slot.claimedByUserId = action.userId;
      slot.connected = true;
      if (action.avatar) slot.avatar = action.avatar;
      return r;
    }

    case "RELEASE_SLOT": {
      const prev = slotOfUser(r, action.userId);
      if (prev) { prev.claimedByUserId = null; prev.connected = false; }
      return r;
    }

    case "START_GAME": {
      r.turnOrder = buildTurnOrder(r.slots);
      r.turnIndex = 0;
      r.round = 1;
      const firstSlotId = r.turnOrder[0];
      r.activeTurn = freshTurn(firstSlotId, r.slots[firstSlotId].teamId);
      r.phase = GamePhase.PLAYING;
      return r;
    }

    case "START_TURN": {
      const t = r.activeTurn!;
      const drawn = drawNextCard(r);
      r.usedCardIds = drawn.usedCardIds;
      t.currentCardId = drawn.cardId;
      t.status = TurnStatus.ACTIVE;
      t.startedAt = now;
      t.endsAt = now + r.settings.turnDurationSec * 1000;
      return r;
    }

    case "CORRECT_GUESS": {
      const t = r.activeTurn!;
      if (t.currentCardId) t.correctCardIds.push(t.currentCardId);
      r.teams[t.teamId].score += r.settings.correctPoints;
      // hedef puana anında ulaşıldı mı?
      const winner = checkWinner(r);
      if (winner) {
        r.winnerTeamId = winner;
        r.phase = GamePhase.FINISHED;
        t.status = TurnStatus.ENDED;
        t.currentCardId = null;
        return r;
      }
      const drawn = drawNextCard(r);
      r.usedCardIds = drawn.usedCardIds;
      t.currentCardId = drawn.cardId;
      return r;
    }

    case "PASS_CARD": {
      const t = r.activeTurn!;
      if (t.currentCardId) t.passedCardIds.push(t.currentCardId);
      t.usedPasses += 1;
      const drawn = drawNextCard(r);
      r.usedCardIds = drawn.usedCardIds;
      t.currentCardId = drawn.cardId;
      return r;
    }

    case "TABOO_VIOLATION": {
      const t = r.activeTurn!;
      if (t.currentCardId) t.tabooCardIds.push(t.currentCardId);
      const team = r.teams[t.teamId];
      team.score = Math.max(0, team.score - r.settings.tabooPenalty); // 0'ın altına inmez
      const drawn = drawNextCard(r);
      r.usedCardIds = drawn.usedCardIds;
      t.currentCardId = drawn.cardId;
      return r;
    }

    case "END_TURN":
    case "NEXT_TURN": {
      // Yarım kart sayılmaz; sıradaki anlatana geç (READY, "Başla" bekler)
      if (r.phase === GamePhase.FINISHED) return r;
      advanceToNextExplainer(r);
      return r;
    }

    case "END_GAME": {
      r.phase = GamePhase.FINISHED;
      if (!r.winnerTeamId) {
        const a = r.teams.teamA.score, b = r.teams.teamB.score;
        r.winnerTeamId = a === b ? null : a > b ? "teamA" : "teamB";
      }
      if (r.activeTurn) r.activeTurn.status = TurnStatus.ENDED;
      return r;
    }

    case "RESTART_GAME": {
      r.teams.teamA.score = 0;
      r.teams.teamB.score = 0;
      r.usedCardIds = [];
      r.winnerTeamId = null;
      r.round = 1;
      r.turnOrder = buildTurnOrder(r.slots);
      r.turnIndex = 0;
      const firstSlotId = r.turnOrder[0];
      r.activeTurn = freshTurn(firstSlotId, r.slots[firstSlotId].teamId);
      r.phase = GamePhase.PLAYING;
      return r;
    }

    case "RECONNECT": {
      const slot = slotOfUser(r, action.userId);
      if (slot) slot.connected = true;
      return r;
    }

    default:
      return r;
  }
}
