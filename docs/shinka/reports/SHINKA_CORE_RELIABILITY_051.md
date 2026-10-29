# Shinka — Core Reliability & Performance Milestone

Buildmarker-051 / HC-050.0 · 29 Ekim 2026 · Test teslimi. Main/publish yapılmadı.

**Yerel düzeltmeler doğrulandı; hosted bakım kısmi.** 048–050, açık tema varsayılanı, doğrulanmış Profil tercihi, arka planlar, kapalı bildirim/scheduler ve ertelenmiş 12 bulgu korundu. Eski FAIL/NOT_RUN sonuçları silinmedi. Kanıtlar [051 kayıt dizininde](core-reliability-051/); aşağıdaki hosted ve yerel sonuçlar birbirinin yerine geçmez.

## Başlangıç ve yetki

- Başlangıç local/Test `6825bf3`; main `5ebc6ce`. Test, main'e çatışmasız fast-forward edildi; mevcut Base44 mobil değişiklikleri ve 049 entegrasyonu korundu.
- Gerçek uygulama `6ad5190f4845d4e3af03b420`, yayın `https://shinka-rhythm-flow.base44.app/`, gözlenen frontend **050/HC-049.0**. Git Test/Preview ayrı veri alanı değildir.
- Korunan native kimlik `6ad519134845d4e3af03b423`: güncel admin/ACTIVE doğrulandı; e-posta yalnız yetkili UI'da eşleştirildi, yetki ölçütü yapılmadı. Hesap/onam/profil sıfırlanmadı veya silinmedi. Son migration verify isteği de güncel admin/ACTIVE denetiminden geçerek 200 döndü.
- Base44 Code ekranında `internalHealth` entry'si ve mevcut native/shared bağlantıları görüldü; nativeReadiness `BASE44_NATIVE_V1 / native-continuation/2`, beş operasyonel tablo okunabilir. Tam yayımlanmış source hash eşitliği kanıtlanmadı. `hostedMutationVerified:false` başarısızlık sayılmadı.
- Başlangıçtaki kayıtlı **153 PASS / 0 FAIL / 0 BLOCKED** rapor kullanıldı; yeni canlı Full Health veya Security scan başlatılmadı. [Başlangıç](core-reliability-051/hosted-baseline.json).

## Bulgu → düzeltme → kanıt

| Bulgu ve doğrulanan neden | Düzeltme | Gerçek kanıt / sınır |
|---|---|---|
| Saklanan Pattern sekmesi geri açıldığında `onShown` yalnız boş themes değerinde yeniliyordu; gizliyken atlanan polling sonrasında eski kart kalabiliyordu | Mevcut controller ile background refresh; kartlar korunur, mevcut coalescing kullanılır | PU08 önce FAIL, sonra PASS; PF03 100 hata/toparlanma döngüsü, 10 mount, sabit istek/listener/timer sayıları. 049 canlı yüklenmeme olayının nedeni olduğu kanıtlanmadı |
| Health listesi 20 tam satırı, kullanılmayan büyük `report_json` ile taşıyordu | 11 kullanılan alana projection; tek sınırlı sorgu | HR07 + eş araçlı 10/1000 satır ölçümü; 1000 satır senaryosunda yanıt 304640 → 2290 byte. Hosted hız kazanımı değildir |
| Internal Build'de geçmiş `*_updated` kayıtları `*_changed` olarak okunup undefined görünüyordu | Bilinen iki alan adını okuyup eksik kanıta `NOT_RECORDED` göster | Canlı önceki undefined gözlemi, HR06 ve H01-006; bilinmeyen geçmiş sonuçlar true yapılmadı |
| Günlük alan temizliği aktif silmeyle birlikte tamamlanmış silmenin kalıcı işaretine de takılıyordu | Sadece COMPLETED DELETE_USER + native User yokluğu halinde dört alanın kaldırılmasına izin; bütün normal ürün yazıları tombstone korumasında | ID13: aktif iş, yeniden oluşmuş User ve normal ürün yazısı reddedilir; ID/atama/tombstone korunur. Gerçek internalHealth TS entry sınırı ayrıca test edildi. Yeni kod hosted değil |
| Son beş Health raporunu koruyan bakım yolu yoktu | Ayrı küçük `healthRetention` modülü, kapalı dispatch, tam keyset envanter, ≤25 incelenmiş ID, digest, her silme öncesi yetki/fingerprint/koruma kontrolü, bağımsız yokluk okuması | HR01–07, H17-001…004; gerçek modül izole fixture üzerinde. Hosted dryRun 400 INVALID_INTERNAL_ACTION: yayın gerekiyor |
| Kullanılmayan sidebar ve tek tüketicisi olduğu mobil hook kalmıştı | 626 + 19 satırlık iki modül ve eski Tailwind istisnası kaldırıldı | Route/import taraması ve önceki üretim bağımlılık grafiğinde yoklar; başlangıç bundle'ına hız kazancı atfedilmedi |

