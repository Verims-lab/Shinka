// Reserve the window during the user gesture, then navigate only while the
// requesting screen still owns it. SDK invocation itself cannot be aborted.
/** @param {()=>Promise<string>} loadUrl
 * @param {()=>null|{closed:boolean,opener:unknown,close:()=>void,location:{replace:(url:string)=>void},document:{createElement:(tag:string)=>any,head:{append:(meta:any)=>void}}}} open */
export function beginPrivateReport(loadUrl, open = () => window.open('about:blank', '_blank')) {
  let popup;
  try { popup = open(); } catch { popup = null; }
  let cancelled = false, navigated = false;
  const cancel = () => { cancelled = true; if (!navigated) popup?.close(); };
  const result = (async () => {
    if (!popup) throw new Error('HEALTH_REPORT_WINDOW_BLOCKED');
    try {
      popup.opener = null;
      const meta = popup.document.createElement('meta');
      meta.name = 'referrer'; meta.content = 'no-referrer'; popup.document.head.append(meta);
      const value = await loadUrl();
      if (cancelled || popup.closed) return false;
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('INVALID_REPORT_URL');
      popup.location.replace(url.href);
      navigated = true;
      return true;
    } catch {
      popup.close();
      if (cancelled) return false;
      throw new Error('HEALTH_HISTORY_READ_FAILED');
    }
  })();
  return { cancel, result };
}
