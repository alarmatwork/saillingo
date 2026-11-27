// "Add SailLingo to your home screen": Android/desktop Chrome and Edge offer a
// real install prompt (beforeinstallprompt); iPhone Safari and the rest only
// have a menu item, so the note tells where to find it.

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPrompt | null = null;
let installed = false;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((f) => f());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // keep the browser's own mini bar away, we show our note instead
    deferred = e as InstallPrompt;
    changed();
  });
  window.addEventListener('appinstalled', () => { installed = true; deferred = null; changed(); });
}

/** Already running as an installed app. */
export function isStandalone(): boolean {
  return installed
    || matchMedia('(display-mode: standalone)').matches
    || matchMedia('(display-mode: fullscreen)').matches
    || (navigator as { standalone?: boolean }).standalone === true;
}

export type InstallWay = 'prompt' | 'ios' | 'android' | 'inApp' | null;

/** How this browser lets the page be added to the home screen, or null when there is nothing to show. */
export function installWay(ua = navigator.userAgent, touch = navigator.maxTouchPoints): InstallWay {
  if (isStandalone()) return null;
  if (deferred) return 'prompt';
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touch > 1);
  // Facebook, Instagram and other in-app browsers cannot add to the home screen at all
  const inApp = /FBAN|FBAV|FB_IAB|Instagram|Line\/|Messenger/.test(ua);
  if (!ios && !/Android/.test(ua)) return null; // desktop without an install prompt: not worth a note
  if (inApp) return 'inApp';
  return ios ? 'ios' : 'android';
}

/** Opens the browser's install dialog. True when the player said yes. */
export async function promptInstall(): Promise<boolean> {
  const e = deferred;
  if (!e) return false;
  deferred = null;
  await e.prompt();
  const { outcome } = await e.userChoice;
  changed();
  return outcome === 'accepted';
}

/** Calls `f` when the install possibility changes (prompt became available, app installed). */
export function onInstallChange(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}
