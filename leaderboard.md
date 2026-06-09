# Leaderboard — Tasarım ve Durum

## Mimari Karar

- `stats` tablosu ham veriyi tutar (günlük quiz istatistikleri)
- `cache` tablosu cron job tarafından hazırlanan düz metin leaderboard verisini tutar
- Client `cache` tablosundan tek seferlik veri çeker, client-side sıralar/filtreler
- Cron job saatte 1 çalışır, bot skorlarını günceller + `stats` + `profiles` verilerini okuyup `cache` tablosunu günceller

## Supabase Tabloları (oluşturuldu)

### `stats`
```sql
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
date date NOT NULL,
practiced integer NOT NULL DEFAULT 0,
correct integer NOT NULL DEFAULT 0,
PRIMARY KEY (user_id, date)
```
RLS: kullanıcı sadece kendi satırını okur/yazar. Botlar service role ile yazılır.

### `cache`
```sql
key text PRIMARY KEY,
value text NOT NULL,
updated_at timestamptz NOT NULL DEFAULT now()
```
RLS: herkes okuyabilir, sadece service role yazabilir.

### `profiles` (mevcut, genişletildi)
```sql
id uuid PRIMARY KEY,
data bytea,           -- gzip sıkıştırılmış wordProgress + pinnedWords + enabledPacks + streak + lastPracticeDate + bestDaily
username text UNIQUE,
avatar_index integer DEFAULT 0,
last_sync timestamptz,
updated_at timestamptz,
is_bot boolean DEFAULT false   -- bot hesapları işaretlemek için (migration ile eklenecek)
```

## Cache Formatı

`cache` tablosunda `key = 'leaderboard'` olan tek bir satır tutulur.

`value` alanı düz metin, her kullanıcı bir satır, `\n` ile ayrılmış:
```
username,avatarIndex,daily,dailyCorrect,last7,last7Correct,last30,last30Correct
```

- `username` — profiles.username; set edilmemişse `unknown_<uuid son 6 karakter>`
- `avatarIndex` — profiles.avatar_index
- `daily` / `dailyCorrect` — bugünkü practiced / correct toplamı
- `last7` / `last7Correct` — son 7 günün practiced / correct toplamı
- `last30` / `last30Correct` — son 30 günün practiced / correct toplamı

UUID kullanılmıyor, username unique olduğu için yeterli.
Bot satırları gerçek kullanıcı satırlarıyla aynı formatta, ayrımı client görmez.

Sıkıştırma şimdilik yok, ileride eklenebilir.

## Cron Job

Dosya: `supabase/functions/update-leaderboard/index.ts`

Deploy: `supabase functions deploy update-leaderboard`

Her saat çalışır, sırasıyla şunları yapar:

### Adım 1 — Bot skorlarını güncelle
- `profiles` tablosundan `is_bot = true` olan tüm kayıtları çek
- Her bot için bugünkü `stats` satırını çek (yoksa sıfırdan başla)
- Saate göre rastgele artış ekle ve `stats` tablosuna upsert et:
  - Gün içinde belirli saat aralıklarında aktif olsunlar (örn. 09-22 arası)
  - Her tetiklemede mevcut `practiced` üzerine `rand(20, 100)` ekle
  - `correct` değeri `practiced`'ın %60-85'i aralığında rastgele hesapla
- Botlar her gün sıfırdan başlar (`stats` tablosu zaten `(user_id, date)` primary key)

### Adım 2 — Cache'i yenile
- `stats` tablosundaki tüm kullanıcıların (bot dahil) günlük/haftalık/aylık toplamlarını hesapla
- `profiles` tablosundan `username` ve `avatar_index` çek
- Sonucu düz metin olarak `cache.value`'ya upsert et
- Service role key ile çalışır (RLS bypass)

## Bot Hesapları

**Henüz oluşturulmadı.**

- ~20 adet bot hesabı, Supabase `auth.users` tablosunda gerçek kayıt olarak tutulur (FK zorunluluğu)
- `profiles` tablosunda `sign` kolonu ile işaretlenir (`is_bot` yerine — daha az bariz)
- Oluşturma yöntemi: seed script (`scripts/seed-bots.ts`) — service role key ile hem auth hem profiles'a yazar
- Kullanıcı adları: Hollandaca sıfat + kelime + 3-4 basamaklı sayı formatında üretilir (örn. `snelle_vis_482`)

