# Ferhat Kargo — Manyetik Etkileşim, Apple Snap Destek Paneli & Özel IP Yönetici Konsolu

Müşteri Hizmetleri ve ortam kontrollerine fizik tabanlı manyetik imleç takibi ekleniyor; destek penceresi Apple iOS/macOS tarzı yaylı (spring-snap) animasyonla açılacak şekilde yenileniyor, Groq tabanlı stajyer yapay zekanın tekrarlayan cevaplar üretmesi engelleniyor ve `212.125.0.52` IP adresine özel, sol sütunda ziyaretçi IP'lerini ve mesaj geçmişlerini filtreleyip canlı devralabileceğiniz çift panelli bir yönetici arayüzü oluşturuluyor.

---

## Kullanıcı Onayı & Kritik Kararlar

> [!IMPORTANT]
> İlk turdaki yanıtlarınız doğrultusunda aşağıdaki mimari ve tasarım kararları kesinleştirildi. Planı onayladığınızda uygulama doğrudan bu spesifikasyona göre geliştirilecektir.

- **Yapay Zeka Altyapısı (Onaylandı)**: Mevcut Groq (`llama-3.3-70b-versatile`) entegrasyonu korunacak; ancak tekrar önleme katmanı, dinamik senaryo tohumlaması ve bağlam duyarlı yedek yanıt havuzu ile aynı cevabın tekrarlanması ortadan kaldırılacak.
- **Manyetik İmleç Takibi Kapsamı (Onaylandı)**: Sağ alttaki yüzen butonlar (Müşteri Hizmetleri, Ses Kapalı/Çalıyor, Kar Yağışı, Karı Temizle), üst menü aksiyon butonları (Hızlı Gezin, Tema Değiştirici) ve ana sayfa/müze ana aksiyon butonlarında dengeli çekim kuvveti uygulanacak.
- **Yönetici Konsolu Yetenekleri — `212.125.0.52` (Onaylandı)**: Sol panelde ziyaretçi IP adresleri ve geçmiş sohbetler listelenecek; IP veya mesaj içeriğiyle canlı arama, durum filtreleme (`Tümü`, `AI`, `Canlı`, `Kapalı`) ve tek tıkla sohbeti canlı devralıp yazışma özellikleri bulunacak.
- **Seçilen Yan Özellikler (Onaylandı)**: Apple iMessage tarzı akıcı 3 noktalı "yazıyor" göstergesi ve yeni sohbet açan müşteriler için tek tıkla gönderilebilen hazır soru önerileri eklenecek.

---

## 1. Genel Bakış & Temel Konsept

- **Ne Sağlar**: Site genelindeki temel kontrol yüzeylerine dokunsal (tactile) manyetik mikro-etkileşim kazandırır, Müşteri Hizmetleri sohbetini akıcı bir Apple tarzı yaylı pencereye dönüştürür ve yönetici IP'si (`212.125.0.52`) ile bağlanıldığında otomatik olarak açılan profesyonel bir müşteri izleme ve canlı müdahale konsolu sunar.
- **Hedef Kitle**:
  - **Standart Ziyaretçiler**: Komik, şaşkın ama her seferinde farklı ve yaratıcı yanıtlar veren stajyer yapay zeka ile akıcı sohbet eden kullanıcılar.
  - **Yönetici (`212.125.0.52`)**: Siteye hangi IP'lerin yazdığını, stajyer yapay zekayla ne konuştuklarını sol listeden anlık izleyip istediği konuşmayı devralabilen site sahibi.
- **Temel Değer**: Donuk açılıp kapanan pencere ve sabit/tekrarlı yapay zeka yanıtları yerine; yaşayan, tepkisel ve yöneticinin tam kontrol sahibi olduğu bütüncül bir destek deneyimi.

---

## 2. Kullanıcı Deneyimi & Görsel Tasarım

### Temel Kullanıcı Akışları

