/**
 * Mobil uygulama (Capacitor) API'yi FARKLI bir kökenden çağırır
 * (Android'de https://localhost). Tarayıcı bunu engellememesi için
 * API yanıtlarına CORS başlıkları eklenir.
 * Kimlik çerezle değil, istek gövdesindeki anonim UUID ile taşındığı için
 * her kökene izin vermek güvenlidir.
 */
export const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
};

export function jsonCors(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS_HEADERS },
  });
}

/** Tarayıcının ön kontrol (preflight) isteği */
export function optionsResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