### `profiles` tablosu migration

```sql
ALTER TABLE profiles ADD COLUMN sign integer DEFAULT 0;
-- 0 = gerçek kullanıcı, 1 = bot
```

### Supabase Editor — profiles tablosuna sign kolonu ekle

Supabase dashboard > SQL Editor'da çalıştır:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sign integer DEFAULT 0;
```

### Seed script için kullanıcı adı havuzu

Bot kullanıcı adları `{sıfat}_{isim}_{sayı}` formatında üretilecek.
Aşağıdaki listeyi düzenle, seed script bunları kullanacak:

```ts
// scripts/seed-bots.ts içinde kullanılacak havuz
const ADJECTIVES = [
  // Hollandaca sıfatlar — düzenle
  "snelle", "grote", "kleine", "sterke", "slimme",
  "vrolijke", "rustige", "flinke", "koele", "warme",
  // ...buraya ekle (hedef: ~30 adet)
];

const NOUNS = [
  // Hollandaca isimler — düzenle
  "vis", "kat", "hond", "boom", "ster",
  "wolf", "beer", "egel", "uil", "vos",
  // ...buraya ekle (hedef: ~20 adet)
];
```

Format: `snelle_vis_482`, `grote_kat_7341` gibi.
Sayı aralığı: 100–9999 arası rastgele.

### Seed script çıktısı (örnek)

Script çalışınca konsolda şunu basar, kopyalayıp sakla:

```
[OK] snelle_vis_482   → auth uid: xxx-yyy
[OK] grote_kat_7341   → auth uid: xxx-yyy
...
```

## Uygulama Tarafı

### Mevcut durum
- `ProfileScreen.tsx` → Leaderboard tabı placeholder gösteriyor (`Trophy` ikonu + "Leaderboard coming soon")
- `src/services/sync.ts` → Leaderboard için henüz fonksiyon yok

### Yapılacaklar

#### Login duvarı (blur overlay)
- Leaderboard tabına tıklanınca içerik bulanık gösterilir
- Üzerinde "Sıralamayı görmek için giriş yap" mesajı + Profile sayfasına yönlendiren buton
- Giriş yapan kullanıcıya normal leaderboard gösterilir

#### Leaderboard UI
1. `sync.ts`'e `fetchLeaderboard(): Promise<string | null>` ekle
   - `supabase.from('cache').select('value').eq('key', 'leaderboard').single()`
   - Ham metin döner
2. Client-side parse fonksiyonu — düz metni `{ username, avatarIndex, daily, weekly, monthly }[]` dizisine çevirir
3. `ProfileScreen.tsx` leaderboard tabına bağla
   - Tab açılınca bir kere çek (`sessionStorage` ile dedup)
   - Daily / Weekly / Monthly toggle (client-side sort, ek istek yok)
   - Her satırda avatar + username + skor göster

## Avatar

- `src/assets/avatars.svg` — SVG sprite dosyası mevcut
- `src/components/AvatarPicker.tsx` — avatar seçim componenti mevcut
- `src/components/AvatarPicker.css` — stilleri mevcut
- Avatar index `profiles.avatar_index` ve local `AppData.avatarIndex`'te tutulur
- Leaderboard satırında `Avatar` componenti `index` prop'u ile kullanılacak

## İlgili Dosyalar

| Dosya | İlgisi |
|-------|--------|
| `src/components/ProfileScreen.tsx` | Leaderboard tab UI, blur overlay + asıl liste |
| `src/components/ProfileScreen.css` | Tab stilleri, blur overlay stilleri |
| `src/components/AvatarPicker.tsx` | `Avatar` ve `AvatarPicker` componentleri |
| `src/services/sync.ts` | `fetchLeaderboard` buraya eklenecek |
| `src/services/storage.ts` | `getUsername`, `getAvatarIndex` — local okuma |
| `src/services/supabase.ts` | Supabase client |
| `scripts/seed-bots.ts` | Bot hesaplarını oluşturan seed script (henüz yok) |
| `supabase/functions/update-leaderboard/` | Edge Function + cron job (henüz yok) |
