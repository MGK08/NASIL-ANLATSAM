/**
 * Saf DB <-> Room eşleme fonksiyonları.
 * rooms tablosu (jsonb kolonlar) + slots tablosu (satırlar) <-> Room nesnesi.
 * Ağ erişimi yoktur; bu yüzden birim testi kolaydır.
 */
import type { Room, PlayerSlot, GameSettings, Team, TeamId, ActiveTurn } from "../types/game";
import { GamePhase } from "../types/game";

export interface DbRoomRow {
  code: string;
  host_user_id: string | null;
  phase: string;
  settings: GameSettings;
  teams: Record<TeamId, Team>;
  round: number;
  turn_order: string[];
  turn_index: number;
  active_turn: ActiveTurn | null;
  deck_card_ids: string[];
  used_card_ids: string[];
  winner_team_id: string | null;
  created_at?: string | number;
  updated_at?: string | number;
}

export interface DbSlotRow {
  slot_id: string;
  room_code: string;
  name: string;
  team_id: string;
  turn_position: number;
  is_host: boolean;
  is_captain: boolean;
  claimed_by_user_id: string | null;
  connected: boolean;
  avatar: string | null;
}

function toMs(ts: string | number | undefined): number {
  if (ts == null) return Date.now();
  return typeof ts === "number" ? ts : Date.parse(ts);
}

/** DB satırları -> Room nesnesi */
export function mapRowsToRoom(roomRow: DbRoomRow, slotRows: DbSlotRow[]): Room {
  const slots: Record<string, PlayerSlot> = {};
  for (const s of slotRows) {
    slots[s.slot_id] = {
      slotId: s.slot_id,
      name: s.name,
      teamId: s.team_id as TeamId,
      turnPosition: s.turn_position,
      isHost: s.is_host,
      isCaptain: s.is_captain,
      claimedByUserId: s.claimed_by_user_id,
      connected: s.connected,
      avatar: s.avatar ?? undefined,
    };
  }
  return {
    code: roomRow.code,
    hostUserId: roomRow.host_user_id,
    phase: roomRow.phase as GamePhase,
    settings: roomRow.settings,
    slots,
    teams: roomRow.teams,
    round: roomRow.round,
    turnOrder: roomRow.turn_order,
    turnIndex: roomRow.turn_index,
    activeTurn: roomRow.active_turn,
    deckCardIds: roomRow.deck_card_ids,
    usedCardIds: roomRow.used_card_ids,
    winnerTeamId: roomRow.winner_team_id as TeamId | null,
    createdAt: toMs(roomRow.created_at),
    updatedAt: toMs(roomRow.updated_at),
    updatedAtRaw: typeof roomRow.updated_at === "string" ? roomRow.updated_at : undefined,
  };
}

/** Room nesnesi -> DB satırları (created_at/updated_at'ı DB yönetir, yazılmaz) */
export function mapRoomToRows(room: Room): { roomRow: Omit<DbRoomRow, "created_at" | "updated_at">; slotRows: DbSlotRow[] } {
  const roomRow = {
    code: room.code,
    host_user_id: room.hostUserId,
    phase: room.phase,
    settings: room.settings,
    teams: room.teams,
    round: room.round,
    turn_order: room.turnOrder,
    turn_index: room.turnIndex,
    active_turn: room.activeTurn,
    deck_card_ids: room.deckCardIds,
    used_card_ids: room.usedCardIds,
    winner_team_id: room.winnerTeamId,
  };
  const slotRows: DbSlotRow[] = Object.values(room.slots).map((s) => ({
    slot_id: s.slotId,
    room_code: room.code,
    name: s.name,
    team_id: s.teamId,
    turn_position: s.turnPosition,
    is_host: s.isHost,
    is_captain: s.isCaptain,
    claimed_by_user_id: s.claimedByUserId,
    connected: s.connected,
    avatar: s.avatar ?? null,
  }));
  return { roomRow, slotRows };
}