1. **Manyetik Hover Deneyimi**: Fare imleci Müşteri Hizmetleri, Ses Kapalı, Kar Yağışı, Hızlı Gezin, Tema veya ana CTA butonlarının üzerine geldiğinde buton gövdesi imlece doğru yumuşak bir yay fiziğiyle (en fazla `5–8px`) yaklaşır; içindeki ikon ve metin çok hafif ikincil bir derinlik (paralaks) hareketi yapar. İmleç ayrıldığında buton esnek biçimde başlangıç noktasına geri oturur. Dokunmatik cihazlarda ve azaltılmış hareket (`prefers-reduced-motion`) tercihinde efekt otomatik devre dışı kalır.
2. **Apple Snap Açılış & Müşteri Sohbeti**:
   - Müşteri Hizmetleri butonuna basıldığında pencere sağ alt köşeden (`origin-bottom-right`) yüksek rijitlikli, pürüzsüz bir yay animasyonuyla (`scale 0.84 -> 1`, `opacity 0 -> 1`, yumuşak dikey kalkış) açılır; kapanırken aynı eksende hızlıca toplanır.
   - Boş sohbette karşılama mesajının altında 3–4 adet hazır soru önerisi (*"Kargom nerede kaldı?"*, *"Fiat Egea ne zaman gelir?"*, *"Takip kodum çalışmıyor"*, *"Şefinle görüşebilir miyim?"*) görünür; tıklandığında anında mesaj olarak gönderilir.
   - Yanıt beklenirken Apple iMessage stilinde ritmik 3 noktalı yazıyor balonu görünür ve gelen mesaj yumuşak yay hareketiyle listeye eklenir.
3. **Özel Yönetici Arayüzü (`212.125.0.52`)**:
   - Sunucu isteğin `212.125.0.52` (veya ortam değişkenindeki yetkili IP) üzerinden geldiğini doğruladığında sağ alttaki buton yönetici rozetiyle ve aktif oturum sayacıyla görünür.
   - Pencere açıldığında genişletilmiş çift panelli konsol (`740px × 560px`) yaylı şekilde açılır:
     - **Sol Sütun (IP & Geçmiş Listesi)**: Üstte anlık IP/mesaj arama kutusu ve `Tümü / AI / Canlı / Kapalı` sekmeli durum filtresi yer alır. Her satırda ziyaretçinin **IP adresi** (hizalı monospace font ile), son mesaj özeti, mesaj adedi, saat bilgisi ve sade durum etiketi görünür.
     - **Sağ Sütun (Geçmiş & Canlı Müdahale)**: Seçilen IP'nin tüm mesaj geçmişi kronolojik olarak listelenir. Yönetici üstten seçili IP bilgilerini ve toplam mesaj sayısını görür; alttan tek tıkla **"Müşteri ile İletişime Geç"** diyerek stajyer yapay zekayı devre dışı bırakıp doğrudan yazışabilir veya konuşmayı sonlandırabilir.
   - Yönetici isterse üst çubuktaki geçiş butonuyla aynı pencere içinde pürüzsüz boyut geçişiyle (`layout` animasyonu) normal **Müşteri Görünümü**'nü de test edebilir.

### Görsel Kimlik & Tema Uyumu

- **Estetik Yönelim**: Mevcut Apple benzeri temiz, yarı saydam buzlu cam (`glass-dock`), tek seviye yüzey derinliği ve net tipografik hiyerarşi korunur.
- **Renk Paleti & Kontrast**: Mevcut açık/karanlık tema değişkenleri (`--background`, `--card`, `--secondary`, `--primary`, `--border`) eksiksiz kullanılır; 60-30-10 dengesi bozulmaz. Yönetici durum göstergeleri yalnızca renge bağlı kalmadan net Türkçe etiketlerle (`AI`, `Canlı`, `Kapalı`) eşleştirilir.
- **Tipografi & Hizalama**: Başlıklar `Plus Jakarta Sans`, sohbet metinleri `DM Sans`, ziyaretçi IP adresleri, zaman damgaları ve mesaj sayaçları ise dikey hizalamayı koruyan `IBM Plex Mono` (`tabular-nums`) ile sunulur.
- **Sade Metadata Disiplini**: Statik etiketlerde gereksiz kapsül/rozet yığınları veya süs amaçlı yanıp sönen noktalar kullanılmaz; etkileşimli filtreler temiz sekmeli kontrol (segmented control) olarak tasarlanır.

### Hareket & Mikro-Etkileşim Bütçesi

