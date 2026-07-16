# Nasıl Anlatsam? — Proje İskeleti

Çevrimiçi çok oyunculu kelime anlatma oyunu. Oyuncular yan yana; herkes kendi
telefonundan 8 haneli kodla aynı odaya bağlanır.

## Teknoloji

- **Next.js (React) → Vercel**: hem arayüz hem de yetkili sunucu mantığı (API route'ları).
- **Supabase**: Postgres veritabanı + Realtime (canlı senkron) + anonim giriş.

Yetkili yazma sunucuda döner (hile engelleme). İstemci yalnızca okur ve Realtime
ile anlık güncellenir.

```
📱 telefonlar ──aksiyon──▶ Vercel API (validateAction → applyAction)
                                  │ yazar (service role)
                                  ▼
                            ☁️ Supabase Postgres
                                  │ Realtime yayını
📱 telefonlar ◀──oda durumu anında──┘
```

## Klasör Yapısı

```
nasilanlatsam/
├── README.md
├── package.json              # Next.js + Supabase bağımlılıkları
├── tsconfig.json             # @/* -> src/* yol takma adı
├── next.config.js
├── vercel.json
├── .env.example              # Supabase anahtarları şablonu
├── supabase/
│   ├── migrations/
│   │   └── 0001_initial_schema.sql   # decks, cards, rooms, slots + RLS + realtime
│   └── seed.sql                      # 350 kartın yüklenmesi
└── src/
    ├── types/
    │   └── game.ts           # ✅ PAYLAŞILAN MODEL (tek gerçek kaynak)
    ├── lib/
    │   ├── supabaseClient.ts # ✅ tarayıcı (anon, okuma+realtime)
    │   ├── supabaseAdmin.ts  # ✅ sunucu (service role, yetkili yazma)
    │   └── roomCode.ts       # ✅ 8 haneli kod üretimi
    ├── engine/
    │   ├── rulesEngine.ts    # ⏳ applyAction / validateAction  (oyunun kalbi)
    │   ├── scoring.ts        # ⏳ puan + kazanan kontrolü
    │   └── turnOrder.ts      # ⏳ dönüşümlü sıra
    ├── server/api/
    │   └── action.ts         # ⏳ yetkili uç nokta (Vercel serverless)
    ├── realtime/
    │   └── subscribeRoom.ts  # ⏳ canlı abonelik
    └── app/                  # ⏳ ekranlar (giriş, kurulum, katılım, lobi, oyun, sonuç)
```

`✅` hazır · `⏳` iskeleti kuruldu, mantığı adım adım dolacak.

## Kurulum (özet)

1. Supabase'de proje aç, **Settings → API**'den URL + anon + service_role anahtarlarını al.
2. `.env.example`'ı `.env.local` olarak kopyala, anahtarları doldur.
3. `supabase/migrations/0001_initial_schema.sql` ve ardından `supabase/seed.sql` çalıştır.
4. `npm install` → `npm run dev`.
5. Deploy: Vercel'e bağla, aynı ortam değişkenlerini gir.

## Oyun Kuralları (tasarım özeti)

- Giriş: **Oyun Kur** / **Oyuna Katıl**.
- Kurucu ayarları (hedef puan, tur süresi) girer, 2 takım + isimler + birer **kaptan** belirler; ilk isim kurucudur. **8 haneli kod** üretilir.
- Katılanlar kodu girer, isim listesinden kendini seçer (seçilen isim **soluklaşır**, kilitlenir; tekrar basıp değiştirilebilir).
- Tüm isimler dolunca kurucu **Başlat**'a basar; herkeste oyun ekranı açılır.
- Sıra **isim listesine göre, takımlar arası dönüşümlü**. Sıradaki kişide **Başla** çıkar.
- **Anlatan**: kelime + yasaklılar + Anlattım/Pas + sağ üstte süre. **Takımı**: sadece "X anlatıyor". **Rakip**: kartı görür; **rakip kaptanda** Yasaklı Kelime butonu.
- Puan: doğru **+1**, tabu **−1** (kart atlanır), **3 pas** (bitince pasif). Sol üstte canlı skorboard.
- Süre bitince yarım kart sayılmaz; otomatik sıradakine geçilir (Başla beklenir).
- **Hedef puana anında** ulaşan kazanır → kazanan + final skor + Tekrar Oyna. Her oyunda kartlar rastgele; 350 biterse yeniden karışır.
- Kopan oyuncu kodla **kaldığı yerden** döner; oyun kurucunun **Oyunu Bitir**'ine ya da bitişe kadar sürer. Takım başına en az 2 kişi.
- Süre sonu / tabu anında ses + titreşim.

## Adım Adım Yol Haritası ("başlayalım" dediğinde, sunucudan başlayarak)

1. **Supabase kurulumu** — şemayı uygula, 350 kartı seed'le, bağlantıyı doğrula.
2. **Sunucu: oda kur/katıl** — kod üretimi, slot oluşturma, sahiplenme API'si.
3. **Sunucu: kural motoru** — `applyAction`/`validateAction`: skor, sıra, pas, tabu, tur akışı (+ testler).
4. **Realtime katmanı** — `subscribeRoom`, tüm ekranların canlı senkronu.
5. **Arayüz: Giriş** — Oyun Kur / Oyuna Katıl.
6. **Arayüz: Kurulum** — ayarlar + takımlar + kaptan + kod ekranı.
7. **Arayüz: Katılım** — kod girişi + isim listesi (soluk/seçim/değiştir).
8. **Arayüz: Lobi + Başlat.**
9. **Arayüz: Oyun ekranı** — roller, skorboard, süre, Anlattım/Pas/Tabu.
10. **Sonuç ekranı** — kazanan + Tekrar Oyna.
11. **Dayanıklılık** — kopma/yeniden bağlanma, Oyunu Bitir.
12. **His & cila** — ses, titreşim, animasyon, tema.
13. **Vercel deploy.**
