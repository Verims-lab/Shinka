# SHINKA — ON-02 ve kullanım koşulları kabulü (074)

Tarih: 12.11.2026. Çalışma ve teslim dalı: `GizemTest`. Paket: Buildmarker-074 / HC-073.0.

Yetki kaynağı: kullanıcının `93bcc609-69f9-40aa-8b2c-c5ae3fcc8942/Pasted text.txt` içindeki “SHINKA — ONBOARDING SCREEN 2 DEVELOPMENT” talebi. Kod, test, belge, HealthCheck, commit ve yalnız GizemTest'e gönderim bu talep kapsamında. Yayın, canlı kullanıcı işlemi ve yıkıcı veri geçişi kapsam dışında.

## Belgeler ve karar önceliği

Güncel Source of Truth, Business Flow, UI/UX Standards, mimari, veri/güvenlik, native oturum sözleşmeleri, Health kataloğu ve 061/064/071–073 kayıtları incelendi. Önceki kapsamlı incelemede indirilip hash'leri kaydedilen gerçek kaynakların içerikleri de kullanıldı: SRC-01 İş Analizi v2.5, SRC-02 Use Case v1.4, SRC-03 UI/UX v1.1'in dört bölümü ve tablo companion'ı, SRC-04 Teknik Analiz v1.1, SRC-05 Veritabanı Tasarımı v1.2 ve SRC-07 Entity/İlişkiler v1.2 çalışma kitabı.

Kaynaklar boş başlayan 18+ beyanını ve ayrı backend doğum tarihi denetimini tanımlar; eski onboarding sırasını ve “Terms of Service” adını kullanır. Güncel onaylanmış koşul sürümü veya sürümlü yasal kabul tablosu sağlamazlar. Bu talep ON-02'nin yeni metinlerini ve kabul şartını belirler. Kimlik doğrulamadan sonra kişisel ekranlara geçiş ve doğrudan devam için 061/071, arka plan için 073 geçerlidir. Tarihî belgelere sonradan onay verilmiş gibi davranılmadı.

Asıl Word/Excel dosyaları Git içinde düzenlenebilir kaynak olarak bulunmuyor; dışarıda korunan özgünler değiştirilmedi. Ürün sahibinin ayrıca güncellemesi gerekenler: İş Analizi hesap/18+ kuralları; Use Case UC-01; UI/UX ON-02 ve doğrulama/companion tabloları; Teknik Analiz kimlik/oturum bölümü; Veritabanı Tasarımı ve Entity/İlişkiler çalışma kitabına yeni kabul olayı/owner ilişkisi. Bu teslimde depoda sürdürülen kanonik belgeler güncellendi; yeni dış belge onayı iddia edilmedi.

## Ekran ve sağlayıcı denetimi

Welcome başlığı ve alt açıklamasının mevcut metni, işaretlemesi, fontu, ağırlığı, hizası ve konumu korundu. Yalnız onay alanına `padding-top: 5dvh` eklendi. Her iki etiket eski yaş metninin tam %70'ini kullanır: ölçülen 16px → 11,2px. Onay kutuları 24px; satırlar ve bağlantılar en az 44px dokunma alanını korur. Kısa, yatay ve büyütülmüş yazılı ekranlarda bütün denetimlere belge kaydırmasıyla ulaşılır.

Yeni kullanıcı görünümünde başlangıçta işaretsiz tam iki kutu vardır:

| Dil | Koşul kabul metni | Gizlilik açıklaması |
|---|---|---|
| EN | I agree to the Terms of Use | We handle your personal information in our Privacy Policy. |
| TR | Kullanım Koşullarını kabul ediyorum | Kişisel verilerinizi Gizlilik Politikamız kapsamında koruyoruz |

