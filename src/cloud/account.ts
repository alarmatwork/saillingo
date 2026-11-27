// The game's side of optional sign-in: loads sync.js when needed, merges the
// saved progress with what is on this device, and uploads after every change.
import { cloudData, followProgress, mergeCloud, noProgress, saveState, setSaveListener, type State } from '../store.ts';
import { LANGS } from '../i18n/index.ts';
import { FIREBASE_CONFIG } from './config.ts';
import type { Cloud, CloudFactory, CloudUser, Provider } from './types.ts';

export type SyncStatus = 'off' | 'loading' | 'synced' | 'error';

export interface Account {
  /** false when no Firebase project is configured: hide everything about accounts */
  readonly available: boolean;
  user: CloudUser | null;
  status: SyncStatus;
  signIn(provider: Provider): Promise<void>;
  /** Emails a one-time sign-in link to the address. */
  sendEmailLink(email: string): Promise<void>;
  signOut(): Promise<void>;
  /** Proof of who is signed in (for the admin page's own requests); null when nobody is. */
  token(): Promise<string | null>;
}

/**
 * @param getState current game state (it can be replaced, e.g. by "reset progress")
 * @param changed  called when the account or the synced progress changed, to redraw
 * @param askEmail asks the player for their address when an emailed link is opened
 *                 in a browser that does not remember it
 */
export function createAccount(getState: () => State, changed: () => void, askEmail: () => string | null): Account {
  let cloud: Cloud | null = null;
  let loading: Promise<Cloud> | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const load = () =>
    (loading ??= new Promise<Cloud>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'sync.js';
      s.onload = () => {
        const make = (window as unknown as { __saillingoCloud?: CloudFactory }).__saillingoCloud;
        if (!make || !FIREBASE_CONFIG) return reject(new Error('sync.js did not load'));
        cloud = make(FIREBASE_CONFIG);
        cloud.onUser(onUser);
        resolve(cloud);
      };
      s.onerror = () => {
        loading = null; // offline: allow another try later
        reject(new Error('sync.js could not be loaded'));
      };
      document.head.append(s);
    }));

  /**
   * Brings this device and the account together: downloads what other devices
   * saved, merges it in, and uploads the result only if it differs. Uploading
   * without merging first would overwrite progress made on another device.
   */
  const push = async () => {
    if (!cloud || !account.user) return;
    const uid = account.user.uid;
    const st = getState();
    try {
      const remote = await cloud.load(uid);
      mergeCloud(st, remote);
      saveState(st, true);
      // `created` is when the account was first saved (0 = before this was recorded); it is only used for statistics
      const created = remote ? Number((remote as { created?: unknown }).created) || 0 : Date.now();
      const data = { ...cloudData(st), created };
      const same = (a: unknown) => JSON.stringify({ ...(a as object), updated: 0 });
      if (!remote || same(remote) !== same(data)) await cloud.save(uid, data);
      st.xpBase = st.xp; // the account now has everything earned here
      saveState(st, true);
      account.status = 'synced';
    } catch {
      account.status = 'error';
    }
    // the score for "TOP x %" is a separate, optional extra: a failure here does not affect syncing
    await cloud.saveScore(uid, getState().xp).catch(() => {});
    changed();
  };

  async function onUser(user: CloudUser | null) {
    const st = getState();
    account.user = user;
    if (!user) {
      account.status = 'off';
      if (st.account) {
        delete st.account;
        saveState(st);
      }
      return changed();
    }
    account.status = 'loading';
    changed();
    try {
      const fresh = noProgress(st);
      mergeCloud(st, await cloud!.load(user.uid));
      // a fresh device starts in the phone's language: follow the account's progress instead
      if (fresh) followProgress(st, (lang) => lang in LANGS);
      st.account = { name: user.name };
      account.status = 'synced';
      saveState(st); // also triggers the upload of the merged result
    } catch {
      account.status = 'error';
    }
    changed();
  }

  const account: Account = {
    available: FIREBASE_CONFIG !== null,
    user: null,
    status: 'off',
    async signIn(provider) {
      await (await load()).signIn(provider);
    },
    async sendEmailLink(email) {
      // the link brings the player back to this page, without whatever lesson is open
      await (await load()).sendEmailLink(email, location.href.split(/[?#]/)[0]);
    },
    token: async () => (cloud && account.user ? cloud.token() : null),
    async signOut() {
      // upload the latest progress first, so nothing done on this device is lost
      clearTimeout(timer);
      await push();
      await cloud?.signOut();
    },
  };

  if (account.available) {
    // upload shortly after every saved change, but not on every keystroke
    setSaveListener(() => {
      if (!account.user) return;
      clearTimeout(timer);
      timer = setTimeout(push, 1500);
    });
    // coming back to the app (e.g. a phone where it stayed open): pick up what was done elsewhere
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || !account.user) return;
      clearTimeout(timer);
      void push();
    });
    // An emailed sign-in link was opened: finish signing in, then tidy the address.
    if (/[?&]oobCode=/.test(location.search)) {
      load()
        .then((c) => c.completeEmailLink(location.href, askEmail))
        .then(() => history.replaceState(null, '', location.pathname + location.hash))
        .catch(() => { account.status = 'error'; changed(); });
    }
    // someone who signed in before: reconnect quietly (fails silently when offline)
    else if (getState().account) load().catch(() => {});
  }
  return account;
}
