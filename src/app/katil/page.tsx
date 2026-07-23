"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRoom } from "../../lib/api";

export default function KatilPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function join() {
    setError(null);
    if (!/^\d{8}$/.test(code)) {
      setError("Kod 8 haneli olmalı.");
      return;
    }
    setBusy(true);
    const room = await getRoom(code);
    setBusy(false);
    if (room) router.push(`/oda?kod=${code}`);
    else setError("Bu kodla oda bulunamadı. Kodu kontrol et.");
  }

  return (
    <main className="screen">
      <Link href="/" className="back">‹ Geri</Link>
      <div className="grow" />
      <div className="card">
        <p className="section-title">Oyuna Katıl</p>
        <p className="hint" style={{ marginBottom: 12 }}>Kurucunun söylediği 8 haneli kodu gir.</p>
        <input
          className="input"
          inputMode="numeric"
          placeholder="8 haneli kod"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
          style={{ textAlign: "center", fontSize: 26, letterSpacing: "0.2em", fontFamily: "var(--display)" }}
        />
        {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
      </div>
      <div className="grow" />
      <button className="btn btn--bubble" onClick={join} disabled={busy}>
        {busy ? "Aranıyor…" : "Odaya Gir"}
      </button>
    </main>
  );
}
