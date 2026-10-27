# Shinka 036 — altı onboarding düzeltmesi

**Buildmarker-036 / HC-036.0 · 2026-10-27 · Test teslimi**
**Kaynak commit:** [`733956d`](https://github.com/Verims-lab/Shinka/commit/733956db4caacede320e9301e10e568ed7ad06be); takip eden commit yalnız bu teslim makbuzudur.

**Durum:** **LOCAL_VERIFIED**; yayın ve hosted olay kabulü kullanıcıda. Kaynak/commit ve son komut makbuzları [verification.json](onboarding-closure-036/verification.json) içinde.

## Başlangıç, kaynak ve canlı kanıt sınırı

Kullanıcı isteği: `9b08acc7-f978-4827-acc3-e29781663998/Pasted text.txt`; üç ekran görüntüsü olay kanıtıdır. Temiz lokal ve origin/Test `14bfc7922ec9fb1bae0dc931495f5fd9dfa25cba` aynıydı. Fetch sonrası main `ac0a1b4`, iki commit ilerideydi. `git merge --ff-only origin/main` ve `git push origin Test` ile eşitlendi; reset/force/ezme yapılmadı. Main’deki Base44 belge güncellemeleri ve 035 kaynakları korundu. AGENTS/README, Base44 CLI/SDK/troubleshooter becerileri ve canonical standartlar kullanıldı; beceriler geçici araç klasöründe güncellendi, uygulama bağımlılıkları değiştirilmedi.

Görsellerde 4/6–6/6, eski hiyerarşik birthplace ve Account & Privacy başlığı var. Senkronize kaynakta beş ana adım, numarasız hazırlık, tek A/P arama ve onboarding’de bu menünün yokluğu var. **Görsel, mevcut kaynak görünümüyle eşleşmiyor.** Bunun eski yayın, tarayıcı cache’i veya frontend/backend/shared eşleşmezliğinden hangisi olduğu kanıtlanamadı; Buildmarker tek başına kaynak hash’i değildir. Yayımlanan asset/function/shared içerikleri bu tur fingerprint edilmedi.

Dar salt okunur inceleme: `npx base44 logs --app-id 6ad5190f4845d4e3af03b420 --env prod --function dailyMessage --level error --since 2026-10-27T00:00:00Z --limit 20 --json` API_ERROR / **401** döndü. Bu, kullanıcıdaki dailyMessage isteğinin 401 aldığı anlamına gelmez; yalnız tanı aracının log yetkisi reddedildi. Kullanıcı, CLI oturum yenilemesini ve canlı tanıyı erteleyip yerel teslimi tamamlama kararı verdi. Secret/token/kişisel payload/ham exception rapora alınmadı. Canlı işlem tetiklenmedi.

## Altı madde: bulgu → kanıt → düzeltme → test → kalan kabul

| Madde | Bulgu ve kanıtlanan neden | Uygulanan düzeltme / korunan sözleşme | Bu pakette yürütülen kanıt | Kalan kabul |
|---|---|---|---|---|
| 1. Otomatik dil | Screen kendi manuel TR/EN state’ini tutuyordu; bu tercih kalıcı kullanıcı tercihi değildi. | Düğmeler/onLanguage kaldırıldı. Ortak `resolveLanguage(saved, locale)`: kayıtlı en/tr → cihazın tr/en taban dili → EN. URL/storage geçici dil değerleri bu resolver’a girmez. Initialize varsa kayıtlı tercihi kullanır; hydrate/reset/reopen ve You tercihi korunur. | OF01: varyant/fallback ve gerçek You save→reset→hydrate; OV01: prop değişiminde taslak; CLI: gerçek tr-TR/en-US/en-GB/de-DE browser context, stale URL/storage, ters kayıtlı tercih ve reload; YT/YU regresyonları. | Fiziksel cihaz dili/OAuth dönüşü kullanıcı kabulü; yerel fake SDK gerçek hosted preference kanıtı değildir. |
| 2. Yalnız DOB | Mevcut backend DOB-only’yi destekliyor; güncel kaynakta boş yerin eksik seçim sayıldığı bir hata yeniden üretilemedi. Bu nedenle doğrulamalar gevşetilmedi. | Geçerli yetişkin DOB zorunlu; boş saat ve beş yer alanı NULL. Aç/kapat/iptal boşu zorunlu yapmaz; serbest yer metni/yarım saat hata ve temizleme yolunu korur. Tek aramalı birthplace korunur. | OF02 ve OV02: gerçek form→service→HTTP handler→native adapter→readback→ON-05, sıfır provider construction; OV04: kısa metin hatası→Clear→NULL kayıt. Skip sıfır consent/health yazısı. | Ekrandaki eski yayınla güncel kaynak aynı olmadığı için hosted DOB-only kabulü yayın sonrası yapılmalı. |
| 3. Sol üst geri | 035 açıkça ON-04 Back’i dışlıyordu; yeni kullanıcı kararı bunu değiştiriyor. | ON-02→01, ON-03→02, ON-04→oturumlu welcome, ON-05→04. Welcome Continue aynı taslağa döner; logout/OAuth yok. Hazırlık Back welcome’a gider; Continue hazırlığa ve kalıcı günlük readback’e döner. Başlamış sunucu işi iptal/rollback sayılmaz. Modal önce kendi history katmanını tüketir. | U18, OU01/02/07/08, OV03 (tamamlanmış geç sunucu yanıtı gizli görünümü açmaz; resume tek kayıt), OV06 (hesap değişimi), CLI modal browser Back. | Fiziksel Android/native host geri davranışı NOT_RUN. Backend owner/yaş/completed-owner/reset guard’ları değişmedi. |
| 4. İlk Shinka / Retry | Görseldeki genel hata kök nedeni açıklamıyor. Güncel hook/service içinde kalıcı failed-promise cache veya kilit takılması yeniden üretilemedi. Log erişimi 401; deployed hata kodu, deadline, içerik/Moon/timezone/auth veya sürüm ayrımı hâlâ açık. | Günlük motor değiştirilmedi. Fresh retry, same-day reconciliation ve gerçek persisted sonuç şartı korunur. Service’in güvenli tanınan hata kodları tamamlandı; mevcut yerelleştirilmiş mesajın altında yalnız allowlist kod gösterilir. Deadline aynı 20s, cleanup kontrollü saatle test edilir. Sahte içerik/başarı/koşulsuz Home yok. | OF03/04: deadline/late response, malformed success, consent yolu, create sonrası kayıp yanıt→aynı immutable kayıt; OV02/03/06 ve DU/NA: DOB→Skip→hata→Retry, duplicate click, Back/resume, owner değişimi. | **HOSTED INCIDENT OPEN.** Yerel PASS ekran görüntüsündeki olayı kapatmaz. Kullanıcı sync/publish sonrası aynı hesapla normal Retry ve readback; hata sürerse safe code ve zaman bilgisiyle salt okunur tanı. |
| 5. Klavyeden saat | ON-04 `type="time"` native kontrolü kullanıyordu; mobil klavye yolu uygulama tarafından garanti edilmiyordu. | Tek parent-owned HH:mm text değeri; yazma/paste/düzeltme/clear, 24 saat. 00:00/23:59 geçerli; 24:00/12:60/yarım değer reddedilir. İkon aynı değere yalnız explicit Set uygular; açılışta saat/UTC/default üretilmez. | OV04, CLI keyboard/insertText/select/clear; OF02 server validasyonu ve NULL; U17 geometri. | Gerçek mobil klavye, VoiceOver/TalkBack NOT_RUN. |
| 6. Kesilen Ayarla | İlgili kaynak native `input[type=time]` ve dekoratif ikon içeriyordu; screenshot’taki analog panel uygulamanın DOM’u değildi. O cihazın browser/OS/wrapper varyantı ayrıca gözlenmedi. | Native zaman paneli yerine mevcut dialog/focus/history altyapısıyla app-owned seçim. Hour/Minute geçici seçimi; görünür Ayarla/İptal/Temizle; viewport-bounded scroll. Dialog portalı dış formdan ayrı, submit yayılımı kesilir; iptal eski değeri ve trigger odağını korur. Tarih native takvimi değişmez. | OV04/05 ve her motorda CLI: 320px, %200 metin, 400px azaltılmış yükseklik, scroll ile tüm eylemler, odak/Escape/Back, üç hızlı reopen, Set’in dış formu submit etmemesi. [Yerel görüntü](onboarding-closure-036/time-picker-chromium.png). | Fiziksel Android/iOS ve klavye açık native viewport kabulü NOT_RUN. Emülasyon fiziksel kanıt değildir. |

Saat dialogunun iki seçimi bağımsız ikinci kalıcı saat state’i değildir: açılışta mevcut geçerli değerden kurulan ve Cancel’da atılan form taslağıdır. Kalıcı/form değeri yalnız parent’ta bulunur. `useModalSurface` artık input/select/textarea’yı da focus sırasına alır; iptal kapanışını history tüketilene kadar sıraya koyar. Mevcut Calendar/Privacy çağrı noktaları aynı dismiss API’sine taşındı; tam CA/PV/CLI regresyonları bu ortak değişikliği kapsar. Yeni bağımlılık, entity, field, server mutation davranışı veya content değişikliği yok.

## Execution, Health ve kalite

Yeni runner kayıtları **OF01–OF04, OV01–OV06** (10); eski 657 test korunur, toplam **667**. OU02/OU06 artık kaldırılmış düğmelere basmaz; gerçek locale prop girdisini değiştirir. U18 yeni Back sözleşmesini kontrol eder. Actual browser locale ve saat etkileşimleri `scripts/checkOnboardingClosure.mjs` ile canonical runner’ın iki tam motor koşusuna bağlıdır; gizli kontrol yok.

Health **0 ekleme / 6 güncelleme / 0 silme**:

| ID | Gerekçe / yürütme |
|---|---|
| H07-003 | DOB-only, NULL time/place, provider’sız native readback; OF02 + O06/C14. |
| H07-006 | Cihaz varyant/fallback, kayıtlı tercih ve You→reset→hydrate; OF01 + A05/O23/O30. |
| H09-001 | Aynı gün native reconciliation, deadline cleanup ve partial create sonrası retry; OF03/04 + NA02–05. |
| H07-013 | DU01–05 + OV02/03/06; preparation Retry/Back/owner isolation, LOCAL_BROWSER. |
| H13-012 | OV01–06 + U/OU + actual locale/time CLI, korunmuş mobil matrisler. |
| H13-013 | Native date + app time dialog/gerçek klavye kabulünü doğru adlandırır; EXTERNAL / NOT_RUN kalır. |

Backend `healthPlan` aynı kapalı ID envanterini korur; shared `healthConstants` ve `healthExecutionScope` HC-036.0 ile eşleşir. **175 case / 149 in-app / 12 local / 14 external, 16 suite.** Önceki failed kanıtları silinmez. Normal local in-app sonuç **136 PASS / 0 FAIL / 13 BLOCKED**: hosted/content bağımlılıkları simüle edilmez. H09-901 ve H11-006 aynı hesap/live kabulü açık; 12 backend bulgusu **OPEN / USER-DEFERRED**, notification entry/scheduler kapalı kalır.

Son Chromium **667/667**, WebKit **667/667**; iki motor da exit 0 ve sıfır page error. Son yürütme sayıları ve exit kodları verification.json içinde. Zorunlu kapsam: fresh npm ci, full tree/audit/security, typecheck/lint/build, Repo Health, generated son-beş, Node session 9/9, tam Chromium/WebKit; per engine 667 test ve 6 yeni browser senaryosu, mevcut 150 mobile-experience + 87 compatibility ve ürün akışları. Yerel Health kaydetme/retry/liste/rapor açma da canonical koşuda doğrulanır; canlı Full Health değildir.

Performans aynı bütçelerle: initial JS **483699 raw / 160983 gzip**, CSS **79943 / 14860** byte; 500000/165000 ve 90000/16000 sınırları korunur. Import cycle yok; soğuk rota/lazy retry kapıları yereldir. Son ledger metadata güncellemesi sonrası üretim ölçümü yeniden geçti; makbuz verification.json içindedir. Field INP/hosted hız veya fiziksel cihaz iddiası yok.

İlk/ara başarısızlıklar ayrı [initial-failures.json](onboarding-closure-036/initial-failures.json) içinde: yeni testin timer bağlamı, eksik fixture privacy tablosu, modalın dış form/history ayrımı, focus ve portal DOM gözlemi, DOM değiştirmeyen backend bariyerinin yanlış beklenmesi. Bunlar final PASS ile üzeri yazılmış canlı arızalar değildir. Kurulum sürerken erken lint çağrısı executable bulunamadı; kurulum sonrasında zorunlu lint yeniden geçti. Npm’in mevcut config uyarısı/dynamic-import uyarıları bastırılmadı.

## Belgeler ve yayın sırası

SOURCE_OF_TRUTH, UI_UX_STANDARDS, BUSINESS_FLOW, DATA_MODEL, TECHNICAL_ARCHITECTURE, RELEASE_HEALTH_CHECK, DEVELOPMENT_RULES, CODE_STANDARDS, DEVELOPMENT_NOTES, README ve generated BUILD_HISTORY eşlendi. Eski 035 karar/sonuçları tarihsel kaldı; current ON-04 geri yok/manuel dil anlatımı yenilendi. Internal Build **032–036** gösterir.

1. **Kullanıcı:** GitHub’da Test → main merge; ajan main’e yazmadı. Base44 uygulamasının **Main** kaynak senkronizasyonunun bu teslim commit’ini içerdiğini kontrol edin. Test dalı ayrı veri ortamı değildir.
2. Şema delta’sı **yok**; eksik klasörden `entities push` veya içerik import gerekmiyor. Mevcut tam şema korunur.
3. Frontend publish öncesinde Base44 Code görünümünde backend function entry/shared bütünlüğünü doğrulayın: `applicationSession`, `onboarding`, `dailyMessage`, `internalHealth` ve kullandıkları `nativeClient.ts`/tüm shared dosyalar aynı Git senkronizasyonuna ait olmalı. Özellikle `healthConstants.js=HC-036.0`, closed plan/scope ve mevcut onboarding/daily native guard’ları. Güncel Buildmarker metni tek başına yeterli değildir; verification.json kaynak hash listesiyle dosyaları eşleyin. Bu tur CLI deploy ile Git sync bypass edilmedi.
4. Aynı senkronizasyondaki frontend’i Base44 Dashboard **Publish** ile yayımlayın. Tarayıcıda tam yeniden yükleme/yeni sekme açın; beş ana adım, tek birthplace, onboarding’de TR/EN yokluğu ve text HH:mm + app dialogu görünmeli. Eski 6/6/hiyerarşi görünüyorsa source/asset cache eşleşmesini çözmeden kabul vermeyin.
5. Kullanıcı yayımlanan Full Health’i çalıştırıp kaydeder/listeden açar. Yerel 13 hosted BLOCKED canlı başarı sayılmaz.

## Aynı hesapla kısa kabul

Hesabı silmeyin/resetlemeyin/yeniden oluşturmayın. Sorunlu aynı hesaba normal giriş yapıp hazırlık ekranında **Retry** kullanın; sonuç geldiğinde aynı gün yeniden açın. Yetkili salt okunur kayıt görünümünde owner+shinka_date günlük kaydının ID/pair/snapshot’larının korunduğunu kontrol edin; gereksiz yeni consent/event/period oluşmamalı. Paylaşılacak kanıt yalnız safe error code, tarih/saat, frontend commit ve function/shared kaynak sürümü olsun; token, kişisel doğum/döngü payload’ı paylaşmayın. Hata devam ederse auth/deadline/content/Moon/timezone veya yayın uyuşmazlığı bu kod ve dar logla ayırt edilmeli; bu paket hiçbirini kanıtsız kök neden ilan etmiyor.

Ayrı kontrollü kabulde DOB + boş saat/yer → ON-05 → Skip; consent’li döngü→hazırlık; geri/ileri, tercih/reopen ve saat Set/Cancel/Clear’i Android/iOS cihazlarında doğrulayın. Kullanıcı açıkça çalıştırmadıkça ajan canlı kayıt/reset/silme/import/push/Health yapmaz. **Hosted İlk Shinka olayı ve fiziksel kabul açık; repository teslimi bunlardan ayrı tamamlanır.**
