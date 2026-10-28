# Shinka — Bildirim tercihi, adım 1 / 044

**Buildmarker-044 / HC-043.0 — LOCAL_VERIFIED; hosted/native kabulü açık.**

Başlangıçta temiz Test ve origin/Test `9161937` idi; main `3b9fc0c` dört commit ilerideydi. Test main’e fast-forward edildi. Base44’ün oturum retry, Vite plugin ve Home/Calendar/Pattern başlık kararları korundu. Son teslim kontrolünde main aynı kaldı. Test teslim commit’i bu raporu içerir; commit ve uzak dal eşitliği teslim mesajında belirtilir. Main merge/publish kullanıcıda. Aktif Internal Build geçmişi script ile **040–044** üretildi.

## Tamamlanan davranış

- Profil’de **kayıtlı tercih**, **kaydedilmemiş seçim**, **kaydı kontrol etme** ve **sonucu belirsiz kayıt** ayrıldı. Başarı yalnız mevcut backend’in VERIFIED okumasından sonra görünür. Hata/aynı kayıt kontrolü/tekrar deneme ve başarı mesajı tercih formunun yanında.
- Mevcut `youController`/service/backend revision ve readback akışı kullanıldı. Kayıp yanıtta taslak ve aynı intent/payload korunur; başarısız kontrol yeni düzenlemeyi açmaz. Yeniden açılışta kayıtlı değer gelir. Yeni kullanıcı false başlar; mevcut true değeri initialize/retry ile ezilmez.
- TR/EN metinleri merkezi `notificationCopy` içinde. “Telefon izni: Doğrulanmadı” ve telefon ayarları yönlendirmesi, uygulama tercihinden ayrı. Tercih açıkken GRANTED/aktif/teslim edildi iddiası yok. Tarayıcı Notification API, uydurma native köprü veya çalışmayan Ayarları aç düğmesi yok. Denied/unknown test prop’ları yalnız sentetik girdidir.
- Gönderimin henüz hazır olmadığı açıkça yazılır. Yerel 06:00 ve mevcut IANA saat dilimi davranışı korunur. Tercih kaydı profil/sağlık/günlük içerik/push üretmez; dil tercihi korunur. Bildirim istememek ürün erişimini kapatmaz; sağlık onamından ayrıdır.
- Gerçek You backend fixture’ından doğrulanmış kapatma, READY veya IN_FLIGHT kaydından sonraki güncel gönderim kabulünü engeller. Provider’a ulaşmış çağrı iptal edilmiş sayılmaz; kabul geldiyse gerçek kabul kaydı korunur, tekrar gönderilmez. Dağıtık exactly-once veya network iptali iddiası yok.
- %200 görsel kontrolde bulunan caption satır sıkışması, mevcut token her paragrafa uygulanarak düzeltildi. Klavye etiketleri/açıklamaları, dar ekran ve okunabilir satır yüksekliği doğrulanır.

## Kapsam içinde giderilen regresyonlar ve korunan kanıt

Main-043’ün iki 700/1400ms gerçek oturum retry beklemesi, SS06’nın çoklu hata senaryolarını 20 saniyelik test sınırının üzerine taşıyordu. Üretim retry sayısı/süresi korunarak iptal edilebilir wait enjekte edildi; çıkış, hesap değişimi, üyelik reddi, unmount ve geri yükleme sınırları bekleyen timer’ı temizler. SS06 aynı çağrı/süre sözleşmesini; SS12 gerçek timer iptalini ve eski hesaptan yeni retry çıkmamasını doğrular. Uçuşta olan SDK çağrısının iptal edildiği söylenmez. Arka plan yavaşlatması veya provider arızası kök neden ilan edilmedi.

Tam koşu, 043’te kaldırılan EN düğmesini tıklayan CU05/CU06’yı buldu. Aynı Calendar instance’ına güncel dil prop’u uygulanarak TR/EN ve kayıt kurtarma kapsamı korundu; düğmeler geri eklenmedi. WebKit macOS varsayılan Tab davranışı küçük yerel HTML ile ölçüldü: Tab düğmeyi atlıyor, Option+Tab odaklıyor. Aynı submit-focus assertion’ı uygun tuşla korunur. NU05’in erken DOM okuması, gerçek sonuç geçişini bekleyecek şekilde düzeltildi. Assertion/timeout/güvenlik kontrolleri gevşetilmedi.

[İlk başarısızlık özeti](notification-preferences-044/initial-failures.json), [ilk Chromium çıktısı](notification-preferences-044/chromium-initial.txt), [ilk WebKit çıktısı](notification-preferences-044/webkit-initial.txt), [ilk %200 görüntü](notification-preferences-044/initial-200percent-lineheight.png) korunur. Son [TR %200](notification-preferences-044/you-webkit-320-tr-2x.png) ve [EN %200](notification-preferences-044/you-webkit-320-en-2x.png) ayrı kanıttır.

## Gerçek yerel sonuçlar

