# SmartDash — Geliştirici Notları

> İç notlar. Projede çalışan AI agent'ların ve Kadirhan'ın bilmesi gereken her şey.

---

## 🧠 Bilinmesi Gereken Teknik Detaylar

### Renk Sistemi: OKLCH

Bu proje **Tailwind CSS v4** ile birlikte gelen **OKLCH** renk sistemini kullanır.
`globals.css` içinde `@theme inline` ile tanımlı tüm renkler OKLCH formatındadır.

**⚠️ ÖNEMLİ:** `html2canvas` OKLCH renk fonksiyonlarını desteklemez!
- PDF export için **jsPDF** kullanılıyor (html2canvas kaldırıldı)
- Dark mode'da PDF alırken OKLCH→hex CSS override enjeksiyonu yapılıyor
- Yeni bir screenshot/kütüphane eklenirse OKLCH uyumluluğu kontrol edilmeli

### Tailwind v4 CSS-First

Tailwind v4'te **tailwind.config dosyası yok**. Tüm konfigürasyon `globals.css` içinde:
```css
@import "tailwindcss";
@import "tw-animate-css";
@source "../../node_modules/@base-ui/react";

@theme inline {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  /* ... */
}

@custom-variant dark (&:is(.dark *));
```

Yeni bir renk eklemek için `@theme inline` bloğuna ekle, `tailwind.config`'e değil.

### Tema Sistemi

- **ThemeProvider** (`src/components/theme-provider.tsx`): context-based
- localStorage'da `theme` anahtarıyla saklanır (`light` | `dark`)
- Sistem tercihi: `prefers-color-scheme` medya sorgusu
- `toggleTheme()` ile `light` ↔ `dark` geçiş
- CSS'de: `.dark` class'ı ile 20+ CSS değişkeni override edilir

### API Key Güvenliği

- Kullanıcının API anahtarı **sessionStorage**'da `sdApiKey` anahtarıyla saklanır
- Sekme kapanınca otomatik silinir
- Sayfa yenilenince kalır (sessionStorage özelliği)
- Sunucuya **gönderilmez** — sadece OpenRouter API çağrılarında kullanılır
- `.env.local`'de API key yok — zaten kullanıcı kendi key'ini girer

### Rate Limiter

```typescript
// src/lib/rate-limit.ts
checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}
```

- In-memory `Map<string, {count, resetAt}>` store
- Sliding window (60sn)
- Default: 30 istek/dk
- 5dk'da bir cleanup (memory leak önleme)
- **Uyarı:** Sunucu restart'ında sıfırlanır. Production'da Redis/Vercel KV.

### AI Analiz Servisi

```typescript
// src/lib/openrouter.ts
generateAIAnalysis(apiKey, model, testSuite): Promise<AIAnalysisResponse>
```

- **Prompt:** Türkçe — test sonuçlarını analiz eder, yapısal JSON çıktı verir
- **Öncelikli model:** `gemini-2.0-flash` (ücretsiz)
- Response: `{ summary, overallHealth, passRate, passedTests, failedTests, totalTests, comments[], recommendations[] }`
- JSON parse + validasyon içerir

### Run History (localStorage)

```typescript
// src/hooks/use-run-history.ts
useRunHistory() => {
  history: HistoryItem[];
  activeId: string | null;
  addToHistory(data, fileName): HistoryItem;
  removeFromHistory(id): void;
  clearHistory(): void;
  selectHistoryItem(id): void;
}
```

- localStorage'da `smartdash-run-history` anahtarıyla saklanır
- Maksimum 50 kayıt (eskiler otomatik silinir)
- Her kayıt: `{ id, fileName, timestamp, testCount, passedCount, failedCount, data: TestSuite }`
- Duplicate koruması: aynı fileName + testCount varsa eklenmez
- Sayfa kapatılsa bile kalır (localStorage)

### PDF Export Detayları

- `src/components/pdf-export.tsx` (650+ satır)
- jsPDF ile A4 portre formatında profesyonel rapor
- Başlık, özet, grafik açıklamaları, test listesi, AI yorumları, öneriler
- Dark mode override: PDF öncesi DOM'a geçici `<style>` enjekte edilir
- `LIGHT_OVERRIDE_CSS` ve `DARK_OVERRIDE_CSS` sabitleri — hex değerler

### JUnit XML Parser

```typescript
// src/lib/parse-xml.ts
parseJUnitXml(xmlContent: string): TestSuite
```

- fast-xml-parser kullanır
- Çift yönlü çalışır: **server** (API route) + **client** (direct call)
- Max 10MB dosya boyutu
- TestCase status: `passed` | `failed` | `error` | `skipped`

---

## 📐 Mimari Kararlar (ADR)

### Neden Next.js 16 App Router?
- Backend + Frontend tek repo, tek deploy
- API route'lar ayrı bir backend gerektirmez
- Server Components ile performans, Client Components ile interaktivite

### Neden tailwind.config yok?
- Tailwind v4 CSS-first yaklaşım — tüm konfigürasyon CSS'de
- `@theme inline`, `@custom-variant`, `@source` direktifleri ile

### Neden html2canvas kaldırıldı?
- OKLCH renk fonksiyonlarını desteklemiyor
- jsPDF ile değiştirildi, daha hafif ve güvenilir

### Neden in-memory rate limiter?
- MVP için yeterli, ek bağımlılık istemiyoruz
- Production'da Redis/Vercel KV'ye geçiş planlandı

---

## 🐛 Bilinen Issue'lar / Riskler

| Risk | Etki | Çözüm |
|------|------|-------|
| OKLCH + kütüphane uyumsuzluğu | Grafik/PDF hataları | OKLCH→hex override pattern'ini kullan |
| In-memory rate limiter reset | Sunucu restart'ında herkes geçici limitsiz | Production'da Redis'e geç |
| sessionStorage sekme bazlı | 2 sekmede 2 farklı API key | Bilinçli tasarım, sekme izolasyonu |
| GitHub repo public | API key'ler git'e eklenebilir | `sessionStorage` + `.env*` gitignore |

---

## 📊 Performance Notları

- Build: ~7sn (Turbopack local), ~15sn (Vercel)
- Sayfa ilk yük: Server Components ile hızlı
- Charts: Recharts ResponsiveContainer ile render
- AI analiz: streamText ile streaming (şu an tek response)
- localStorage: Run History boyutu büyürse eski kayıtlar otomatik temizlenir

---

## 🔗 Referanslar

- [Next.js 16 Docs](https://nextjs.org/docs) (eğer farklıysa local `node_modules/next/dist/docs/`)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Recharts v3](https://recharts.org)
- [OpenRouter API](https://openrouter.ai/docs)
- [jsPDF](https://raw.githack.com/MrRio/jsPDF/master/docs/index.html)
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)
