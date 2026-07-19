"use client";

import { useEffect, useRef, useState } from "react";
import type { TeamId } from "../types/game";

/**
 * Yazı-tura: gerçek çift yüzlü madalyon.
 * Bir yüzü kırmızı, diğer yüzü mavi (ikisinde de KUPALABS logosu).
 * Dikey eksende (rotateX) döner, kazanan takımın yüzünde durur.
 */
export function CoinFlip({
  winnerTeamId,
  winnerName,
  onDone,
}: {
  winnerTeamId: TeamId;
  winnerName: string;
  onDone: () => void;
}) {
  const [stopped, setStopped] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const stop = setTimeout(() => {
      setStopped(true);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([60, 50, 120]);
    }, 2000);
    const done = setTimeout(() => doneRef.current(), 3900);
    return () => { clearTimeout(stop); clearTimeout(done); };
  }, [winnerTeamId]);

  // Kırmızı = ön yüz (0deg), Mavi = arka yüz (180deg)
  const finalDeg = winnerTeamId === "teamA" ? 1080 : 1260;

  const face = (bg: string, back: boolean) => (
    <div style={{
      position: "absolute", inset: 0, borderRadius: "50%", background: bg,
      border: "8px solid var(--cream)", display: "grid", placeItems: "center",
      backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
      transform: back ? "rotateX(180deg)" : undefined,
    }}>
      <div style={{ width: "76%", height: "76%", borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", overflow: "hidden" }}>
        <img src="/kupalabs-logo.jpg" alt="KUPA labs" style={{ width: "86%" }} />
      </div>
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(42,26,18,0.72)", backdropFilter: "blur(3px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24,
    }}>
      <p style={{ fontFamily: "var(--display)", fontWeight: 800, color: "var(--cream)", fontSize: 22, margin: 0 }}>
        Yazı Tura
      </p>

      <div style={{ perspective: 800 }}>
        <div style={{
          position: "relative", width: 150, height: 150,
          transformStyle: "preserve-3d",
          filter: "drop-shadow(0 14px 26px rgba(0,0,0,.45))",
          animation: stopped ? undefined : "coinspin .55s linear infinite",
          transform: stopped ? `rotateX(${finalDeg}deg)` : undefined,
          transition: stopped ? "transform 1s cubic-bezier(.2,.7,.2,1)" : undefined,
        }}>
          {face("var(--kirmizi)", false)}
          {face("var(--mavi)", true)}
        </div>
      </div>

      <p style={{
        fontFamily: "var(--display)", fontWeight: 800, fontSize: 20, margin: 0,
        color: "var(--cream)", opacity: stopped ? 1 : 0.35,
        transition: "opacity .3s ease", textAlign: "center", padding: "0 20px",
      }}>
        {stopped ? `${winnerName} başlıyor!` : "…"}
      </p>
    </div>
  );
}
