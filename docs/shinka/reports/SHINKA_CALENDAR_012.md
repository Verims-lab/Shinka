# Takvim ve Döngü Yönetimi — Buildmarker-012 / HC-012.0

Takvim ekranı, ortak hesaplama ve işlem protokolü uygulanmıştır. **Üretimde ekleme, düzeltme, silme ve Takvim üzerinden yeni rıza kaydı kapalıdır.** Base44 koleksiyonlarını birlikte, kalıcı ve bağımsız worker’lar arasında atomik değiştiren bir yetenek doğrulanmamıştır. Okuma ve aylık gösterim kullanılabilir; etkin kayıt akışları izole test modeliyle sınanmıştır. Bu paket üretime hazır veya canlı doğrulanmış olarak işaretlenmez.

**014 güncellemesi:** OD-012 kullanıcı kararıyla kapandı ve ortak Home/Takvim hesaplamasında uygulandı. Son üç tamamlanmış aralık penceresi içindeki 15–60 değerler kullanılır; >60 gerçek tarihler korunur, eski aralıklarla örnek tamamlanmaz. Desteklenen örnek yoksa güncel tahmin/evre üretilmez; hiç tamamlanmış aralık yoksa başlangıç/28 davranışı sürer. Aşağıdaki 012 ölçümleri tarihsel teslim kanıtıdır. Güncel kapsam ve testler: [014 teslimi](SHINKA_CLOSURE_014.md). Üretim yazma blokajı devam eder.

## Kaynak ve kapsam

Başlangıçta temiz lokal Test/origin Test `f5fd7c4`, main `3c76cb4` idi. Main’in iki commit’i fast-forward ile Test’e ve lokale alındı; origin/Test eşitlendi. Sonraki değişiklikler bu paketindir. Main’e push veya Base44 publish yapılmaz.

On bağlayıcı canonical belge doğrudan okundu. SRC-01 §5, Calendar ve KK-15…20/29…30; SRC-02 UC-12/13/14/15/27; SRC-03 §5 ve companion tablo 8; SRC-04 §7; SRC-05 §5.3…5.7; SRC-07 özgün çalışma kitabı 05…08 sayfaları kullanıldı. Belgeler kaynak kanıtıdır; operasyonel yetki mevcut kullanıcı talebinden gelir.

| Sözleşme | Uygulama |
|---|---|
| Gerçek başlangıçlar | Yerel YYYY-MM-DD; backend IANA timezone ile bugünü belirler. Gelecek/geçersiz tarih, tekrar ve iki komşudan herhangi birine 15 günden az mesafe reddedilir. Bütün geçmiş dikkate alınır. |
| Tahmini uzunluk | Son üç gerçek aralık; bir değer diğer ikisinden en az 9 gün farklı ve kalan ikisi en fazla 3 gün farklıysa aykırı değer yalnızca tahmin ortalamasından çıkarılır. Gerçek kayıt korunur. 26/27/45 → 26.5 → half-up 27. |
| Eksik ayarlar | NULL korunur. 5/28 yalnızca hesaplama varsayılanıdır; alanlara veya ayar kaydına yazılmaz. |
| Fazlar ve ufuk | Tamamlanan gerçek aralıklar kendi uzunluklarıyla; mevcut/gelecek döngüler ortak tahminle hesaplanır. Son gerçek başlangıca bağlı mevcut döngü ve sonraki üç döngü kapsanır; aradaki tahmini geçmiş de temsil edilir. |
| Tahmin kaydı | `predicted_end_date` tüm döngünün dahil son günüdür; arayüz yalnızca MENSTRUAL bölümünü tahmini regl olarak boyar. |
| Son başlangıcın silinmesi | Tahmin/fazlar boşalır; ayarlar ve geçerli rıza korunur. Henüz üretilmemiş günlük içerik UNKNOWN yoluna gider. |

