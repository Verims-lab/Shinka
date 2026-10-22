# Shinka — Android/iOS native bildirim hazırlığı 032

**Paket:** Buildmarker-032 / HC-032.0
**İnceleme tarihi:** 2026-10-22
**Durum:** Hazırlık tamamlandı; platform sözleşmeleri ve fiziksel kabul açık. Cihaz adımları **NOT_RUN**.

## 1. Kaynak, kapsam ve kararlar

Başlangıçta çalışma ağacı temiz, Test/origin Test `b4b654f6259af8d1e0c7b856d47fe49c6be93a77` idi. PR #33 kullanıcı tarafından `0a8b1e8baba8881434e46c8ad6057d3031cd8859` ile main'e birleştirilmişti; iki kaynak ağacı aynıydı. Test güvenli fast-forward ile bu merge kaydına getirildi. 032 boştu; kullanıcı/Base44 değişikliği ezilmedi.

Bu paket kurulum envanteri, uygulanabilir kullanıcı rehberi ve cihaz kabul planıdır. İncelenen uygulamada somut davranış hatası bulunmadı. You/Profil, ortak günlük motor, bildirim backend'i ve test kodları korunur. Kod farkı yalnız sürüm/katalog/içerik politikası metadata'sı ve iki dış kabul case'inin açıklamasıdır. 032, mevcut doğrulama koşullarını değiştirmeden açık içerik allowlist'ine eklenir; import yapılmaz. Firebase yalnız Base44 Android push hazırlığı içindir; Shinka kimliği/verisi/backend'i Base44'te kalır.

Önceki standartlarla uzlaştırma: bağımsız hesap/anahtar/build **hazırlığı**, iki teknik sözleşmenin yanıtını beklemek zorunda değildir. Eski “önce sözleşme, sonra APNs/Firebase” sıralaması bu hazırlığı engellemez; gönderimin açılması hâlâ engellidir. Aynı yetkili admin'in elle çağrısını workflow'dan ayırmak ürün şartı değildir; güvenli otomatik çağrı sözleşmesi şarttır. Browser/PWA izni native kanıt değildir. Genel mobil davranış standardı [mevcut Android/iOS raporunda](SHINKA_ANDROID_IOS_COMPATIBILITY.md) kalır; [029/030](SHINKA_NOTIFICATIONS_029.md) ve [031](SHINKA_NOTIFICATION_PERFORMANCE_031.md) kanıtları silinmez.

## 2. Hassas olmayan envanter

Durumlar yalnız yazılan kapsam için geçerlidir. “Bilinmiyor”, “yok” demek değildir. Dashboard salt okunur gezildi; form açmak build başlatmak değildir. Hiçbir toggle/alan değiştirilmedi, dosya seçilmedi, kaydetme/üretim/yayınlama yapılmadı.

