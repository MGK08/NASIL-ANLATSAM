"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { subscribeRoom } from "../../../realtime/subscribeRoom";
import { getUserId } from "../../../lib/identity";
import { postAction } from "../../../lib/api";
import type { Room, PlayerSlot } from "../../../types/game";
import { GamePhase } from "../../../types/game";
import { CaptainBadge } from "../../../components/CaptainBadge";

export default function OdaPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const myId = typeof window !== "undefined" ? getUserId() : "";

  useEffect(() => {
    const unsub = subscribeRoom(code, (r) => { setRoom(r); setLoaded(true); });
    return unsub;
  }, [code]);

  useEffect(() => {
    if (room && room.phase !== GamePhase.LOBBY) router.push(`/oyun/${code}`);
  }, [room?.phase, code, router]);

  if (loaded && !room) {
    return (
      <main className="screen">
        <Link href="/" className="back">‹ Ana sayfa</Link>
        <div className="grow" />
        <div className="card"><p className="error">Bu kodla oda bulunamadı.</p></div>
        <div className="grow" />
      </main>
    );
  }

  const slots: PlayerSlot[] = room
    ? Object.values(room.slots).sort((a, b) => a.teamId.localeCompare(b.teamId) || a.turnPosition - b.turnPosition)
    : [];
  const mySlot = slots.find((s) => s.claimedByUserId === myId) ?? null;
  const allClaimed = slots.length > 0 && slots.every((s) => s.claimedByUserId);
  const iAmHost = mySlot?.isHost ?? false;

  async function pick(slotId: string) {
    if (busy) return;
    setBusy(true);
    if (mySlot && mySlot.slotId === slotId) {
      // Kendi ismine tekrar basınca seçimi bırak (isim tekrar boşa düşer)
      await postAction({ type: "RELEASE_SLOT", code, userId: getUserId() });
    } else {
      await postAction({ type: "CLAIM_SLOT", code, slotId, userId: getUserId() });
    }
    setBusy(false);
  }
  async function start() {
    setBusy(true);
    await postAction({ type: "START_GAME", code, byUserId: getUserId() });
    setBusy(false);
  }
  async function copyCode() {
    try { await navigator.clipboard.writeText(code); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const teamLabel = (t: string) => (t === "teamA" ? "Kırmızılar" : "Maviler");
  const teamColor = (t: string) => (t === "teamA" ? "var(--kirmizi)" : "var(--mavi)");

  return (
    <main className="screen">
      <Link href="/" className="back">‹ Ana sayfa</Link>

      <p className="tagline" style={{ textAlign: "center", marginBottom: 6 }}>Oda kodu</p>
      <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
        <div className="code-big" style={{ flex: 1, margin: 0, whiteSpace: "nowrap", fontSize: "clamp(24px,8.5vw,40px)", letterSpacing: "0.08em", display: "flex", alignItems: "center", justifyContent: "center" }}>{code}</div>
        <button onClick={copyCode} className="btn btn--bubble" style={{ width: "auto", flex: "0 0 auto", padding: "0 18px", fontSize: 15, borderRadius: 18 }}>
          {copied ? "Kopyalandı ✓" : "Kopyala"}
        </button>
      </div>
      <p className="hint" style={{ textAlign: "center", color: "#FFE2D6", marginTop: 10, marginBottom: 18 }}>
        Bu kodu arkadaşlarına söyle. Onlar “Oyuna Katıl”dan girip kendi ismini seçecek.
      </p>

      <div className="card">
        <p className="section-title">{mySlot ? "İsmini değiştirebilirsin" : "Sen kimsin? İsmini seç"}</p>
        {!loaded && <p className="hint">Yükleniyor…</p>}
        <div className="stack" style={{ gap: 10 }}>
          {slots.map((s) => {
            const takenByOther = !!s.claimedByUserId && s.claimedByUserId !== myId;
            const mine = s.claimedByUserId === myId;
            return (
              <button
                key={s.slotId}
                className="input"
                disabled={takenByOther || busy}
                onClick={() => pick(s.slotId)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  cursor: takenByOther ? "not-allowed" : "pointer",
                  opacity: takenByOther ? 0.4 : 1,
                  borderColor: mine ? teamColor(s.teamId) : "#EAD9CC",
                  borderWidth: mine ? 3 : 2,
                  background: mine ? "#FFF3E9" : "#FFFDFB",
                }}
              >
                <span style={{ fontWeight: 800 }}>
                  {s.name}{s.isCaptain && <CaptainBadge />}{s.isHost ? " (kurucu)" : ""}
                </span>
                <span className="hint" style={{ color: teamColor(s.teamId) }}>
                  {teamLabel(s.teamId)}{mine ? " • sen" : s.claimedByUserId ? " • dolu" : ""}
                </span>
              </button>
            );
          })}
        </div>
        <p className="hint" style={{ marginTop: 10 }}>
          C = takım kaptanı{mySlot ? " · İsmine tekrar basarsan seçimini bırakırsın." : ""}
        </p>
      </div>

      <div className="grow" />

      {iAmHost ? (
        <button className="btn btn--bubble" onClick={start} disabled={!allClaimed || busy}>
          {allClaimed ? "Başlat" : "Herkesin seçmesi bekleniyor…"}
        </button>
      ) : (
        <p className="hint" style={{ textAlign: "center", color: "#FFE2D6" }}>
          {allClaimed ? "Kurucunun başlatması bekleniyor…" : "Herkes ismini seçince kurucu başlatacak."}
        </p>
      )}
    </main>
  );
}
