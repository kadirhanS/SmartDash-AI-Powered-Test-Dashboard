# SmartDash — AI Destekli Test Dashboard

JUnit XML test sonuçlarınızı yükleyin, AI ile analiz edin, grafiklerle görselleştirin ve PDF rapor olarak dışa aktarın.

**Canlı:** [smartdash-jet.vercel.app](https://smartdash-jet.vercel.app)

---

## Özellikler

- **Dosya Yükleme** — JUnit XML dosyalarını sürükle-bırak veya dosya seçici ile yükleyin
- **AI Analiz** — OpenRouter üzerinden AI modelleri ile test sonuçlarınızı analiz edin
- **Dashboard** — Test sonuçları, hata dağılımı, süre analizi grafikleri
- **Test Listesi** — Sıralama, filtreleme, arama ve sayfalama ile test senaryoları
- **Run History** — Geçmiş yüklemelerinizi tarayıcıda saklayın
- **Dark/Light Mode** — Sistem tercihine göre otomatik tema
- **PDF Export** — Profesyonel rapor formatında PDF çıktısı
- **Responsive** — Mobil ve masaüstü uyumlu tasarım

## Kullanım

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresini açın.

1. OpenRouter'a kaydolup ücretsiz API anahtarı alın
2. Anahtarı doğrulayın ve bir model seçin
3. JUnit XML dosyanızı yükleyin
4. AI ile analiz edin

## Teknolojiler

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Recharts · framer-motion · OpenRouter AI · jsPDF · fast-xml-parser

## Proje Yapısı

```
src/
├── app/
│   ├── api/          # API route'ları
│   ├── globals.css   # Stiller
│   ├── layout.tsx    # Kök layout
│   └── page.tsx      # Ana dashboard
├── components/       # React bileşenleri
├── hooks/            # Custom hook'lar
└── lib/              # Yardımcı kütüphaneler
```

## API Route'ları

| Route | Method | Açıklama |
|-------|--------|----------|
| `/api/parse-xml` | POST | JUnit XML dosyasını ayrıştırır |
| `/api/validate-key` | POST | OpenRouter API anahtarını doğrular |
| `/api/models` | GET | Kullanılabilir modelleri listeler |
| `/api/analyze` | POST | Test sonuçlarını AI ile analiz eder |