[İlk başarısızlıklar ve düzeltme gerekçeleri](core-reliability-051/initial-failures.json) korunmuştur. Test fixture'ındaki eski `list` beklentisi, `about:blank` üstünde test storage erişimi ve INCOMPLETE retention boşluğu da saklanmıştır; uygulama hatası gibi sunulmaz.

## Dört kritik akış

| Akış | Yerel gerçek uygulama + izole IO | Yayımlanmış 050 gözlemi |
|---|---|---|
| Onboarding | Beş adım, geri/ileri/reopen, isim/Skip, 18+, DOB-only, NULL saat/yer, saat klavye/seçici/iptal, GeoNames arama-seçim-kayıt, ayrı onam/opsiyonel döngü, kayıp yanıt/same intent ve ilk Home regresyonları PASS | Korunan hesabı resetlemedim. Yeni hesapla canlı onboarding/onam testi NOT_RUN; provider trafiği üretilmedi |
| Home | Soğuk/tekrar açılış, aynı günlük ID, güncel MessagePair, hata/Retry, gün ve hesap değişimi/late response PASS | Gerçek iki içerik kartı açıldı; üç tekrar açılışta aynı günlük ID. “Hello” hazır içerik ölçütü sayılmadı |
| Pattern | Pencere/kategori/Home tutarlılığı, bağımsız hata/Retry, güncel evre/ilk gelecek Dolunay, read-only ve dönüşte freshness PASS | İki tema bölümü ve Ay bilgisi açıldı; 360 px'de yatay taşma yok. Yeni PU08 düzeltmesinin hosted kabulü yayın sonrası |
| Calendar | Ekle/düzelt/iptal/sil/son kayıt, gelecek tarih/15 gün/>60 gün, ay/taslak/pending, kayıp ACK, aynı action ID, iki istemci ve ortak Home hesapları PASS | Takvim ve ay kontrolleri açıldı, 360 px'de yatay taşma yok. Korunan hesabın sağlık verisine test yazımı yapılmadı |

Her iki motorda TR/EN, 87 mobil layout ve 150 mobil deneyim kontrolü; sheet klavye/Escape/geri/focus, 200% metin, kaydetme/iptal/unknown ve hesap sınırları çalıştırıldı. You tema seçimi gerçek yayın UI'sında değiştirilip Escape ile iptal edildi: kayıtlı Light ve tetikleyici odak korundu; save yapılmadı. Sağlık verisi gösteren canlı Calendar ve kişisel Pattern geçmişi görüntüleri Git'e alınmadı.

Gecikmiş/hiç dönmeyen yanıt, 429/503, offline→online, çift aksiyon, bağımsız istemci, logout/hesap değişimi ve geç yanıt kapsamı tam koşuda korundu. PF03 controller/lifecycle kaynak sayımıdır; işletim sisteminin tüm promise/heap grafiğini ölçtüğü iddia edilmez. Gerçek cross-document geri/ileri denemesi iki motorda belgeyi yeniden yükledi: `pageshow.persisted=true` gözlenmedi, **BFCache restore NOT_RUN**. Sentetik pageshow/pasif focus kontrolleri ayrı PASS; fiziksel arka plan, WebView donması ve native geri kabulü açık.

## Performans

**Hosted:** [Tek cache-disabled ağ örneği](core-reliability-051/hosted-network-baseline.json): applicationSession 880 ms, onboarding 1110 ms, dailyMessage 1550 ms; DCL 2180 ms, load 2900 ms. Görülen en uzun uygulama isteği dailyMessage'dır; request ID/alt DB aşaması yakalanmadığından kesin backend kök nedeni çıkarılamaz. Yaklaşık yanıt transferleri 800/1100/1300 byte. Tüm 41 istek/11.4 MB tarayıcı eklentilerini de içerir; Shinka maliyeti diye raporlanmaz.

