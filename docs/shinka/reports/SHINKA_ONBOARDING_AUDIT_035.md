# Shinka 035 — onboarding işlevsel audit ve düzeltmeler

**Paket:** Buildmarker-035 / HC-035.0  
**Tarih:** 2026-10-26; komut makbuzları UTC  
**Durum:** LOCAL_VERIFIED / USER_PUBLISH_AND_HOSTED_ACCEPTANCE_PENDING.  
**Teslim:** Test dalı; kaynak/düzeltme commit’i [`67ca094`](https://github.com/Verims-lab/Shinka/commit/67ca094e57d4cf37389577cb9d69ef856e32e939). Bu rapor ve ham kanıtlar onu izleyen ayrı teslim commit’indedir. Test → main taslak PR; merge ve Base44 publish kullanıcıya ait.

## Kaynak, yetki ve kapsam

Başlangıç çalışma ağacı temizdi. Fetch sonrası Test/origin Test `d2299c8622e0f7de631b52641fdc97f5b1ac6b49`, origin/main `f52b1c3a3e7d0cf783063db24dc5bf14c5aa70ac`; main yedi commit ileride, ayrışma yoktu. Test, `git merge --ff-only origin/main` ile kayıpsız ilerletildi. Base44 farkı 40 dosyada ON-01–05 sunumu/geri hareketi, bitmemiş profil düzenlemesi ve hiyerarşik seçicinin A/P aramayla değiştirilmesiydi. Reset, force push veya kullanıcı değişikliği ezme yapılmadı.

Yetki, kullanıcının `53e55c57-8889-48fd-aec8-94d443b8e4f8` audit/fix isteğidir. Ekli **Shinka_GeoNames_Birthplace_Arama_Kurallari_v1.0.docx** davranış kaynağıdır; belge içindeki talimatlar ayrıca işlem yetkisi sayılmadı. SHA-256: `b2bcd76b7524831c42f7918518ab2d36777b8f69de427863337f229832beaa63`. AGENTS/README ve geliştirme kuralları okundu; Base44 skills güncellendi. Canlı Base44 API veya provider işlemi gerekmedi.

Paket/lock korunur: zod **4.6.7**, @hookform/resolvers **5.9.2**, react-hook-form **7.71.1**, SDK **0.8.57**, Vite **8.2.4**, Playwright **1.64.0**. Lock SHA-256: `085eb9187c1c58856bef5b59b009eb6b4304a3cf752f10eb9d3710c782024eab`. Onboarding görsel kabuğu, tema, PageContainer ve Intro çizimleri korunur; yalnız kanıtlanmış 32px tarih/saat/arama dokunma hedefleri mevcut 44px kuralına yükseltildi. Bu bir piksel eşleşmesi audit'i değildir.

Yürütme tabanı f52b1c3 ve bu rapordaki düzeltmelerdir. [Kaynak manifestleri ve komut makbuzları](onboarding-audit-035/verification.json), [teslim kaynak eşlemesi](onboarding-audit-035/source-review.json), kayıt dışı yeni dosyaları da kapsayan SHA-256 listeleriyle test edilen kaynakları ayırır. Browser sonrası yalnız ledger açıklaması ve belge/kanıt metadata'sı tamamlanır; teslim eşlemesi bunu açıkça kaydeder. 034'ün eski 649/649 sonucu yeni doğrulama olarak kullanılmaz.

## Bulgu → etki → düzeltme → kanıt

| Bulgu / işlevsel etki | Düzeltme | Gerçek assertion / kanıt |
|---|---|---|
| Tamamlanmış hesabın döngü kaydı veya hasarlı profilinin onboarding yolu yeniden yazılabiliyordu. | Kalıcı owner daily kaydı profil hazır olma hesabından bağımsız kontrol edilir; normal saveProfile/saveCycle kapalıdır. Üretim SDK adapter'ı da değişiklik/onam sınırında yeniden kontrol eder. Yetkili reset yolu kendi mevcut guard'ını korur. | OA02, A08; normal ve bozulmuş profil, profil/döngü yazısı reddi, satır/yazı sayısı değişmemesi. |
| Hızlı çift Begin aynı görünümden iki geçiş üretebiliyordu. | Mevcut eşzamanlı action kilidi Begin/isim atlamaya da uygulanır. | OU01: gerçek Intro/Screen, tek geçiş, üç bölüm ilk render'da, sıfır auth/backend çağrısı. |
| Genel/eksik save cevabı sonraki adımı açıp geçici ismi silebiliyordu. | UI, açık persisted/readback ve geçerli durum zarfını doğrular; belirsiz cevapta form/aynı action ID kalır. | OU03, U06, O19–O21/O29/O31, P23/P24/P30/P31. OU03 yanlış başarıyı reddeder, doğrulanmış retry tek profile ilerler. |
| Unmount/oturum sonrasında eski save sonucu state veya isim deposunu etkileyebiliyordu. | Screen nesli/mount ve parent owner-session kontrolü; initialize sonrası ikinci hydrate öncesi nesil kontrolü. | OU04 ve OU08: gerçek AuthProvider/router/Onboarding, A'nın gecikmiş cevabı B'yi değiştirmez; reopen B'nin kalıcı profiline döner, logout/OAuth başlatılmaz. CLI pending-hydration route ayrılışında geç yazı yapmaz. |
| Bitmemiş ON-05→04 düzeltmesinin taslak/kalıcı veri ayrımı ve kayıt sınırı yeterince test edilmemişti. | Aynı mounted form döngü taslağını tutar; doğrulanmış profil değerleri geri gösterilir; mevcut profil ismi eski pre-auth taslağından önce gelir. | OU02/OA03: DOB/Sun ve beş birthplace alanı gerçek backend tarafından güncellenir; dil/geri hareketi döngü taslağını/onam kutusunu korur, tek başına sağlık yazısı yapmaz. |
| OAuth beklerken Back ve yaş kutusu değiştirilebiliyordu; beklenmeyen rejection kilidi açık bırakabilirdi. | SignIn try/finally/mount koruması ve parent busy bağlantısı; yaş/geri kontrolleri beklemede kapalı. | OU07 ve A01–A03/SS regressions: unchecked yaşda sıfır provider, iki tıkta bir çağrı, iptal/hata/güvenli dönüş, hassas hata metni sızmaz. |
| Filtrelenmiş boş ilk sayfadan sonraki hata Retry ile sayfa sıfıra dönüyordu; hata boş sonuç gibi görünebiliyordu. | Hatalı next_page yeniden denenir; hata mesajı boş durumdan önce gelir; kısa/kapalı/bekleyen Retry çağrı üretmez. | OA04/OU06, BS01–BS08: sayfa sırası 0,1,1; 429 görünür; dedup ve yeni sorgu sıfırlaması; eski cevaplar etkisiz. |
| Boş popup listbox'ı yoktu; düğmeye klavye odağı popup'ı kapatıyordu; düğmeden Escape odağı geri dönerken popup yeniden açılıyordu. | Her açık popup bir listbox sağlar; iç odak korunur; Escape'te önce odak, sonra kapatma; aktif option görünür alana kaydırılır. | OU05/OU06 ve gerçek mobil CLI: active-descendant, ok/Enter/Escape, More odak, uzun liste scroll, append ve açık seçim. |
| Tarih/saat/arama girişleri 32px idi; mevcut mobil dokunma eşiğini karşılamıyordu. | Giriş ve native tarih/saat picker hit alanı 44px; genel tasarım/tokenlar değişmez. | YU04, canonical mobile experience/compatibility matrisleri; ilk başarısız geometri ölçümleri saklanır. |
| Formlar ile FramedDateField arasında circular import; eski countries() runner ve hierarchy select beklentileri vardı. | FieldError küçük ortak bileşene ayrıldı; runner'lar mevcut resolve/search ve Home→You→Admin/combobox davranışını çalıştırır. | Tip/lint/build/grafik; AN08 fallback menu klavye assertion'ları korunur, gerçek App CLI ve mobil kontroller güncellenir. |
| BS09/12 ve G/O testlerinin beklediği hata zarfı/8 sonuç/text transport, yeni adapter'ın public+diagnostic/50/stream sözleşmesiyle uyuşmuyordu. | Assertion'lar gerçek kapalı sözleşmeye eşlendi; public GEONAMES_UNAVAILABLE ve diagnostic INVALID_RESPONSE birlikte doğrulanır. U11 non-DOM sayacı için DOM observer yerine gerçek provider-start promise bekler; OU testleri gerçek React commit'ini bekler. | OA01 reject yardımcısının başarı ve yanlış hata kodunda gerçekten fail ettiğini doğrular. G01/G06/G10/G14, O11 ve U09–U12 gerçek adapter/handler/component yolunu korur. |

Kontrol atlama, assertion kaldırma, güvenlik gevşetme veya süre/byte bütçesi büyütme yapılmadı. Kaldırılmış cascade/sheet için artık var olmayan UI assertion'ları güncel combobox karşılıklarına taşındı; canlı/native back iddiası eklenmedi. GeoNames tanılama planının search parametreleri mevcut A/P, 50 satır, startRow=0 sözleşmesiyle eşlendi; G14 yerel fixture'dır, canlı probe çalıştırılmadı.

## Adım, geri hareketi ve kalıcılık

| Ekran | İleri / geri | Kalıcı sınır ve doğrulama |
|---|---|---|
| ON-01 Introduction | Begin→02; geri yok | Üç bölüm birlikte, auth/kayıt yok; U16/OU01. |
| ON-02 isteğe bağlı isim | Continue/Prefer not→03; Back→01 | Trim/50 Unicode karakter; atlama eski ismi temizler; yalnız mevcut süreli session taslağı; O01/O02/U02/OU01. |
| ON-03 giriş | Onaylı Apple/Google→sunucu hydrate; Back→02 | 18+ başlangıçta false, sağlık onamından ayrı; pending sırada geri/giriş kilidi; A/SS/OU07. |
| ON-04 profil | Doğrulanmış save→05; Back yok | Güvenli önceki authenticated ekran bulunmadığı için açık karar netleştirildi. Logout/OAuth tekrarı yok. DOB/yaş/gelecek tarih ve beş alan server doğrulaması; saat NULL, Sun yalnız birth_date; O/U/OU02–04. |
| ON-05 döngü | Finish/Skip→06; Back→04 | 5/28 placeholder, sağlık onamı açık ve ayrı; geri tek başına yazmaz. Skip onam geri çekmez/geçmiş silmez. Gerçek partial/readback/retry P/O testleri; OA03/OA05/OU02. |
| ON-06 hazırlık | Doğrulanmış daily→Home; hata/timeout→Retry | Numarasız, eksik kaynak başarı görünmez; DU01–05 ve daily/production regressions. |
| Home / yeniden açılış | Kalıcı resolver | Gerçek owner daily son tamamlanma işareti; yeniden girişte mevcut günlük kullanılır. Bitmemiş profil→04, tamam profil→05, kalıcı döngü→06, daily→Home. A08/C16/C18/C20/OA03/OA05/OU08. |

Yalnız beş ana adım sayılır; hazırlık/inactive/hata numaralandırılmaz (U16–U18). Geri hareketi aynı mounted form taslağını korur; sayfa yenilemede kaydedilmemiş bütün alanların korunacağı iddia edilmez. Skip için yeni durable bayrak yoktur: daily oluşmadan tekrar açılış 05'e dönebilir. Native çok kayıtlı transaction/rollback veya dağıtık exactly-once garantisi eklenmedi.

## Birthplace sözleşmesi

Frontend ve backend en az üç karakter; 350ms debounce ve kısa girişte sıfır provider çağrısı. Görünen yerin kendi adına büyük/küçük harf duyarsız literal substring uygulanır. Kansas/Kansas City/Kanpur/Kankan pozitif, Çanakkale/Çankaya ve yalnız üst bölge eşleşmesi negatif; Arkansas içindeki `rkans` özel orta eşleşme testi vardır (BS04/05). Accent folding, fuzzy veya otomatik ilk seçim yoktur.

A ülke/bölge ve P yerleşim arama/seçim/ID resolve'da desteklenir. Serbest metin kayıt değildir; etiketi yazıyla değiştirmek önceki ID'yi geçersizleştirir. Beş canonical alan backend'de birlikte çözülür/kaydedilir veya Clear ile beşi NULL olur. You'da değişmeyen ID provider kesintisinde korunur; yeni ID tekrar çözülür; Cancel/reopen kalıcı değeri geri getirir (YT04/YU02/BS09–12/OA03).

Her istek bir provider sayfası; 50 aday × dört sayfa = **Shinka'nın 200 aday sınırı**. Filtrelenmiş sıfır eşleşme varsa More açık kalabilir; sınır tüm dünyadaki sonuçların bittiği anlamına gelmez. [Resmî GeoNames search belgesi](https://www.geonames.org/export/geonames-search.html) ayrı provider sınırlarını ve featureClass parametrelerini açıklar; doküman okuması canlı sonuç kapsaması değildir. 429/timeout/servis hatası boş sonuç veya auth kaybı olmaz; mevcut redirect/secret/owner/rate-limit kontrolleri korunur.

## Son yürütme ve kalite sonuçları

| Kontrol | Bu paketin sonucu | Kanıt sınırı |
|---|---|---|
| Kilitli npm ci | PASS; 458 paket, exit 0 | Temiz kurulum; lock/TLS/registry değişmedi. |
| npm ls --all + resolver runtime | PASS / PASS | Gerçek kurulu Zod/resolver success ve field-error yolları; zorunlu peer eksiği yok. |
| npm audit --json / security:deps | PASS / PASS; tüm severity seviyeleri **0** | Yerel npm kanıtı; Base44 scan değildir. |
| Node session doğrulaması | **9/9 PASS** | Node/sentetik; browser toplamına katılmadı. |
| Chromium 156.0.8078.4 | **657 PASS / 0 FAIL**, exit 0 | Tam canonical komut, pageErrors boş; gerçek browser + sentetik IO. |
| WebKit 27.2 | **657 PASS / 0 FAIL**, exit 0 | Aynı kaynak, ayrı tam komut, pageErrors boş; fiziksel Safari/iOS değil. |
| Her motorda yerel in-app Health | **136 PASS / 0 FAIL / 13 BLOCKED** | 149 case; hosted/content önkoşulları açık. |
| Typecheck / lint / production build | PASS / PASS / PASS | Mevcut kurallar; ilk hatalar ayrıca saklandı. |
| Repo Health / build-history | PASS / PASS | 035 / HC-035.0; son beş benzersiz paket **031–035**. |
| Production performans/grafik/lazy retry | PASS | Değişmeyen byte bütçeleri, sıfır import cycle; sentetik laboratuvar. |
| Hosted, OAuth, provider ve fiziksel kabul | **NOT_RUN** | Ayrı kullanıcı kabulü; yayın/gönderim yetkisi verilmedi. |

[Chromium gerçek sonuç listesi](onboarding-audit-035/chromium-results.json), [WebKit gerçek sonuç listesi](onboarding-audit-035/webkit-results.json), [komutlar/çıkış kodları ve kaynaklar](onboarding-audit-035/verification.json). İki motorda da 657 ID benzersiz ve PASS; ayrıca 53 odak ID için açık exact-once kontrolü yapıldı: OA01–05, OU01–08, BS01–12, U01–18, O32, NA07/NA22, SC06/SC10/SC11, NC06/NC07, A08/AN08. Yeni 13 test registry'ye bağlı ve gerçekten çalıştı; sıfır test veya eksik motor başarısı yok.

**Sayı farkı:** önceki 034'ün 649 kaydından Base44 main değişikliğinde eski cascade B01–18 ve kaldırılan cache M06/M07 çıkarılmış; BS01–12 ve U16–18 eklenmişti (649−20+15=644). Bu audit OA01–05 ve OU01–08 ekledi: **644+13=657**. Eski davranış kanıtları Git/034 raporunda kalır; yeni sözleşme eski cache/hiyerarşiyi yürütüyor gibi gösterilmez.

Her tam komut SC01–05 ve SC07–09'u **8/8 LOCAL_SERVER_FIXTURE** olarak ayrıca çalıştırdı; bunlar browser 657 toplamı değildir. SC06/10/11 gerçek browser listesinde. Mevcut entry/secret/native ve notification kontrolleri de canonical prelude'da geçti; gereksiz ayrı tekrar yapılmadı. Her motorda ek olarak 150 mobile experience, 87 compatibility, 19 admin navigation, 24 You, 23 privacy, 4 Test Tools, 5 daily, 8 Calendar, 22 Pattern ve 4 Health timing senaryosu ile production routing/product navigation tamamlandı. Bu sayılar 657'ye eklenip tek toplam yapılmaz.

Performans: initial JS **482582 raw / 161301 gzip** byte (bütçe 500000/165000); CSS **79922 / 14861** (90000/16000), sıfır import cycle. [Ölçüm](onboarding-audit-035/performance.json) dokuz rotada üçer soğuk yükleme ve lazy-retry kapısını kapsar; saha INP veya hosted SDK hızı değildir. Node v26.0.0 / npm 11.12.1. Ayrı görsel/piksel kabulü veya optional screenshot paketinin tamamı çalıştırılmadı; mobil hata tanısı için yerel ekran çıktıları kullanıldı.

Çalıştırılmayan yerel zorunlu kontrol yok. Önceki eksik/başarısız koşulara final PASS yazılmadı. Son browser manifesti 510 dosya, aggregate SHA-256 `1e16221a8297a4395d5fab7ae73c46bebcafb1499950adb0e1a04337443135fb`; browser sonrası yalnız `buildLedgerData.js` açıklaması değişti. Son build/performance/repo/history bu metadata'yı da kapsar.

## Health ve execution değişiklikleri

**0 ekleme / 7 güncelleme / 0 silme; yeni suite yok.** Katalog/kapalı backend planı 16 suite / 175 case; 149 in-app, 12 local, 14 external, 0 future olarak kalır.

| ID | Gerekçe ve yürütme |
|---|---|
| H07-004 | Kalıcı resolver, istemci state/legacy action bypass reddi ve Skip'in geçici niteliği; O24/A07/A08/OA05. |
| H07-007 | Bitmemiş profil düzeltmesi ve partial retry/readback; OA03 eklenir, A/O/P assertion'ları korunur. |
| H07-012 | Daily varsa hasarlı profil dahil onboarding profil/döngü yazısının kapanması; OA02/OA05, mevcut C16/C18/C20. |
| H10-003 | A/P own-name arama, failed-page retry ve beş alan; BS01–12, OA01/OA03/OA04 ve O/G/YT/M kontrolleri. Rendered U/OU yalnız yerel. |
| H13-012 | U01–18 + OU01–08, gerçek geri/taslak/readback/oturum/router, combobox klavye/paging ve mevcut mobil matris. Fiziksel cihaz değil. |
| H13-014 | AN01/AN08 üç araç/TR-EN/gezinti ve kalan fallback menünün klavyesi; CLI gerçek Home→You→Admin ve onboarding header yokluğunu doğrular. |
| H15-004 | Geçici arama generation/locale/cancel ve hatalı sonraki sayfa; BS03/OA04. Kaldırılmış hierarchy cache güncel davranış sayılmaz. |

Onboarding Health seçicisi her bağlı test ID'sini **tam bir kez** bulmak zorundadır; boş veya eksik seçim sessiz PASS üretmez. `healthExecutionScope.js`, gerçek registry ve runner aynı ayrımı taşır. Motorlara ait üretilmiş case audit'leri kayıt predicate'i, testler, actual evidence ve ortamı birlikte verir.

Yerel in-app 13 hosted/content önkoşulu ayrı BLOCKED kalır: H04-019, H05-001–009, H08-005, H09-004, H12-031. H06-007 gerçek OAuth, H10-004 GeoNames, H11-006 aynı hesap ON-05 canlı kabulü ve H13-013 fiziksel Android/iOS açık. H14-901/H16-901 kapatılmadı. **12 backend bulgusu OPEN / USER-DEFERRED**; yeniden audit/scan yapılmadı. Gerçek notification entry `enabled:false`, provider sonucu UNKNOWN ve scheduler bağlantısı kapalı kalır.

## Belgeler ve tarihsel kanıt

SOURCE_OF_TRUTH kaynak önceliğini; UI_UX mevcut ekran/sayaç/geri/combobox ve header erişimini; BUSINESS_FLOW taslak/kalıcı/write sınırını; DATA_MODEL A/P ve beş alan invariantını; TECHNICAL_ARCHITECTURE mevcut adapter/controller/nesil ayrımını anlatır. RELEASE_HEALTH_CHECK, DEVELOPMENT_NOTES, CODE_STANDARDS ve BASE44_CONTINUATION gerçek test/execution/teslim sınırlarıyla eşleşir. README, SECURITY_PRIVACY ve son-beş ledger güncellenir. Eski cascade/P-only/sheet kararları açıkça tarihsel olarak ayrılır; önceki başarısız raporlar silinmez.

[İlk ve ara başarısızlıklar](onboarding-audit-035/initial-failures.json) komut makbuzları/log SHA'larıyla korunur: eski entry countries(), sandbox loopback, timer/fixture tipleri, negatif test hata zarfı, stale DOM, duplicate Begin, readback/unmount/combobox sorunları, eski admin/cascade runner, 32px geometri ve Escape. Bunlar final PASS'in yerine yazılmaz. 034/TLS ve önceki paket kanıtları byte olarak değiştirilmedi. npm'in mevcut min-release-age-exclude uyarısı ve Vite'ın dynamic-import uyarıları saklanır; ayar/dependency/CA gevşetmesi yapılmadı.

## Kullanıcının yayın sonrası kabulü

1. Hazır olduğunuzda Test → main/sync/publish akışını yürütün; backend/shared ve frontend eşleşsin. Bu ajan merge/publish yapmadı.
2. Güncel 035 / HC-035.0 Full Health'i uygulamada çalıştırıp raporu kaydedin ve listeden açın. Yerel fixture BLOCKED kayıtlarını canlı kanıt yerine kullanmayın.
3. Kontrollü hesapla gerçek Apple/Google giriş/iptal/dönüş ve ON-01→05→06→Home, geri hareketleri, partial kayıt/Retry ve yeniden açılışı kabul edin. Gerçek GeoNames A/P araması/seçim/NULL readback ve servis hata davranışını doğrulayın.
4. Android/iOS fiziksel klavye, date/time picker, combobox odağı, native geri, safe area ve erişilebilirliği ayrıca kontrol edin. Bu tur görsel/piksel veya fiziksel kabul yapılmadı.
5. Bildirim gönderimi ve scheduler kapalı kalsın; provider/workflow/native alıcı/yanıt/no-device/idempotency/logout sözleşmeleri ayrı bekler.

Canlı Full Health/GeoNames probe/Security scan, import, gerçek kullanıcı kaydı/reset/silme, push/workflow, native build, main merge ve publish **NOT_RUN**.
