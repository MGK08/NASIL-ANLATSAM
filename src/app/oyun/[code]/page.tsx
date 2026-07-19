"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { subscribeRoom } from "../../../realtime/subscribeRoom";
import { getUserId } from "../../../lib/identity";
import { postAction, getCard } from "../../../lib/api";
import { viewRole } from "../../../engine/roles";
import { CaptainBadge } from "../../../components/CaptainBadge";
import { CoinFlip } from "../../../components/CoinFlip";
import type { Room, Card, TeamId } from "../../../types/game";
import { GamePhase, TurnStatus } from "../../../types/game";

const TABOO_BANNER_MS = 5000;

function vibrate(ms: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
}
const teamColor = (id: TeamId) => (id === "teamA" ? "var(--kirmizi)" : "var(--mavi)");
function teamBg(teamId?: TeamId | null): string {
  if (teamId === "teamA") return "linear-gradient(160deg,#FF9F45 0%,#FF5A57 52%,#FF3D6E 100%)";
  if (teamId === "teamB") return "linear-gradient(160deg,#56B4FF 0%,#3B82F6 52%,#6366F1 100%)";
  return "linear-gradient(160deg,#FF9F45 0%,#FF6A4D 52%,#FF4470 100%)";
}
const chipStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", background: "rgba(255,247,239,0.92)",
  fontFamily: "var(--display)", fontWeight: 800, fontSize: 13, padding: "5px 14px", borderRadius: 999,
};

