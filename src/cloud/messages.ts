// Messages to the developer (partner enquiries, suggested terms). Each one is
// stored in Firestore under messages/ (anyone may add one, nobody can read them
// from the app) and copied to a Google Form, which emails a notification and
// keeps a list of responses. Works without signing in and without the Firebase SDK.
import { FIREBASE_CONFIG } from './config.ts';

export interface Message {
  kind: 'partner' | 'term';
  text: string;
  name?: string;
  contact?: string;
  lang: string;
}

/**
 * A Google Form that receives a copy of every message, so that Google emails a
 * notification. Leave `null` to send to Firestore only.
 * The field numbers come from the form page (entry.<number>).
 */
const GOOGLE_FORM: { url: string; message: string; name: string; contact: string } | null = {
  url: 'https://docs.google.com/forms/d/e/1FAIpQLSdM29xIH2ZdZPD9zg84nuqEoERoXooKAHbjxx8JPx6oKBesew/formResponse',
  message: 'entry.1696754510',
  name: 'entry.2044888068',
  contact: 'entry.302029917',
};

/** Google Forms does not let a page read its answer, so a sent request counts as delivered. */
async function sendToForm(m: Message): Promise<void> {
  if (!GOOGLE_FORM) throw new Error('no form configured');
  const body = new URLSearchParams({
    [GOOGLE_FORM.message]: `[${m.kind === 'term' ? 'Termin' : 'Partner'} · ${m.lang}] ${m.text}`,
    [GOOGLE_FORM.name]: m.name ?? '',
    [GOOGLE_FORM.contact]: m.contact ?? '',
  });
  await fetch(GOOGLE_FORM.url, { method: 'POST', mode: 'no-cors', body });
}

/** Sends to both places; succeeds if at least one of them took the message. */
export async function sendMessage(m: Message): Promise<void> {
  const results = await Promise.allSettled([sendToFirestore(m), sendToForm(m)]);
  if (results.every((r) => r.status === 'rejected')) throw new Error('sending failed');
}

async function sendToFirestore(m: Message): Promise<void> {
  if (!FIREBASE_CONFIG) throw new Error('no database configured');
  const fields: Record<string, unknown> = { at: { integerValue: String(Date.now()) } };
  for (const [k, v] of Object.entries(m)) if (v !== undefined && v !== '') fields[k] = { stringValue: String(v).slice(0, 1000) };
  const c = FIREBASE_CONFIG;
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${c.projectId}/databases/(default)/documents/messages?key=${c.apiKey}`,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fields }) },
  );
  if (!res.ok) throw new Error(`sending failed: ${res.status}`);
}
