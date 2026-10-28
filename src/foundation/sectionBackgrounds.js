// 046 user-approved section backgrounds. The uploaded PNGs are the visual source
// (originals kept unchanged in media storage); the app loads one native-size
// (941x1672, no upscale) JPEG q85 CDN derivative per asset. Main/Calender/Pattern/You
// uploads are byte-identical (sha256 5b073124a7bd…) so they share ONE asset/URL.
// Sections keep separate logical entries so one can be swapped independently.
const MEDIA = 'https://media.base44.com/images/public/6ad5190f4845d4e3af03b420/';
const DERIVATIVE = '/v1/fill/w_941,h_1672,al_c,q_85/';

export const BACKGROUND_SOURCES = Object.freeze({
  watercolor: `${MEDIA}fc68f6082_Main.png`,
  onboardingMoon: `${MEDIA}220a7ce68_Onbaording.png`,
});

export const BACKGROUND_ASSETS = Object.freeze({
  watercolor: `${BACKGROUND_SOURCES.watercolor}${DERIVATIVE}shinka-watercolor.jpg`,
  onboardingMoon: `${BACKGROUND_SOURCES.onboardingMoon}${DERIVATIVE}shinka-onboarding.jpg`,
});

// focusY anchors the portrait cover crop; on landscape the onboarding art is
// shown whole at full height instead (sectionBackground.css).
export const SECTION_BACKGROUNDS = Object.freeze({
  onboarding: Object.freeze({ asset: 'onboardingMoon', focusY: '0%' }),
  home: Object.freeze({ asset: 'watercolor', focusY: '50%' }),
  calendar: Object.freeze({ asset: 'watercolor', focusY: '50%' }),
  pattern: Object.freeze({ asset: 'watercolor', focusY: '50%' }),
  you: Object.freeze({ asset: 'watercolor', focusY: '50%' }),
});

export function sectionBackground(section) {
  const config = SECTION_BACKGROUNDS[section];
  return config ? { url: BACKGROUND_ASSETS[config.asset], focusY: config.focusY } : null;
}