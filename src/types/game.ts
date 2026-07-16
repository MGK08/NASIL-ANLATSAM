/**
 * "Nasıl Anlatsam?" — Çevrimiçi Çok Oyunculu Kelime Oyunu
 * ============================================================
 * PAYLAŞILAN VERİ MODELİ  (single source of truth)
 * Hem arayüz (Next.js/React) hem de sunucu (Vercel API) hem de
 * veritabanı (Supabase) tam olarak bu tiplere göre konuşur.
 */

/* ============================================================
 * 1) KART
 * ============================================================ */
export interface Card {
  id: string;                 // "c001"
  mainWord: string;           // "Yatak"
  forbiddenWords: string[];   // tam 7 tane
  category?: string;
}

/* ============================================================
 * 2) OYUNCU (SLOT MANTIĞI)
 * Kurucu takımları yazarken her isim bir "slot" olur.
 * Katılan oyuncu bir slotu "sahiplenir" (claim).
 *   claimedByUserId === null  -> boş slot (seçilebilir)
 *   claimedByUserId !== null  -> dolu slot (ekranda SOLUK, seçilemez)
 * ============================================================ */
export type TeamId = "teamA" | "teamB";

export interface PlayerSlot {
  slotId: string;                    // uuid
  name: string;                      // kurucunun yazdığı isim: "Ayşe"
  teamId: TeamId;
  turnPosition: number;              // takım içi sabit sıra (0,1,2...)
  isHost: boolean;                   // takım A'nın ilk slotu = kurucu
  isCaptain: boolean;                // her takımda 1 kaptan
  claimedByUserId: string | null;    // null ise boş; doluysa o kullanıcı seçmiş
  connected: boolean;                // bağlantı canlı mı (kopma takibi)
  avatar?: string;
}

/* ============================================================
 * 3) TAKIM
 * ============================================================ */
export interface Team {
  id: TeamId;
  name: string;                      // "Kırmızılar"
  color: string;                     // "#FF4A5F"
  score: number;
  captainSlotId: string | null;
}

/* ============================================================
 * 4) AYARLAR  (kurucu girer)
 * ============================================================ */
export interface GameSettings {
  turnDurationSec: number;           // tur süresi (kurucu girer, örn. 60)
  targetScore: number;               // hedef puan (kurucu girer, örn. 30)
  passLimit: number;                 // tur başına pas (sabit 3)
  tabooPenalty: number;              // tabu cezası (sabit 1)
  correctPoints: number;             // doğru puanı (sabit 1)
  deckId: string;                    // "varsayilan_350"
}

export const DEFAULT_SETTINGS: GameSettings = {
  turnDurationSec: 60,
  targetScore: 30,
  passLimit: 3,
  tabooPenalty: 1,
  correctPoints: 1,
  deckId: "varsayilan_350",
};

export const MIN_PLAYERS_PER_TEAM = 2;

/* ============================================================
 * 5) DURUM MAKİNESİ
 *   LOBBY ─başlat─▶ PLAYING ─süre bitti─▶ TURN_REVIEW ─Başla─▶ PLAYING ...
 *                      └─ hedef puana ulaşıldı ─▶ FINISHED
 * ============================================================ */
export enum GamePhase {
  LOBBY = "LOBBY",             // slotlar seçiliyor; hepsi dolunca Başlat aktif
  PLAYING = "PLAYING",         // tur aktif ya da "Başla" bekleniyor
  TURN_REVIEW = "TURN_REVIEW", // tur bitti, skor ekranda, sıradaki "Başla" bekliyor
  FINISHED = "FINISHED",       // kazanan belli
}

export enum TurnStatus {
  READY = "READY",             // sıradaki anlatanda "Başla" butonu var
  ACTIVE = "ACTIVE",           // süre akıyor, kart ekranda
  ENDED = "ENDED",             // süre bitti / manuel bitti
}

/* ============================================================
 * 6) AKTİF TUR
 * ============================================================ */
export interface ActiveTurn {
  explainerSlotId: string;           // sırası gelen slot
  teamId: TeamId;                    // anlatanın takımı
  status: TurnStatus;
  currentCardId: string | null;
  startedAt: number | null;          // ms
  endsAt: number | null;             // startedAt + turDuration
  correctCardIds: string[];
  passedCardIds: string[];
  tabooCardIds: string[];
  usedPasses: number;
}

/* ============================================================
 * 7) ODA  (Supabase 'rooms' satırı = bu nesne)
 * ============================================================ */
export interface Room {
  code: string;                      // "48213907" (8 haneli, sadece rakam)
  hostUserId: string | null;
  phase: GamePhase;
  settings: GameSettings;
  slots: Record<string, PlayerSlot>; // { slotId: PlayerSlot }
  teams: Record<TeamId, Team>;
  round: number;
  turnOrder: string[];               // slotId sırası (takımlar arası DÖNÜŞÜMLÜ)
  turnIndex: number;
  activeTurn: ActiveTurn | null;
  deckCardIds: string[];             // karıştırılmış kart sırası
  usedCardIds: string[];
  winnerTeamId: TeamId | null;
  createdAt: number;
  updatedAt: number;
}

/* ============================================================
 * 8) AKSİYONLAR  (istemci -> sunucu; kural motoru bunları işler)
 * ============================================================ */
export type GameAction =
  // Kurulum & katılım
  | { type: "CREATE_ROOM"; hostUserId: string; settings: GameSettings; setup: TeamSetup }
  | { type: "CLAIM_SLOT"; code: string; slotId: string; userId: string; avatar?: string }
  | { type: "RELEASE_SLOT"; code: string; userId: string }   // isim değiştirmek için
  | { type: "START_GAME"; code: string; byUserId: string }
  // Tur oynanışı
  | { type: "START_TURN"; code: string; byUserId: string }   // anlatan "Başla"
  | { type: "CORRECT_GUESS"; code: string; byUserId: string }// +1, yeni kart
  | { type: "PASS_CARD"; code: string; byUserId: string }    // yeni kart (limit 3)
  | { type: "TABOO_VIOLATION"; code: string; byUserId: string } // rakip kaptan: -1, kart atla
  | { type: "END_TURN"; code: string }                       // süre bitti / otomatik
  | { type: "NEXT_TURN"; code: string; byUserId: string }    // review -> Başla ekranı
  // Yaşam döngüsü
  | { type: "END_GAME"; code: string; byUserId: string }     // kurucu "Oyunu Bitir"
  | { type: "RESTART_GAME"; code: string; byUserId: string } // bitişten sonra tekrar
  | { type: "RECONNECT"; code: string; userId: string };     // kopan geri döner

/** Kurucu takımları oluştururken gönderdiği yapı */
export interface TeamSetup {
  teamA: { name: string; color: string; playerNames: string[]; captainIndex: number };
  teamB: { name: string; color: string; playerNames: string[]; captainIndex: number };
  hostName: string; // teamA.playerNames[0] ile aynı olmalı
}

/* ============================================================
 * 9) YARDIMCI
 * ============================================================ */
export interface Deck { id: string; name: string; language: string; cards: Card[]; }

/** Bir kullanıcının oyun ekranında hangi rolü gördüğünü belirler */
export type ViewRole =
  | "explainer"        // anlatan: kelime + yasaklılar + Anlattım/Pas
  | "teammate"         // anlatanın takımı: sadece "X anlatıyor"
  | "opponent"         // rakip: kelime + yasaklılar (görüp kontrol eder)
  | "opponentCaptain"; // rakip kaptan: yukarısı + "Yasaklı Kelime" butonu
