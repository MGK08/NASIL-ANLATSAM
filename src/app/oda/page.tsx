"use client";

import { Suspense } from "react";
import { OdaEkrani } from "./OdaEkrani";

/** Statik dışa aktarımda useSearchParams için Suspense sınırı gerekir. */
export default function Page() {
  return (
    <Suspense fallback={<main className="screen screen--center"><p className="tagline">Oda yükleniyor…</p></main>}>
      <OdaEkrani />
    </Suspense>
  );
}
