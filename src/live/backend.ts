// How the party quiz talks to the outside world. The real thing is Firestore
// (loaded on demand as live.js, so nobody else downloads it); for trying the
// game out without a server there is a stand-in that works between tabs of one
// browser: add ?mocklive to the address.
import { FIREBASE_CONFIG, LIVE_ON_HOME } from '../cloud/config.ts';
import type { Game, Player } from './core.ts';

export interface LiveBackend {
  /** This device's id for games; signs in anonymously the first time. */
  uid(): Promise<string>;
  /** The shared clock (ms): every device's own clock corrected to the server's. */
  now(): number;
  /** Creates the game; false when the code is already taken. */
  createGame(code: string, game: Game): Promise<boolean>;
  updateGame(code: string, patch: Partial<Game>): Promise<void>;
  watchGame(code: string, cb: (g: Game | null) => void): () => void;
  watchPlayers(code: string, cb: (players: Player[]) => void): () => void;
  getPlayer(code: string, uid: string): Promise<Player | null>;
  savePlayer(code: string, player: Player): Promise<void>;
  /** How many players have more points than this. */
  countAbove(code: string, score: number): Promise<number>;
}

export interface LiveLib {
  make(config: Record<string, string>): Promise<LiveBackend>;
  /** An SVG picture of a QR code for the text. */
  qr(text: string): string;
}

const mock = () => /[?&]mocklive\b/.test(location.search);
export const liveAvailable = () => FIREBASE_CONFIG !== null || mock();
/** whether the home page offers the party quiz */
export const liveOnHome = () => mock() || (FIREBASE_CONFIG !== null && LIVE_ON_HOME);

let lib: Promise<LiveLib> | null = null;
const loadLib = () =>
  (lib ??= new Promise<LiveLib>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'live.js';
    s.onload = () => {
      const l = (window as unknown as { __saillingoLive?: LiveLib }).__saillingoLive;
      if (l) resolve(l);
      else reject(new Error('live.js did not load'));
    };
    s.onerror = () => {
      lib = null; // offline: allow another try
      reject(new Error('live.js could not be loaded'));
    };
    document.head.append(s);
  }));

let backend: Promise<LiveBackend> | null = null;
export function loadLive(): Promise<{ backend: LiveBackend; qr: (text: string) => string }> {
  const l = loadLib();
  backend ??= mock() ? Promise.resolve(mockBackend()) : l.then((x) => x.make(FIREBASE_CONFIG!));
  backend.catch(() => { backend = null; });
  return Promise.all([l, backend]).then(([x, b]) => ({ backend: b, qr: x.qr }));
}

/** Games kept in localStorage and announced to other tabs through its change events. */
function mockBackend(): LiveBackend {
  const read = <T>(key: string): T | null => JSON.parse(localStorage.getItem(key) ?? 'null') as T | null;
  const listeners = new Map<string, Set<() => void>>();
  const write = (key: string, value: unknown) => {
    localStorage.setItem(key, JSON.stringify(value));
    listeners.get(key)?.forEach((fn) => fn());
  };
  window.addEventListener('storage', (e) => { if (e.key) listeners.get(e.key)?.forEach((fn) => fn()); });
  const watch = (key: string, fn: () => void) => {
    let set = listeners.get(key);
    if (!set) listeners.set(key, (set = new Set()));
    set.add(fn);
    setTimeout(fn, 0);
    return () => { set.delete(fn); };
  };
  const gameKey = (c: string) => `mocklive:game:${c}`, playersKey = (c: string) => `mocklive:players:${c}`;
  const players = (c: string) => read<Record<string, Player>>(playersKey(c)) ?? {};
  let id = sessionStorage.getItem('mocklive:uid');
  if (!id) sessionStorage.setItem('mocklive:uid', (id = Math.random().toString(36).slice(2, 10)));
  const uid = id;
  return {
    uid: async () => uid,
    now: () => Date.now(),
    async createGame(code, game) {
      if (read(gameKey(code))) return false;
      write(gameKey(code), game);
      return true;
    },
    async updateGame(code, patch) {
      write(gameKey(code), { ...read<Game>(gameKey(code)), ...patch });
    },
    watchGame: (code, cb) => watch(gameKey(code), () => cb(read<Game>(gameKey(code)))),
    watchPlayers: (code, cb) => watch(playersKey(code), () => cb(Object.values(players(code)))),
    getPlayer: async (code, pid) => players(code)[pid] ?? null,
    async savePlayer(code, player) {
      write(playersKey(code), { ...players(code), [player.id]: player });
    },
    countAbove: async (code, score) => Object.values(players(code)).filter((p) => p.score > score).length,
  };
}