Home/Pattern/Calendar saklanan kartlarına üçer gerçek geçişin UI otomasyonu üst sınırları (medyan/en kötü): **108/135, 93/101, 68/170 ms**. Taze backend içerik zamanı değildir. Üç gerçek Home reload gözlemi **6802, 5171, 6852 ms**; model/tool aralarını içerir, sayfa yükleme metriği veya önce–sonra hız karşılaştırması değildir. Günlük ID üçünde de aynı. [Geçiş](core-reliability-051/hosted-retained-transitions.json), [reopen](core-reliability-051/hosted-reopen.json).

DevTools Performance kayıt girişimleri sekmeyi about:blank'a götürdü/bağlantıyı kaybetti; geçersiz kayıtlar kullanılmadı. Hosted **LCP/INP/CLS ve feedback/content/interaction süreleri NOT_RUN**. Bu açık ölçüm, 049 aralıklı olayını kapanmış saymayı engeller. 051 yayımlanmadığından hosted kod öncesi/sonrası yok; 12 satırdaki veri temizliğinin gecikmeyi azalttığı da iddia edilmez.

**Eş koşullu yerel karşılaştırma:** 050 `5ebc6ce` ve 051, aynı sentetik HTTP/veri; 5 soğuk context, 60 geçiş, 390×844, CPU 4×, API 200 ms, asset 40 ms. Aynı mevcut 76644-byte görsel/hash kullanıldı; dış fontlar iki tarafta da engelli. Tam saha testi veya HTTP-cache sıcaklık testi değildir.

| Ölçüm (ms, medyan / en kötü) | 050 | 051 |
|---|---:|---:|
| Home soğuk gerçek içerik, n=5 | 920.5 / 1108.8 | 921.4 / 1080.6 |
| Home taze sonuç yerleşimi, n=15 | 280.7 / 283.1 | 280.4 / 281.9 |
| Pattern taze sonuç yerleşimi, n=15 | 281.6 / 349.5 | 280.8 / 347.7 |
| Calendar taze sonuç yerleşimi, n=15 | 281.7 / 374.7 | 281.4 / 370.5 |
| You taze sonuç yerleşimi, n=15 | 281.9 / 342.4 | 281.0 / 331.0 |

Anlamlı ekran hız artışı kanıtlanmadı. Saklanan değer görünürlüğü yaklaşık 31 ms iken yeni yanıtın yerleşmesi yaklaşık 281 ms; ayrım ölçüm dosyalarında açık. Soğuk Home LCP medyanı iki tarafta 604 ms, CLS 0; gözlenen EventTiming maksimumu 56 → 48 ms, **saha INP/p95 değildir**. Geçiş pencerelerinde 50 ms üstü görev gözlenmedi. [Ham güvenli örnekler ve koşullar](core-reliability-051/performance-comparison.json).

**DB/SDK ölçümü:** Tek örnekli izole transport sayımı; gerçek server süresi/kredi değildir. Home ilk/yeniden 58/13 okuma, Calendar 39, Pattern themes/lunar 18/16, You 18; önce/sonra aynı. Owner/onam/lifecycle kontrolleri hız için kaldırılmadı. History listesi 10/1000 satırda bir sorgu/≤20 sonuç: yanıt **152310→1140 / 304640→2290 byte**. Domain 100/101 sınırı ve 240 mapping; ID batch/pagination testleri gizli kesilmeyi doğrular. [Önce](core-reliability-051/data-before.json), [sonra](core-reliability-051/data-after.json).

Üretim bütçeleri ve import cycle kontrolü PASS; başlangıç JS yaklaşık 475 KB / 158 KB gzip, CSS yaklaşık 79 KB / 14.5 KB gzip. Kesin son sayılar execution kaydında. Büyük Health/test chunk'ları başlangıç bağımlılıklarına taşınmadı. [Mimari envanter](core-reliability-051/architecture.json): onboarding UI 301 satır, AuthContext 180; 3549 satırlık onaylı içerik referansı uygulama karmaşıklığı sayılmadı. Genel cache/router/DB katmanı veya gereksiz dosya bölme eklenmedi. Kalan auth şablonları platform slotlarıdır; tüm repo için sıfır dead-export iddiası yok.

