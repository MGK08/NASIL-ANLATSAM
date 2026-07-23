/**
 * Web (Vercel) ve mobil (Capacitor) aynı kod tabanından derlenir.
 * MOBILE_BUILD=1 iken statik dışa aktarım yapılır: arayüz telefonun
 * içine gömülür, API çağrıları Vercel'e gider.
 * @type {import('next').NextConfig}
 */
const mobil = process.env.MOBILE_BUILD === "1";

const nextConfig = {
  reactStrictMode: true,
  ...(mobil
    ? {
        output: "export",
        trailingSlash: true,          // /oda/ -> oda/index.html
        images: { unoptimized: true },
      }
    : {}),
};

module.exports = nextConfig;
