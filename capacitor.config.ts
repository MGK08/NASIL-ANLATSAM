import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.kupalabs.nasilanlatsam",
  appName: "Nasıl Anlatsam?",
  // Uygulamanın içinde barınan web klasörü (server.url kullandığımız için
  // sadece placeholder; yine de gerekli).
  webDir: "public",
  server: {
    // Android uygulaması doğrudan canlı Vercel sitesini yükler.
    url: "https://nasil-anlatsam.vercel.app",
    cleartext: false,
  },
};

export default config;