Altı kategori kararı, 260 içerik çifti, 240 eşleme, kaynak manifesti, 20 ürün şeması ve RLS değişmedi. Pattern, tam profil, bildirim ve scheduler eklenmedi. ON-05 için önceki `OPEN_PENDING_LIVE_SAVE_AND_READBACK` durumu sürer.

## Kullanıcı akışları ve modüller

`Calendar.jsx`, `CalendarMonth` ve `CalendarDeleteDialog` gerçek aylık ekranı oluşturur. Pastel pembe kayıtlı gün, lavanta tahmini gün, seçim halkası, ayrı kesikli klavye odağı ve erişilebilir tarih/durum etiketleri vardır. Tarihe dokunmak yalnızca seçer. Düzeltilecek ID ve yeni tarih ayrı tutulur; ay değişse de yanlış kayıt düzenlenmez. Silme yalnızca gerçek başlangıçta açılır; tarih ve tahmin etkisi açıklanır, ilk odak İptal’dedir. İptal/Escape yazmaz.

`calendarController` geçici seçim, düzenleme, işlem ve tekrar deneme durumunu yönetir. Bekleyen işlem ikinci gönderimi engeller. Kayıp yanıtta aynı action ID/payload tekrar kullanılır; hata doğrulanmış veriyi ve seçimi korur. Oturum/onam geçersizleştirmesi veya unmount sonrası eski yanıt ekrana geri dönemez. Tarayıcı kalıcı depolamasına sağlık verisi veya receipt yazılmaz.

`calendarService` mevcut SDK üzerinden yalnızca `calendar` fonksiyonunu çağırır; 20 saniyelik sınır ve doğrulanmış response sözleşmesi vardır. `calendarCopy` merkezi EN/TR metinleri kullanır; rıza kutusu önceki onaylı onboarding metnini aynen alır ve boş başlar.

`calendarOperation` kimliği authenticated backend’den türetir, dar payload kabul eder ve aktif hesap/onam/silme işi kontrollerini yapar. `base44CalendarReader` owner filtreli, alanları sınırlandırılmış sayfalar okur. Gün başına istek yoktur; geçmiş 100’lük sayfalarda, 2.500 başlangıç sınırı ve taşma tespitiyle alınır. Tek sayfalık geçmişte iki doğrulama turu toplam 22 SDK okuması gerektirir; bu canlı gecikme olarak ölçülmemiştir. 40.000 hesaplanan gün sınırı da açık hata verir; eksik geçmişle başarı dönülmez.

`calendarCalculation` saf hesaplama/validasyon, `calendarState` işlem planı ve commit doğrulamasıdır. Home ve Takvim aynı `dailyCycle` tahmin/faz fonksiyonlarını kullanır. Değişmeyen cache satırlarının ID/zamanları korunur ve bunlar da commit öncesinde doğrulanır. Günlük Shinka satırları planın girdisi veya çıktısı değildir; bugünün/geçmişin dört TR/EN snapshot’ı değişmez. Home’un rıza olayı okuması mevcut grant dönemini dikkate alır.

Home ve Calendar ortak `ProductNavigation` kullanır. Profile/You ve admin erişimi korunur; Calendar route’u durably completed aktif kullanıcıya açılır. Main’den gelen fakat route/import/dinamik kullanımda bulunmayan beş auth şablonu (`AuthLayout`, `Register`, `ForgotPassword`, `ResetPassword`, `OAuthConsent`) kaldırıldı; Apple/Google sözleşmesi korunur ve bu dosyalardaki tip hataları teslimi engellemez.

## Kalıcı tutarlılık: uygulanan sınır, kanıtlanmamış yetenek

