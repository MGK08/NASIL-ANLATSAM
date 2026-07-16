/** Tarayıcıda kalıcı, anonim kullanıcı kimliği (UUID). DB'deki uuid alanlarıyla uyumlu. */
export function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("na_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("na_user_id", id);
  }
  return id;
}
