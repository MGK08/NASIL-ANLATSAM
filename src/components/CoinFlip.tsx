"use client";

import { useEffect, useRef, useState } from "react";
import type { TeamId } from "../types/game";

/**
 * Oyun başında yazı-tura: madalyonun iki yüzü de KUPALABS logosu
 * (biri kırmızı, biri mavi). Başlayan takımın yüzünde durur.
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
  const [phase, setPhase] = useState<"spin" | "result">("spin");
  const [face, setFace] = useState<TeamId>("teamA");

  // onDone her render'da yeniden oluşuyor; ref'te tutarsak zamanlayıcılar sıfırlanmaz.
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const spin = setInterval(() => setFace((f) => (f === "teamA" ? "teamB" : "teamA")), 110);
    const stop = setTimeout(() => {
      clearInterval(spin);
      setFace(winnerTeamId);
      setPhase("result");
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([60, 50, 120]);
    }, 1900);
    const done = setTimeout(() => doneRef.current(), 3800);
    return () => { clearInterval(spin); clearTimeout(stop); clearTimeout(done); };
  }, [winnerTeamId]);

  const color = face === "teamA" ? "var(--kirmizi)" : "var(--mavi)";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(42,26,18,0.72)", backdropFilter: "blur(3px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22,
    }}>
      <p style={{ fontFamily: "var(--display)", fontWeight: 800, color: "var(--cream)", fontSize: 22, margin: 0 }}>
        Yazı Tura
      </p>

      <div style={{
        width: 158, height: 158, borderRadius: "50%",
        background: color, border: "8px solid var(--cream)",
        boxShadow: "0 14px 34px rgba(0,0,0,.45)",
        display: "grid", placeItems: "center",
        transition: "background .12s linear",
        animation: phase === "spin" ? "coinspin .42s linear infinite" : "coinpop .5s ease",
      }}>
        {/* iç beyaz disk + KUPALABS logosu */}
        <div style={{
          width: "78%", height: "78%", borderRadius: "50%", background: "#fff",
          display: "grid", placeItems: "center", overflow: "hidden",
          boxShadow: "inset 0 0 0 3px rgba(0,0,0,.06)",
        }}>
          <img src="/kupalabs-logo.jpg" alt="KUPA labs"
            style={{ width: "84%", objectFit: "contain" }} />
        </div>
      </div>

      <p style={{
        fontFamily: "var(--display)", fontWeight: 800, fontSize: 20, margin: 0,
        color: "var(--cream)", opacity: phase === "result" ? 1 : 0.35,
        transition: "opacity .3s ease", textAlign: "center", padding: "0 20px",
      }}>
        {phase === "result" ? `${winnerName} başlıyor!` : "…"}
      </p>
    </div>
  );
}
