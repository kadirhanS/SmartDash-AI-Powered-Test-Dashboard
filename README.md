# SmartDash — AI Destekli Test Dashboard

<p align="center">
  <a href="https://smartdash-jet.vercel.app">
    <img src="https://img.shields.io/badge/canl%C4%B1%20demo-Vercel-black?style=for-the-badge&logo=vercel" alt="Vercel">
  </a>
  <a href="https://github.com/kadirhanS/SmartDash-AI-Powered-Test-Dashboard">
    <img src="https://img.shields.io/badge/kaynak%20kod-GitHub-blue?style=for-the-badge&logo=github" alt="GitHub">
  </a>
</p>

JUnit XML test sonuçlarınızı yükleyin, **AI ile analiz edin**, grafiklerle görselleştirin ve PDF rapor olarak dışa aktarın.

---

## ✨ Özellikler

| Özellik | Açıklama |
|---------|----------|
| 📂 **Dosya Yükleme** | JUnit XML dosyalarını sürükle-bırak veya dosya seçici ile yükleyin |
| 🤖 **AI Analiz** | OpenRouter üzerinden AI modelleri ile test sonuçlarınızı analiz edin |
| 📊 **Dashboard** | Test sonuçları, hata dağılımı, süre analizi grafikleri (Pie, Bar, Donut, Speed Bars) |
| 📋 **Test Listesi** | Sıralama, filtreleme, arama ve sayfalama ile test senaryoları |
| 🕒 **Run History** | Geçmiş yüklemelerinizi localStorage'da saklayın, tekrar görüntüleyin |
| 🌙 **Dark/Light Mode** | Sistem tercihine göre otomatik tema |
| 📄 **PDF Export** | Profesyonel rapor formatında PDF çıktısı |
| 📱 **Responsive** | Mobil ve masaüstü uyumlu tasarım |

## 🚀 Canlı

👉 **[smartdash-jet.vercel.app](https://smartdash-jet.vercel.app)**

## 🛠️ Kullanım

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresini açın.

### Adımlar

1. **OpenRouter'a kaydolun** → Ücretsiz API anahtarı alın
2. **Anahtarı doğrulayın** → SmartDash'te API Key girişi yapın ve bir model seçin
3. **XML yükleyin** → JUnit XML dosyanızı sürükleyip bırakın
4. **AI analiz yapın** → "AI ile Analiz Et" butonuna tıklayın
5. **İnceleyin ve paylaşın** → Grafikleri inceleyin, PDF rapor indirin

## 🧰 Teknolojiler

| Teknoloji | Versiyon | Kullanım |
|-----------|----------|----------|
| Next.js | 16.2.6 | App Router, Frontend + Backend |
| React | 19.2.4 | UI Framework |
| TypeScript | 5.x | Tip Güvenliği |
| Tailwind CSS | v4 | CSS-first Styling |
| shadcn/ui | base-nova | UI Komponentleri |
| Recharts | 3.8.1 | Grafikler |
| framer-motion | 12.39.0 | Animasyonlar |
| OpenRouter AI | REST API | AI Analiz |
| jsPDF | 4.2.1 | PDF Rapor |
| fast-xml-parser | 5.8.0 | JUnit XML Parse |

## 📁 Proje Yapısı

```
smartdash/
├── src/
│   ├── app/
│   │   ├── api/          # 4 API route (parse-xml, analyze, models, validate-key)
│   │   ├── globals.css   # Tema değişkenleri (OKLCH)
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Ana dashboard
│   │   └── not-found.tsx # 404 sayfası
│   ├── components/       # React bileşenleri (16+)
│   ├── hooks/            # Custom hooks (use-toast, use-run-history)
│   └── lib/              # Yardımcı kütüphaneler
├── docs/                 # Dokümantasyon
└── test-data.xml         # Örnek JUnit XML
```

## 🔐 Güvenlik

- API anahtarları **sessionStorage**'da saklanır, sunucuya gönderilmez
- Tüm API route'ları **rate-limited** (10-30 istek/dk)
- Hassas bilgi `.env.local`'de tutulmaz, kullanıcı kendi key'ini girer

## 📈 Durum

✅ **MVP Tamamlandı** — 8/8 özellik canlı

---

*AI-assisted development ile vibe coding modeliyle geliştirilmiştir.*
