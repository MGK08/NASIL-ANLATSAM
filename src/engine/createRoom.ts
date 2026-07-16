import type { Room, GameSettings, TeamSetup, PlayerSlot, Team, TeamId } from "../types/game";
import { GamePhase } from "../types/game";
import { shuffle } from "./deck";

let _uuid = 0;
/** Test edilebilir uuid: gerçek ortamda crypto.randomUUID ile değiştirilebilir. */
function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `slot_${++_uuid}`;
}

/**
 * Kurucu "Oyun Kur"u tamamlayınca çağrılır. Boş bir oda (LOBBY) üretir:
 * slotları oluşturur, kaptanları işaretler, host teamA'nın ilk slotunu sahiplenir.
 * deckCardIds: sunucunun Supabase'den çekip karıştırdığı kart id listesi.
 */
export function createRoom(args: {
  code: string;
  hostUserId: string;
  settings: GameSettings;
  setup: TeamSetup;
  deckCardIds: string[];
  rng?: () => number;
  now?: number;
}): Room {
  const { code, hostUserId, settings, setup, deckCardIds, rng = Math.random } = args;
  const now = args.now ?? Date.now();

  const slots: Record<string, PlayerSlot> = {};

  function addTeamSlots(teamId: TeamId, cfg: TeamSetup["teamA"]): string | null {
    let captainSlotId: string | null = null;
    cfg.playerNames.forEach((name, idx) => {
      const slotId = makeId();
      const isHost = teamId === "teamA" && idx === 0;
      const isCaptain = idx === cfg.captainIndex;
      if (isCaptain) captainSlotId = slotId;
      slots[slotId] = {
        slotId,
        name,
        teamId,
        turnPosition: idx,
        isHost,
        isCaptain,
        claimedByUserId: isHost ? hostUserId : null, // host kendi slotunu otomatik sahiplenir
        connected: isHost,
      };
    });
    return captainSlotId;
  }

  const captainA = addTeamSlots("teamA", setup.teamA);
  const captainB = addTeamSlots("teamB", setup.teamB);

  const teams: Record<TeamId, Team> = {
    teamA: { id: "teamA", name: setup.teamA.name, color: setup.teamA.color, score: 0, captainSlotId: captainA },
    teamB: { id: "teamB", name: setup.teamB.name, color: setup.teamB.color, score: 0, captainSlotId: captainB },
  };

  return {
    code,
    hostUserId,
    phase: GamePhase.LOBBY,
    settings,
    slots,
    teams,
    round: 0,
    turnOrder: [],
    turnIndex: 0,
    activeTurn: null,
    deckCardIds: shuffle(deckCardIds, rng),
    usedCardIds: [],
    winnerTeamId: null,
    createdAt: now,
    updatedAt: now,
  };
}
