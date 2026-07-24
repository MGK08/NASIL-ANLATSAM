import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Nasıl Anlatsam?",
  description: "Biliyorsun ama söyleyemiyorsun! Arkadaşlarınla oynanan kelime anlatma oyunu.",
};

export const viewport: Viewport = {
  themeColor: "#FF6A4D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Android 15+ kenardan kenara çizimi zorunlu kılıyor ve kapatılamıyor.
  // Boşlukları biz yönetiyoruz (globals.css: --sat/--sab), bunun için şart.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