export default function OyunPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [coinDone, setCoinDone] = useState(false);
  const endedRef = useRef<string>("");
  const myId = typeof window !== "undefined" ? getUserId() : "";

  useEffect(() => subscribeRoom(code, setRoom), [code]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const t = room?.activeTurn ?? null;
  const role = room ? viewRole(room, myId) : "none";
  const status = t?.status;
  const cardId = t?.currentCardId ?? null;
  const canSeeCard = role === "explainer" || role === "opponent" || role === "opponentCaptain";
  const paused = !!t?.pausedAt;
  const lastTaboo = t?.lastTaboo ?? null;

  useEffect(() => {
    if (status === TurnStatus.ACTIVE && canSeeCard && cardId) getCard(code, myId).then(setCard);
    else setCard(null);
  }, [cardId, status, canSeeCard, code, myId]);

  // Duraklatılmışken sayaç donar
  const remainingMs = paused
    ? (t?.pausedRemainingMs ?? 0)
    : t?.endsAt ? t.endsAt - now : 0;
  const remaining = Math.max(0, Math.ceil(remainingMs / 1000));
  const expired = status === TurnStatus.ACTIVE && !paused && remainingMs <= 0;

  // Süre bitti -> turu bitir (tekrar denemeli + herkesten yedekli)
  useEffect(() => {
    if (!expired || !t) return;
    const key = `${t.explainerSlotId}-${t.startedAt}`;
    if (endedRef.current !== key) { endedRef.current = key; vibrate([120, 60, 120]); }
    const delay = role === "explainer" ? 0 : 2000;
    let stopped = false;
    const fire = () => { if (!stopped) postAction({ type: "END_TURN", code }); };
    const first = setTimeout(fire, delay);
    const retry = setInterval(fire, 2500);
    return () => { stopped = true; clearTimeout(first); clearInterval(retry); };
  }, [expired, t?.explainerSlotId, t?.startedAt, role, code]);

  // Tabu şeridi bitince otomatik devam (yeni kart + süre akar)
  useEffect(() => {
    if (!lastTaboo) return;
    const left = Math.max(0, lastTaboo.at + TABOO_BANNER_MS - Date.now());
    const delay = left + (role === "explainer" ? 0 : 1200);
    let stopped = false;
    const fire = () => { if (!stopped) postAction({ type: "RESUME_AFTER_TABOO", code }); };
    const first = setTimeout(fire, delay);
    const retry = setInterval(fire, 2500);
    return () => { stopped = true; clearTimeout(first); clearInterval(retry); };
  }, [lastTaboo?.at, lastTaboo?.cardId, role, code]);

  const me = room ? (Object.values(room.slots).find((s) => s.claimedByUserId === myId) ?? null) : null;
  const Bg = <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: -1, background: teamBg(me?.teamId) }} />;

  // Bu cihazın bir ismi yoksa (yeni cihaz / veri silinmiş) lobiye gidip
  // düşen birinin yerine geçmesi gerekir.
  useEffect(() => {
    if (room && room.phase !== GamePhase.FINISHED && !me) router.push(`/oda/${code}`);
  }, [room?.phase, me, code, router]);

  const gameKey = room ? `${room.phase}-${room.round}-${room.turnOrder[0] ?? ""}` : "";
  useEffect(() => { setCoinDone(false); }, [gameKey]);

  if (!room) return <main className="screen screen--center"><p className="tagline">Oyun yükleniyor…</p></main>;

  async function act(action: Parameters<typeof postAction>[0], buzz?: number | number[]) {
    if (busy) return;
    if (buzz) vibrate(buzz);
    setBusy(true);
    await postAction(action);
    setBusy(false);
  }

  const isHost = room.effectiveHostUserId ? room.effectiveHostUserId === myId : (me?.isHost ?? false);
  const A = room.teams.teamA, B = room.teams.teamB;
  const explainer = t ? room.slots[t.explainerSlotId] : null;
  const exTeamId = t?.teamId ?? null;
  const sameTeam = !!(me && exTeamId && me.teamId === exTeamId);
  const iReported = !!lastTaboo && lastTaboo.byUserId === myId;

  const CodeChip = (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(code); } catch {}
        setCodeCopied(true); setTimeout(() => setCodeCopied(false), 1500);
      }}
      style={{ ...chipStyle, color: "var(--ink)", border: "none", cursor: "pointer", letterSpacing: "0.06em" }}
    >{codeCopied ? "Kopyalandı ✓" : `Kod: ${code}`}</button>
  );
  const TargetChip = <span style={{ ...chipStyle, color: "var(--ink)" }}>Hedef: {room.settings.targetScore}</span>;
  const MeChip = me ? (
    <span style={{ ...chipStyle, color: teamColor(me.teamId) }}>
      Sen: {me.name}{me.isCaptain && <CaptainBadge size={15} />} · {room.teams[me.teamId].name}
    </span>
  ) : null;
  const exChip = exTeamId ? (
    <span style={{ ...chipStyle, color: teamColor(exTeamId) }}>
      {room.teams[exTeamId].name} takımı{me ? (sameTeam ? " · senin takımın" : " · rakip") : ""}
    </span>
  ) : null;

  const EndGame = isHost ? (
    <div style={{ textAlign: "center", marginTop: 12 }}>
      {!confirmEnd ? (
        <button onClick={() => setConfirmEnd(true)} style={{
          border: "2px solid rgba(255,247,239,0.6)", background: "rgba(58,36,27,0.28)",
          color: "var(--cream)", fontFamily: "var(--display)", fontWeight: 700, fontSize: 14,
          padding: "9px 20px", borderRadius: 999, cursor: "pointer",
        }}>Oyunu bitir</button>
      ) : (
        <div className="card" style={{ padding: 14 }}>
          <p style={{ margin: "0 0 10px", fontWeight: 800, color: "var(--ink)" }}>Oyunu bitirmek istediğine emin misin?</p>
          <div className="btn-row">
            <button className="btn btn--pass" onClick={() => setConfirmEnd(false)}>Vazgeç</button>
            <button className="btn btn--danger" onClick={() => act({ type: "END_GAME", code, byUserId: getUserId() })}>Evet, bitir</button>
          </div>
        </div>
      )}
    </div>
  ) : null;

  // ---------- KAZANAN ----------
  if (room.phase === GamePhase.FINISHED) {
    const win = room.winnerTeamId ? room.teams[room.winnerTeamId] : null;
    return (
      <main className="screen screen--center game">
        {Bg}
        <div className="winner-emoji">🏆</div>
        <p className="turn-sub">Kazanan</p>
        <div className="winner-team">{win ? <span style={{ ...chipStyle, fontSize: 24, color: teamColor(win.id) }}>{win.name}</span> : "Berabere"}</div>
        <p className="turn-sub" style={{ marginBottom: 20 }}>{A.name} {A.score} — {B.score} {B.name}</p>
        <div className="stack">
          {isHost && <button className="btn btn--bubble" disabled={busy}
            onClick={() => act({ type: "RESTART_GAME", code, byUserId: getUserId() })}>Tekrar Oyna</button>}
          <Link href="/" className="btn btn--ghost">Ana sayfa</Link>
        </div>
      </main>
    );
  }

  const Scoreboard = (
    <div className="topbar">
      <div className="score-pill"><div className="name" style={{ color: "var(--kirmizi)" }}>{A.name}</div><div className="val">{A.score}</div></div>
      <div className="score-pill"><div className="name" style={{ color: "var(--mavi)" }}>{B.name}</div><div className="val">{B.score}</div></div>
      {status === TurnStatus.ACTIVE && (
        <div className={`timer ${remaining <= 10 && !paused ? "low" : ""}`} style={paused ? { opacity: 0.6 } : undefined}>
          <span className="t">{remaining}</span><span className="lbl">{paused ? "DURDU" : "SANİYE"}</span>
        </div>
      )}
    </div>
  );

  // ---------- TUR HAZIR ----------
  if (status === TurnStatus.READY) {
    const isFirstTurn = room.round === 1 && room.turnIndex === 0;
    const startTeamId = t?.teamId ?? "teamA";
    if (isFirstTurn && !coinDone) {
      return (
        <main className="screen game">
          {Bg}{Scoreboard}
          <CoinFlip winnerTeamId={startTeamId} winnerName={room.teams[startTeamId].name} onDone={() => setCoinDone(true)} />
        </main>
      );
    }
    return (
      <main className="screen game">
        {Bg}{Scoreboard}
        <div className="inforow">{MeChip}{TargetChip}{CodeChip}</div>
        <div className="mid">
          <div className="turn-hero">
            <p className="turn-sub">Sıra</p>
            <p className="turn-name">{explainer?.name}</p>
            <div style={{ marginTop: 4 }}>{exChip}</div>
            <p className="turn-sub" style={{ marginTop: 8 }}>
              {role === "explainer" ? "Hazır olduğunda başla!" : `${explainer?.name} başlamak üzere…`}
            </p>
          </div>
        </div>
        {role === "explainer" && (
          <button className="btn btn--go" disabled={busy}
            onClick={() => act({ type: "START_TURN", code, byUserId: getUserId() }, 40)}>Başla</button>
        )}
        {EndGame}
      </main>
    );
  }

  // ---------- TUR AKTİF ----------
  const passesLeft = t ? room.settings.passLimit - t.usedPasses : 0;
  const blocked = busy || expired || paused || !!lastTaboo;

  const topInfo = (
    <div className="inforow">
      {MeChip}
      {role === "explainer"
        ? <span style={{ ...chipStyle, color: "var(--ink)" }}>Sıra sende — anlat!</span>
        : role === "teammate" ? exChip
        : <span style={{ ...chipStyle, color: exTeamId ? teamColor(exTeamId) : undefined }}>{explainer?.name} anlatıyor · rakip</span>}
      {CodeChip}
    </div>
  );

  // Tabu şeridi (herkes görür)
  const TabooBanner = lastTaboo ? (
    <div className="taboo-banner">
      <p className="t">⛔ Yasaklı kelime kullanıldı! (−{room.settings.tabooPenalty})</p>
      <p className="s">{card ? `“${card.mainWord}” kartı` : "Kart"} · {exTeamId ? room.teams[exTeamId].name : ""} −{room.settings.tabooPenalty} puan</p>
      {iReported && (
        <button className="btn btn--pass" style={{ fontSize: 14, padding: 10 }} disabled={busy}
          onClick={() => act({ type: "UNDO_TABOO", code, byUserId: getUserId() })}>
          Geri al
        </button>
      )}
    </div>
  ) : null;

  return (
    <main className="screen game">
      {Bg}{Scoreboard}{topInfo}

      {role === "teammate" ? (
        <div className="mid">
          <div className="turn-hero">
            <p className="turn-name">{explainer?.name} anlatıyor</p>
            <p className="turn-sub">🙈 Kartı göremezsin — dinle ve tahmin et!</p>
            {paused && <p className="turn-sub" style={{ marginTop: 8 }}>⏸ Süre duraklatıldı</p>}
          </div>
          {TabooBanner}
        </div>
      ) : (
        <>
          <div className="mid">
            {card ? (
              <div className="word-card">
                <p className="word-label">{role === "explainer" ? "Anlat" : "Takip Et"}</p>
                <p className="main-word">{card.mainWord}</p>
                <ul className="forbidden-list">{card.forbiddenWords.map((w) => <li key={w}>{w}</li>)}</ul>
              </div>
            ) : <p className="turn-sub" style={{ textAlign: "center" }}>Kart yükleniyor…</p>}
            {TabooBanner}
            {expired && <p className="turn-sub" style={{ textAlign: "center", marginTop: 8 }}>⏱ Süre doldu — sıradaki oyuncuya geçiliyor…</p>}
            {paused && !lastTaboo && <p className="turn-sub" style={{ textAlign: "center", marginTop: 8 }}>⏸ Süre duraklatıldı</p>}
          </div>

          {role === "explainer" && (
            <>
              <div className="btn-row">
                <button className="btn btn--oops" disabled={blocked}
                  onClick={() => act({ type: "TABOO_VIOLATION", code, byUserId: getUserId(), cardId: cardId ?? undefined }, [80, 40, 80])}>
                  Oops! Yasaklı<br />Kelime Kullandım
                </button>
                <button className="btn btn--go" disabled={blocked}
                  onClick={() => act({ type: "CORRECT_GUESS", code, byUserId: getUserId() }, 50)}>Anlattım ✓</button>
              </div>
              <button className="btn btn--pass" style={{ marginTop: 8 }} disabled={blocked || passesLeft <= 0}
                onClick={() => act({ type: "PASS_CARD", code, byUserId: getUserId() }, 30)}>
                Pas{passesLeft > 0 ? ` (${passesLeft})` : ""}
              </button>
            </>
          )}

          {role === "opponentCaptain" && (
            <>
              <button className="btn btn--oops" disabled={blocked}
                onClick={() => act({ type: "TABOO_VIOLATION", code, byUserId: getUserId(), cardId: cardId ?? undefined }, [80, 40, 80])}>
                Hey! Yasaklı Kelimeyi Söyledin!
              </button>
              {!lastTaboo && (
                <button className="btn btn--pause" style={{ marginTop: 8 }} disabled={busy || expired}
                  onClick={() => act({ type: paused ? "RESUME_TURN" : "PAUSE_TURN", code, byUserId: getUserId() }, 30)}>
                  {paused ? "▶ Devam et" : "⏸ Süreyi duraklat"}
                </button>
              )}
            </>
          )}

          {role === "opponent" && (
            <p className="turn-sub" style={{ textAlign: "center" }}>👀 Yasaklı geçerse kaptanınız butona bassın.</p>
          )}
        </>
      )}
      {EndGame}
    </main>
  );
}
