import type { CapacitorConfig } from "@capacitor/cli";

/**
 * GÖMÜLÜ SÜRÜM: arayüz telefonun içinde (out/ klasörü) çalışır.
 * Artık canlı siteye bağlanılmıyor -> anında açılır ve Play Store'un
 * "sadece web sitesi" itirazına takılmaz.
 * API çağrıları Vercel'e gider (NEXT_PUBLIC_API_BASE).
 */
const config: CapacitorConfig = {
  appId: "app.kupalabs.nasilanlatsam",
  appName: "Nasıl Anlatsam?",
  webDir: "out",
  android: {
    // Uygulama içi adres: https://localhost (API tarafında CORS ile izinli)
    allowMixedContent: false,
  },
};

export default config;
