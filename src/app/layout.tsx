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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
