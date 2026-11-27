// Built as its own file (dist/sync.js) so the Firebase SDK is only downloaded by
// players who sign in. It registers a factory the game calls with the config.
import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider, OAuthProvider, getAuth, isSignInWithEmailLink, onAuthStateChanged,
  sendSignInLinkToEmail, signInWithEmailLink, signInWithPopup, signOut,
} from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore/lite';
import type { CloudFactory } from './types.ts';

/** where the address is remembered between asking for the link and opening it */
const EMAIL_KEY = 'saillingo.signInEmail';

const factory: CloudFactory = (config) => {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  // each player can only read and write their own document: users/<their id>
  const ref = (uid: string) => doc(db, 'users', uid);
  return {
    onUser(cb) {
      onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, name: u.displayName ?? u.email ?? '' } : null));
    },
    async signIn(provider) {
      await signInWithPopup(auth, provider === 'apple' ? new OAuthProvider('apple.com') : new GoogleAuthProvider());
    },
    async sendEmailLink(email, returnTo) {
      await sendSignInLinkToEmail(auth, email, { url: returnTo, handleCodeInApp: true });
      localStorage.setItem(EMAIL_KEY, email);
    },
    async completeEmailLink(url, askEmail) {
      if (!isSignInWithEmailLink(auth, url)) return false;
      const email = localStorage.getItem(EMAIL_KEY) ?? askEmail();
      if (!email) return false;
      await signInWithEmailLink(auth, email, url);
      localStorage.removeItem(EMAIL_KEY);
      return true;
    },
    signOut: () => signOut(auth),
    load: async (uid) => (await getDoc(ref(uid))).data() ?? null,
    save: (uid, data) => setDoc(ref(uid), data),
    saveScore: (uid, xp) => setDoc(doc(db, 'scores', uid), { xp: Math.round(xp), updated: Date.now() }),
  };
};

(window as unknown as { __saillingoCloud: CloudFactory }).__saillingoCloud = factory;
