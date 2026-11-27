// Optional sign-in and progress sync with Firebase (https://firebase.google.com).
//
// Leave this as `null` and the game has no accounts and talks to no server.
// To switch it on, paste the "firebaseConfig" object that the Firebase console
// shows under Project settings -> Your apps -> Web app. These values identify
// the project and are meant to be public; access is controlled by the Firestore
// security rules (see README).
export const FIREBASE_CONFIG: Record<string, string> | null = {
  apiKey: 'AIzaSyBX0bHxeDOBgkku2dWn2eBWT8JrSxxIpbE',
  authDomain: 'sailingo-7c642.firebaseapp.com',
  projectId: 'sailingo-7c642',
  storageBucket: 'sailingo-7c642.firebasestorage.app',
  messagingSenderId: '854896830479',
  appId: '1:854896830479:web:de131dcab31e5b399a1b7a',
};

/**
 * Shows the party quiz button on the home page. The game itself always works
 * at #party; this only decides whether everyone is pointed to it. It needs
 * anonymous sign-in and the `games` rules in the Firebase project (see README).
 */
export const LIVE_ON_HOME = true;
