// Optional, cookie-free visit counting with GoatCounter (https://www.goatcounter.com).
// Leave the code empty and the game contacts no one.
// Set it to your GoatCounter site code, e.g. 'saillingo' for saillingo.goatcounter.com.
const GOATCOUNTER_CODE = 'saillingo';

interface GoatCounter {
  count?: (vars: { path: string; title?: string; event?: boolean }) => void;
}

/** Loads the counter script; it records one page view by itself. */
export function initAnalytics(): void {
  if (!GOATCOUNTER_CODE || !location.protocol.startsWith('http')) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
  document.head.append(s);
}

/** Records something the player did, e.g. track('lesson-done/hull1'). Never throws. */
export function track(name: string): void {
  try {
    (window as { goatcounter?: GoatCounter }).goatcounter?.count?.({ path: name, title: name, event: true });
  } catch {
    /* counting must never break the game */
  }
}
