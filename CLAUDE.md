# SmartDash — AI Agent Rehberi

> Bu proje vibe coding modeliyle geliştirilmiştir: AI agent kod yazar, Kadirhan yönetir/review eder.

## 📌 Proje Künyesi

- **Proje:** SmartDash — AI Destekli Test Dashboard
- **Sahibi:** Kadirhan (@kadirhanS)
- **Hedef:** QA mühendisleri için JUnit XML analiz + AI yorum platformu
- **Portföy Stratejisi:** ai-test-case-generator + SmartDash = AI-Powered Testing Suite
- **Durum:** 🟢 MVP TAMAMLANDI (20 Mayıs 2026)

## 🏗️ Mimari Kararlar

| Karar | Seçim | Gerekçe |
|-------|-------|---------|
| **Framework** | Next.js 16 (App Router) | Backend + Frontend tek repo |
| **UI** | Tailwind CSS v4 + shadcn/ui base-nova | Hızlı prototipleme, CSS-first |
| **State** | React useState (context light) | MVP için yeterli, ek kütüphane yükü yok |
| **AI** | OpenRouter (gemini-2.0-flash) | Ücretsiz, API key kullanıcı tarafında |
| **Charts** | Recharts 3.8.1 + 21st.dev DonutChart | Responsive, animasyonlu |
| **PDF** | jsPDF 4.2.1 | HTML2canvas kaldırıldı (OKLCH uyumsuzluğu) |
| **Storage** | sessionStorage (API key) + localStorage (Run History) | Güvenlik + kalıcılık |
| **Rate Limit** | In-memory Map (sliding window) | MVP için yeterli, prod'da Redis/KV |

## 🚨 Önemli Uyarılar (AGENTS.md)

Bu proje **Next.js 16** kullanır. Eğitim verilerindeki Next.js'den farklı olabilir.
Yeni kod yazmadan önce `node_modules/next/dist/docs/` içindeki ilgili kılavuzu oku.

**Bilinen farklar:**
- Route Handler'lar: `NextApiRequest/NextApiResponse` KULLANILMAZ → Web API `Request/Response`
- `params` bir Promise olarak gelir (v15+)
- `FormData` için `request.formData()` kullanılır
- Body parser konfigürasyonu gerekmez

## 📁 Proje Yapısı

```
smartdash/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/route.ts        # POST - AI analiz (10/dk rate limit)
│   │   │   ├── models/route.ts          # GET - model listesi (30/dk, 5dk ISR cache)
│   │   │   ├── parse-xml/route.ts       # POST - JUnit XML parse (10/dk, max 10MB)
│   │   │   └── validate-key/route.ts    # POST - API key doğrulama (20/dk)
│   │   ├── globals.css                  # OKLCH tema değişkenleri + Tailwind v4
│   │   ├── layout.tsx                   # Root layout (Geist font, Theme, Toast)
│   │   ├── not-found.tsx                # 404 sayfası
│   │   └── page.tsx                     # Ana dashboard (ana state yönetimi)
│   ├── components/
│   │   ├── ui/                          # 9 adet shadcn/ui primitifi
│   │   ├── ai-config-panel.tsx          # API Key + Model seçme
│   │   ├── donut-chart.tsx              # framer-motion animasyonlu donut
│   │   ├── donut-chart-wrapper.tsx       # Skeleton + responsive wrapper
│   │   ├── file-upload.tsx              # Drag & drop yükleme
│   │   ├── filter-sidebar.tsx           # Durum/arama/süre filtreleri
│   │   ├── pdf-export.tsx               # jsPDF ile PDF üretimi (650 satır)
│   │   ├── run-history.tsx              # Geçmiş yüklemeler listesi
│   │   ├── skeletons.tsx                # Loading skeleton'lar
│   │   ├── test-charts.tsx              # PieChart, BarChart, DurationChart
│   │   ├── test-list.tsx                # 5 sütunlu tablo + AI Popover
│   │   ├── theme-provider.tsx           # Dark/Light context
│   │   └── toast.tsx                    # Toast bildirim UI
│   ├── hooks/
│   │   ├── use-run-history.ts           # localStorage persistence hook
│   │   └── use-toast.tsx                # Toast context + provider
│   └── lib/
│       ├── ai-types.ts                  # AI tipleri (OpenRouterModel, AIAnalysisResponse)
│       ├── openrouter.ts                # OpenRouter API servisi (Türkçe prompt)
│       ├── parse-xml.ts                 # JUnit XML parser (fast-xml-parser)
│       ├── rate-limit.ts                # In-memory sliding window rate limiter
│       ├── types.ts                     # TestSuite, TestCase, FilterState
│       └── utils.ts                     # cn() fonksiyonu
├── docs/
│   ├── plan.md                          # Proje planı + roadmap
│   ├── rate-limit.md                    # Rate limiter dokümantasyonu
│   ├── usage.md                         # Kullanım rehberi (Türkçe)
│   └── dev-notes.md                     # Geliştirici notları
└── test-data.xml                        # Örnek JUnit XML (15 test)
```

## 🎯 MVP Özellikleri (8/8 ✅)

- [x] Dosya yükleme (drag-drop, .xml filtresi)
- [x] JUnit XML parser (fast-xml-parser)
- [x] AI Analiz (API Key + Model seçme, sessionStorage)
- [x] Dashboard grafikleri (Pie, Bar, Donut, Speed Bars)
- [x] Test Listesi (sıralama, arama, sayfalama, AI Popover)
- [x] Dark/Light Mode + Filter Sidebar + Toast + Skeleton
- [x] PDF Export (jsPDF, OKLCH→hex override)
- [x] Run History (localStorage)

## 🐛 Geçmiş Bug'lar (Çözüldü)

| Bug | Sorun | Çözüm |
|-----|-------|-------|
| BUG-001 | PDF Export Dark Mode: html2canvas OKLCH desteklemiyor | jsPDF'a geçildi, OKLCH→hex CSS override |
| BUG-002 | Sol altta "3 issue" mesajı | 3 ESLint hatası düzeltildi (no-explicit-any, prefer-const, display-name) |

## 🔜 Gelecek İçin Fikirler

- GitHub Actions ile CI pipeline
- Çoklu JUnit XML desteği (klasör tarama)
- Test sonuçlarının zaman içindeki trend grafiği
- İngilizce dil desteği (şu an Türkçe)
- Cypress/Playwright JSON rapor formatı desteği
- Docker konteynerizasyonu

## 👨‍💻 Çalışma Düzeni

- Kadirhan: haftalık review, feature kararları, prompt mühendisliği
- AI Agent: kod üretimi, refactor, cleanup
- Commit formatı: `feat/fix/docs: açıklama 🤖 AI-assisted`
- Branch: direkt `main`'e push (tek kişilik proje)

## 🔗 Bağlantılar

- Canlı: https://smartdash-jet.vercel.app
- GitHub: https://github.com/kadirhanS/SmartDash-AI-Powered-Test-Dashboard
- AI Test Case Generator: https://ai-test-case-generator.vercel.app
