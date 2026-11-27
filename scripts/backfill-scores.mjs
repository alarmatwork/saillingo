// One-off: create the anonymous "TOP x %" score (scores/<uid>) for every saved
// account (users/<uid>), so that players who have not opened the app since the
// ranking was added are counted too. Safe to run again: it only (re)writes scores.
//
// Needs a Firebase service-account key (Project settings -> Service accounts ->
// Generate new private key). Keep that file private and delete the key afterwards.
//
//   npm install firebase-admin            (in a scratch folder, not this project)
//   node backfill-scores.mjs key.json            dry run: shows what would be written
//   node backfill-scores.mjs key.json --write    writes the scores
import { readFile } from 'node:fs/promises';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const [keyFile, flag] = process.argv.slice(2);
if (!keyFile) {
  console.error('usage: node backfill-scores.mjs <service-account-key.json> [--write]');
  process.exit(1);
}
const write = flag === '--write';
initializeApp({ credential: cert(JSON.parse(await readFile(keyFile, 'utf8'))) });
const db = getFirestore();

const users = await db.collection('users').get();
let written = 0, skipped = 0;
const batch = db.batch();
for (const doc of users.docs) {
  const xp = Math.round(Number(doc.get('xp')));
  if (!Number.isFinite(xp) || xp < 0 || xp >= 1_000_000) {
    skipped++;
    continue;
  }
  batch.set(db.collection('scores').doc(doc.id), { xp, updated: Number(doc.get('updated')) || Date.now() });
  written++;
}
if (write && written) await batch.commit();
const scores = await db.collection('scores').count().get();
console.log(`${users.size} accounts: ${written} scores ${write ? 'written' : 'to write (dry run)'}, ${skipped} skipped.`);
console.log(`scores collection now holds ${scores.data().count} entries.`);
