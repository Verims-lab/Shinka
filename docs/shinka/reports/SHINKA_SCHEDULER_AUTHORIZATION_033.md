# Shinka 033 — scheduler secret yetkilendirme hazırlığı

**Paket:** Buildmarker-033 / HC-033.0
**İnceleme tarihi:** 2026-10-23 (Europe/Istanbul; koşu kayıtları UTC)
**Durum:** Yerel hazırlık; gerçek secret kaydı/taşıması bağlı değil, entry `enabled:false`.

## 034 ek notu — yalnız alan adları doğrulandı (2026-10-26)

Kullanıcının ilettiği **Dmytro / Base44 Support** yanıtı `user_id`, `title`, `content`, `action_label`, `action_url` adlarını doğrular; önceki AI aktarımına ek kaynak budur. Destek kaydına bağımsız erişilmedi veya hosted çağrı yapılmadı. Bilinmeyen/yanlış alanlar sessizce atılıp başarı dönebilir; genel başarı bütün alanların işlendiğini ya da cihaz gösterimini kanıtlamaz. Aşağıdaki tarihsel “provider kabulü” ifadesi somut bir yanıt eşlemesi değildir; ACCEPTED/SENT çıkarımı yapılmaz.

Tam tip/zorunluluk/nullability/limitler, native User.id eşlemesi, somut kabul/başarı/hata/no-device JSON, uygunluk, idempotency ve logout/hesap değişimi hâlâ açık. Workflow secret kaydı/referansı/header taşıması için yeni sözleşme gelmedi; bağlantı kurulmadı. Bu raporun 033 koşuları ve başarısızlıkları tarihsel kalır; 034'te yeniden çalıştırılmadı. Güncel [034 ek notu ve BLOCKED/NOT_RUN kayıtları](SHINKA_STABILIZATION_034.md) geçerlidir. Entry `enabled:false`, H14-901/H16-901 açık.

## Kaynak ve bilginin niteliği

Başlangıç Test/origin Test `8498cf40ce14f0f65800a65781b1816b714e48f6`, çalışma ağacı temizdi. Kullanıcı PR #34'ü main'e `c9d2d04a1176f9e936456eaddaf14dd420d81721` ile birleştirmişti; ağaçlar aynıydı. Test güvenli fast-forward ile ilerletildi. 033 boştu; kullanıcı/Base44 içeriği ezilmedi.

| Bilgi | Kanıt türü / sınır |
|---|---|
| Workflow bir app secret taşımalı; backend doğrulamalı | Kullanıcının aktardığı yeni destek beyanı; destek kaydına bağımsız erişilmedi. Kullanıcı scheduler'a özgü shared secret'ı açıkça kabul etti. |
| Workflow `auth.me()` kimliği belgelenmemiş; service role çağıranı doğrulamaz | Destek aktarımı ve korunan güvenlik kararı. Kullanıcısızlık kendi başına makine yetkisi değil. |
| Başarı, cihaz görünmesi değil provider kabulüdür | Destek beyanı; başarıyı temsil eden somut SDK yanıtı hâlâ bilinmiyor. |
| `secrets.get` istek içinde string/undefined döndürür | Güncel resmî runtime belgesi. Bu paket gerçek entry'ye bu çağrıyı eklemez. |
| Secret değişikliği/silme ve yayın etkisi | Resmî set/delete ve developer-tools belgeleri; Shinka ortamlarında canlı denenmedi. |
| Karşılaştırma, yetki ayrımı ve negatifler | Yerel Node/Chromium/WebKit fixture kanıtı; gerçek workflow, secret kaydı veya cihaz teslimi değil. |
| Kesin push parametreleri, native User eşleşmesi, yanıt/hata/no-device, uygunluk ve idempotency | **UNVERIFIED**. Önceki Base44 AI aktarımı doğrulanmış platform şeması seviyesine yükseltilmedi. |

Bu karar önceki keyless/admin-session-only scheduler yorumlarını değiştirir; `SHINKA_WRITE_MODE` geri gelmez. [029–031 bildirim kanıtı](SHINKA_NOTIFICATIONS_029.md) ve [032 native hazırlık/cihaz planı](SHINKA_NATIVE_NOTIFICATION_READINESS_032.md) korunur.

