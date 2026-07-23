"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUserId } from "../../lib/identity";
import { postAction } from "../../lib/api";
import { DEFAULT_SETTINGS } from "../../types/game";

type TeamState = { names: string[]; captain: number };

export default function KurPage() {
  const router = useRouter();
  const [target, setTarget] = useState(30);
  const [duration, setDuration] = useState(60);
  const [teamA, setTeamA] = useState<TeamState>({ names: ["", ""], captain: 0 });
  const [teamB, setTeamB] = useState<TeamState>({ names: ["", ""], captain: 0 });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function setName(team: "A" | "B", i: number, val: string) {
    const [t, setT] = team === "A" ? [teamA, setTeamA] : [teamB, setTeamB];
    const names = [...t.names];
    names[i] = val;
    setT({ ...t, names });
  }
  function addName(team: "A" | "B") {
    const [t, setT] = team === "A" ? [teamA, setTeamA] : [teamB, setTeamB];
    if (t.names.length >= 8) return;
    setT({ ...t, names: [...t.names, ""] });
  }
  function removeName(team: "A" | "B", i: number) {
    const [t, setT] = team === "A" ? [teamA, setTeamA] : [teamB, setTeamB];
    if (t.names.length <= 2) return;
    const names = t.names.filter((_, idx) => idx !== i);
    const captain = t.captain >= names.length ? 0 : t.captain;
    setT({ names, captain });
  }

  async function createGame() {
    setError(null);
    const aNames = teamA.names.map((n) => n.trim()).filter(Boolean);
    const bNames = teamB.names.map((n) => n.trim()).filter(Boolean);
    if (aNames.length < 2 || bNames.length < 2) {
      setError("Her takımda en az 2 oyuncu olmalı.");
      return;
    }
    setBusy(true);
    const res = await postAction({
      type: "CREATE_ROOM",
      hostUserId: getUserId(),
      settings: { ...DEFAULT_SETTINGS, targetScore: target, turnDurationSec: duration },
      setup: {
        hostName: aNames[0],
        teamA: { name: "Kırmızılar", color: "#FF4A5F", playerNames: aNames, captainIndex: Math.min(teamA.captain, aNames.length - 1) },
        teamB: { name: "Maviler", color: "#3B82F6", playerNames: bNames, captainIndex: Math.min(teamB.captain, bNames.length - 1) },
      },
    });
    setBusy(false);
    if (res.ok && res.code) router.push(`/oda?kod=${res.code}`);
    else setError("Oyun kurulamadı. Tekrar dene." + (("reason" in res) ? ` (${res.reason})` : ""));
  }

  const renderTeam = (label: string, cls: string, team: "A" | "B", state: TeamState) => (
    <div className={`team ${cls}`}>
      <h3>{label}</h3>
      {state.names.map((name, i) => (
        <div className="name-row" key={i}>
          <input
            className="input"
            placeholder={team === "A" && i === 0 ? "Senin adın (kurucu)" : `Oyuncu ${i + 1}`}
            value={name}
            onChange={(e) => setName(team, i, e.target.value)}
            maxLength={16}
          />
          <button
            type="button"
            className={`cap-btn ${state.captain === i ? "on" : ""}`}
            onClick={() => (team === "A" ? setTeamA({ ...state, captain: i }) : setTeamB({ ...state, captain: i }))}
            title="Kaptan"
          >
            Kaptan
          </button>
          {state.names.length > 2 && (
            <button type="button" className="icon-btn" onClick={() => removeName(team, i)} aria-label="Sil">×</button>
          )}
        </div>
      ))}
      {state.names.length < 8 && (
        <button type="button" className="add-name" onClick={() => addName(team)}>+ Oyuncu ekle</button>
      )}
    </div>
  );

  return (
    <main className="screen">
      <Link href="/" className="back">‹ Geri</Link>

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="section-title">Ayarlar</p>
        <div className="field">
          <label>Kaç puanda biter?</label>
          <div className="stepper">
            <button type="button" onClick={() => setTarget((v) => Math.max(5, v - 5))}>−</button>
            <input className="val" inputMode="numeric" value={target}
              onChange={(e) => setTarget(parseInt(e.target.value.replace(/\D/g, "")) || 0)}
              onBlur={() => setTarget((v) => Math.min(200, Math.max(5, v || 5)))}
              style={{ width: 56, border: "none", background: "transparent", outline: "none", padding: 0, color: "var(--ink)" }} />
            <button type="button" onClick={() => setTarget((v) => Math.min(200, v + 5))}>+</button>
          </div>
        </div>
        <div className="field">
          <label>Tur süresi (sn)</label>
          <div className="stepper">
            <button type="button" onClick={() => setDuration((v) => Math.max(10, v - 15))}>−</button>
            <input className="val" inputMode="numeric" value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value.replace(/\D/g, "")) || 0)}
              onBlur={() => setDuration((v) => Math.min(300, Math.max(10, v || 30)))}
              style={{ width: 56, border: "none", background: "transparent", outline: "none", padding: 0, color: "var(--ink)" }} />
            <button type="button" onClick={() => setDuration((v) => Math.min(300, v + 15))}>+</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="section-title">Takımlar</p>
        {renderTeam("Kırmızılar", "team--a", "A", teamA)}
        {renderTeam("Maviler", "team--b", "B", teamB)}
        <p className="hint">Her takımdan bir kaptan seç. Kaptan, rakip anlatırken yasaklı kelimeyi yakalar.</p>
      </div>

      {error && <div className="error">{error}</div>}
      <div className="grow" />
      <button className="btn btn--bubble" onClick={createGame} disabled={busy}>
        {busy ? "Kuruluyor…" : "Oyunu Oluştur"}
      </button>
    </main>
  );
}
