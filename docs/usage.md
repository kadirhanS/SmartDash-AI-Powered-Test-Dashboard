## SmartDash Kullanım Rehberi

### 1.  Projeyi Başlatma
```bash
# Paketi kurun (Node 20+ gerekir)
npm install
# Geliştirme ortamını başlatın
npm run dev
# Üretim sürümü oluşturun
npm run build
```

### 2. XML Yükleme & Analiz
- **Dashboard** sayfasında “Upload XML” butonuna tıklayın.
- Support yetenekleri: JUnit XML v3.8+, Ant, Maven veya Gradle çalıtrmaları.
- Dosya boyutu maksimum **10 MB**.
- Yükleyip **Analyze** butonuna basın, AI 2.0 modeli analiz yapacak.

### 3. AI Çıktısını Görüntüleme
- Analiz tamamlandığında “Charts” kartında pie graph, bar chart ve test süresi histogramı görülür.
- “AI Analysis” kartında modelin önerileri (improvements, performance, security) sıralanır.
- “Download PDF” butonuna basarak tüm sonuçları tek bir dosyada görebilirsiniz.

### 4. Dark/Light Mod
- Sağ üst köşede bulunan güneş/ ay ikonuna tıklayın.
- Değişiklik anında uygulanır.

### 5. 404 Sayfası
- Tanımsız bir rotaya gittiğinizde, log içinde 404 hatası göreceksiniz.
- Varsayılan “Sayfa Bulunamadı” sayfası, büyük 404 yazısı ve kısa açıklama içerir.

> **Not**: Bu proje demonstration amaçlıdır; veritabanı, kimlik doğrulama veya kısıtlamalı API anahtarı yoksunluğundadır.