| Kontrol | Sonuç ve sınır |
|---|---|
| Tam Chromium 156.0.8078.4 | **714 PASS / 0 FAIL**, 714 benzersiz ID, 0 page error |
| Tam WebKit 27.2 | **714 PASS / 0 FAIL**, aynı ID kümesi, 0 page error; fiziksel iOS değildir |
| Yeni/ilgili regresyonlar | Yeni NU04–06, NT24/25, SS12; NU01–03, P03, SS06, mevcut You/yetki/yaşam döngüsü ve notification testleri geçti |
| Profil gerçek App/React yüzeyi | Her motorda **24 senaryo**; 5 genişlik × TR/EN × normal/%200 = 20 geometri/klavye kontrolü; kayıt/dil/navigation/logout ve rol kontrolleri |
| Yerel in-app Health | Her motorda **138 PASS / 0 FAIL / 13 BLOCKED**; save, retry-save, liste ve özel rapor açma geçti |
| Node sunucu runner’ları | Admission **8/8**, session **9/9** |
| Canonical runner’ın sunucu/native kontrolleri | Her koşuda **8 server**, **11 notification entry**, **SDK01** loopback; native session 7, route 5, artifact 2, deletion entry 7 kontrolü geçti. Dış provider çağrısı yok |
| Kalite | npm ci/tree, typecheck, lint, build, Repo Health, history, dependency/security kapıları PASS; **0 bağımlılık açığı** |
| Mevcut performance kapıları | JS **471292 raw / 155952 gzip**, CSS **77682 raw / 14230 gzip** bayt; 500000/165000 ve 90000/16000 sınırları PASS; 0 import döngüsü, 9 route × 3 örnek ve lazy-load retry geçti |

13 BLOCKED: H04-019, H05-001–009, H08-005, H09-004, H12-031. Bunlar yerel sentetik transportta bulunmayan hosted kanıt önkoşullarıdır; canlı arıza veya yeni PASS olarak yorumlanmaz. [Makine özeti](notification-preferences-044/verification.json), [Chromium](notification-preferences-044/chromium.json), [WebKit](notification-preferences-044/webkit.json), [kalite](notification-preferences-044/quality-gates.json), [performance](notification-preferences-044/performance.json). Son **535 executable/config/harness dosyası** [hash manifesti](notification-preferences-044/tested-source.json) ile bağlandı ve koşu sonrası eşitliği tekrar kontrol edildi. Doküman/kanıt ve üretilen ledger bu hash kapsamı dışında. Ölçümler yerel, sentetik ve throttling uygulanmamış laboratuvar sonuçlarıdır; saha performansı iddiası değildir.

## Health ve doküman eşlemesi

**Ekleme 0 / güncelleme 5 / silme 0.** H14-004: NU01–06 + mevcut NS/SDK; H14-003: NT24/25; H13-018: gerçek Profil klavye/açıklama/%200 kontrolleri; H12-025: kontrollü retry + SS12; H05-009: onaylı 044 için aynı kesin kaynak/hash/sayım politikası. Bir sonraki onaysız paket hâlâ engellenir; import yapılmadı. P03 mevcut default ve kayıt koruma case’inin testini güçlendirir. CU05/CU06 aynı dil ve kurtarma davranışını yeni başlık sözleşmesiyle test eder, Health iddiasını azaltmaz.

Registry: **177 toplam / 151 in-app / 12 local / 14 external**. [Chromium case eşlemesi](notification-preferences-044/chromium-audit/case-audit.json) ve [WebKit eşlemesi](notification-preferences-044/webkit-audit/case-audit.json) gerçek kaynak ve sonucu içerir. H14-901/H16-901 dış kabul olarak açık. UI/UX, iş akışı, kaynak otoritesi, gizlilik, mimari, kod/geliştirme kuralları, Release Health ve geliştirme notları hedefli güncellendi; tarihsel başarısızlıklar korunur. 029/033 eski secret yaklaşımı yeniden açılmadı; [042 Support sözleşmesi](core-audit-042/support-contract.md) geçerli.

## Kullanıcıya kalan yayın ve cihaz kabulü

Mevcut akışla Test’i main’e alın; uyumlu shared/Health metadata ve frontend’i birlikte sync/publish edin. Schema/import, secret, workflow veya native anahtar değişikliği gerekmiyor. **notificationSchedule enabled:false kalmalı.** Bu pakette canlı kullanıcı işlemi, canlı Full Health/Security scan, push, scheduler/workflow oluşturma, native build/anahtar veya mağaza işlemi çalıştırılmadı.

Sonraki aşama için kısa liste:

1. Yayınlanmış uygulamada Profil aç/kapat–kaydet–yeniden aç ve kayıt belirsizliği/aynı intent kurtarmasını kabul edin; istenen yayın sonrası Full Health’i kullanıcı çalıştırır.
2. Fiziksel Android/iOS’ta sistem izni reddi/bilinmiyor, telefon ayarları yönlendirmesi, font büyütme/klavye, TalkBack/VoiceOver ve hesap değişimi/çıkış kontrolü: **NOT_RUN**. Sentetik izin testleri bunları kapatmaz.
3. Ayrı native/workflow kabul aşamasında kurulum, gerçek creator-admin/owner-fallback, provider kabulü ile ekranda teslim ayrımı, foreground/background/kapalı uygulama ve bildirime dokunarak Home doğrulanmalı. **H14-901/H16-901 açık**; bu teslim gönderimi etkinleştirmez.
