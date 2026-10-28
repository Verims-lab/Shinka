import { APPROVED_COPY } from '../uiuxTables';
import { onboardingCopy } from './onboardingCopy';
// Original EN states remain verbatim. New labels/TR are scoped You package copy;
// no legal text or notification-delivery claim is supplied by this catalog.
export const YOU_COPY = Object.freeze({
  en: {
    languageUnknown:'Your language save is unconfirmed. Check App Preferences in You', languageError:APPROVED_COPY.you[2], title:'You', profile:'My Profile', preferences:'App Preferences', account:'Account & Privacy',
    display_name:'Name (optional)', birth_date:'Date of birth', birth_time:'Birth time (optional)', sun:'Sun sign',
    edit:'Edit profile', save:'Save', cancel:APPROVED_COPY.you[12], saved:APPROVED_COPY.you[1],
    loading:'Loading…', saving:'Saving…', loadError:'We couldn’t load your profile. Please try again',
    saveError:APPROVED_COPY.you[0], unknown:'The save result is unconfirmed. Check the saved values before retrying',
    check:'Check saved result', retry:'Retry the same save', conflict:'These values changed elsewhere. Reopen the saved values and review your draft',
    reopen:'Reopen saved values', language:'Language', appearance:'Appearance', themeLight:'Light', themeDark:'Dark', notifications:'Daily Notifications', notificationTime:'06:00 local target time; delivery time may vary',
    preferencesSaved:'Your preferences have been updated', preferencesDraft:'Unsaved changes. Tap Save to apply.', privacy:'Privacy Policy', terms:'Terms of Service', legalPending:'Content has not been published yet',
    consent:'Health Data Consent', GRANTED:'Consent granted', WITHDRAWN:'Consent withdrawn', NOT_GIVEN:'Consent not given', signOut:'Sign Out', back:'Back to Shinka',
    ARIES:'Aries',TAURUS:'Taurus',GEMINI:'Gemini',CANCER:'Cancer',LEO:'Leo',VIRGO:'Virgo',LIBRA:'Libra',SCORPIO:'Scorpio',SAGITTARIUS:'Sagittarius',CAPRICORN:'Capricorn',AQUARIUS:'Aquarius',PISCES:'Pisces',
  },
  tr: {
    languageUnknown:'Dil tercihin doğrulanamadı. Profil ekranından kayıtlı tercihini kontrol et', languageError:'Dil tercihin güncellenemedi. Lütfen tekrar dene', title:'Profil',profile:'Profilim',preferences:'Uygulama Tercihleri',account:'Hesap ve Gizlilik',
    display_name:'İsim (isteğe bağlı)',birth_date:'Doğum tarihi',birth_time:'Doğum saati (isteğe bağlı)',sun:'Güneş burcu',
    edit:'Profili düzenle',save:'Kaydet',cancel:'Vazgeç',saved:'Profilin güncellendi',loading:'Yükleniyor…',saving:'Kaydediliyor…',loadError:'Profilin yüklenemedi. Lütfen tekrar dene',
    saveError:onboardingCopy('saveError','tr'),unknown:'Kayıt sonucu doğrulanamadı. Yeniden denemeden önce kayıtlı değerleri kontrol et',
    check:'Kayıt sonucunu kontrol et',retry:'Aynı kaydı yeniden dene',conflict:'Bu değerler başka bir yerde değişti. Kayıtlı değerleri yeniden açıp taslağını gözden geçir',
    reopen:'Kayıtlı değerleri yeniden aç',language:'Dil',appearance:'Görünüm',themeLight:'Açık',themeDark:'Koyu',notifications:'Günlük Bildirimler',notificationTime:'Hedef yerel saat 06:00; teslim saati değişebilir',
    preferencesSaved:'Tercihlerin güncellendi',preferencesDraft:'Kaydedilmemiş değişiklik var. Uygulamak için Kaydet’e dokun.',
    privacy:'Gizlilik Politikası',terms:'Terms of Service',legalPending:'İçerik henüz yayımlanmadı',consent:'Sağlık Verisi Onamı',
    GRANTED:'Onam verildi',WITHDRAWN:'Onam geri çekildi',NOT_GIVEN:'Onam verilmedi',signOut:'Çıkış yap',back:'Shinka’ya dön',
    ARIES:'Koç',TAURUS:'Boğa',GEMINI:'İkizler',CANCER:'Yengeç',LEO:'Aslan',VIRGO:'Başak',LIBRA:'Terazi',SCORPIO:'Akrep',SAGITTARIUS:'Yay',CAPRICORN:'Oğlak',AQUARIUS:'Kova',PISCES:'Balık',
  },
});
export const youCopy = (key, language = 'en') => YOU_COPY[language]?.[key] ?? YOU_COPY.en[key] ?? onboardingCopy(key, language);