## Uygulanan dar değişiklik

`notificationMachineAuth.js`, `node:crypto.timingSafeEqual` ile eşit uzunlukta credential byte'larını karşılaştıran küçük, yalnız sunucuda kullanılacak modüldür. **Shinka'nın önerdiği biçim**, kriptografik güvenli rastgele 32 baytın 64 küçük hex karakterle gösterimidir. Bu Base44'ün tanımladığı bir alan/format değildir. Yerel fixture'lar kasıtlı sabit/sentetik değerler kullanır; gerçek secret üretilmedi.

Factory kurulurken secret okunmaz. Dönen callback her admission'da okuyucuları çağırır; global/module-load secret veya yetki önbelleği yoktur. Eksik/boş/yanlış biçimli/okunamayan config `NOTIFICATION_AUTH_UNAVAILABLE`, geçersiz credential `NOTIFICATION_MACHINE_AUTH_REQUIRED` ile kapanır. Değerler trim/normalizasyon veya ham hata çıktısıyla sızdırılmaz. Sabit boyutlu biçim dışında erken reddetme vardır; tüm HTTP işleyicisinin süre eşitliği iddia edilmez.

`handleNotificationSchedule` yalnız güvenilir sunucu bileşiminden verilen `admitMachine` callback'ini kabul eder. İstek gövdesi/header değeri bir JavaScript callback'i veya çağrı modu seçemez. Makine yolu doğrulamadan önce SDK istemcisini bile oluşturmaz; sonra mevcut admission sınırlarında yeniden kontrol eder. User/admin nesnesi veya `auth.me()` taklidi üretmez. Secret sahibi olmayı doğrular; belirli bir workflow/run veya mevcut admin rolünün kimliğini kanıtlamaz. Manuel yol eski güncel native User/admin/lifecycle ve sabit kimlik kontrollerini korur; hatalı makine doğrulamasından admin oturumuna fallback yoktur.

Mevcut POST, 512-byte sınırlı `{action:"tick"}` gövdesi korunur. Keyfî alıcı, mesaj, tarih, rol, workflow veya checkpoint alanı kabul edilmez. Alıcı varlığı, ACTIVE/profil tamamlanması, yaşam döngüsü, gizlilik/onam, tercih/cihaz uygunluğu, günlük içerik bağımsızlığı ve yazma/gönderim öncesi kontroller değişmez. Ortak admin/privacy/owner/daily/delivery modülleri korunur. Worker kilidi ve readback dağıtık kesin-bir-kez garantisi değildir.

**Gerçek entry:** karşılaştırma modülünü import etmez, secret okuyucusu/transport parser'ı veya `admitMachine` bağlamaz; `enabled:false` kalır. Geçerli admin DISABLED/processed:0 alır; kullanıcısız gerçek giriş hâlâ reddedilir. Yerel bir fixture, gerçek entry'nin aynı kapalı seçeneklerine hazırlanan doğrulamayı enjekte ederek geçerli makine credential'ının da iş başlatmadığını ayrıca gösterir. Bu enjeksiyon üretimde yoktur.

Push adapter'ında yalnız kanıt açıklaması güncellendi. Her fulfilled promise veya 2xx için sonuç hâlâ UNKNOWN; SENT/ACCEPTED eşlemesi, kör retry veya alternatif kanal eklenmedi. Intent/readback/IN_FLIGHT/UNKNOWN kayıtları korunur.

## Güvenli kayıt, bağlama ve yayın sırası — kullanıcıda

