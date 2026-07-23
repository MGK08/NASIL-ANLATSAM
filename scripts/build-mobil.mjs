/**
 * MOBİL DERLEME
 * Next.js'i statik olarak dışa aktarır (out/) ve Capacitor'a aktarır.
 *
 * Statik dışa aktarım, sunucu tarafı API rotalarıyla birlikte çalışmaz.
 * Bu yüzden derleme sırasında src/app/api geçici olarak kenara alınır,
 * işlem bitince (hata olsa bile) geri konur. API zaten Vercel'de çalışıyor.
 */
import { rename, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const API = "src/app/api";
const GECICI = ".api-gecici";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://nasil-anlatsam.vercel.app";

function calistir(komut, env = {}) {
  const r = spawnSync(komut, { stdio: "inherit", shell: true, env: { ...process.env, ...env } });
  if (r.status !== 0) throw new Error("Komut başarısız: " + komut);
}

async function geriKoy() {
  if (existsSync(GECICI)) {
    if (existsSync(API)) await rm(API, { recursive: true, force: true });
    await rename(GECICI, API);
  }
}

async function main() {
  await geriKoy(); // önceki yarım kalmış işlem varsa toparla

  console.log("\n▶ API rotaları geçici olarak kenara alınıyor…");
  await rename(API, GECICI);

  try {
    console.log("▶ Statik dışa aktarım (API adresi: " + API_BASE + ")…");
    await rm("out", { recursive: true, force: true });
    calistir("npx next build", { MOBILE_BUILD: "1", NEXT_PUBLIC_API_BASE: API_BASE });
  } finally {
    await geriKoy();
    console.log("▶ API rotaları geri kondu.");
  }

  if (!existsSync("android")) {
    console.log("▶ Android projesi yok, oluşturuluyor…");
    calistir("npx cap add android");
  } else {
    console.log("▶ Capacitor'a aktarılıyor…");
    calistir("npx cap sync android");
  }
  console.log("\n✅ Bitti. Android Studio'da çalıştırabilirsin: npx cap open android\n");
}

main().catch(async (e) => {
  await geriKoy();
  console.error("\n❌ " + e.message + "\n");
  process.exit(1);
});
