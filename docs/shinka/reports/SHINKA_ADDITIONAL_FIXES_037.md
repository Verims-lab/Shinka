# Shinka 037 — beş ek düzeltme

**Buildmarker-037 / HC-037.0 · 2026-10-27 · Test teslimi**

**Kaynak commit:** [`62160a3`](https://github.com/Verims-lab/Shinka/commit/62160a38583c053a7a6490eb5d62f46bc4c1b16d); sonraki commit yalnız bu makbuzu tamamlar.

**LOCAL_VERIFIED_HOSTED_PENDING.** Tam makbuz: [verification.json](additional-fixes-037/verification.json); çalıştırılan kaynakların [SHA-256 listesi](additional-fixes-037/tested-source-manifest.json). Önceki 036 sonuçları yeniden kullanılmadı.

Başlangıçta `Test = origin/Test = 1e331e42cbef432661b7ef0e64581aa28f012715`, çalışma ağacı temiz; main `ac0a1b4` karşısında Test 2 commit ilerideydi. Kullanıcı değişikliği/reset/force yok. AGENTS/README ve Base44 CLI/SDK becerileri kullanıldı; beceriler geçici araç klasöründe güncellendi. Base44 hosted erişim/oturum yenileme denenmedi. Salt okunur Git main 035 ve Test 036 karşılaştırıldı; ikisinde de yeni beş-adım yapısı ve privacy bağlantısız başlık var. Bu, hosted kaynak parmak izi değildir.

| Bulgu | Kanıtlanan neden | Düzeltme | Test | Kalan kabul |
|---|---|---|---|---|
| Dolu isim Skip ile silinebiliyor | ON-02 handler koşulsuz clear/advance; disabled yoktu | Trim sonrası dolu isimde disabled ve güncel ref üzerinden handler kontrolü; Continue/normalizasyon korunur | FX01, OU01, O01/O02, auth-return gerçek profile save | Yayın sonrası TR/EN klavye/geri/yeniden giriş |
| ON-05 privacy bağlantılı 5/6 görsel | Güncel 036 kaynak zaten beş adım ve privacy bağlantısız; ekran görüntüsü kaynakla farklı | İkinci gizleme eklenmedi; You/direct route/guard/onam korundu | FX01, U18, OU/OV, You/privacy regresyonları | Salt okunur Git main 035 de beş adım/privacy bağlantısız; exact hosted bundle/cache eşleşmesi doğrulanmadı, canlı tanı ertelendi |
| Gelecek gerçek başlangıç | Fresh native yol validatePeriodChange ile zaten reddediyordu; PENDING initial grant recovery ve APPLIED/same-result shortcut önce çalışıyordu. Eski future row calculateCalendar’ı durduruyordu. Canlı kaydın gerçekten varlığı doğrulanmadı | Shared tarih guard’ı recovery/replay ve her sağlık yazısı önüne; UI disable+handler; belirli future-row uyarısı ve düzeltme/silme erişimi; readback doğrulaması | CF01–05, FX02, CA/NA/CU; server IANA midnight/month/year ve sıfır yazı | Kullanıcı mevcut hesabında yalnız seçili/tahmini/gerçek kaydı ayırsın; otomatik veri onarımı yok |
| OS dark Home | Mevcut sistem media listener + semantic dark palette, önceki ürün kararına uyuyordu | Yeni karar light-only: binding/listener/palette kaldırıldı; static CSS + startup meta; merkezi watercolor ve a11y korunur | T39/T75/T79/T81/H13; 9 yüzeyde OS light/dark başlangıcı/değişimi + contrast/200% | Fiziksel OS pencereleri ve wrapper barları ölçülmedi |
| Home Yenile | RefreshControl gesture ve button’ı birlikte render ediyordu | Home showButton=false; hiçbir gizli click target yok; passive pull/cleanup, last confirmed cards ve hata Retry korunur | Gerçek App checkMobileInteractions, DU/OV/NA/OF ve Calendar refresh regresyonu | Yayın sonrası mobil pull/Retry aynı gün ID/snapshot kabulü |

## Yetki ve kapsam

Base44 tek authority, mevcut kimlik/owner/ACTIVE/onam/lifecycle kontrolleri korunur. Şema değişikliği yok. Native receipt bir transaction/lock değildir; tarih sınırı istek sürerken değişirse PENDING kayıt kalabilir, otomatik rollback iddiası yoktur. Mevcut grant zamanı yeniden üretilmez. Çelişen data hataları genel olarak yutulmaz; yalnız CALENDAR_FUTURE_RECORD read/repair görünümü açar. Gerçek profile/health satırı okunmadı/değiştirilmedi; canlı Full Health, import/provider probe/push/main/publish çalıştırılmadı. 12 backend bulgusu USER-DEFERRED kalır. 036 altı düzeltme ve kanıtları korunur.

## Health ve dokümanlar

0 add / 8 update / 0 delete: H08-002, H08-004, H12-027, H13-001, H13-010, H13-012, H13-015, H07-013. Aynı 175 case / 149 in-app / 12 local / 14 external; backend closed plan ve execution scope aynı IDs ile HC-037.0. CF01–05 backend/synthetic, FX01–02 LOCAL_BROWSER; eski system-dark beklentileri yeni light/token/form/watercolor ve gerçek OS matrix ile değiştirildi. SOURCE_OF_TRUTH, UI_UX, BUSINESS_FLOW, ARCHITECTURE, CODE_STANDARDS, DEVELOPMENT_RULES/NOTES, RELEASE_HEALTH, Android/iOS raporu ve generated history eşlendi. Tek paket; aktif 033–037.

## Gerçek doğrulama ve ilk başarısızlıklar

- Chromium **156.0.8078.4: 674/674**, WebKit **27.2: 674/674**, her ikisi exit 0 / sıfır page error. CF01–05, FX01/02 ve önceki OF01–04/OV01–06 dahil gerekli ID listeleri [Chromium](additional-fixes-037/chromium-test-index.json) / [WebKit](additional-fixes-037/webkit-test-index.json) içinde. Son boş Home satırı düzeltmesinden sonra iki tam koşu yeniden yapıldı.
- Her motor: 6 gerçek locale/time kontrolü, 150 mobile-experience, 87 compatibility, 5 Home, 8 Calendar, 22 Pattern, 24 You, 23 privacy ve 4 admin-test akışı. OS açık/koyu başlangıcı ve runtime değişimi, 320px/landscape, 200% metin, contrast/focus/gesture ölçümleri yereldir. Fiziksel Android/iOS **NOT_RUN**.
- Yerel in-app Health **136 PASS / 0 FAIL / 13 BLOCKED**; 13 hosted/content ön koşulu sentetik PASS yapılmadı. Save/retrySave, liste ve private report açma geçti. Detaylı case-audit ve sonuç JSON’ları aynı kanıt klasöründedir. H13-012/015 ve diğer UI koşuları LOCAL_BROWSER olarak kalır.
- `npm ci` (457 paket), `npm ls --all --json`, fresh `npm audit --json`, `security:deps`, typecheck, lint, build, Repo Health, son-beş ledger kontrolü, Node session ve üretim performans/lazy-retry kapıları geçti. Audit **0 advisory**. Kullanımı biten `next-themes` kaldırıldı; npm ayrıca dört kullanılmayan optional/peer lock girdisini temizledi. Kalan paket sürümleri değişmedi.
- Initial JS **483391 raw / 160917 gzip**, CSS **77728 / 14239** byte; mevcut 500000/165000 ve 90000/16000 sınırları aşılmadı. Import cycle yok; ölçüm loopback/sentetik transport, field/hosted performans iddiası değildir.
- [İlk başarısızlıklar](additional-fixes-037/initial-failures.json) korunur: DOM tip/iterable düzeltmeleri; FX01’in gerçek locale render’ını beklemesi; T81’in temel ivory yerine mevcut onaylı watercolor token’ını ölçmesi; eski U02’nin dolu uzun adı Skip ile temizleme beklentisinin yeni kurala geçirilmesi. İlk tam koşular 673 PASS / 1 FAIL (U02) idi; başka flow failure/page error yoktu. Timeout/validasyon azaltılmadı. Mevcut npm config/dynamic-import uyarıları bastırılmadı.

Home normal durumda boş bir 44px satır da bırakmaz; yalnız durum/gesture gerektiğinde feedback görünür. [Home görsel kanıtı](additional-fixes-037/home-os-dark-light-app-320-200percent.png) sentetik Ada hesabı ile OS dark + 320px/200% koşuludur; gerçek kullanıcı görüntüsü/verisi değildir.

## Yayın ve kullanıcı kabulü

1. GitHub Test → main merge kullanıcıda. Base44 Main Git sync’in bu teslim kaynak commit’ini içerdiğini doğrulayın; Test/Preview ayrı veri tabanı değildir.
2. Şema delta yok; entities push/import yok. Önce backend entry/shared kodları aynı sync’te: özellikle calendar + calendarOperation/calendarCalculation/nativeCalendarPersistence/nativeCalendarGrant/base44CalendarReader; ortak nativeClient, applicationSession, onboarding, dailyMessage, internalHealth ve Health version/plan/scope aynı kaynak setinde olmalı. Ardından frontend’i aynı sync’ten Publish edin. CLI deploy ile akış bypass edilmedi.
3. Yeni sekmede/tam reload ile Buildmarker-037 / HC-037.0 ve beş ana adım (ON-05 privacy yok) doğrulayın. Sürüm etiketi tek başına eski asset/function olmadığını kanıtlamaz; kaynak hash makbuzuyla eşleyin. Eski 5/6 başlık sürerse sync/asset farkını çözün.
4. Kullanıcı yayın sonrası Full Health’i çalıştırıp kaydeder, listeler ve raporu açar. Yerel fixture Health hosted PASS yerine geçmez.
5. Aynı hesapları reset/silmeden TR/EN ad dolu→Skip disabled, boş→enabled ve Continue→auth→profile adını; future ay browse/prediction ile actual record ayrımını doğrulayın. Today/past geçerli tarihler kabul, future add/edit açıklamalı red; eski gerçek future row varsa normal edit/delete. Health verilerini/tokenları rapora koymayın.
6. Android/iOS OS dark açılışı/değişiminde tüm app yüzeyleri light, Home normal Refresh yok; pull ve hata Retry aynı gün günlük ID/pair/snapshot’ını korur. Fiziksel klavye/date picker/bar/zoom kabulünü ayrı kaydedin. Eski İlk Shinka canlı tanısı ve orijinal ON-05 aynı hesap kabulü açık kalır.
