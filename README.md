# SmartDash — AI Destekli Test Dashboard

JUnit XML test sonuçlarınızı yükleyin, AI ile analiz edin, grafiklerle görselleştirin ve PDF rapor olarak dışa aktarın.

## Özellikler

- **Dosya Yükleme** — JUnit XML dosyalarını sürükle-bırak veya dosya seçici ile yükleyin
- **AI Analiz** — OpenRouter üzerinden AI modelleri ile test sonuçlarınızı analiz edin
- **Dashboard** — Test sonuçları, hata dağılımı, süre analizi grafikleri
- **Test Listesi** — Sıralama, filtreleme, arama ve sayfalama ile test senaryoları
- **Dark/Light Mode** — Sistem tercihine göre otomatik tema
- **PDF Export** — Profesyonel rapor formatında PDF çıktısı
- **Responsive** — Mobil ve masaüstü uyumlu tasarım

## Başlangıç

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresini açın.

## Kullanım

1. OpenRouter'a kaydolup ücretsiz bir API anahtarı alın
2. Anahtarı SmartDash'te doğrulayın ve bir model seçin
3. JUnit XML dosyanızı yükleyin
4. "AI ile Analiz Et" butonuna tıklayın
5. Grafikleri inceleyin ve PDF rapor indirin

## Deploy

```bash
npm run build
npm start
```

Vercel'e tek tıkla deploy edilebilir.

## Teknolojiler

Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Recharts, jsPDF