Yalnız “Terms of Use” / “Kullanım Koşullarını” ifadeleri https://shinkadaily.com/terms/ adresine, “Privacy Policy” / “Gizlilik Politikamız” ifadeleri https://shinkadaily.com/privacy/ adresine gider. Bağlantılar yeni bağlamda `noopener noreferrer` ile açılır. Bağlantı tıklaması kutuyu değiştirmez. Gizlilik açıklaması için üçüncü kutu veya ayrı kabul koşulu yoktur. Her iki URL salt okunur HEAD kontrolünde HTTP 200 döndürdü; bu, hukuki içerik onayı sayılmaz.

Yeni ON-02 görseli eklenmemiş ve depoda açıkça ayırt edilememiştir. Tek mevcut `src/assets/shinka-background.png` dosyası, 073'ün oranı ve güvenli alan yerleşimiyle aynen korundu. Görsel üretilmedi.

Ortak `validateAuthDeclarations`, hem SignIn olay işleyicisinde hem gerçek `beginProviderAuth` servisinde sağlayıcı çağrısından önce çalışır. Yeni kullanıcı için yaş/koşul 00, 01 ve 10 kombinasyonlarında SDK çağrısı sıfırdır; 11 yalnız Apple veya Google'ı, doğrulanmış yapılandırma sürümüyle başlatır. Sadece düğmenin pasif görünmesine güvenilmez. İptal sessiz kalır ve geçici niyet temizlenir. Backend'in doğum tarihi ve 18+ denetimi değiştirilmedi.

## Kimlik doğrulama ve uygulamaya kabul

Kimlik bilinmeden hesap/mevcut kabul sorgusu yapılmaz. “Zaten bir hesabım var / I already have an account” yolu 18+ kutusunu yeniden boş başlatır ve yine zorunlu tutar; önce Apple/Google kimliği doğrulanır, sonra o kimliğin sürümlü kabulü okunur. Bu seçeneğin kullanılması uygulamaya erişim sağlamaz.

Güncel kabul kaydı olan kullanıcı yeni bir koşul onayı veya zaman damgası yazılmadan, mevcut sunucu ilerlemesine göre ON-03/04/05, hazırlık veya Home'a devam eder. Eksik, eski veya doğrulanamayan kabul kişisel veri okumasından önce kapıda kalır. Altıncı numaralı onboarding adımı eklenmedi.

Yeni kullanıcıda sessionStorage yalnız kısa ömürlü sürüm/nonce niyetini taşır; kabul kaydı veya kullanıcı kimliği değildir. OAuth dönüş URL'sindeki nonce eşleşmeli, niyet on dakika içinde olmalı ve yalnız bir kez tüketilmelidir. Niyette kabul zamanı yoktur. Eksik, süresi dolmuş, eşleşmeyen veya farklı sürüme ait niyet yeni açık onay gerektirir. Browser kaydı uygulamaya yetki vermez.

`applicationSession`, native kimliğe ek olarak CURRENT / REQUIRED / CONFIGURATION_REQUIRED / UNAVAILABLE durumunu döndürür. CURRENT, doğrulanmış sürüm ve kayıt kimliği/sunucu zamanını içerir. App, güncel kabul yokken kişisel ve admin rotalarını yüklemeden lazy TermsGate'i açar. Hesap/sürüm/durum değişiklikleri eski sorgu ve ekran kapsamını temizler; geç yanıtlar eski kapsamı geri getiremez. Mevcut owner güvenliğiyle `/account-privacy` ve `/delete-account` bağımsız olarak erişilebilir kalır.

## Base44 kayıtları ve yapılandırma

Yeni `UserTermsAcceptance`, değişmeyen 20 ürün entity'sinden ve isteğe bağlı sağlık onamından ayrı operasyonel tablodur. Fiziksel envanter: 20 ürün + 8 operasyonel + native User = 29. Zorunlu alanlar: `user_id`, `terms_version`, `accepted_at`, `status=ACCEPTED`, `document_url`, `intent_id`. İlişki: UserTermsAcceptance.user_id → User.id.