## Gerçek DB bakım sonucu

[26 tablo toplamı](core-reliability-051/hosted-table-counts.json): daily 18, Health 53, AdminTestOperation 7, audit 37, CalendarAction 3; içerik 6 kategori/240 eşleme/260 çift/103 mevcut Moon satırı. 103 yükleme hedefi olarak kullanılmadı. Diğer sayımlar dosyada; bunlar her ürün satırının referans denetimi anlamına gelmez.

045 akışı mevcut yetkili Test Function'dan yürütüldü: tam dryRun → yeni incelenmiş digest'ler → yedi sıralı sınırlı grup → tüm sayfalarda son verify. Busy hedefte duruldu; hedef değiştirilirken yeni plan alındı.

| | Önce | Sonra |
|---|---:|---:|
| Günlük native kayıt | 18 | 18 |
| Dört eski alanın toplam varlığı | 72 | 24 |
| Alanları doğrulanmış temiz kayıt | 0 | 12 |
| Lifecycle nedeniyle bekleyen | — | 6 |
| NotificationDelivery bağlantısı | 0 | 0 |

Bütün 18 native ID, atama digest'i ve bağlantı digest'i aynı. Son verify **200, hasMore=false, clean=false**. [Mutasyon özeti](core-reliability-051/daily-cleanup.json), [son okuma](core-reliability-051/daily-final-verify.json). Kalan beş satır üç aktif silmeye; bir satır tamamlanmış silmeye bağlı. 051 terminal-owner düzeltmesi henüz dağıtılmadı. Aktif işleri/tombstone'ları silerek bypass yapılmadı. **Dört alan opsiyonel şemada kalır; final schema/generator/inspector/D23 temizliği tamamlanmadı.**

Health Dashboard envanteri kaydırılarak **53 benzersiz run** ile tamamlandı: **50 benzersiz özel dosya referansı**, 3 eski inline rapor. Başarısız eski raporlar dahil tüm satırlar yerinde. Yeni retention endpoint'i current yayınında yok: dryRun **400 INVALID_INTERNAL_ACTION**, request ID `9435ad66-171f-4c3b-ad7e-99dc97d29a0d`, OPERATION/262 ms. **0 Health satırı / 0 dosya silindi.** [Envanter](core-reliability-051/health-hosted-inventory.json), [yanıt](core-reliability-051/retention-hosted-availability.json).

Retention son beşi canonical `completed_at` UTC/offset zamanına göre sıralar; PASS, FAIL/BLOCKED sonuçlarını seçici biçimde gizlemez. INCOMPLETE, geçersiz/eksik rapor zamanı/ID, çakışan run ID ve açık recovery ID'leri korunur. Canlı 20-satır örneğinde native `created_date` timezone'suz, completed_at açık timezone'ludur; native değere Z eklenmez ve cihaz timezone'u kullanılmaz. [Metadata kanıtı](core-reliability-051/health-native-time.json).

**Apply önkoşulu:** Health save yazıcıları durdurulup uçuşta istekler drain edilir; bütün açık/pending kurtarma run ID'leri `protected_run_ids` ile verilir. Bu koşullar doğrulanamıyorsa yalnız dryRun. `writers_drained:true` operatör beyanıdır, dağıtık kilit değildir. Her hedef öncesi tam güncel envanter, yetki ve fingerprint tekrar doğrulanır; kayıp ACK'de ayrı okuma yapılır. Kesintide aynı ID listesi için tekrar dryRun alınır; temizlenen/olmayan hedef yeni kayda dönüşmez.

Kurulu SDK'da doğrulanmış özel dosya silme yolu yok; yeni kod da dosya silmez, `NOT_SUPPORTED_BY_VERIFIED_SDK` döndürür. Retained dosya referansları korunur; özel URI/token rapora taşınmaz. Yedi operasyonun dördü aktif, ikisi kalıcı DELETE tombstone, biri completed reset; audit/receipt bağımlılıkları nedeniyle yaşları tek başına silme gerekçesi değildir. Ürün döngü geçmişi/daily atamaları/shared kaynaklar ve bu bağlı operasyonlar korunmuştur.

