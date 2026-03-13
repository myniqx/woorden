export interface ChangelogEntry {
  date: string; // ISO: "2026-03-13"
  items: string[];
}

// Newest first
export const changelog: ChangelogEntry[] = [
  {
    date: '2026-03-13',
    items: [
      'A2+ kelime paketi için örnek cümleler (zinnen) eklendi',
      'Hollandaca → Anadil testinde örnek cümle gösterimi eklendi',
      'Zin dosyaları birleştirildi (27 → 3 dosya)',
      'CLI: check, check --van-woord, check --fix komutları eklendi',
      'CLI: add-zin tekrar cümle koruması eklendi',
    ],
  },
  {
    date: '2026-02-17',
    items: [
      'A1 ve A2 kelime paketleri için örnek cümleler tamamlandı',
      'Kelime başına 5 cümle limiti eklendi',
      'Zin notasyon sistemi geliştirildi',
    ],
  },
  {
    date: '2026-01-20',
    items: [
      'A2+ kelime paketi eklendi',
      'Kelime havuzu modalı yenilendi',
      'Destek butonu eklendi',
    ],
  },
  {
    date: '2025-12-01',
    items: [
      'A1 ve A2 kelime paketleri eklendi',
      'Spaced repetition algoritması iyileştirildi',
      'Karanlık/aydınlık tema desteği eklendi',
      'PWA desteği eklendi (offline kullanım)',
    ],
  },
];

export const latestDate = changelog[0].date;
