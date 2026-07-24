import type { CapacitorConfig } from "@capacitor/cli";

/**
 * GÖMÜLÜ SÜRÜM: arayüz telefonun içinde (out/), API Vercel'de.
 *
 * SİSTEM ÇUBUKLARI
 * Android 15+ kenardan kenara çizimi zorunlu kılıyor; kapatılamıyor.
 * Capacitor 8.3+ sistem çubuklarının gerçek ölçülerini --safe-area-inset-*
 * CSS değişkenleri olarak enjekte eder (insetsHandling varsayılanı "css").
 * globals.css bu değerleri kullanarak içeriği çubukların dışında tutar.
 */
const config: CapacitorConfig = {
  appId: "app.kupalabs.nasilanlatsam",
  appName: "Nasıl Anlatsam?",
  webDir: "out",
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SystemBars: {
      // Arka planımız doygun turuncu/kırmızı/mavi -> açık (beyaz) simgeler okunur.
      style: "LIGHT",
    },
  },
};

export default config;
