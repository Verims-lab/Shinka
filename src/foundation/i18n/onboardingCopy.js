import { APPROVED_COPY } from '../uiuxTables.js';
import { STRINGS } from './strings.js';
// SRC-03 EN retained except explicit Final Closure/approved helper replacements.
// TR entries below are the exact current onboarding package approved product copy.
const errors=['NAME_TOO_LONG','AGE_DECLARATION_REQUIRED','AUTH_PROVIDER_FAILED','DOB_REQUIRED','DATE_INVALID','DOB_FUTURE','AGE_UNDER_18','TIME_INVALID','PLACE_SELECTION_REQUIRED','GEONAMES_EMPTY','GEONAMES_UNAVAILABLE','PERIOD_START_REQUIRED','PERIOD_START_FUTURE','DAYS_INTEGER','DURATION_INVALID','DURATION_RANGE','CYCLE_LENGTH_INVALID','CYCLE_LENGTH_RANGE','CONSENT_REQUIRED'];
const en={
 GEONAMES_RATE_LIMITED:'Too many place requests. Your selections are kept; please try again in about a minute.',
 TEST_RESET_CYCLE_USE_CALENDAR:'Your saved cycle history is preserved. Choose Skip for now; after onboarding, use Calendar to change dates.', TEST_RESET_STEP_CONFLICT:'A previous step is incomplete. Retry with the same information or refresh to review it.',
 placeOptional:'(optional)',placeSearchPlaceholder:'Search a city, region or country',placeMinChars:'Type at least 3 characters to search.',placeSearching:'Searching…',placeEmpty:'No matching places found. Try a different spelling.',placeNoMatchYet:'No matches in this set yet. More candidates can be checked.',placeMore:'Show more results',placeLoadingMore:'Loading more…',placeNarrow:'Shinka checks up to 200 candidates per search. Type a more specific name to check other candidates.',placeError:'Places couldn’t be loaded. Your typing is kept.',placeRetry:'Try again',placeClear:'Clear birthplace',placeKindCOUNTRY:'Country',placeKindREGION:'Region',placeKindPLACE:'Place',PLACE_SELECTION_INCOMPLETE:'Select a place from the list, or clear the field.',
 intro:'A gentle guide to your daily rhythm',birthChart:'Your birth chart',introBody:'Shinka combines your cycle, the Moon and your birth chart to support you with simple, meaningful insights',introCycle:'Your cycle',introCycleText:'Understand your unique rhythm',introMoon:'The Moon',introMoonText:'Discover its influence on your day',introChartText:'See the bigger picture about you',begin:'Begin',nameTitle:'What should we call you?',display_name:'Name',continue:'Continue',preferNot:'Prefer not to say',signIn:'Welcome',age:'I confirm that I am 18 or older',apple:STRINGS.en['auth.apple'],google:STRINGS.en['auth.google'],
 personal:'Personal Details',aboutTitle:'A little about you',aboutSubtitle:'Let’s begin with a few details about you',nameSubtitle:'We’ll use your name to make your daily insights feel more personal',signInSubtitle:'A little space to reconnect with yourself',cycleSubtitle:'Sharing your cycle details is optional. You can always add or update them later.',finish:'Finish',back:'Back',placeChoose:'Choose birthplace',placeDone:'Done',placeCancel:'Cancel',stepOf:'{n} of 5',birth_date:'Date of birth',birth_time:'Birth time',birthplace:'Birthplace',cycle:'Your cycle, your choice',period_start_date:'Last period start date',period_duration_days:'Period duration',initial_cycle_length_days:'Cycle length',skip:'Skip for now',health_consent:'I consent to Shinka processing my cycle data to provide cycle-based features and personalization.',preparation:'A little moment, just for you',preparing:'We’re preparing your first Shinka insight',retry:STRINGS.en['state.retry'],saveError:APPROVED_COPY.you[0],systemError:'Something went wrong. Please try again',inactive:'Your account is inactive',terms:'Terms of Service',
 ...Object.fromEntries(errors.map((key,index)=>[key,APPROVED_COPY.onboarding[index]])),
};
const tr={
 GEONAMES_RATE_LIMITED:'Çok fazla yer isteği yapıldı. Seçimlerin korunuyor; lütfen yaklaşık bir dakika sonra tekrar dene.',
 TEST_RESET_CYCLE_USE_CALENDAR:'Kayıtlı döngü geçmişin korunuyor. Şimdilik geç seçeneğini kullan; onboarding sonrasında tarihleri Takvim’den düzenleyebilirsin.', TEST_RESET_STEP_CONFLICT:'Önceki adım yarım kaldı. Aynı bilgilerle tekrar dene veya kontrol etmek için yenile.',
 placeOptional:'(isteğe bağlı)',placeSearchPlaceholder:'Şehir, bölge veya ülke ara',placeMinChars:'Aramak için en az 3 karakter yaz.',placeSearching:'Aranıyor…',placeEmpty:'Eşleşen yer bulunamadı. Farklı bir yazım dene.',placeNoMatchYet:'Bu grupta henüz eşleşme yok. Daha fazla aday kontrol edilebilir.',placeMore:'Daha fazla sonuç göster',placeLoadingMore:'Daha fazlası yükleniyor…',placeNarrow:'Shinka her aramada en fazla 200 adayı kontrol eder. Başka adayları kontrol etmek için daha belirgin bir ad yaz.',placeError:'Yerler yüklenemedi. Yazdıkların korunuyor.',placeRetry:'Tekrar dene',placeClear:'Doğum yerini temizle',placeKindCOUNTRY:'Ülke',placeKindREGION:'Bölge',placeKindPLACE:'Yer',PLACE_SELECTION_INCOMPLETE:'Listeden bir yer seç veya alanı temizle.',
 intro:'Günlük ritmine nazik bir rehber',birthChart:'Doğum haritan',introBody:'Shinka; döngünü, Ay’ı ve doğum haritanı bir araya getirerek seni sade ve anlamlı içgörülerle destekler',introCycle:'Döngün',introCycleText:'Kendine özgü ritmini anla',introMoon:'Ay',introMoonText:'Gününe olan etkisini keşfet',introChartText:'Kendinle ilgili büyük resmi gör',begin:'Başla',nameTitle:'Sana nasıl hitap edelim?',display_name:'Adın',continue:'Devam et',preferNot:'Belirtmek istemiyorum',signIn:'Hoş geldin',age:'18 yaşında veya daha büyük olduğumu onaylıyorum',apple:'Apple ile devam et',google:'Google ile devam et',
 personal:'Kişisel bilgilerin',aboutTitle:'Seni biraz tanıyalım',aboutSubtitle:'Seninle ilgili birkaç bilgiyle başlayalım',nameSubtitle:'Günlük içgörülerini daha kişisel kılmak için adını kullanacağız',signInSubtitle:'Kendinle yeniden bağ kurman için küçük bir alan',cycleSubtitle:'Döngü bilgilerini paylaşmak isteğe bağlıdır. Dilediğin zaman ekleyebilir veya güncelleyebilirsin.',finish:'Bitir',back:'Geri',placeChoose:'Doğum yerini seç',placeDone:'Tamam',placeCancel:'Vazgeç',stepOf:'{n} / 5',birth_date:'Doğum tarihi',birth_time:'Doğum saati',birthplace:'Doğum yeri',cycle:'Döngün, senin seçimin',period_start_date:'Son regl başlangıç tarihi',period_duration_days:'Regl süresi',initial_cycle_length_days:'Döngü uzunluğu',skip:'Şimdilik geç',health_consent:'Shinka’nın döngü verilerimi döngüye dayalı özellikler ve kişiselleştirme sunmak amacıyla işlemesine açık rıza veriyorum',preparation:'Sana özel küçük bir an',preparing:'İlk Shinka içgörünü hazırlıyoruz',retry:STRINGS.tr['state.retry'],
 // Additional helper mappings approved by the user in this continuation.
 saveError:'Değişikliklerin kaydedilemedi. Lütfen tekrar dene',systemError:'Bir şeyler ters gitti. Lütfen tekrar dene',inactive:'Hesabın aktif değil',terms:'Terms of Service',
 NAME_TOO_LONG:'Lütfen daha kısa bir isim gir',
 AGE_DECLARATION_REQUIRED:'Lütfen 18 yaşında veya daha büyük olduğunu onayla',
 AUTH_PROVIDER_FAILED:'Giriş yapılamadı. Lütfen tekrar dene',
 DOB_REQUIRED:'Lütfen doğum tarihini gir',
 DATE_INVALID:'Lütfen geçerli bir tarih gir',
 DOB_FUTURE:'Doğum tarihi gelecekte olamaz',
 AGE_UNDER_18:'Shinka yalnızca 18 yaş ve üzeri kullanıcılar içindir',
 TIME_INVALID:'Lütfen geçerli bir saat gir',
 PLACE_SELECTION_REQUIRED:'Lütfen listeden bir yer seç',
 GEONAMES_EMPTY:'Yer bulunamadı',
 GEONAMES_UNAVAILABLE:'Yerler yüklenemedi. Lütfen tekrar dene',
 PERIOD_START_REQUIRED:'Lütfen son regl başlangıç tarihini gir',
 PERIOD_START_FUTURE:'Regl başlangıç tarihi gelecekte olamaz',
 DAYS_INTEGER:'Lütfen gün sayısını tam sayı olarak gir',
 DURATION_INVALID:'Lütfen geçerli bir regl süresi gir',
 DURATION_RANGE:'Lütfen desteklenen aralıkta bir regl süresi gir',
 CYCLE_LENGTH_INVALID:'Lütfen geçerli bir döngü uzunluğu gir',
 CYCLE_LENGTH_RANGE:'Lütfen 15–60 gün arasında bir döngü uzunluğu gir',
 CONSENT_REQUIRED:'Devam etmek için döngü verilerinin kullanılmasına açık rıza vermelisin',
};
export const ONBOARDING_COPY=Object.freeze({en:Object.freeze(en),tr:Object.freeze(tr)});
export const ONBOARDING_COPY_STATUS=Object.freeze({en:'APPROVED_SOURCE',tr:'APPROVED_PRODUCT_COPY'});
export const onboardingCopy=(key,language)=>ONBOARDING_COPY[language]?.[key]??'COPY_KEY_MISSING';
export const ONBOARDING_ERROR_KEYS=Object.freeze([...errors,'GEONAMES_RATE_LIMITED','TEST_RESET_CYCLE_USE_CALENDAR','TEST_RESET_STEP_CONFLICT','PLACE_SELECTION_INCOMPLETE']);