1. **Şimdi:** gerçek bağlantıyı kapalı tut. Önerilen ad `SHINKA_NOTIFICATION_SCHEDULER_SECRET`; yalnız bu scheduler'a ayrılır. Eski admin-preview, GeoNames, kullanıcı session veya `SHINKA_WRITE_MODE` değerini kullanma. Bu adın platformda mevcut olduğu iddia edilmiyor; burada secret listesi/değeri okunmadı.
2. **Örnek geldikten sonra:** destek örneğinin workflow secret'ı nasıl güvenli referansladığını, hangi kanaldan backend'e taşıdığını ve çalıştırma geçmişinde nasıl maskelediğini doğrula. URL/query/body'ye veya workflow kaynak metnine düz secret yazma. Bu paket bir header adı ya da secret-reference sözdizimi önermiyor. Taşıma sözleşmesi gelmeden bağlama yapılmaz.
3. **Kayıt:** güvenli bir credential yöneticisinde uygun rastgele değeri kullanıcı hazırlar; yalnız ilgili Base44 uygulamasının Dashboard → Settings → Secrets / environment variables alanına doğrudan girer. Workspace API anahtarı veya frontend `VITE_*` değişkeni oluşturma. Secret'ı sohbet, Git, komut satırı geçmişi, test çıktısı veya Health'e koyma. Ekran bu menüyü sunmuyorsa alanı tahmin etmeden yetkili Base44 secret yönetimini kullan.
4. **Kod bağlama:** kayıt ve taşıma doğrulandıktan sonra ayrı, gözden geçirilmiş değişiklikte runtime reader yalnız request içinde çalışacak şekilde gerçek entry'ye bağlanır. Önce **enabled:false** ile eksik/yanlış/eski credential reddi ve geçerli credential için DISABLED/0 iş kabulü doğrulanır. Genel admin guard'ı değiştirilmez. Şu paket kayıtsız `secrets.get(...)` çağrısıyla yayına hazır ilan edilmez.
5. **Yayın sırası:** mevcut Test → main sahibi akışıyla tüm gerekli backend/shared kodu senkronize et; matching kapalı entry'yi önce incele. Preview/test ve workflow'un kullandığı güncel backend ile yayımlanmış sürümü ayrı doğrula. Main Publish bütün main değişikliklerini birlikte taşır. Secret kurmak veya kapalı bağlamayı doğrulamak gerçek gönderim izni değildir.
6. **Aktivasyon:** kesin push sözleşmesi, native hazırlık ve seçilmiş test hesabında açık kullanıcı izni gelmeden workflow oluşturma/çalıştırma veya gönderim açma. [032 aşama A/B planı](SHINKA_NATIVE_NOTIFICATION_READINESS_032.md) hâlâ **NOT_RUN**.

### Preview/prod ve rotasyon