| Madde | Durum | Gözlem / kalan bilgi |
|---|---|---|
| Base44 kimlik/veri/backend otoritesi | **Doğrulandı** | Mevcut SDK client, backend fonksiyonları ve repo sözleşmesi. Yeni Firebase Auth/veritabanı yok. |
| Kayıtlı bildirim tercihi, bilinmeyen native izin/destek, bekleyen gönderim kurulumu | **Doğrulandı** | NotificationStatus ve merkezi TR/EN sözlüğü ayrı durumlar gösteriyor; bilinmeyen durumdan alım garantisi çıkmıyor. |
| Gerçek girişin kapalı olması | **Doğrulandı** | notificationSchedule entry `enabled:false`; yetkili admin için DISABLED/processed:0 sözleşmesi korunuyor. |
| Apple/Google giriş ayarı | **Doğrulandı** | Settings → Authentication: Apple ve Google açık; Google “Use the default Base44 OAuth”. Bu ayar gözlemi fiziksel giriş testi değildir. |
| Native hazırlık menüleri | **Doğrulandı** | Publish menüsü → Mobile app → Build Stores Files; iOS/Android formları açılıp kaydetmeden kapatıldı. |
| Açılan iOS formunun hazır olması | **Eksik olduğu doğrulandı — yalnız form** | Issuer ID, Key ID, Team ID boş; API Key dosyası seçili değil; Continue pasif. Hesabın/anahtarların başka yerde bulunmadığı sonucu çıkarılamaz. |
| Doğrulanmış JS native izin/kayıt arayüzü | **Eksik olduğu doğrulandı — incelenen repo/SDK sözleşmesi** | Kurulu 0.8.57 tiplerinde ve incelenen resmî kaynaklarda kullanılabilir wrapper permission/token API'si bulunmadı; platformda hiç olmadığı iddia edilmiyor. Uydurma bridge eklenmedi. |
| iOS bundle ID / Android package name | **Bilinmiyor** | İncelenen repo ve açılan formsal aşamada görünmüyor. Base44 app ID'si veya web alan adı bunların yerine kullanılamaz. |
| Apple Developer/Play Console üyeliği, yetkiler, ücretli plan | **Bilinmiyor** | İlgili hesaplara girilmedi, satın alma yapılmadı. “Upgrade” düğmesi tek başına mevcut planı kanıtlamaz. |
| APNs, App Store Connect API anahtarı, Firebase projesi ve iki dosyası | **Bilinmiyor** | Anahtar/hesap içerikleri açılmadı. Her iki açılan formda “Add push notifications” kapalıydı; yeni form varsayılanı kalıcı push yapılandırmasının yokluğunu kanıtlamaz. |
| Google Play imzalama parmak izleri | **Bilinmiyor** | Play Console ve Base44 SHA kayıtları doğrulanmadı. Mevcut Google giriş ayarı değiştirilmedi. |
| Push içeren üretilmiş/kurulu binary, OS izni, native User–cihaz eşlemesi | **Bilinmiyor / NOT_RUN** | Fiziksel cihaz/build envanteri yok; gönderim yapılmadı. Repo native proje/anahtar içermiyor; bu yönetilen build'in dashboard'da bulunmadığı anlamına gelmez. |
| Güvenli workflow ve provider sözleşmeleri | **Bilinmiyor** | Bekleyen teknik yanıtı bu paket varsayımla kapatmıyor; service-role erişimi çağıranın yetkisi değildir. |

Açık Security ekranındaki mevcut özet 13 fonksiyon uyarısı gösteriyordu. Yeni scan/audit yapılmadı, ayrıntılar genişletilmedi veya Acknowledge edilmedi. Önceden kayıtlı **12 bulgu OPEN / USER-DEFERRED** kalır; bu gözlem onları kapatmaz ya da yeni bir audit başlatmaz.

## 3. Kullanıcının kurulum rehberi

Aşağıdakiler kullanıcı adımlarıdır; ajan tarafından çalıştırılmadı. Önce kimlikleri ve mevcut hesap erişimlerini doğrula, mevcut uyumlu kayıtları koru; sonra gerekli dosyaları doğrudan güvenilir platform alanlarında kullan. Özel anahtar, service-account içeriği, oturum veya cihaz token'ını sohbete, Git'e ya da test raporuna yapıştırma. Dosyaları repo dışında güvenli sakla. JSON düzenleme veya terminal komutu gerekmez.

### iPhone hazırlığı