- Tüm hover ve açılış/kapanış geçişleri yalnızca GPU hızlandırmalı `transform` ve `opacity` özelliklerini kullanır; layout titremesi oluşturmaz.
- Rutin buton tepkileri `150–200ms` aralığında yerleşir; pencere snap animasyonu yüksek hızda başlayıp sekmeden pürüzsüz duran Apple yay eğrisiyle (`stiffness: 420, damping: 32, mass: 0.85`) çalışır.

---

## 3. Temel Ürün Kararları & Ödünleşimler

- **Karar 1 — Groq Üzerinde Tekrar Önleme & Akıllı Yedekleme**:
  - *Seçilen Yaklaşım*: Groq API çağrısında `temperature`, `frequency_penalty` ve `presence_penalty` değerleri çeşitliliği artıracak şekilde ayarlanır; sistem istemine oturumdaki son yapay zeka yanıtları *"bunları ve benzer kalıpları tekrar etme"* talimatıyla ve rastgele seçilen bir stajyer ruh hali/senaryo ipucuyla eklenir. Ayrıca API anahtarı eksikse veya servis geçici olarak yanıt vermezse, tek bir sabit cümle yerine oturumdaki önceki yanıtları hatırlayan ve müşteri mesajındaki konuya (kargo, selamlaşma, şikayet, şef talebi, Egea vb.) göre farklı yanıtlar seçen çok katmanlı bir yedek motor devreye girer.
  - *Neden*: Hem canlı Netlify ortamında Groq key ile gerçek LLM yaratıcılığı korunur hem de anahtar yokluğunda veya yoğunlukta kullanıcı hiçbir zaman aynı mesajı art arda görmez.
  - *Elenen Alternatif*: Tek sabit hata mesajı bırakmak (kullanıcının şikayet ettiği temel sorun) veya Groq'u tamamen kaldırmak (kullanıcı mevcut Groq yapısının korunmasını tercih etti).

- **Karar 2 — Sunucu Doğrulamalı IP Yetkilendirmesi (`212.125.0.52`)**:
  - *Seçilen Yaklaşım*: Yönetici IP kontrolü yalnızca sunucu tarafında (`212.125.0.52` varsayılan yetkili IP + isteğe bağlı `ADMIN_IP` ortam değişkeni desteği) yapılır. Oturum oluşturulduğunda müşterinin gerçek bağlantı IP'si sunucuda kaydedilir; IP listesi yalnızca yetkili yöneticiye döner.
  - *Neden*: İstemci tarafında IP gizleme veya taklit etme riskini önler; standart kullanıcılar diğer ziyaretçilerin IP adreslerine veya sohbet geçmişlerine erişemez.
  - *Elenen Alternatif*: Sadece tarayıcıda IP kontrolü yapmak (güvensiz ve üçüncü parti IP servisine bağımlı).

- **Karar 3 — Yerel Geliştirme & Netlify Uyumluluğu**:
  - *Seçilen Yaklaşım*: Netlify fonksiyonundaki tüm yeni IP, arama/listeleme ve çeşitlendirilmiş Groq mantığı yerel geliştirme ortamındaki `/api/support-chat` ara katmanıyla birebir senkronize edilir.
  - *Neden*: Hem canlı Netlify dağıtımında (Netlify Blobs kalıcı depolama) hem de geliştirme önizlemesinde (yerel JSON depolama) birebir aynı davranış sağlanır.

---

## 4. Teknik Mimari & Veri Stratejisi *(Teknik Referans)*

### Sistem Mimarisi & Bileşen İlişkisi

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                              İstemci Arayüzü                               │
│                                                                            │
│  ┌──────────────────────┐    ┌──────────────────────────────────────────┐  │
│  │ Manyetik Sarıcı      │───▶│ Yüzen Destek Butonu · Ortam Dock'u       │  │
│  │ (Spring Pointer FX)  │    │ Üst Menü Aksiyonları · Ana CTA Butonları │  │
│  └──────────────────────┘    └──────────────────────────────────────────┘  │
│                                            │ Tıklama (Apple Snap Spring)   │
│                                            ▼                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                   Müşteri Hizmetleri Penceresi                       │  │
│  │  ┌─────────────────────────────┐  ┌───────────────────────────────┐  │  │
│  │  │ Standart Müşteri Görünümü   │  │ Özel Yönetici Konsolu         │  │  │
│  │  │ · Hazır soru önerileri      │  │ (Yalnızca IP: 212.125.0.52)   │  │  │
│  │  │ · Apple yazıyor animasyonu  │  │ · Sol: IP Listesi + Arama +   │  │  │
│  │  │ · Canlı/AI mesaj akışı      │  │   Durum Filtreleri            │  │  │
│  │  └─────────────────────────────┘  │ · Sağ: Seçili IP Geçmişi +    │  │  │
│  │                                   │   Canlı Devralma & Yanıtlama  │  │  │
│  │                                   └───────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬───────────────────────────────────────┘
                                     │ HTTPS (/api/support-chat)
                                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     Sunucu Katmanı (Netlify + Yerel Dev)                   │
