/** Futbol kaptan pazubandı gibi küçük "C" rozeti. */
export function CaptainBadge({ size = 16 }: { size?: number }) {
  return (
    <span
      title="Kaptan"
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        minWidth: size, height: size, padding: "0 4px", marginLeft: 6,
        borderRadius: 5, background: "var(--bubble)", color: "var(--ink)",
        fontFamily: "var(--display)", fontWeight: 800, fontSize: Math.round(size * 0.68),
        lineHeight: 1, verticalAlign: "middle",
      }}
    >C</span>
  );
}
