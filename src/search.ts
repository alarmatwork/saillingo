// Finding terms by name, in any language, forgiving small typos and missing accents.
import { TERM_IDS, lessonOf, type TermId, type TopicId } from './data/model.ts';
import type { LanguagePack } from './i18n/types.ts';
import { normalize } from './session.ts';

export interface Hit {
  term: TermId;
  topic: TopicId;
  /** lower is better */
  score: number;
}

/**
 * Typing mistakes between two words: a wrong, missing or extra letter, or two
 * neighbouring letters swapped (so "ankur" is one step from "ankru-").
 */
function typos(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[a.length][b.length];
}

/** How well one name matches the query: 0 exact ... 4 a near miss, or null. */
function nameScore(name: string, q: string): number | null {
  const n = normalize(name);
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.split(' ').some((w) => w.startsWith(q))) return 1.5;
  if (q.length >= 3 && n.includes(q)) return 2;
  const allowed = q.length >= 8 ? 2 : q.length >= 4 ? 1 : 0;
  if (allowed && [n, ...n.split(' ')].some((w) => typos(w, q) <= allowed)) return 3;
  // the start of a longer word with one typo, e.g. "ankur" for "ankrukett"
  if (allowed && n.split(' ').some((w) => w.length > q.length && typos(w.slice(0, q.length), q) <= 1)) return 4;
  return null;
}

export function search(query: string, langs: LanguagePack[], max = 20): Hit[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const hits: Hit[] = [];
  for (const term of TERM_IDS) {
    let best: number | null = null;
    for (const lang of langs) {
      const t = lang.terms[term];
      for (const name of [t.name, ...(t.alt ?? []), ...(t.accept ?? [])]) {
        const s = nameScore(name, q);
        // other spellings count a little less than the main name
        const scored = s === null ? null : name === t.name ? s : s + 0.5;
        if (scored !== null && (best === null || scored < best)) best = scored;
      }
      if (best === null && q.length >= 4 && normalize(t.desc).includes(q)) best = 6;
    }
    if (best !== null) hits.push({ term, topic: lessonOf(term).topic, score: best });
  }
  return hits.sort((a, b) => a.score - b.score).slice(0, max);
}
