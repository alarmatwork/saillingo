// Built as its own file (dist/live.js) so the full Firestore SDK and the QR code
// generator are only downloaded by people who open the party quiz.
//
// Every device signs in anonymously (no name, no email): that gives it an id, so
// the security rules can let only the host change a game and only a player
// change their own score. A separate Firebase app is used so this never mixes
// with the optional account used for syncing progress.
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { collection, doc, getCountFromServer, getDoc, getFirestore, onSnapshot, query, runTransaction, setDoc, updateDoc, where } from 'firebase/firestore';
import qrcode from 'qrcode-generator';
import type { LiveBackend, LiveLib } from './backend.ts';
import type { Game, Player } from './core.ts';

/** The server's clock, from the Date header of a small request (Firestore lets pages read it). */
async function clockOffset(config: Record<string, string>): Promise<number> {
  try {
    const sent = Date.now();
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/games/-?key=${config.apiKey}`, { cache: 'no-store' });
    const got = Date.now();
    const date = Date.parse(res.headers.get('date') ?? '');
    // the header has whole seconds, so on average the real time is half a second later
    return Number.isFinite(date) ? date + 500 - (sent + got) / 2 : 0;
  } catch {
    return 0;
  }
}

const lib: LiveLib = {
  async make(config) {
    const app = initializeApp(config, 'live');
    const auth = getAuth(app);
    const db = getFirestore(app);
    const offset = await clockOffset(config);
    const game = (code: string) => doc(db, 'games', code);
    const players = (code: string) => collection(db, 'games', code, 'players');
    const backend: LiveBackend = {
      async uid() {
        await auth.authStateReady();
        return (auth.currentUser ?? (await signInAnonymously(auth)).user).uid;
      },
      now: () => Date.now() + offset,
      createGame: (code, g) =>
        runTransaction(db, async (tx) => {
          if ((await tx.get(game(code))).exists()) return false;
          tx.set(game(code), g);
          return true;
        }),
      updateGame: (code, patch) => updateDoc(game(code), patch),
      watchGame: (code, cb) => onSnapshot(game(code), (snap) => cb((snap.data() as Game | undefined) ?? null), () => cb(null)),
      watchPlayers: (code, cb) => onSnapshot(players(code), (snap) => cb(snap.docs.map((d) => d.data() as Player)), () => {}),
      getPlayer: async (code, uid) => ((await getDoc(doc(players(code), uid))).data() as Player | undefined) ?? null,
      savePlayer: (code, p) => setDoc(doc(players(code), p.id), p),
      countAbove: async (code, score) => (await getCountFromServer(query(players(code), where('score', '>', score)))).data().count,
    };
    return backend;
  },
  qr(text) {
    const q = qrcode(0, 'M');
    q.addData(text);
    q.make();
    return q.createSvgTag({ scalable: true, margin: 2 });
  },
};
(window as unknown as { __saillingoLive?: LiveLib }).__saillingoLive = lib;