Dar `termsAcceptance` backend'i native kimlik, User, lifecycle ve gizlilik denetiminden sonra yalnız çağıranın kayıtlarını okur/ekler. İstemci owner/rol/zamanı ve tanımsız alan/eylemler reddedilir. Genel düzenleme/silme API'si yoktur. Mevcut doğrudan SDK erişimini kapatan depo şeması deseni korundu.

Platform doğrulama sınırı: [resmî entity güvenlik belgesi](https://docs.base44.com/developers/backend/resources/entities/security) `false` değerini erişim reddi olarak tanımlar ve service role'ün kuralları aştığını belirtir. Güncellenen [Base44 entity kılavuzu](https://github.com/base44/skills/blob/main/skills/base44-platform-entities/references/rls.md), create/update için farklı davranış uyarısı içerir. Yerel şema incelemesi bu çelişkiyi çözemez. Yayından önce anonim, normal kullanıcı ve native admin doğrudan create/update denemelerinin reddedildiği ve kabul zamanı/durumunun değişmediği gerçek ortamda doğrulanmalıdır. Aksi sonuç yayını engeller ve desteklenen kapatma kuralının doğrulanmasını gerektirir. Canlı RLS başarısı iddia edilmedi.

Sürüm yalnız sunucudaki `SHINKA_TERMS_VERSION` yapılandırmasından gelir. **Onaylı hukuki sürüm kimliği bulunmadı; üretim varsayılanı uydurulmadı.** Eksik/geçersiz değer CONFIGURATION_REQUIRED üretir ve uygulamaya kabulü kapalı tutar. Ürün/hukuk onaylı gerçek belge kimliği alındıktan sonra mevcut Base44 uygulamasının Dashboard → Secrets alanında tanımlanmalıdır. Testlerdeki test-terms-v1/v2 hukuki sürüm değildir. Yapılandırma değişince yeni açık kabul gerekir; eski kullanıcıların kabul ettiği varsayılmaz.

Kabul zamanı eklemeden hemen önce sunucuda `new Date().toISOString()` ile üretilir. Yazmadan önce ve sonra kimlik/lifecycle/sürüm yeniden denetlenir; owner/sürüm okumasıyla teyit olmadan başarı verilmez. Güncel kabul tekrarında ilk geçerli olay ve zamanı aynen döner. Yeni sürüm yeni olay ekler. Eşzamanlı olaylar silinmeden, accepted_at ardından id ile deterministik okunur; desteklenmeyen UNIQUE/CAS/transaction garantisi verilmez. Owner/güncel sürüm sorgusu en fazla 101 satırla sınırlandırılır; taşma, bozuk veya yabancı kayıt başarıya dönüşmez.

`createNativeClient` ürün girişlerinde yazı başı denetimin içinde güncel koşul kabulünü zorunlu kılar. Internal Health/Test Tools da aynı kapıyı kullanır. Kesinlikle kapalı bildirim girişi açılmadı. applicationSession ve termsAcceptance, kabulü okuyup verebilmek için önce native kimliği kuran bilinçli istisnalardır. Public policy yalnız belge adresleri ve yapılandırılmış sürüm bilgisini açar.

Normal işleyiş eklemelidir; sağlık verisi iznini geri çekme koşul geçmişini silmez. Mevcut açık owner hesap silme istisnası yalnız o kullanıcının koşul geçmişini ACCOUNT_CLEANUP üzerinden kaldırıp yokluğunu User silinmeden önce doğrular. Başka owner'ın kayıtları korunur. Saklama süresi veya ek onam icat edilmedi. Canlı kayıt oluşturulmadı, değiştirilmedi, silinmedi.

## Başarısız ve belirsiz sonuçlar

İstemci servisi 15 saniyeyle sınırlıdır. Zaman aşımı, kayıp yazma yanıtı veya bozuk/başarısız geri okuma kabul başarısı değildir. UI aynı owner/sürüm/intent'i korur ve yalnız okuyan durum kontrolü sunar. Başarısız kontrol yazmayı etkinleştirmez. CURRENT, yeni applicationSession kontrolüne; doğrulanmış REQUIRED ise ayrı açık eylemle aynı niyetin yeniden denenmesine izin verir. Sürüm değişince eski taslak bırakılır ve kutular yeniden boş başlar. Yeniden açılma geçmişteki belirsiz yazmayı otomatik tekrarlamaz.

## Testler ve HealthCheck

HC-073.0, H06-008/009'u ekler; sağlayıcı, operasyonel şema ve ON-02 kanıtlarını günceller. Önceki vakalar silinmedi. Katalog: 17 suite, 188 vaka; 162 uygulama içi, 12 yerel regresyon, 14 dış doğrulama.

TA01–TA14: iki sağlayıcının bütün kutu kombinasyonları; açık sürüm yapılandırması; native owner/sunucu zamanı/sürüm/geçmiş; tekrar ve eski sürüm; bozuk/yabancı/başarısız/belirsiz/timeout/eşzamanlı kayıt; payload reddi; tek kullanımlık niyet; sağlık geri çekme ve owner silme ayrımı.

Zorunlu checkTermsAcceptance gerçek App'i sentetik SDK ile çalıştırır: TR/EN, 320/360/390/430px, tablet/yatay, %100/%200 yazı; açık/koyu OS altında mevcut açık onboarding; değişmeyen başlık; 5dvh ve %70 ölçüsü; kutu, URL, dokunma, klavye, ekran okuyucu etiketi; sağlayıcı matrisi; OAuth dönüş niyeti; güncel/eski sürüm; kayıp/başarısız kayıt ve salt okunur kurtarma; oturum ve gizlilik istisnası. Doğum tarihi ve beş adımlı akışın önceki regresyonları korunur.

### Çalıştırma kayıtları

| Kontrol | Sonuç |
|---|---|
| Kilitli npm ci, npm ls --all | PASS; bağımlılık/lockfile değişmedi |
| npm audit --audit-level=high --include=dev | PASS; 0 açık |
| TypeScript, lint, üretim derlemesi | PASS |
| Depo Health ve beş paketlik build kaydı | PASS; 070–074 |
| Tam Chromium Foundation | PASS; 817/817, 0 hata, 0 page error |
| Chromium yeni ON-02 matrisi | PASS; 26 senaryo |
| Chromium statik / onboarding Health kanıtları | 63/63 ve 23/23 PASS |
| Chromium uygulama içi sentetik Health | 149 PASS, 13 beklenen BLOCKED, 0 FAIL |
| WebKit çekirdek Foundation | PASS; aynı 817 testin tamamı, 0 hata, 0 page error |
| WebKit yeni ON-02 matrisi | PASS; 26 senaryo |
| WebKit Health kanıt grupları | Statik 63/63, onboarding 23/23, daily 9/9, admin 3/3 PASS |
| Tam WebKit / Calendar Health | FAIL; H08-004 içindeki RC06, 5 saniyelik helper sınırında TEST_TIMEOUT |
| Yerel şema paketleri current/final | PASS; 29 şema, canlı çağrı yok |
| Üretim paket bütçeleri ve rota ölçümü | PASS; sınırlar artırılmadı |
| Gerçek OAuth, canlı Base44 RLS/zaman/geri okuma, fiziksel iOS/Android, yayın sonrası Health | NOT_RUN |

Üretim ölçümü: ilk JS 492.588 / 500.000 bayt, gzip 164.532 / 165.000; CSS 83.283 / 90.000, gzip 16.000 / 16.000. Yasal ekran ve metinleri lazy yüklenir; ilk App yalnız küçük kabul koşulunu taşır.

Sentetik uygulama içi Health'teki beklenen BLOCKED kimlikleri: H04-019, H05-001…009, H08-005, H09-004, H12-031. Bunlar test ortamının canlı veri/platform yeteneği sağlamadığı durumları korur; yeni başarısızlık veya canlı kabul kanıtı olarak sunulmaz.

Önceki denemeler korundu: sandbox loopback erişimi reddedildi, sonra izinli yerel çalıştırıldı; eksik Playwright motorları proje dışında kuruldu. Tek kutulu eski sağlayıcı fixture'ları iki onaya uyarlandı. Boş çeviri parçaları tam cümleli ayrı termsCopy kataloğuna taşındı. Kontrollü React kutuları için fixture olayları ayrı event turn'lerde yürütüldü. Paralel tam koşudaki WebKit U12/OV05 ve Chromium tercih ekranı zamanlama sorunları ayrı koşuda geçti. Başlangıç heading fokusunun ve Health hook API kurulumunun gerçekten tamamlanması beklenir; Pattern geri dönüş fixture kontrolü de sabit 20ms yerine gerçek çağrıyı gözler. Yasal niyetlerin tarihçe/storage sınırlarını denetleyen ve ortak test cache bilgisini kullanan Health kanıtları sırayla çalıştırılır. Hiçbir doğrulama kaldırılmadı veya timeout sınırı yükseltilmedi. İlk paket ölçümleri sınırı aştı; yükleme ayrımı ve mevcut UI yardımcılarıyla sınırlar içinde tutuldu. Önceki başarısız/kesilen koşular son PASS sonuçları diye gösterilmez.

WebKit tam koşusu Calendar Health adımında durduğu için bu adımdan sonraki toplu rota/uygulama içi Health kontrolleri WebKit motorunda tamamlanmadı. Chromium motorunda bu kontrollerin tamamı geçti. RC06 dokuz senaryolu çekirdek testte geçer; Health kontrolünün daha kısa 5 saniyelik sınırında WebKit motorunda tamamlanamaz. Bu sınır kaldırılmadı, takvim algoritmaları değiştirilmedi ve tam WebKit paketi PASS olarak sunulmadı.

## Git ve teslim

Başlangıçta GizemTest c10fcddc2ac136210fcba6d6d8cfe79507793102, main b77ce45db6a18f365a2c3469898b6d21e00babd0 idi. Main 24 commit öndeydi; GizemTest'in ayrı commit'i ve yerel değişiklik yoktu. GizemTest üzerinde güvenli fast-forward yapıldı. Git CLI yazma kimliği sağlamadığı için bağlı GitHub bağlantısıyla yalnız GizemTest güncellendi; fetch sonrası yerel/uzak eşitliği ve main ile 0/0 fark geliştirmeden önce doğrulandı.

Son kod/test/belgeler tek geliştirme commit'iyle GizemTest'e teslim edilir. Son commit, tekrar fetch sonrası yerel/uzak eşitliği ve temiz çalışma ağacı teslim yanıtında, gerçek doğrulamadan sonra bildirilir. Main'e geçilmedi, main'e yazılmadı; force-push, PR veya yayın yapılmadı.

## Açık maddeler

- WebKit tam Health paketi H08-004 / RC06 zaman aşımı nedeniyle açık; çekirdek ve yeni özellik testlerinin PASS sonucu bu hatayı kapatmaz.
- Yeni ON-02 görseli yok; mevcut özgün PNG korundu.
- Ürün/hukuk tarafından onaylanmış koşul sürümü ve SHINKA_TERMS_VERSION yapılandırması gerekli.
- Asıl dış Word/Excel belgeleri ürün sahibi tarafından revize edilmeli; bu teslim onların yeni onayı değildir.
- Yeni kapalı şema ile bütün eşleşen backend/shared/frontend grafiği, sahibinin yetkilendirdiği yayın sürecinde birlikte ele alınmalı. Bu görevde deploy/entity push/veri geçişi yapılmadı.
- RLS belge çelişkisi için gerçek doğrudan erişim reddi, OAuth callback, sunucu zamanı/kayıt okuması ve fiziksel cihaz kabulü ayrı doğrulanmalı. Yerel PASS bunları kapatmaz.