## Health, execution ve yayın

**6 eklenen / 5 güncellenen / 0 silinen case; 1 yeni suite.** Yeni H15-005/006, H17-001…004. Güncellenen H01-006, H05-009, H09-007, H13-017, H15-002. **185 toplam = 159 in-app + 12 yerel + 14 external**; 200-case sınırı korunur. H16, H17 dahil normal sonuçlardan sonra çalışır. Normal Health yalnız izole retention fixture'larını mutasyona uğratır.

Chromium/WebKit tam koşuları 745/745, sıfır page error; saklama/list/open/retry UI'sı doğrulandı. Yerel in-app: **146 PASS / 0 FAIL / 13 hosted-prerequisite BLOCKED**. Bu 13 sonuç yayımdaki eski içerik/readiness sorunlarını yeniden açmaz; sentetik runner canlı backend kanıtını taklit etmez. Son H17 zaman sözleşmesi dahil son kaynaklarla iki tam koşu tekrar doğrulandı. Gerçek 185 case/helper eşlemesi [case-audit](core-reliability-051/case-audit.md) ve JSON kaydındadır. npm ci/tree/audit (0 açık)/security:deps/typecheck/lint/build/repo/recordBuild ve mevcut byte/cycle kapıları çalıştırıldı. [Execution](core-reliability-051/execution.json), [Chromium](core-reliability-051/browser-chromium.json), [WebKit](core-reliability-051/browser-webkit.json).

051 tek milestone'dur; recordBuild ile aktif son beş **047–051**. Bildirim/scheduler enabled:false, fiziksel native/workflow H14-901/H16-901 ve 12 ertelenmiş güvenlik bulgusu açık.

**Senden gereken tek yayın adımı:** Test'i mevcut main → Base44 GitHub sync → publish akışınla yayınla. Özellikle internalHealth entry, tüm değişen shared modüller, Health plan/catalog ve frontend birlikte gelmeli. Şema değişikliği/push gerekmez; opsiyonel dört alanı şimdi kaldırma.

Yayın sonrasında aynı yetkiyle yapılacak bakım:
1. 051/HC-050.0 ve admin/app doğrulaması; nativeReadiness salt okunur kontrolü.
2. `internalHealth` Test Function: `{"action":"dailyReferenceMigration","request":{"action":"dryRun"}}`; yeni reviewed_digest ve ≤25 IDs ile applyBatch; aktif deletion hedeflerini bypass etmeden mevcut operation ID'leriyle tamamlanma/çatışma durumunu ayrı çöz. Her sayfada verify, aynı assignment/link digest'leri, sıfır legacy alan olmadan final şemaya geçme.
3. Health yazıcıları durdurulup recovery ID'leri belirlendikten sonra `{"action":"healthRetention","request":{"action":"dryRun","protected_run_ids":[]}}` (listeyi gerçek açık ID'lerle doldur); incelenmiş IDs/digest ve `writers_drained:true` ile applyBatch; tam verify. Boş liste otomatik varsayım değildir. Dosyalar, doğrulanmış platform silme yöntemi gelene kadar tutulur.
4. Yayın sonrası tekrar performans kaydı ve gerçek BFCache/background/Android-iOS wrapper kabulü. 049'un aralıklı canlı olayı, request-ID/alt aşama kanıtı ve gerçek ölçüm gelmeden kapatılmaz.

Resmî dayanaklar: [Playwright isolation/assertions](https://playwright.dev/docs/best-practices), [Web Vitals lab/field ayrımı](https://web.dev/articles/vitals), [BFCache persisted kontrolü](https://web.dev/articles/bfcache), [Page Lifecycle](https://developer.chrome.com/docs/web-platform/page-lifecycle-api), [OWASP iş akışı yetkisi](https://cheatsheetseries.owasp.org/cheatsheets/Business_Logic_Security_Cheat_Sheet.html), [Base44 entity API](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities), [W3C görünür odak](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum). Güncel doküman, kurulu SDK kabiliyeti veya fiziksel cihaz kanıtı yerine kullanılmadı.

![Yayımlanmış 050: 360 px Home, gerçek içerik; 051 yayın kanıtı değildir](core-reliability-051/hosted-home-mobile.jpg)
