# Shinka 034 — yerel stabilizasyon doğrulaması

**Paket:** Buildmarker-034 / HC-034.0
**Tarih:** 2026-10-26 (Europe/Istanbul; komut makbuzları UTC)
**Durum:** LOCAL_VERIFIED / USER_PUBLISH_AND_HOSTED_ACCEPTANCE_PENDING
**Teslim:** Mevcut Test dalı ve [taslak PR #36](https://github.com/Verims-lab/Shinka/pull/36). Main merge/publish veya canlı kabul yapılmadı.

## Kaynak ve koruma

Yeni ağdaki devam, temiz Test/origin Test `1f061ec5ac79bf225ce644e2c400c45d8487f613` üzerinde başladı. Güncel fetch ile main `041b40b6dc216b7da99d67ab4ed2da82a0b535b2` doğrulandı; main-only commit yok, Test iki commit ilerideydi. Kullanıcı çalışması ezilmedi, reset/force veya yeni paket kullanılmadı. Önceki `f3dbba1` stabilizasyonu ve `1f061ec` destek kaydı korundu.

Test edilen kaynak bu taban ve aşağıdaki odaklı düzeltmelerdir: [yürütme kaynak manifesti](stabilization-034/resumed-20261026/source-manifest.json), [teslim kaynak eşlemesi ve korunan dosyalar](stabilization-034/resumed-20261026/source-review.json), [gerçek sonuçlar/komut makbuzları](stabilization-034/resumed-20261026/verification.json). Browser koşusundan sonra yalnız üretilmiş ledger açıklaması ve doküman/kanıt kayıtları tamamlandı; fark kaynak eşlemesinde açıkça belirtilir. Son repo/history kontrolleri teslim metadata'sını kapsar.

`package.json` ve lock main ile byte olarak aynı: **zod 4.6.7**, **@hookform/resolvers 5.9.2**, react-hook-form 7.71.1, SDK 0.8.57, Vite plugin 1.0.48, Vite 8.2.4, Playwright 1.64.0. Onboarding CSS/shell, native silme pre/post-write guard'ları, session-generation/pacing düzeltmeleri, bildirim entry'si ve scheduler korunur. NC06/NC07 gövdeleri değişmedi; provider değişiklikleri yalnız açıklamadır.

## Doğrulamada bulunan ve düzeltilen sorunlar

- **Tip/lint:** T81 createElement children biçimi, readiness union alanlarının güvenli daraltılması, test promise resolver ve sahte oturum/auth dönüş tipleri düzeltildi. App'teki kullanılmayan Navigate import'u kaldırıldı; compiler/lint kuralı gevşetilmedi.
- **Eski hata beklentileri:** NS02/NC01, belirsiz auth taşıma hatasını yanlışlıkla 401 bekliyordu. Mevcut 034 sözleşmesine göre tam **503 / SESSION_UNAVAILABLE**, eksik kimlikte **401 / AUTH_REQUIRED** beklenir; service-role/job IO/provider erişiminin sıfır olması assertion'ları korunur. HD02, geçerli sözleşmedeki 429/5xx/timeout için BLOCKED; şema/strateji/bozuk satır için FAIL bekler. SS04/SS10, 429'un bozuk sözleşmeyi gizleyemediğini ayrıca çalıştırır.
- **Gerçek DOM sırası:** SS08 yeni hesap React commit'ini, TP fixture'ı preview kapanıp status görünmesini bekler. Eski render üzerinden assertion yapılmaz; yeni kimlik, UNKNOWN, aynı operasyon, unmount ve bütçe kontrolleri korunur.
- **CSS motor farkı:** Chromium çok katmanlı background-repeat değerini altı kez, WebKit tek kez yazabiliyor. T81 her katmanın no-repeat olmasını, tam 5 radial + 1 linear katmanı ve karanlık düz yüzeyi denetler; assertion kaldırılmadı.
- **CLI ekran fixture'ları:** Anonim sahte SDK artık açık 401 üretir; belirsiz ağ hatasıyla karıştırılmaz. Admin/You pasif yenileme testleri 15 saniyelik coalescing sınırını kontrollü saatle aşar ve saati geri yükler. Product navigation yakın focus'un throttle edilmesini ve bfcache dönüşünde açık yeniden doğrulamayı kontrol eder. Gerçek uzun bekleme veya büyütülmüş timeout yok.

Bu tur yeni ürün özelliği veya yeni test ID'si eklenmedi. Önceden hazırlanmış oturum nesli ayrımı, bekleme sonrası silme bütçesi/iptali ve exact readiness düzeltmeleri artık gerçek browser koşularıyla doğrulandı. İlk hatalar ve ara başarısız koşular [yeni başarısızlık kaydında](stabilization-034/resumed-20261026/initial-failures.json) saklanır.

## Güncel yürütme sonuçları

| Kontrol | Sonuç | Kanıt sınırı |
|---|---|---|
| Mevcut lock ile npm ci | PASS, exit 0 | Temiz tam kurulum; eski üç statik araç kurulumu yerine geçti. TLS/CA/registry gevşetilmedi. |
| npm ls --all + peer/runtime | PASS | Zod/resolver geçerli ve hatalı veri dönüşleri gerçek kurulu modüllerle çalıştı; optional/platform paketleri zorunlu eksik peer sayılmadı. |
| npm audit --json / security:deps | PASS / PASS | Info/Low/Moderate/High/Critical: **0/0/0/0/0**; canlı Base44 scan değildir. |
| Typecheck / lint / production build | PASS / PASS / PASS | Kilitli proje komutları; ilk hata kayıtları korundu. |
| Repository Health / build-history | PASS / PASS | 034 / HC-034.0; son beş paket 030–034. |
| verifySessionStability | **9/9 PASS**, exit 0 | Yeni ağda yeniden çalıştı; Node/sentetik, browser yerine sayılmadı. |
| Chromium 156.0.8078.4 | **649 PASS / 0 FAIL**, exit 0 | Tam canonical runner, 17 zorunlu ID tekil PASS, pageErrors boş. |
| WebKit 27.2 | **649 PASS / 0 FAIL**, exit 0 | Ayrı tam canonical runner, 17 zorunlu ID tekil PASS, pageErrors boş. |
| Her motorda yerel in-app Health | **136 PASS / 0 FAIL / 13 BLOCKED** | 149 case; sahte backend/DOM, canlı Full Health değildir. |
| Performans / grafik / lazy retry | PASS | Production byte bütçeleri, döngüsüz import grafiği, ilk yüklemede internal/test modülü olmaması ve gerçek App'te sentetik asset hatasından recovery. |
| Hosted/device/gerçek kullanıcı işlemleri | NOT_RUN | Ayrı kullanıcı kabulü; yerel başarı bunları kapatmaz. |

Her iki gerçek sonuç listesinde **tam bir kez PASS**: `T81`, `U15`, `SS01`, `SS02`, `SS04`, `SS06`, `SS07`, `SS08`, `SS09`, `SS10`, `NA34A`, `NA34B`, `NA34C`, `TP01`, `TP02`, `TP03`, `TP04`. Eksik/çift ID, atlanan zorunlu kontrol veya sıfır-test başarısı yok. [Chromium sonuç listesi](stabilization-034/resumed-20261026/chromium-results.json), [WebKit sonuç listesi](stabilization-034/resumed-20261026/webkit-results.json).

Ek olarak her canonical koşuda 150 mobile experience, 87 compatibility, 24 You, 23 privacy, 19 admin navigation ve 4 Health timing kontrolü ile product navigation geçti; bunlar 649 temel test sayısına eklenip tek toplam diye sunulmadı. Mevcut runner sunucu/entry/secret kontrollerini de çalıştırır; ayrı tekrar gerekmedi. T81 açık/koyu temayı gerçekten çalıştırdı; U15 ON-04/ON-05 TR/EN arka plan ve taşmayı izole fixture'da doğruladı. Bu tur ayrı görsel screenshot paketi veya fiziksel cihaz testi yapılmadı.

Production ölçümü: initial JS **481660 raw / 160876 gzip** byte (bütçe 500000/165000); CSS **78364 / 14534** (90000/16000). Döngü yok, lazy retry PASS. Ölçümler sentetik yerel laboratuvar; saha INP, canlı SDK gecikmesi veya cihaz hızı değildir. [Performans kanıtı](stabilization-034/resumed-20261026/performance.json).

Node v26.0.0 / npm 11.12.1 kullanıldı. npm mevcut `min-release-age-exclude` ayarına tanınmayan seçenek uyarısı verdi; `.npmrc` değiştirilmedi, kurulum/audit exit 0. Vite'ın test/lazy modüllere ilişkin mevcut dynamic-import uyarıları hata sayılmadı; production grafik ve boyut kapıları ayrıca geçti.

## Bildirim kaynakları: resmî belge, destek aktarımı ve açık sözleşmeler

[Resmî built-in integration belgesi](https://docs.base44.com/Integrations/built-in-integrations#sending-push-notifications), **2026-10-26** tarihinde yeniden okundu: başlık en çok **100**, mesaj **500**, isteğe bağlı aksiyon etiketi **50** karakter; uygulama içi bağlantı isteğe bağlıdır ve verilmezse **Home** açılır. Önceki açıklamada sayısal sınırların tamamen belirsiz/yalnız AI aktarımı gibi gösterilmesi düzeltildi. Bu, hosted uygulama veya cihaz kanıtı değildir.

Kullanıcının ilettiği **Dmytro / Base44 Support** yanıtı (`USER_RELAYED_SUPPORT_EVIDENCE`), `user_id`, `title`, `content`, `action_label`, `action_url` alan adlarını ve bilinmeyen/yanlış alanların sessizce atılıp başarı dönebilmesini doğrular. Destek kaydına bağımsız erişilmedi. Genel başarı bütün alanların amaçlandığı gibi işlendiğini veya bildirimin cihazda göründüğünü kanıtlamaz.

**Açık:** tam wire tipleri/alan zorunluluğu/nullability, Unicode karakter sayım ayrıntıları, `user_id` → native User.id eşlemesi, somut kabul/başarı/hata/no-device JSON, güvenli workflow secret kaydı/referansı/header taşıması, native uygunluk/izin, idempotency ve logout/hesap değişimi/token yeniden bağlama. Validator Unicode code point sayar; platformun aynı sayımı yaptığı varsayılmaz. Fulfilled promise/genel başarı SENT/ACCEPTED/DELIVERED üretmez; adapter UNKNOWN kalır. Gerçek entry `enabled:false`, machine binding bağlı değil; H14-901/H16-901 açık.

## Health değişiklikleri ve dış blokajlar

**034 toplamı: 0 ekleme / 9 güncelleme / 0 silme.** Bu devamda yeni Health ID veya ek case kapsamı gerekmedi; mevcut 9 ID yeterli. Katalog: 16 suite / 175 case; 149 in-app, 12 local, 14 external, 0 future.

| ID | Güncelleme gerekçesi / gerçek kapsam |
|---|---|
| H04-019, H08-005, H09-004, H12-031 | Exact readiness, transient/mismatch ayrımı ve per-run memoization; SS04/SS10 gerçek case yürütmesi. |
| H12-025 | SS01/02, SS06–09 ve gerçek App navigation: transient, role/session kaybı, hesap nesli, login dönüşü, kontrollü pasif yenileme. Canlı OAuth kanıtı değil. |
| H12-033 | NA34A–C: A'nın kimliği/rolü korunarak B silme, role-loss sonrası yazma reddi, yanlış hedef/operasyonun yazmasız reddi. |
| H13-016 | TP01–04: pacing, unmount/session/hesap iptali, bekleme sonrası bütçe, aynı ID ve status-only recovery; AU kanıtları korundu. |
| H13-012 | T81/U15: iki tema, ON-04/ON-05 EN/TR arka plan ve taşma. Fiziksel cihaz kanıtı değil. |
| H14-901 | Resmî sayısal sınırlar/Home varsayılanı ile kullanıcıdan gelen alan adı/sessiz atma kanıtı ayrıldı. External/BLOCKED_EXTERNAL korunur; H16-901 değişmez. |

Yerel 13 BLOCKED: **H04-019, H05-001–H05-009, H08-005, H09-004, H12-031**. Fixture'da hosted/content önkoşulları bulunmaması PASS'e çevrilmedi. Canlı Full Health ve özel raporun gerçek ortamda kaydet/listele/aç kabulü kullanıcıya aittir.

Kullanıcı Base44 zod scan kapanışını bildirmişti; bu **USER_REPORTED_PLATFORM_EVIDENCE**, yeni yerel npm audit sıfır sonucundan ayrıdır. **12 backend bulgusu OPEN / USER-DEFERRED** kalır. İki gerçek silme operasyonunun önceki **PARTIAL** durumu yeniden okunmadı veya tamamlandı sayılmadı.

## Korunan tarihsel kanıtlar

`f3dbba1` checkpoint'indeki [verification.json](stabilization-034/verification.json), [ilk başarısızlıklar](stabilization-034/initial-failures.json), kaynak manifesti ve TLS/audit/browser makbuzları değiştirilmedi: eski temiz kurulum/audit BLOCKED, iki motorda 0 test/NOT_RUN ve eksik type/lint/build/performance kayıtları tarihsel olarak kalır. Yeni başarı bunların yerine yazılmadı; [resumed-20261026](stabilization-034/resumed-20261026/verification.json) ayrı kayıttır.

Base44'ün ilk SS02 failure/handoff'u [orijinal raporda](stabilization-034/base44-handoff-original.md) korunur. Sonraki SS02b failure, syntax/ID çakışması ve bu devamdaki tip/lint/NS02/T81/SS08/TP03/navigation hataları da saklandı. `1f061ec` destek notu turunda kullanıcı talimatıyla test çalıştırılmamıştı; yeni ağdaki bu açık devam talimatı o beklemeyi sona erdirdi. Önceki paketlerin 632/632 veya diğer sayıları 034 kanıtı olarak kullanılmadı.

## Kullanıcının yayın sonrası kısa kabulü

1. Hazır olduğunuzda mevcut Test → main/sync/publish akışını yürütün; eşleşen backend/shared/frontend kaynaklarını birlikte taşıyın. Bu ajan main merge veya publish yapmadı.
2. Normal oturumla dönüş, admin paneli, geçici hatada Retry, rol kaybında kapalı erişim ve login callback akışını uygulamada kontrol edin. ON-04/ON-05 tema/klavye ve fiziksel Android/iOS ayrıca kabul edilir.
3. Güncel 034 / HC-034.0 Full Health'i çalıştırıp özel raporu kaydedin, listeden açın; gerçek hosted önkoşulları yerel fixture sonuçlarından ayırın.
4. Önceki iki PARTIAL silme hedefinin güncel durumunu okuyun; gerekirse aynı operation ID ile devam edin. Bu çalışma gerçek kullanıcı silme/resume/reset yapmadı.
5. Bildirim göndermeyi/scheduler'ı kapalı tutun. Açık provider/workflow sözleşmeleri ve onaylı cihaz denemeleri ayrı tamamlanmadan H14-901/H16-901 kapanmaz.

Canlı Full Health/Security scan, push/workflow, import, gerçek kullanıcı işlemi, native build, main merge ve publish **NOT_RUN**.