Resmi Base44 [şema belgesi](https://docs.base44.com/developers/backend/resources/entities/entity-schemas#uniqueness) native UNIQUE desteği olmadığını belirtir. [SDK upsert](https://docs.base44.com/developers/references/sdk/docs/type-aliases/entities#upsert) eşleşen kaydın alanlarını birleştirir; bu, bütün ilgili koleksiyonları kapsayan bir transaction sözleşmesi değildir. [Actors](https://docs.base44.com/developers/backend/resources/actors/overview) belgesi de burada gereken ayrı Entity koleksiyonlarının tek commit’ini kanıtlamaz. Kaynaklar 2026-10-20’de kontrol edilmiştir.

`domainAtomic.commitCalendarAction` için gerekli `transactCalendar` sözleşmesi:

- Authenticated owner için bütün worker’larda aynı kalıcı işlem sınırı; tam güncel durumdan ACTIVE/onam/açık silme işi/referans/revision kontrolü.
- Gerçek kayıt değişikliği, tahmin/fazların yenilenmesi, gerekiyorsa rıza/olay ve owner/action receipt’in birlikte yayınlanması.
- Çakışan revision veya farklı payload ile aynı action ID kullanılması açık conflict.
- Kayıp yanıt sonrası receipt ile tekrar: yeni rıza zamanı, olay veya başlangıç üretmeden mevcut sonucu doğrulama. Daha yeni işlemle geçersizleşen receipt `CALENDAR_STATE_CHANGED` verir; silinmiş kaydı geri getirmez.
- Receipt’in hesaplama günüyle kalıcı cache doğrulanır. Sonraki gün tekrarında eski commit yeniden hesaplanmış gibi sunulmaz; ekrana yeni günün salt okunur projeksiyonu dönebilir.

Üretim entry’si bu adapter’ı sağlamaz: `writable:false`; doğrudan mutation çağrısı `CALENDAR_ATOMIC_CAPABILITY_REQUIRED` ile yazmadan reddedilir. UI’daki devre dışı buton backend kontrolünün yerine geçmez. Test fixture’ının ortak kuyruğu/Map receipt’i **platform transaction kanıtı değildir**. Yeniden okuma da snapshot isolation veya rollback sağlamaz.

Kapatma seçenekleri: bu kapsamı gerçekten destekleyen, belgelenmiş ve canlı sınanmış native transaction/conditional-write yeteneği; veya ayrıca onaylanacak authoritative transactional store ve migration/guard/crash-recovery tasarımı. İkinci seçenek Calendar, Home, onboarding, rıza ve silme işlemlerini aynı tutarlılık sınırına taşımalıdır. Gölge veritabanına yazıp ardından Base44’e ayrı çağrılar yapmak yeterli değildir. Bu görev dış servis oluşturmadı.

Yeni açık rızada zaman backend UTC iş saatidir; mevcut geçerli `granted_at` tekrar yazılmaz. Geri çekilmiş rızada yeniden izin için aynı owner’ın doğrulanmış tamamlanan silme işi, eşleşen withdrawal olayı ve artık sağlık kaydı bulunmaması gerekir. Kayıt silip baştan başlama çözümü önerilmez. Takvim’e giriş veya seçim rıza vermez.

## Health ve dokümantasyon

HC-012.0: 16 suite, **143 case = 125 current / 7 future / 11 external**.

| Değişiklik | Case |
|---|---|
| Aktifleştirilen | H08-002 tam geçmiş/tarih/başlangıç yaşam döngüsü; H11-002 kapsamlı Calendar reconsent kontrolleri. Eski placeholder ID’leri korunur. |
| Eklenen sentetik | H08-004 atomic protokol; H12-027 owner/onam/eski yanıt; H13-015 aylık UI/erişilebilirlik. |
| Eklenen açık blocker | H08-005 production atomicity; H08-006 OD-012 ürün kuralı. |
| Eklenen external | H08-901 hosted mutation/readback kabulü. |
| Güncellenen | H08-001/003 ortak hesaplama; H05-009/HC12 paket 012 staged content ve 013 sınırı; H13-008 ortak Home/Calendar navigasyonu; H13 kaynak taramasının Calendar kapsamı. |
| Silinen | Yok. H13-008’in eski Home-only araması yeni ortak bileşen nedeniyle FAIL verdi; kontrol yeni sorumluluk yerine taşınarak korundu. |

SOURCE_OF_TRUTH, BUSINESS_FLOW, UI_UX_STANDARDS, DATA_MODEL, CONTENT_MODEL, TECHNICAL_ARCHITECTURE, SECURITY_PRIVACY, CODE_STANDARDS, DEVELOPMENT_RULES, RELEASE_HEALTH_CHECK ve DEVELOPMENT_NOTES güncellendi. BUILD_HISTORY aynı ledger’dan üretildi; Internal Build son beş farklı paket olan 008…012’yi tutar. Kullanıcı/Health/audit kayıtları bu politikaya dahil değildir.

Final yerel ölçüm ve test kanıtları [verification.json](calendar-012/verification.json) ve [mobil uyumluluk raporundadır](SHINKA_ANDROID_IOS_COMPATIBILITY.md#buildmarker-012-calendar-extension). Bunlar deployed Full Health veya fiziksel cihaz sonucu değildir.

## Çalıştırılan kontroller

| Kontrol | Gerçek sonuç |
|---|---|
| Chromium 156.0.8078.4 ve WebKit 27.2 | Her birinde 376/376 canonical PASS; önceki 349 korunur, CA01…23 ve CU01…04 eklenir. |
| Yerel Health | Her birinde 54 genel + 21 onboarding + 9 daily + 5 Calendar = 89/89 PASS. Açık production blocker ve external case’ler bu sayıya dahil değildir. |
| Gerçek App, izole SDK | Her birinde 17 admin, 8 routing/Preview, 5 mobile, 5 daily ve 6 Calendar senaryosu PASS; sıfır page exception. |
| Temiz kurulum / bağımlılıklar | `npm ci`, `npm ls --depth=0`, `npm ls --all` PASS; paket/lock değişmedi. Platforma bağlı optional paketlerin eksik gösterilmesi hata değil. |
| Typecheck / lint / build | PASS. Mevcut npm ayar uyarısı ve lazy Health chunk/mixed-import uyarıları sürer; build başarısızlığı değildir. |
| Repo Health / history | 16/16 PASS; üretilen history beş farklı paket 008…012 ile uyumlu. |
| Performans | Üretim ilk JS 460.387 raw / 149.852 gzip byte; CSS 85.910 / 14.752. Değişmeyen bütçeler PASS. Calendar lazy chunk 16.973 / 6.139. |
| Güncel güvenlik taraması | **BLOCKED_TLS_CERTIFICATE_CHAIN**. `npm run security:deps` ve `npm audit --json`, resmi npm endpoint’inde `unable to verify the first certificate` hatasıyla sonuçlanamadı. |
| Hosted / fiziksel cihaz | Çalıştırılmadı; PASS iddiası yok. |

Sertifika doğrulaması kapatılmadı; sistem/kullanıcı güven deposu ile tekrar denemek de taramayı tamamlamadı. Kalıcı npm veya trust ayarı değiştirilmedi. Önceki 011 audit’inin 0 Critical / 0 High / 2 Moderate sonucu tarihsel kanıttır; 012 için güncel sayı olarak kullanılamaz. Güvenilir TLS erişimi düzeldikten sonra iki güvenlik komutu yeniden çalıştırılmalı, güncel advisory ve dependency path’leri incelenmelidir. Bu eksik nedeniyle repository kapanışı da koşulsuz PASS değildir.

Son inceleme ayrıca bozuk eski cache zamanının commit sonrasında fark edilmesi riskini giderdi: yeniden kullanılan türetilmiş satırlar da plan aşamasında doğrulanır, hata bütün önceki koleksiyonları korur. CA17 bunu timezone içermeyen cache zamanı ile sınar. CA11 başka owner’ın withdrawn consent nesnesinin yeniden rıza yolu üzerinden kabul edilmesini reddeder. Bunlar canlı veri düzeltmesi değildir.

## Publish sonrası kabul

1. Main merge ve Base44 sync/publish kullanıcı tarafından yapılır. Güncel devam paketi **Buildmarker-014 / HC-014.0** ve `calendar` fonksiyonunun dağıtımını doğrulayın; [014 yayın adımlarını](SHINKA_RELEASE_ROLLOUT_014.md) izleyin. Mevcut kullanıcıyla aylık kayıtları, TR/EN, ay değişimi, Profile/admin ve Home dönüşünü kontrol edin. Şu an beklenen sonuç: değişiklikler kapalı; giriş/seçim yeni onam veya sağlık kaydı oluşturmaz.
2. Ürün kuralı/atomiklik/güvenlik doğrulaması kapandıktan ve gerçek adapter yayımlandıktan sonra, amaç için ayrılmış aynı test hesabında **ekle → yeniden aç → aynı ID ile düzelt → silmeyi iptal et → sil → son kaydı sil**. Önce/sonra owner kapsamlı backend okumasıyla kayıt sayısı/referanslar ve türetilmiş verileri doğrulayın. NULL ayar ve mevcut grant zamanı korunmalı.
3. Kayıp yanıt/yenileme/iki sekme/bağımsız worker tekrarlarını gerçek mekanizmada sınayın; tek etkili işlem ve doğru conflict bekleyin. Aktif olmayan, onamsız, silme işi süren ve diğer owner erişimleri reddedilmeli. Rıza geri çekilirken bekleyen eski yanıt sağlık verisini geri göstermemeli.
4. Son kayıt silindikten sonra tahmin/fazlar sıfır, ayarlar aynı olmalı. Önceden kaydedilmiş bugünün Home ID/Pair/dört snapshot’ı aynı kalmalı; yalnızca henüz üretilmemiş günlük hesaplama UNKNOWN kullanmalı.
5. Android Chrome ve iPhone Safari’de native tarih seçici, klavye, safe area, dönüş/arka plan ve ekran okuyucuyla gerçek cihaz kabulünü yapın. Sonra deployed **Full Health → kaydet → listele → özel raporu tekrar aç**. H08-005/H09-004 canlı yetenek kanıtı olmadan PASS yapılmamalı; H08-006 onaylı OD-012 davranışını çalıştırarak doğrular ve üretim persistence engelini kapatmaz.

ON-05 için aynı yarım kalmış hesapla `saveCycle` başarı yanıtı ve consent/event/period/settings readback’i ayrıca [önceki incident adımlarıyla](SHINKA_ON05_CONSENT_RECOVERY.md) doğrulanmalıdır. Bu paket o olayı kapatmaz. Kanıtlarda token veya tam sağlık kaydı yerine gerekli ID/sayı/durum özeti kullanın.


## 014 teknik kapanış devamı

CR01…CR07 / CU05, eski CA02 üst-aralık ret beklentisinin yerine onaylı davranışı doğrular; case silinmez. Geçerli uzun ekleme/düzeltme planı oluşur, destek dışı kapanmış aralığa faz yazılmaz, eski güncel tahmin/fazlar yerine yeni sonuç konur. Home aynı hesaplamayı kullanır; mevcut günlük kayıt değişmez. H08-006 artık davranış çalıştıran sentetik kontroldür. H08-005 gerçek üretim persistence eksikliği nedeniyle BLOCKED kalır.

Güncel güvenlik taraması 0 Critical/High, 2 Moderate ile tamamlandı; yukarıdaki 012 TLS blokajı o çalıştırmanın tarihsel sonucudur. Üretim çözümü seçenekleri, tek yetkili veri modeli ve onay gereksinimi [karar belgesinde](SHINKA_PERSISTENCE_DECISION_014.md); mevcut uygulamada yapılabilen somut şema/import kontrolleri [yayın belgesinde](SHINKA_RELEASE_ROLLOUT_014.md). Hiçbir canlı Calendar mutasyonu veya publish yapılmadı.