[Resmî secrets set](https://docs.base44.com/developers/references/cli/commands/secrets-set) yeni/değişmiş değerin deployed backend'e hemen ulaştığını, editor-published sürümün yeniden Publish edilene kadar eski değeri tutabileceğini söylüyor. [Secrets delete](https://docs.base44.com/developers/references/cli/commands/secrets-delete) silme için aynı ayrımı yapıyor. [Developer tools](https://docs.base44.com/documentation/building-your-app/developer-tools#editing-a-backend-function) yeniden dağıtımın preview/test/workflow'da hemen, live app'te Publish sonrası kullanılmasını açıklıyor. Dolayısıyla yalnız Preview başarısı prod rotasyonu değildir; Git Test dalı da veri/secret izolasyonu kanıtı değildir.

Eski admin secret'ı biliyorsa rol düşürme onu iptal etmez. İptal/rotasyonda kullanıcı önce ilgili schedule'ı durdurur; kapalı backend kodunu ve gerekli Publish'i doğrular, eski secret'ı siler/değiştirir ve güvenli workflow referansını günceller. Eski ve yeni sürümlerde eski değerin reddini, yeninin kapalı işleyicide DISABLED/0 iş sonucunu ayrı kontrol eder; sonra yalnız gerekli kabul ve izinlerle devam eder. Eski değere otomatik fallback veya iki secret'ı aynı anda kabul eden geçiş yoktur. Yanlış sırada kesinti fail-closed olur; gönderimi açık tutmak için gevşetilmez.

Request-time tekrar okuma bir sonraki admission'da görülebilen değişikliği yakalar. Platformun devam eden request'e aynı secret snapshot'ını vermesi, farklı worker/yayın sürümleri ve daha önce gönderilmiş provider isteği için **anında durdurma/geri alma garantisi yoktur**. Kalan intent/UNKNOWN kayıtlarını uzlaştırmadan kör yeniden gönderim yapma. Buradaki durdurma prosedürü yalnız scheduler credential yaşam döngüsüne aittir; genel uygulama yazma modu değildir.

## Health ve kanıt kapsamı

**Add 0 / update 3 / delete 0:**

- **H14-003:** NM01–08 browser fixture'ları; makine admission callback'i testte değiştirilir. İş başlamadan reddetme, admin yetkisi üretmeme, kapalı/gövde kuralları, null auth ile dar çalışma, alıcı/onam kontrolleri, admission kaybı ve UNKNOWN suppression. Bunlar crypto uygulamasını çalıştırmaz.
- **H14-004:** SM01–07 gerçek Node crypto karşılaştırması + sentetik secret okuyucuları; NS01–11 gerçek entry/platform import substitution. NS10 bağlı olmayan girişin credential'ı kabul etmediğini; NS11 yalnız testte bağlanan makine verifier'ına rağmen entry'nin DISABLED kaldığını gösterir. Önceki NU/NC/NP/NT assertion'ları kaldırılmadı.
- **H14-901:** yalnız yerel hazırlık kısmı güncellendi; gerçek kayıt/transport ve provider kabulü hâlâ dış kabul. **H16-901** fiziksel kabul olarak değişmeden açık.

Katalog/plan: 175 toplam, 149 in-app, 12 local, 14 external, 0 future; H14 backend planı [001,002,003]. Hiçbir secret/dosya varlığı native PASS üretmez. Internal Build **029–033**; önceki başarısızlık kanıtları korunur.

### Gerçek yerel koşular

Test edilen temel kaynak `c9d2d04a1176f9e936456eaddaf14dd420d81721` + 033 değişiklikleridir. [501 dosyalık browser manifesti](scheduler-authorization-033/browser-source-manifest.json) hash'i `4f545b0bd08b8189add73dbeb7881ffac941e82cc62f1576cc2537f1306adf46`; [son kaynak manifesti](scheduler-authorization-033/source-manifest.json) `ca44aac3972a706a3360d06988bae78605cd6699dfe60b1146d5e33cceebdd17`. Sonradan sonuç yazılan ledger/prose bu kapsamın dışındadır.

| Yeni 033 yürütmesi | Sonuç | Çalışmayan / sınır |
|---|---|---|
| Chromium 156.0.8078.4 | **632 PASS / 0 FAIL** | Eksik ID ve page error yok; desktop engine + sentetik SDK |
| WebKit 27.2 | **632 PASS / 0 FAIL** | Eksik ID ve page error yok; fiziksel iPhone değil |
| Her canonical komutta Node fixture'ları | **8/8 server + 11/11 entry + 7/7 crypto** | Browser test sayısına eklenmedi; hosted Deno/secret/workflow değil |
| In-app Health, her motor | **136 PASS / 0 FAIL / 13 BLOCKED** | H04-019, H05-001–009, H08-005, H09-004, H12-031 hosted önkoşulları; PASS sayılmadı |
| Temiz install, tree/depth, audit/security, typecheck, lint, build, Repo Health, history, performans | **PASS**, audit tüm seviyelerde **0** | İlk typecheck hatası aşağıda korunur; npm'in mevcut min-release-age-exclude uyarısı sürer |
| Üretim başlangıç byte'ları | JS **479543 / 160179 gzip**, CSS **77521 / 14262 gzip** | Mevcut bütçeler içinde; saha p75/INP ölçülmedi |
| Gerçek kayıt/transport/push/native cihaz | **NOT_RUN / UNVERIFIED** | H14-901/H16-901 kapanmadı |

NM01–08, NT01–23, NC01–09, NP01–07, NU01–03 ve O32/NA07/NA22/SC06/SC10/SC11 iki motorun bireysel sonuç listelerinde PASS. SC01–05/07–09 ana runner'dadır. Odaklı ilk Chromium koşusu 11/11 geçti; tüm yeni crypto/entry kontrolleri Node'da ayrıca çalıştı.

Yeni server-only modül typecheck kapsamına açıkça alınınca `unknown` değerinin TextEncoder'a aktarılması tip hatası verdi. Yalnız JSDoc `value is string` tip daraltması eklendi. [İlk hata](scheduler-authorization-033/initial-failures.json), [çalışan kodun aynı kaldığının kontrolü](scheduler-authorization-033/post-browser-source-check.json) ve [son 11 entry + 7 crypto yeniden koşusu](scheduler-authorization-033/server-final.json) korunur; typecheck tekrar geçti. Assertion veya güvenlik koşulu kaldırılmadı. Etkilenmeyen tam browser koşuları bu yorum düzeltmesi için gereksiz tekrarlanmadı.

[Verification](scheduler-authorization-033/verification.json), [kalite kapıları](scheduler-authorization-033/quality-gates.json), [Chromium](scheduler-authorization-033/chromium.json), [WebKit](scheduler-authorization-033/webkit.json), [case kapsamı](scheduler-authorization-033/chromium-case-audit.md). 032'nin önceki 624/624 sonucu yeni koşu sayılmadı.

### Ayrı admin ve makine ölçümü

Aynı başlangıç state hash'i, saat, sentetik owner/provider ve ürün sonuçları kullanıldı. Admin sonuçları 031 ile birebir karşılaştırıldı; makine yolu farklı çağıran yetkisini ölçer, bir hız/credit kazancı iddiası değildir. Makine ölçümünde gerçek karşılaştırma modülü, sentetik okuyucular kullanıldı.

| Senaryo | Admin entity read / auth.me | Makine entity read / auth.me / credential check | İkisinde write / eligibility / sentetik send |
|---|---|---|---|
| existing-intent | **69 / 12** | **36 / 0 / 11** | **4 / 1 / 0** |
| accepted-dispatch | **104 / 15** | **62 / 0 / 14** | **4 / 3 / 1** |
| settled-pass | **46 / 9** | **22 / 0 / 8** | **2 / 0 / 0** |

[Karşılaştırma ve komut makbuzları](scheduler-authorization-033/cost-comparison.json). 031 admin bütçeleri ve ürün sonucu korunur. Her makine admission'ı secret/credential okuyucusunu yeniden çalıştırır; `auth.me()` sonucu makine yetkisi için kullanılmaz. Gerçek provider gönderimi **0**.

## Destekten kalan somut bilgiler

- App secret'ın güvenli workflow referansı ve backend taşıma örneği; log/history maskeleme, ortam/yayın ve iptal davranışı. Yeni bir genel kimlik sorusu değil, uygulanabilir anahtarsız örnek gerekiyor.
- Çalışır push çağrısının kesin parametreleri ve native User eşlemesi; başarı kabulünün somut SDK yanıtı, hata/no-device örnekleri.
- Uygunluk/izin API'si ve idempotency/yeniden gönderim davranışı; bunların bulunmadığının açık teyidi de geçerli bir sınırdır. Böyle bir yanıt gelirse alternatif, kabul edilen risk ve mevcut ürün kurallarıyla ayrıca değerlendirilir; bu aşamada UNKNOWN izin değildir.

## İncelenen resmî kaynaklar ve teslim sınırı

Kaynaklar **2026-10-23** yerel tarihinde incelendi; destek aktarımından ayrı tutuldu:

- [Base44 runtime secrets](https://docs.base44.com/developers/backend/resources/backend-functions/overview#read-secrets): request-time read; module-load undefined.
- [Secrets set](https://docs.base44.com/developers/references/cli/commands/secrets-set), [delete](https://docs.base44.com/developers/references/cli/commands/secrets-delete), [set-secret API](https://docs.base44.com/api-reference/set-secret): güncelleme/yayın ayrımı, sunucu kapsamı; API beta. Hiçbiri çağrılmadı.
- [Backend edit/redeploy](https://docs.base44.com/documentation/building-your-app/developer-tools#editing-a-backend-function): preview/workflow ile live sürüm ayrımı.
- [Workflows](https://docs.base44.com/Building-your-app/Creating-workflows): genel yürütme modeli; gerekli secret-reference/transport örneğini sağlamıyor.
- [Deno node:crypto timingSafeEqual](https://docs.deno.com/api/node/crypto/): yerleşik eşit-byte-uzunluk karşılaştırması. Yerelde Node'da çalıştırıldı; Base44 hosted Deno runtime'ı burada çalıştırılmadı.

Gerçek secret üretimi/kaydı/okuması, workflow oluşturma/çalıştırma, push, canlı Full Health/Security scan/import/kullanıcı işlemi, native build, main merge veya publish yok. Mevcut **12 bulgu OPEN / USER-DEFERRED**. Tamamlanan kod ve rapor Test üzerinden teslim edilir; hosted kayıt/bağlama/yayın ve fiziksel kabul kullanıcıdadır.
