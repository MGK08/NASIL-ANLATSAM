/** Kural motorunu veri katmanından ayıran arayüz (bağımlılık enjeksiyonu). */
import type { Room, Card } from "../types/game";

export interface RoomRepo {
  fetchDeckCardIds(deckId: string): Promise<string[]>;
  loadRoom(code: string): Promise<Room | null>;
  insertRoom(room: Room): Promise<void>;
  saveRoom(room: Room): Promise<void>;
  fetchCard(cardId: string): Promise<Card | null>;
}
