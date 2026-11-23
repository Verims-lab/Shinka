const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 0.5;

// The owner-confirmed 082 Android case has a CSS/visual viewport already
// clamped above one complete system inset. Match the whole observed behavior,
// never safeBottom or Android identity alone. State is App-lifetime only.
export function createNavigationInsetResolver() {
  let confirmed = null;
  return metrics => {
    const { android, topLevel, browserMode, scale, width, screenWidth, screenHeight,
      nativeBottom, layoutBottom, visualBottom, safeBottom, declaredConsumed,
      dockBottom, barBottom, dockPadding, cssBottom, pixelRatio } = metrics;
    const fallback = reason => { confirmed = null; return { consumed:0, reason }; };
    if (declaredConsumed > 0) return fallback('NATIVE_DECLARATION');
    if (!android || !topLevel || !browserMode || scale !== 1 || !(safeBottom > 0) ||
        !(width > 0) || !(screenWidth > 0) || !close(width, screenWidth) || !(screenHeight > screenWidth) ||
        !(nativeBottom > 0) || !(visualBottom > 0) || dockPadding !== 0 || !close(dockBottom,barBottom))
      return fallback('SAFE_AREA_FALLBACK');
    const key = [width,screenWidth,screenHeight,safeBottom,pixelRatio].join(':');
    // A keyboard/toolbar may reduce a previously confirmed viewport. Do not
    // add the same inset again. A larger/rotated/zoomed/changed screen loses the
    // match, so genuine edge-to-edge behavior immediately restores protection.
    if (confirmed?.key === key && nativeBottom <= confirmed.bottom + 0.5 && visualBottom <= nativeBottom + 0.5)
      return { consumed:safeBottom, reason:'ANDROID_CLAMPED_VIEWPORT' };
    confirmed = null;
    if (close(nativeBottom,layoutBottom) && close(nativeBottom,visualBottom) &&
        close(screenHeight-nativeBottom,safeBottom) && close(nativeBottom-barBottom,safeBottom) && close(cssBottom,safeBottom)) {
      confirmed = { key, bottom:nativeBottom };
      return { consumed:safeBottom, reason:'ANDROID_CLAMPED_VIEWPORT' };
    }
    return { consumed:0, reason:'SAFE_AREA_FALLBACK' };
  };
}
