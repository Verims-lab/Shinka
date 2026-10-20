import { APPROVED_COPY } from '../uiuxTables.js';
import { STRINGS } from './strings.js';
// SRC-03 EN retained except explicit Final Closure/approved helper replacements.
// TR entries below are the exact current onboarding package approved product copy.
const errors=['NAME_TOO_LONG','AGE_DECLARATION_REQUIRED','AUTH_PROVIDER_FAILED','DOB_REQUIRED','DATE_INVALID','DOB_FUTURE','AGE_UNDER_18','TIME_INVALID','PLACE_SELECTION_REQUIRED','GEONAMES_EMPTY','GEONAMES_UNAVAILABLE','PERIOD_START_REQUIRED','PERIOD_START_FUTURE','DAYS_INTEGER','DURATION_INVALID','DURATION_RANGE','CYCLE_LENGTH_INVALID','CYCLE_LENGTH_RANGE','CONSENT_REQUIRED'];
const en={
 TEST_RESET_CYCLE_USE_CALENDAR:'Your saved cycle history is preserved. Choose Skip for now; after onboarding, use Calendar to change dates.', TEST_RESET_STEP_CONFLICT:'A previous step is incomplete. Retry with the same information or refresh to review it.',
 placeOptional:'(optional)',placeHelp:'Choose a country, then narrow by region or select your settlement. Regions only filter the list.',placeCountry:'Country',placeRegion:'State / Province / Region',placeDistrict:'District / County',placeSubregion:'Subregion',placeSettlement:'Birth settlement',placeChooseCountry:'Choose a country',placeChooseCountryFirst:'Choose a country first',placeChooseRegion:'Choose a region to narrow the list',placeChooseSettlement:'Choose your settlement',placeLoading:'Loading options…',placeEmpty:'No settlements found in this area.',placeNoRegions:'No further administrative level is available. You can select a settlement below.',placeSelected:'Selected birthplace',placeChange:'Change birthplace',placeClear:'Clear / Leave empty for now',placePage:'{from}–{to} of {total} options',placePages:'List pages',placePrevious:'Previous page',placeNext:'Next page',placeLimit:'This area exceeds the provider’s paging limit. Choose a smaller region to access the remaining places.',PLACE_SELECTION_INCOMPLETE:'Select a settlement to complete your birthplace, or clear the field.',PLACE_HIERARCHY_INCOMPLETE:'Administrative data is incomplete for this area. Try again, choose a different region, or leave birthplace empty.',
 intro:'A gentle guide to your daily rhythm',birthChart:'Your birth chart',begin:'Begin',nameTitle:'What should we call you?',display_name:'Name',continue:'Continue',preferNot:'Prefer not to say',signIn:'Welcome',age:'I confirm that I am 18 or older',apple:STRINGS.en['auth.apple'],google:STRINGS.en['auth.google'],
 personal:'Personal Details',birth_date:'Date of birth',birth_time:'Birth time',birthplace:'Birthplace',cycle:'Your cycle, your choice',period_start_date:'Last period start date',period_duration_days:'Period duration',initial_cycle_length_days:'Cycle length',skip:'Skip for now',health_consent:'I consent to Shinka processing my cycle data to provide cycle-based features and personalization.',preparation:'A little moment, just for you',preparing:'We’re preparing your first Shinka insight',retry:STRINGS.en['state.retry'],saveError:APPROVED_COPY.you[0],systemError:'Something went wrong. Please try again',inactive:'Your account is inactive',terms:'Terms of Service',
 ...Object.fromEntries(errors.map((key,index)=>[key,APPROVED_COPY.onboarding[index]])),
};
const tr={
 TEST_RESET_CYCLE_USE_CALENDAR:'Kayıtlı döngü geçmişin korunuyor. Şimdilik geç seçeneğini kullan; onboarding sonrasında tarihleri Takvim’den düzenleyebilirsin.', TEST_RESET_STEP_CONFLICT:'Önceki adım yarım kaldı. Aynı bilgilerle tekrar dene veya kontrol etmek için yenile.',
 placeOptional:'(isteğe bağlı)',placeHelp:'Ülke seç, ardından bölgeyle daralt veya yerleşimini seç. Bölgeler yalnızca listeyi filtreler.',placeCountry:'Ülke',placeRegion:'İl / Bölge / Eyalet',placeDistrict:'İlçe / İdari bölge',placeSubregion:'Alt bölge',placeSettlement:'Doğduğun yerleşim',placeChooseCountry:'Ülke seç',placeChooseCountryFirst:'Önce ülke seç',placeChooseRegion:'Listeyi daraltmak için bölge seç',placeChooseSettlement:'Yerleşimini seç',placeLoading:'Seçenekler yükleniyor…',placeEmpty:'Bu bölgede yerleşim bulunamadı.',placeNoRegions:'Başka bir idari seviye bulunmuyor. Aşağıdan yerleşim seçebilirsin.',placeSelected:'Seçilen doğum yeri',placeChange:'Doğum yerini değiştir',placeClear:'Temizle / Şimdilik boş bırak',placePage:'{total} seçenekten {from}–{to}',placePages:'Liste sayfaları',placePrevious:'Önceki sayfa',placeNext:'Sonraki sayfa',placeLimit:'Bu bölge servisin sayfalama sınırını aşıyor. Kalan yerlere ulaşmak için daha küçük bir bölge seç.',PLACE_SELECTION_INCOMPLETE:'Doğum yerini tamamlamak için bir yerleşim seç veya alanı temizle.',PLACE_HIERARCHY_INCOMPLETE:'Bu bölgenin idari verileri eksik. Tekrar dene, farklı bir bölge seç veya doğum yerini boş bırak.',
 intro:'Günlük ritmine nazik bir rehber',birthChart:'Doğum haritan',begin:'Başla',nameTitle:'Sana nasıl hitap edelim?',display_name:'Adın',continue:'Devam et',preferNot:'Belirtmek istemiyorum',signIn:'Hoş geldin',age:'18 yaşında veya daha büyük olduğumu onaylıyorum',apple:'Apple ile devam et',google:'Google ile devam et',
 personal:'Kişisel bilgilerin',birth_date:'Doğum tarihi',birth_time:'Doğum saati',birthplace:'Doğum yeri',cycle:'Döngün, senin seçimin',period_start_date:'Son regl başlangıç tarihi',period_duration_days:'Regl süresi',initial_cycle_length_days:'Döngü uzunluğu',skip:'Şimdilik geç',health_consent:'Shinka’nın döngü verilerimi döngüye dayalı özellikler ve kişiselleştirme sunmak amacıyla işlemesine açık rıza veriyorum',preparation:'Sana özel küçük bir an',preparing:'İlk Shinka içgörünü hazırlıyoruz',retry:STRINGS.tr['state.retry'],
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
export const ONBOARDING_ERROR_KEYS=Object.freeze([...errors,'TEST_RESET_CYCLE_USE_CALENDAR','TEST_RESET_STEP_CONFLICT','PLACE_SELECTION_INCOMPLETE','PLACE_HIERARCHY_INCOMPLETE']);