│                                                                            │
│  ┌───────────────────────┐   ┌──────────────────────────────────────────┐  │
│  │ IP Doğrulama & Rol    │──▶│ 212.125.0.52 / ADMIN_IP kontrolü         │  │
│  │ (Yalnızca Sunucuda)   │   │ Müşteri IP yakalama & yetki sınırı       │  │
│  └───────────────────────┘   └──────────────────────────────────────────┘  │
│                                            │                               │
│  ┌───────────────────────┐   ┌─────────────▼────────────────────────────┐  │
│  │ Oturum Deposu         │◀─▶│ Tekrarsız Stajyer AI Motoru              │  │
│  │ · Netlify Blobs       │   │ · Groq llama-3.3-70b-versatile           │  │
│  │ · Yerel JSON Yedek    │   │ · Dinamik senaryo + tekrar engelleme     │  │
│  └───────────────────────┘   │ · Bağlam duyarlı zengin yedek havuzu     │  │
│                              └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### Veri Modeli & Durum Yönetimi

- **Destek Oturumu (SupportSession)**:
  - `id`: Oturum kimliği.
  - `customerIp`: İsteği gönderen müşterinin sunucuda tespit edilen IP adresi (yalnızca yönetici listesinde görünür).
  - `customerLabel`: Kısa oturum etiketi (`Müşteri #XXXX`).
  - `status`: `"ai" | "admin" | "closed"`.
  - `messages`: Gönderen (`customer`, `ai`, `admin`, `system`), metin ve zaman damgası içeren mesaj dizisi.
  - `createdAt` / `updatedAt`: Sıralama ve geçmiş zaman bilgisi için ISO zaman damgaları.
- **İstemci Durumu**:
  - Yönetici görünümünde `searchQuery` (IP, etiket veya mesaj içi arama) ve `statusFilter` (`all | ai | admin | closed`) istemci tarafında anlık filtreleme sağlar; seçili oturum otomatik korunur ve 3 saniyelik arka plan yenilemesiyle senkron kalır.
  - Müşteri görünümünde hazır soru seçimi doğrudan mesaj gönderim akışını tetikler; yanıt beklenirken iyimser (optimistic) kullanıcı mesajı anında listeye düşer ve altında Apple yazıyor göstergesi belirir.

### Etkileşim & Hata Kurtarma Akışı

- **İyimser Mesaj Gönderimi**: Müşteri mesaj gönderdiğinde veya hazır soruya bastığında mesaj gecikmeden ekranda görünür, yazıyor göstergesi açılır; sunucu hatası olursa bildirim gösterilir ve mesaj metni kaybolmadan geri yüklenir.
- **Boş & Yükleme Durumları**: Yönetici listesinde aramayla eşleşen IP bulunamadığında *"Filtreye uyan IP bulunamadı — Filtreyi Temizle"* aksiyonu sunulur; henüz hiç sohbet yoksa bilgilendirici boş durum gösterilir.
- **Güvenlik & Veri Sınırları**:
  - `GROQ_API_KEY` ve yönetici IP listesi yalnızca sunucu tarafında tutulur; tarayıcıya hiçbir gizli anahtar sızdırılmaz.
  - Diğer kullanıcıların IP adresleri ve sohbet geçmişleri yalnızca sunucu tarafından doğrulanmış yönetici isteğine döner; standart müşteri isteklerinde IP listesi ve yönetici aksiyonları (`403`) engellenir.
  - Tüm kullanıcı mesajları uzunluk sınırından geçirilir ve güvenli React metin bağlamasıyla (ham HTML enjeksiyonu olmadan) ekrana basılır.
