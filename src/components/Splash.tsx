"use client";

import { useEffect, useState } from "react";

/** KUPA LABS acilis animasyonu - gercek logo, "u" kadehi maskeyle pembe dolar. */
const MASK = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFkAAABgCAYAAAB2ft7KAAAByklEQVR4nO3dPW7CQBgG4Rc6SJsLkC73PwxdTkAZTOkUZo3NX4DgsWLmkSwhF2g1fCwLDbO6rutoUPOxF/AKjAwwMsDIACMDjAwwMsDIACMDjAwwMsDIACMDjAwwMsDIACMDjAwwMsDIACMDjAwwMsDIACMDjAwwMsDIACMDjAwwMsDIACMDjAwwMsDIACMDjAwwMsDIACMDjAwwMsDIACMDjAwwMsDIACMDjAwwMsDIACMDjAwwMsDIACMDjAwwMsDIACMDjAwwMsDIACMDjAwwMsDIACMDjAwwMsDIACMDjAwwMmCepBp7EVM3T7JKsh17IVPmJA+vck8e1jbJysjDayd5N+oypmuXNHvyd5LP+OH3bNs0Xb+7k+w0P187ycmhutP8PO3Qzo9uOs3PsUlnaLuRyzRvRljUlJx0PD7C9V4BPeRkRzh3TnbbeNzZIT0X2W3jMSXwSbfZlT9gf0+yTrLcX7rsYuDkeuTkEHidJrr6qv119Z3/W+TCqe7rxi2PL7o1ctKf6kWSWV4reJWkTnMouClucU/kYpkm8CKH4O3zZRrhS9CihN3t79/1G/wjkbve0oQtlkm+9vf/q22Sj/RD1vnDd4cfT29asIbEmI0AAAAASUVORK5CYII=";

export function Splash() {
  const [hide, setHide] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("kupalabs_splash")) { setGone(true); return; }
      sessionStorage.setItem("kupalabs_splash", "1");
    } catch {}
    const t1 = setTimeout(() => setHide(true), 2600);
    const t2 = setTimeout(() => setGone(true), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (gone) return null;

  return (
    <div aria-hidden style={{
      position: "fixed", inset: 0, zIndex: 400, background: "#ffffff",
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: hide ? 0 : 1, visibility: hide ? "hidden" : "visible",
      transition: "opacity .55s ease, visibility .55s ease",
    }}>
      <span style={{ position: "relative", display: "inline-block", width: "72%", maxWidth: 320, lineHeight: 0, animation: "kl-in .5s ease both" }}>
        <img src="/kupalabs-logo.jpg" alt="KUPA labs" style={{ width: "100%", display: "block" }} />
        <div style={{
          position: "absolute", left: "30.949%", top: "28.493%", width: "13.841%", height: "26.301%",
          WebkitMask: "url(" + MASK + ") center/100% 100% no-repeat",
          mask: "url(" + MASK + ") center/100% 100% no-repeat",
          overflow: "hidden", background: "#FCFBF9",
        }}>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 0, background: "linear-gradient(180deg,#FF8FB6 0%,#FF2A78 8%,#FF0164 55%,#E60157 100%)", animation: "kpFill 1.75s cubic-bezier(.42,0,.32,1) .55s forwards" }} />
          <div style={{ position: "absolute", left: "28%", bottom: "6%", width: "8%", paddingBottom: "8%", borderRadius: "50%", background: "rgba(255,255,255,0.55)", animation: "kpBub 1.4s ease-in 1.0s 2 both" }} />
          <div style={{ position: "absolute", left: "58%", bottom: "4%", width: "6%", paddingBottom: "6%", borderRadius: "50%", background: "rgba(255,255,255,0.45)", animation: "kpBub 1.6s ease-in 1.35s 2 both" }} />
          <div style={{ position: "absolute", left: "44%", bottom: "8%", width: "5%", paddingBottom: "5%", borderRadius: "50%", background: "rgba(255,255,255,0.4)", animation: "kpBub 1.5s ease-in 1.7s 1 both" }} />
          <div style={{ position: "absolute", left: "12%", top: "8%", width: "22%", height: "60%", borderRadius: "40%", background: "linear-gradient(120deg,rgba(255,255,255,0.35),transparent 70%)", opacity: 0, animation: "kpShine 1.3s ease-out 2.15s forwards", pointerEvents: "none" }} />
        </div>
      </span>
    </div>
  );
}
