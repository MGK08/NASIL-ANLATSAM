/** Marka yüzü — ikondaki şaşkın surat + "?" balonu (arka plansız). */
export function FaceMark({ size = 132 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="108" cy="132" r="78" fill="#FFF7EF" />
      <path d="M64 118 Q80 104 98 116" fill="none" stroke="#3A241B" strokeWidth="7" strokeLinecap="round" />
      <path d="M112 112 Q131 98 150 110" fill="none" stroke="#3A241B" strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="86" cy="134" rx="8" ry="11" fill="#3A241B" />
      <ellipse cx="130" cy="131" rx="8" ry="11" fill="#3A241B" />
      <circle cx="89" cy="130" r="2.6" fill="#fff" />
      <circle cx="133" cy="127" r="2.6" fill="#fff" />
      <ellipse cx="106" cy="166" rx="11" ry="14" fill="#3A241B" />
      <ellipse cx="106" cy="169" rx="6" ry="7" fill="#C0392B" />
      <path d="M54 116 c0 9 -6 13 -6 20 a10 10 0 0 0 20 0 c0 -7 -6 -11 -6 -20 z" fill="#82D8FF" />
      <path d="M150 96 L166 78 L182 96 Z" fill="#FFD24D" />
      <rect x="146" y="38" width="86" height="66" rx="18" fill="#FFD24D" />
      <text x="189" y="88" fontFamily="'Baloo 2', sans-serif" fontSize="56" fontWeight="800" fill="#FF4A5F" textAnchor="middle">?</text>
    </svg>
  );
}
