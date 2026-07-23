"use client";

import { Suspense } from "react";
import { OyunEkrani } from "./OyunEkrani";

/** Statik dışa aktarımda useSearchParams için Suspense sınırı gerekir. */
export default function Page() {
  return (
    <Suspense fallback={<main className="screen screen--center"><p className="tagline">Oyun yükleniyor…</p></main>}>
      <OyunEkrani />
    </Suspense>
  );
}
