import Link from "next/link";

export const metadata = {
  title: "Gizlilik Politikası — Nasıl Anlatsam?",
  description: "Nasıl Anlatsam? oyununun gizlilik politikası.",
};

export default function GizlilikPage() {
  return (
    <main className="screen" style={{ overflowY: "auto", paddingTop: 28, paddingBottom: 40 }}>
      <div className="card" style={{ maxWidth: 720, margin: "0 auto", padding: 24, lineHeight: 1.65 }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 26, margin: "0 0 4px", color: "var(--ink)" }}>
          Gizlilik Politikası
        </h1>
        <p style={{ fontSize: 13, color: "#8A6A57", margin: "0 0 20px" }}>
          Nasıl Anlatsam? · KUPALABS · Son güncelleme: 23 Temmuz 2026
        </p>

        <h2 style={s.h2}>Kısaca</h2>
        <p style={s.p}>
          Nasıl Anlatsam? bir kelime anlatma oyunudur. Hesap açmanızı istemez; ad, e-posta,
          telefon numarası veya konum bilgisi toplamaz. Reklam göstermez, analiz veya
          takip aracı kullanmaz, hiçbir veriyi üçüncü taraflara satmaz ya da pazarlama
          amacıyla paylaşmaz.
        </p>

        <h2 style={s.h2}>Toplanan bilgiler</h2>
        <p style={s.p}>Oyunun çalışabilmesi için yalnızca şunlar işlenir:</p>
        <ul style={s.ul}>
          <li>
            <b>Anonim cihaz kimliği:</b> Uygulama ilk açıldığında rastgele bir kimlik
            (UUID) üretilir ve cihazınızda saklanır. Kimliğinizle ilişkili değildir;
            yalnızca oyunda hangi oyuncu olduğunuzu ayırt etmeye yarar.
          </li>
          <li>
            <b>Oyun içi takma adlar:</b> Oyunu kuran kişinin yazdığı oyuncu adlarıdır.
            Gerçek ad girme zorunluluğu yoktur; istediğiniz takma adı kullanabilirsiniz.
          </li>
          <li>
            <b>Oyun verisi:</b> Oda kodu, takımlar, puanlar, sıra bilgisi ve oyun ayarları.
          </li>
          <li>
            <b>Bağlantı zamanı:</b> Oyuncunun bağlantısının kopup kopmadığını anlamak için
            son görülme zamanı tutulur. Böylece düşen oyuncu oyuna geri dönebilir.
          </li>
        </ul>

        <h2 style={s.h2}>Nerede saklanır</h2>
        <p style={s.p}>
          Veriler, altyapı sağlayıcılarımız Supabase (veritabanı, Frankfurt/Almanya) ve
          Vercel (uygulama sunucusu) üzerinde barındırılır. Bu sağlayıcılar veriyi yalnızca
          hizmeti sunmak için işler.
        </p>

        <h2 style={s.h2}>Saklama süresi ve silme</h2>
        <p style={s.p}>
          Oyun odaları geçicidir ve yalnızca oynanış için tutulur. Cihazınızdaki anonim
          kimliği, uygulamayı kaldırarak ya da uygulama verilerini temizleyerek silebilirsiniz.
          Verilerinizin silinmesini istediğinizde aşağıdaki adresten bize yazmanız yeterlidir.
        </p>

        <h2 style={s.h2}>Çocukların gizliliği</h2>
        <p style={s.p}>
          Oyun her yaşa uygundur ve çocuklardan bilerek kişisel veri toplamaz. Zaten hesap
          veya kişisel bilgi istenmediği için toplanan veri anonimdir.
        </p>

        <h2 style={s.h2}>İzinler</h2>
        <p style={s.p}>
          Uygulama; kamera, mikrofon, konum, rehber veya dosyalarınıza erişim izni istemez.
          Yalnızca internet bağlantısı kullanır (oyun çevrimiçi oynandığı için gereklidir).
        </p>

        <h2 style={s.h2}>Değişiklikler</h2>
        <p style={s.p}>
          Bu politika güncellenirse, sayfanın üstündeki tarih değiştirilir.
        </p>

        <h2 style={s.h2}>İletişim</h2>
        <p style={s.p}>
          Sorularınız veya veri silme talepleriniz için: <b>labskupa@gmail.com</b>
        </p>

        <div style={{ marginTop: 24 }}>
          <Link href="/" className="btn btn--primary">Ana sayfaya dön</Link>
        </div>
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  h2: { fontFamily: "var(--display)", fontSize: 17, margin: "20px 0 6px", color: "var(--ink)" },
  p: { fontSize: 14.5, color: "var(--ink)", margin: "0 0 8px" },
  ul: { fontSize: 14.5, color: "var(--ink)", margin: "0 0 8px", paddingLeft: 20 },
};
