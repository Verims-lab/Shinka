import { onboardingCopy } from './onboardingCopy.js';
// Owner's 074 request: exact legal sentences and scoped interaction helpers.
// Loaded with legal screens so ordinary product startup retains its byte budget.
export const TERMS_COPY=Object.freeze({
 en:Object.freeze({
  termsAgreement:'I agree to the Terms of Use',termsLink:'Terms of Use',privacyInformation:'We handle your personal information in our Privacy Policy.',privacyLink:'Privacy Policy',
  existingAccount:'I already have an account',newAccount:'Create an account',returningTermsCheck:'Your previous Terms acceptance will be checked after sign-in.',
  termsContinue:'Accept and continue',termsCheck:'Check acceptance status',termsContinueSame:'Try the same acceptance again',termsNeeded:'Please confirm the current Terms to continue.',
  TERMS_CONFIRMATION_REQUIRED:'Please accept the Terms of Use',TERMS_CONFIGURATION_REQUIRED:'The Terms of Use are not ready for acceptance yet. Please try again later.',TERMS_STATE_UNAVAILABLE:'Your Terms acceptance could not be verified. Please check again.',TERMS_WRITE_UNCONFIRMED:'Your acceptance has not been confirmed. Check its status before trying again.',TERMS_VERSION_CHANGED:'The Terms of Use have changed. Please review and accept the current version.',TERMS_INTENT_UNAVAILABLE:'Your confirmation could not be carried through sign-in. Please try again.',
 }),
 tr:Object.freeze({
  termsAgreement:'Kullanım Koşullarını kabul ediyorum',termsLink:'Kullanım Koşullarını',privacyInformation:'Kişisel verilerinizi Gizlilik Politikamız kapsamında koruyoruz.',privacyLink:'Gizlilik Politikamız',
  existingAccount:'Zaten bir hesabım var',newAccount:'Hesap oluştur',returningTermsCheck:'Önceki koşul kabulün giriş yaptıktan sonra kontrol edilecek.',
  termsContinue:'Kabul et ve devam et',termsCheck:'Kabul durumunu kontrol et',termsContinueSame:'Aynı kabulü tekrar dene',termsNeeded:'Devam etmek için güncel koşulları onayla.',
  TERMS_CONFIRMATION_REQUIRED:'Lütfen Kullanım Koşullarını kabul et',TERMS_CONFIGURATION_REQUIRED:'Kullanım Koşulları henüz kabul için hazır değil. Lütfen daha sonra tekrar dene.',TERMS_STATE_UNAVAILABLE:'Koşul kabulün doğrulanamadı. Lütfen tekrar kontrol et.',TERMS_WRITE_UNCONFIRMED:'Kabulün henüz doğrulanmadı. Tekrar denemeden önce durumunu kontrol et.',TERMS_VERSION_CHANGED:'Kullanım Koşulları değişti. Lütfen güncel sürümü inceleyip kabul et.',TERMS_INTENT_UNAVAILABLE:'Onayın giriş işlemine aktarılamadı. Lütfen tekrar dene.',
 }),
});
export const termsCopy=(key,language)=>TERMS_COPY[language]?.[key]??onboardingCopy(key,language);