1. **Kimlik ve hesap:** Apple Developer Program üyeliğinin ve App Store Connect erişiminin etkin olduğunu kontrol et. Mevcut uygulama varsa App Store Connect → My Apps → Shinka → App Information içindeki Bundle ID'yi esas al; Base44'ün üreteceği binary aynı kimliği taşımalı. Kimlik gösterilmiyorsa Base44'ten kesin build kimliğini doğrulat; uygulama adından tahmin etme. Team ID ile bundle ID aynı şey değildir. Apple'ın [uygulama kimliği](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information) ve [hesap/API rolleri](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api) açıklamaları bu ayrımı destekler.
2. **İki ayrı anahtar:** App Store Connect → Users and Access → Integrations → Team Keys, mağaza/build API erişimi içindir; gerekiyorsa yetkili hesap sahibi gerekli role sahip API anahtarını burada hazırlar. APNs için Apple Developer → Certificates, Identifiers & Profiles → Keys kullanılır ve Apple Push Notifications service seçilir. İkisi de `.p8` olabilir ama birbirinin yerine geçmez; her birinin Key ID'si ayrı doğrulanır. Apple'ın yeni APNs ortam/kapsam seçenekleri Base44 rehberiyle eşleşmiyorsa seçim tahmin edilmez; build uyumluluğu destekten netleştirilir. Anahtarları yeniden üretmek yerine uygun mevcut anahtarları kullan. [API anahtarı](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api), [APNs anahtarı](https://developer.apple.com/help/account/keys/create-a-private-key/).
3. **Base44 alanları:** Publish → Mobile app → Build Stores Files → Create App Store files. İlk bölüme App Store Connect Issuer ID/Key ID, Apple Team ID ve **API Key file (.p8)** girilir. **Add push notifications** bölümünde **Upload the APNs auth key (.p8)** ve **APNs Key ID** kullanılır; ilk bölümdeki API anahtarını buraya koyma. Başlıklar resmî rehberle kontrol edildi; ilk bölüm bu uygulamada da görüldü. [Base44 iOS kurulumu](https://docs.base44.com/documentation/building-your-app/uploading-to-app-stores#adding-push-notifications).
4. **Doğru build:** Alanları kullanıcı tamamladıktan sonra kendi kararıyla native dosya üretimini/yüklemesini yapar. App Store Connect → Shinka → TestFlight üzerinden doğru sürüm/build numarasını test grubuna bağla; iPhone'da TestFlight'tan o build'i kur. Web güncellemesi eski binary'ye push kabiliyeti eklemiş sayılmaz. Kurulu sürümü, bundle ID'yi ve push yapılandırmasıyla üretilmiş build kaydını eşleştir; izin penceresi görmek tek başına teslim kanıtı değildir. [TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview), [native güncelleme gereği](https://docs.base44.com/documentation/building-your-app/uploading-to-app-stores#updating-your-app).

### Android hazırlığı

1. **Kimlik ve Firebase:** Base44 Android hazırlığında gösterilen **package name** değerini aynen kullan. Firebase Console → ilgili proje → Project overview → Add app → Android → Android package name. Mevcut kayıt varsa eşleşmesini kontrol et; başka uygulama/projeyi yanlışlıkla değiştirme. Firebase package name büyük/küçük harfe duyarlıdır ve kayıt sonrasında değişmez. Değer henüz görünmüyorsa tahminle kayıt oluşturma. [Firebase Android kurulumu](https://firebase.google.com/docs/android/setup).
2. **İki farklı dosya:** Aynı Firebase projesindeki Android uygulamasından `google-services.json` indirilir; bu dosya istemci uygulamasının proje/app yapılandırmasıdır. Project settings → Service accounts bölümündeki service-account anahtarı sunucunun yetkili gönderimi içindir ve gizlidir; gerekiyorsa yetkili kullanıcı **Generate New Private Key** ile hazırlar. İkisi aynı projenin dosyaları olmalı; dosya içeriğini sohbete taşıma. Firebase Auth, Firestore veya yeni Shinka backend'i kurma. [İstemci dosyası](https://firebase.google.com/docs/android/setup), [sunucu anahtarı](https://firebase.google.com/docs/cloud-messaging/send/v1-api#provide-credentials-manually).
3. **Base44 alanları:** Publish → Mobile app → Build Stores Files → Create Google Play files → Add push notifications. Dosyalar sırasıyla **Upload google-services.json** ve **Upload the service account key (.json)** alanlarına gider. Logo değişikliği yapma; mevcut logo korunur. Rehberde Spark yeterli belirtilir; bu paket ücretli proje açmayı gerektirmez. [Base44 Android kurulumu](https://docs.base44.com/documentation/building-your-app/uploading-to-app-stores#adding-push-notifications).
4. **Google girişini koru:** Play Console'da **Protected with Play → Play Store distribution → Go to Play app signing** yolundan dağıtılan uygulamanın **app signing** sertifikasını kontrol et; eski görünümde **Test and release → App integrity → App signing** olabilir. Upload key parmak izi tek başına yeterli değildir. Base44 → Mobile app → Build Stores Files → Google Play bölümündeki More actions → **Add Google Play SHA** ekranında standart imzalama için SHA-256; quantum-ready için resmî Base44 rehberinin istediği sertifika ZIP'i kullanılır. Mevcut imzalama düzenini veya varsayılan Base44 Google OAuth'u değiştirme. [Google imzalama ayrımı ve güncel menü](https://support.google.com/googleplay/android-developer/answer/9842756?hl=en), [Base44 SHA alanı](https://docs.base44.com/documentation/building-your-app/uploading-to-app-stores#adding-google-play-sha).
5. **Doğru build:** Kullanıcı üretim/yükleme kararını verdikten sonra Play Console → Testing → Internal testing üzerinden seçilmiş test grubuna uygun AAB sürümünü dağıtır; cihazda test katılım bağlantısından kurar. Play'in dağıttığı imzalı sürümde Google/Apple girişini tekrar kontrol et. Sadece tarayıcı veya başka imzalı yerel APK sonucu yeterli değildir. [Google internal test](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en).

**Hesap/erişim gerektiren son adımlar:** Mevcut üyelik/rol ve dosyaları yalnız sen doğrulayabilirsin. Eksikse hesap/proje/anahtar oluşturma, ücretli plan, native dosya üretimi ve mağaza/test kanalı yüklemesi senin kararındadır. Base44 dokümanı dosya indirme için Builder veya üzerini gerektiriyor; hesabının planı burada bilinmiyor. Bunları yapmak backend'deki `enabled:false` değerini kaldırmaz. Genel mağaza/legal onayı bu paket tarafından verilmez; eski açık kabul maddeleri korunur.

## 4. İki aşamalı fiziksel cihaz planı

Her satır Android ve iPhone'da ayrı kaydedilir. Test hesabına “A/B” gibi takma ad, cihaz modeli/OS, build sürümü, dil, uygulama durumu ve beklenen/görülen sonuç yeterlidir. Anahtar, token, kişisel profil veya sağlık ekranı kanıt dosyasına konmaz. Başarılı provider yanıtı ile cihazda görünme iki ayrı alan olarak tutulur.

### A — Şimdi hazırlanabilen kontroller; gerçek gönderim yok

| Adım | Menü / işlem ve beklenen sonuç | Durum |
|---|---|---|
| A1 — doğru uygulama | TestFlight / Play internal test üzerinden push ile hazırlanmış doğru bundle/package ve build sürümünü kur; web sürümü ile binary'yi karıştırma. Kimlik/build kaydı olmadan sonraki kabulü başlatma. | **NOT_RUN** |
| A2 — giriş korunması | Seçilmiş test hesabıyla Apple ve Google girişini mevcut ekrandan dene. Normal oturum/onboarding doğru açılmalı; yeni Firebase girişi görünmemeli. H16-902 kanıtı ayrı. | **NOT_RUN** |
| A3 — sistem izni | iPhone: Ayarlar → Bildirimler → Shinka. Android: Ayarlar → Uygulamalar → Shinka → Bildirimler (üreticiye göre ad değişebilir). İlk karar verilmemiş, izinli ve reddedilmiş durumları ayrı kaydet. Reddetmek Home/günlük içeriği engellememeli. | **NOT_RUN** |
| A4 — tercih ve dil | You/Profil'de bildirim tercihini aç/kapat, Kaydet, ekranı yeniden aç ve uygulamayı yeniden başlat. Kayıtlı durum korunmalı. TR/EN metinleri doğru olmalı; native izin “bilinmiyor” kalabilir ve alım garantisi vermemeli. | **NOT_RUN** |
| A5 — hata ve hesap değişimi | Seçilmiş hesapta kontrollü ağ kesintisinde kaydetme sonucunu başarı varsayma; mevcut Check/Retry aynı değişikliği doğrulasın. Çıkış yapıp B'ye gir: A'nın tercihi/taslağı/içeriği görünmemeli. Bu aşama token yeniden bağlanmasını kanıtlamaz. | **NOT_RUN** |

[iOS izin belgesi](https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications): sistem kararı kaydeder; sonraki istek yeniden pencere açmış sayılmaz, izin sonradan değişebilir. Provisional/quiet durumlar tam uyarı izniyle bir tutulmaz. [Android izin belgesi](https://developer.android.com/develop/ui/compose/notifications/notification-permission): Android 13+ yeni kurulumda POST_NOTIFICATIONS izni gerekir; pencereyi kaydırarak kapatmak “izin verildi” değildir. Hedef SDK/kanal davranışı gerçek build'de doğrulanır. Bu işletim sistemi bilgileri Base44 JavaScript API'si oluşturmaz; prompt zamanını uygulama koduyla değiştirmiyoruz.

### B — Sözleşmeler tamamlanıp kontrollü gönderime izin verildikten sonra

**Başlatma koşulu:** aşağıdaki teknik sözleşmeler kaynaklarıyla doğrulanmış, native hazırlık tamamlanmış ve kullanıcı tek test hesabında kontrollü gönderime açıkça izin vermiş olmalı. Bu paket hiçbirini otomatik açmaz.

| Adım | Kontrol ve kabul ölçütü | Durum |
|---|---|---|
| B1 — teslim / görünme | A test hesabında tek günlük işlem. Provider kabulünü ayrı, Android/iPhone'da bildirimin görünmesini ayrı kaydet; B'ye gitmemeli. Tekrar kontrol yeni günlük snapshot veya kör yeniden gönderim üretmemeli. | **NOT_RUN** |
| B2 — uygulama durumu | Ön plan, arka plan ve normal kapalı durumları ayrı dene. Ön plan banner/ses davranışını desteklenen wrapper sözleşmesiyle karşılaştır; varsayma. Android “Zorla durdur” ve iOS kullanıcı tarafından kapatma gibi durumları ayrı not et; kapalı uygulama iddiasıyla karıştırma. | **NOT_RUN** |
| B3 — dokunarak Home | Bildirime dokununca mevcut güvenli Home açılmalı. Oturumsuzsa giriş, eksik onboarding varsa ilgili adım; eski bildirim geçmiş gün/başka hesabın içeriğini zorla açmamalı. Yeni link protokolü yok. | **NOT_RUN** |
| B4 — tercih/izin kapalı | Uygulama tercihi kapalı ve OS izni reddedilmiş durumları ayrı kontrol et. Yeni gönderim uygunluğu fail-closed olmalı; günlük içerik yine erişilebilir. Önceden teslim edilmiş bildirimlerin sistem merkezinde kalmasını yeni gönderimle karıştırma. | **NOT_RUN** |
| B5 — çıkış / hesap değiştirme | A'dan çıkıştan ve B girişinden sonra A hedefli yeni push B cihaz oturumuna taşınmamalı. Bildirime dokunmak da A verisini göstermemeli. Token silme/yeniden bağlama ve birden fazla cihaz davranışı ayrıca doğrulanmalı; UI temizliği tek başına yeterli değildir. | **NOT_RUN** |
| B6 — kayıtlı cihaz yok / belirsiz yanıt | Cihazsız test alıcısı, açık hata ve belirsiz yanıt sözleşmedeki sonuçla eşleşmeli. Bilinmeyen sonuç “gönderildi” sayılmamalı veya otomatik yeniden gönderilmemeli. Kayıtlı intent/readback ve 031 bütçeleri korunmalı. | **NOT_RUN** |

Fiziksel banner/ses için OS kanal, odak/özet ve kullanıcı ayarları ayrıca gözlenir; provider kabulünden doğrudan görünme beklenmez. Aşama A başarılı olsa bile H14-901/H16-901 kapanmaz. B sonuçları yetersizse gönderim kapalı kalır; yerel kilit/uzlaştırma dağıtık kesin-bir-kez garantisi değildir.

## 5. Teknik ekipten beklenenler

İstenen yanıtlar anahtarsız örnek ve resmî SDK/platform kaynağı içermeli; kurulu sözleşmeyle karşılaştırılmalı:

- Güvenli otomatik çağrı kimliği nasıl doğrulanır; `auth.me()` ne döner, rol düşürme/silme nasıl etkiler? Aynı yetkili admin'in elle çağrısını ayırmak şart değil. Null auth veya `asServiceRole` erişimi sistem yetkisi değildir.
- `user_id` native User ile nasıl kesin eşleşir; oturum kapatma/hesap değiştirme ve çoklu cihaz kaydı nasıl yönetilir?
- Başarılı/hatalı yanıtların ve kayıtlı cihaz yokluğunun şeması nedir; kabul/kuyruk/cihaz teslimi hangi aşamadır?
- Güvenilir cihaz uygunluğu/izin bilgisi, yeniden gönderim ve idempotency davranışı nedir? Doğrulanmış wrapper API'si varsa kapsamı/sürümü nedir?

Mevcut kullanıcı-aktarımlı giriş şeması bu cevapların yerine geçmez. Gerçek entry ve scheduler **enabled:false** kalır; admin **DISABLED / processed:0** alır. Yeni servis, header, bridge veya alıcı kayıt sistemi eklenmedi.

## 6. Health ve yerel doğrulama

Health **add: 0 / update: 2 / delete: 0**. H14-901 güvenli otomatik çağrı/provider kabul kapsamını, H16-901 iki aşamalı fiziksel kabulü açıklaştırır; ikisi de dış kabul olarak kalır. H14-001–004 ve H16-902 incelendi, mevcut assertion/scope yeterli olduğu için korunur. Katalog 175 / 149 in-app / 12 local / 14 external / 0 future; backend plan değişmez. Hiçbir dosya/anahtar varlığı testi native PASS üretmez.

032'nin sürüm/allowlist/katalog metadata'sı için iki motorun mevcut tam regresyonu **2026-10-22** tarihinde birer kez çalıştırıldı. Test edilen temel commit `0a8b1e8baba8881434e46c8ad6057d3031cd8859` + bu paketin farklarıdır. [498 dosyanın SHA-256 manifesti](native-notification-readiness-032/source-manifest.json) toplu hash'i `70ba35f2b0be159055b905c4c10ff5bc03388bd90c2c1d2feeca93fec12b2b68`; sonradan sonuçları yazılan ledger ve raporlar bunun dışındadır. Operasyonel bildirim/UI/auth ve bağımlılık dosyaları temel kaynakla aynıdır. [Kaynak incelemesi](native-notification-readiness-032/source-review.json), [dashboard gözlemi](native-notification-readiness-032/dashboard-observation.json).

| Yeni 032 koşusu | Regresyon | Ek server / gerçek entry fixture | Yerel in-app Health | Hata / eksik ID |
|---|---|---|---|---|
| Chromium 156.0.8078.4 | **624/624 PASS** | **8/8 + 9/9 PASS** | **136 PASS / 0 FAIL / 13 BLOCKED** | **0 / 0**, page error yok |
| WebKit 27.2 | **624/624 PASS** | **8/8 + 9/9 PASS** | **136 PASS / 0 FAIL / 13 BLOCKED** | **0 / 0**, page error yok |

O32, NA07, NA22, SC06/10/11, NT01–23, NC01–09, NP01–07, NU01–03 bireysel sonuç listelerinde mevcut. SC01–05/07–09 ana runner'da, NS01–09 gerçek TS entry + değiştirilmiş SDK fixture'ında çalıştı; ayrıca tekrar edilmedi. Health'in 13 önkoşul engeli: H04-019, H05-001–009, H08-005, H09-004, H12-031. Bunlar hosted veriye/bağlantıya ihtiyaç duyar; PASS sayılmadı. H14-901/H16-901 dış kabul olarak bu 149 in-app case'in dışında kalır.

Temiz `npm ci`, iki bağımlılık ağacı kontrolü, audit ve security:deps, typecheck, lint, üretim build, Repo Health, build-history ve performans kapıları **PASS**. Bağımlılık audit'i tüm seviyelerde **0**. Npm'in mevcut `min-release-age-exclude` ayarı için uyarısı sürüyor; ayar/bağımlılık değiştirilmedi. Başlangıç JS **479543 B / 160180 B gzip**, CSS **77521 B / 14262 B gzip**; mevcut bütçeler içinde. Laboratuvar ölçümü saha p75/INP değildir.

031 ile aynı harness, başlangıç verisi, zaman ve ürün sonucu yeniden karşılaştırıldı: existing-intent / accepted-dispatch / settled-pass sırasıyla **69/104/46 entity read**, **4/4/2 write**, **12/15/9 auth.me**, **1/3/0 eligibility**, **0/1/0 sentetik provider send**. [Karşılaştırma](native-notification-readiness-032/notification-cost-comparison.json). Gerçek gönderim sayısı sıfırdır.

[verification.json](native-notification-readiness-032/verification.json) ve [quality-gates.json](native-notification-readiness-032/quality-gates.json) komut, zaman, sonuç ve kanıt bağlantılarını içerir; iki motorun case-audit dosyaları gerçek kapsamı ayrı listeler. Uygulama/test assertion'ı değiştirilmedi veya kaldırılmadı. Kanıt hazırlamada temiz kurulumla aynı anda SDK dosyasına erişme ve npm uyarısını JSON sanma hataları, yalnız rapor derleme yardımcılarında düzeltildi; test başarısızlığı ya da uygulama kusuru değildi. Eski 028–031 başarısızlıkları korunur. Önceki 031 koşuları yeni kanıt olarak sunulmaz. Tüm fiziksel/hosted kontroller **NOT_RUN** kalır.

## 7. Resmî kaynaklar ve kanıt sınırı

Aşağıdaki kaynaklar **2026-10-22** tarihinde incelendi. URL taşınmaları not edildi. Sayfalarda doğrulanabilir JS wrapper izin/ayar/token arayüzü veya eksik provider/workflow şemaları bulunmadı; bu bir platformda yokluk kanıtı değildir.

| Kaynak | Kullanılan kapsam |
|---|---|
| [Base44 native kurulum](https://docs.base44.com/documentation/building-your-app/uploading-to-app-stores) | Native hazırlık menüleri, iki platformun dosyaları ve push için yeni binary. Uygulamanın iki ilk formu ayrıca salt okunur görüldü. |
| [Base44 built-in push](https://docs.base44.com/Integrations/built-in-integrations#sending-push-notifications) | Native hedef, backend service-role çağrı yeri, linksiz varsayılan Home; kesin yanıt/kimlik/teslim sözleşmesi sağlamıyor. |
| [Apple izin](https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications) | İzin kararları; sayfanın JS kabuğu nedeniyle resmî indekslenmiş [içerik varyantı](https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications?changes=_4) da okundu. |
| [Android izin](https://developer.android.com/develop/ui/views/notifications/notification-permission) | Resmî URL güncel compose/notifications/notification-permission adresine yönleniyor; Android 13+, izin reddi/kararsız durum. |
| [Firebase Android](https://firebase.google.com/docs/android/setup) | Birebir package eşleşmesi ve istemci yapılandırma dosyası. |
| [Firebase sunucu yetkisi](https://firebase.google.com/docs/cloud-messaging/auth-server) | send/v1-api adresine yönleniyor; service-account anahtarı ayrı ve gizli. Shinka'ya doğrudan FCM mimarisi eklenmez. |
| [Apple API anahtarı](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api), [APNs anahtarı](https://developer.apple.com/help/account/keys/create-a-private-key/), [Bundle ID](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information) | Hesap/rol, ayrı anahtarlar ve build kimliği. |
| [Play imzalama](https://support.google.com/googleplay/android-developer/answer/9842756?hl=en), [internal test](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en), [TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview) | Dağıtılan sertifika ve doğru test build'i; hiçbir yükleme/dağıtım burada yapılmadı. |

## 8. Teslim sınırı

Test üzerinden yeni taslak devam PR'ı; #33 zaten birleştirilmiş. Internal Build **028–032**. Ajan hesap/Firebase projesi/anahtar oluşturmadı, ücretli plan açmadı, native build veya mağaza yüklemesi başlatmadı; gerçek push, workflow, canlı Full Health/Security scan/import/kullanıcı mutasyonu, main merge veya publish yapmadı. Test/GitHub senkronu yayımlanmış native uygulama kanıtı değildir. Kullanıcı kurulum adımlarını ve daha sonra onaylı cihaz kabulünü yürütür; 12 eski güvenlik bulgusu ertelenmiş/açık kalır.
