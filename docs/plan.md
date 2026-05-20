# SmartDash — Proje Planı ve Notlar

> **Son Güncelleme:** 20 Mayıs 2026
> **Durum:** ✅ MVP Tamamlandı

## Stack

| Teknoloji | Versiyon | Kullanım |
|-----------|----------|----------|
| Next.js | 16.2.6 | Frontend + Backend (App Router) |
| React | 19.2.4 | UI Framework |
| TypeScript | 5.x | Tip Güvenliği |
| Tailwind CSS | v4 | CSS-first Styling |
| shadcn/ui | base-nova | UI Komponentleri |
| Recharts | 3.8.1 | Grafikler |
| framer-motion | 12.39.0 | Animasyonlar |
| OpenRouter | REST API | AI Analiz (gemini-2.0-flash) |
| jsPDF | 4.2.1 | PDF Rapor |
| fast-xml-parser | 5.8.0 | JUnit XML Parse |
| @base-ui/react | 1.4.1 | Popover, primitifler |
| lucide-react | 1.16.0 | İkonlar |

## Özellik Durumu

- [x] JUnit XML yükleme + parse ✅
- [x] AI analiz (API key + model seçme) ✅
- [x] Dashboard grafikleri (Pie, Bar, Duration, Donut) ✅
- [x] Filtreleme + arama + sayfalama ✅
- [x] Dark/Light mode ✅
- [x] PDF Export ✅
- [x] Responsive UI ✅
- [x] Run History (localStorage) ✅

## Build Durumu

✅ `npm run build` — 0 hata, 0 warning
✅ `npm run lint` — 0 hata, 0 warning
✅ Vercel deploy — başarılı

## Deploy

- **Production:** https://smartdash-jet.vercel.app
- **Platform:** Vercel (ücretsiz tier, Washington D.C.)
- **Build süresi:** ~15sn (Turbopack)

## API Route'ları

| Route | Method | Rate Limit | Açıklama |
|-------|--------|------------|----------|
| /api/parse-xml | POST | 10/dk | Multipart form, max 10MB |
| /api/validate-key | POST | 20/dk | OpenRouter 1 token test |
| /api/models | GET | 30/dk | ?plan=free\|paid, 5dk ISR cache |
| /api/analyze | POST | 10/dk | JSON body → AI analiz |

## Gelecek Planları (MVP Sonrası)

### Kısa Vade
- [ ] GitHub Actions CI pipeline (lint + build + test)
- [ ] Çoklu JUnit XML desteği (klasör tarama)
- [ ] İngilizce dil desteği

### Orta Vade
- [ ] Test sonuçlarının zaman içindeki trend grafiği
- [ ] Cypress/Playwright JSON rapor formatı desteği
- [ ] Docker konteynerizasyonu

### Portföy
- [ ] Demo video çekimi
- [ ] LinkedIn'de SmartDash duyurusu
- [ ] Portföy sitesinde sergileme

## Notlar

- Tüm teknolojiler açık kaynak ve ücretsiz
- API key'ler kullanıcı tarafında (sessionStorage) — asla sunucuda saklanmaz
- Rate limiter in-memory — production'da Redis/Vercel KV'ye geçilebilir
- Tailwind v4 CSS-first yaklaşım — tailwind.config dosyası yok
- Renk sistemi OKLCH — html2canvas ile uyumsuz, jsPDF kullanılıyor
- Proje vibe coding modeliyle geliştiriliyor: AI agent kod yazar, Kadirhan yönetir
