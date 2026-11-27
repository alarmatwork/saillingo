// The party quiz: one person creates a game, shows it on a big screen, and
// everyone answers on their own phone. This file is the pure logic (no DOM, no
// network): which questions are asked, what happens when, and the scoring.
//
// The game runs on a shared clock rather than on messages: the game document
// says when a question started (`anchorQ`, `anchorAt`) and every device works
// out the rest from the time. So a host whose phone falls asleep cannot stall
// the game; the host only *shortens* a question when everybody has answered.
import { LESSONS, lessonOf, type TermId, type TopicId } from '../data/model.ts';
import { shuffle } from '../session.ts';

export interface Question {
  /** pick = the picture shows it, define = its description is given; either way choose the name */
  kind: 'pick' | 'define';
  term: TermId;
  options: TermId[];
}

export interface Game {
  v: 1;
  /** id of the device that created the game; only it may change the game */
  host: string;
  /** language of the terms */
  lang: string;
  /** language of the big screen */
  ui: string;
  /** seconds to answer a question */
  secs: number;
  questions: Question[];
  status: 'lobby' | 'run';
  /** question `anchorQ` starts at `anchorAt` (ms, shared clock); later ones follow at a fixed pace */
  anchorQ: number;
  anchorAt: number;
  created: number;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  /** correct answers in a row */
  streak: number;
  right: number;
  /** the latest answer: question number, chosen option, and what it earned */
  a?: { q: number; c: number; ok: boolean; pts: number };
  joined: number;
}

export type QuestionKinds = 'pick' | 'define' | 'both';
export const COUNTS = [10, 15, 20, 30];
export const SECONDS = [10, 20, 30];
/** how long the answer and the standings stay up before the next question */
export const REVEAL_MS = 9000;
/** the standings replace the answer after this long */
export const BOARD_AFTER_MS = 4500;
export const COUNTDOWN_MS = 5000;

/** Questions for a game: random terms from the chosen topics, each with three wrong answers that look plausible. */
export function buildQuestions(
  topics: readonly TopicId[],
  count: number,
  kinds: QuestionKinds,
  nameOf: (t: TermId) => string,
  rng: () => number = Math.random,
): Question[] {
  const inGame = LESSONS.filter((l) => topics.includes(l.topic));
  const pool = shuffle(inGame.flatMap((l) => [...l.terms]), rng);
  const everything = LESSONS.flatMap((l) => [...l.terms]);
  const out: Question[] = [];
  for (const term of pool) {
    if (out.length === count) break;
    const lesson = lessonOf(term);
    // wrong answers come from the same lesson first, then the same topic, then anywhere
    const near = [
      ...shuffle(lesson.terms.filter((x) => x !== term), rng),
      ...shuffle(LESSONS.filter((l) => l.topic === lesson.topic && l.id !== lesson.id).flatMap((l) => [...l.terms]), rng),
      ...shuffle(everything, rng),
    ];
    const used = new Set([nameOf(term)]);
    const wrong: TermId[] = [];
    for (const x of near) {
      if (wrong.length === 3) break;
      if (x === term || used.has(nameOf(x))) continue;
      used.add(nameOf(x));
      wrong.push(x);
    }
    if (wrong.length < 3) continue;
    const kind = kinds === 'both' ? (rng() < 0.6 ? 'pick' : 'define') : kinds;
    out.push({ kind, term, options: shuffle([term, ...wrong], rng) });
  }
  return out;
}

export type Phase =
  | { phase: 'lobby' }
  /** `q` is the question that follows */
  | { phase: 'countdown'; q: number; left: number }
  | { phase: 'ask'; q: number; left: number; total: number }
  /** `board` = the standings are showing instead of the answer */
  | { phase: 'reveal'; q: number; left: number; board: boolean }
  | { phase: 'done' };

/** What every device should be showing at the moment `now`. */
export function phaseAt(g: Pick<Game, 'status' | 'anchorQ' | 'anchorAt' | 'secs' | 'questions'>, now: number): Phase {
  if (g.status !== 'run') return { phase: 'lobby' };
  const n = g.questions.length;
  if (g.anchorQ >= n) return { phase: 'done' };
  const ask = g.secs * 1000;
  const cycle = ask + REVEAL_MS;
  const dt = now - g.anchorAt;
  if (dt < 0) return { phase: 'countdown', q: g.anchorQ, left: -dt };
  const q = g.anchorQ + Math.floor(dt / cycle);
  if (q >= n) return { phase: 'done' };
  const within = dt % cycle;
  if (within < ask) return { phase: 'ask', q, left: ask - within, total: ask };
  // after the last question the standings are the final results, shown by 'done'
  if (q === n - 1 && within - ask >= BOARD_AFTER_MS) return { phase: 'done' };
  return { phase: 'reveal', q, left: cycle - within, board: within - ask >= BOARD_AFTER_MS };
}

/** Changes to the game document that start it, end a question early, or move to the next one. */
export const startPatch = (now: number) => ({ status: 'run' as const, anchorQ: 0, anchorAt: now + COUNTDOWN_MS });
export const revealPatch = (g: Pick<Game, 'secs'>, q: number, now: number) => ({ anchorQ: q, anchorAt: now - g.secs * 1000 });
export const nextPatch = (q: number, now: number) => ({ anchorQ: q + 1, anchorAt: now + 1200 });

/** A correct answer earns 500 points plus up to 500 for speed. */
export function points(ok: boolean, usedMs: number, totalMs: number): number {
  if (!ok) return 0;
  const speed = 1 - Math.min(1, Math.max(0, usedMs / totalMs));
  return Math.round(500 + 500 * speed);
}

/** Players in order of score; earlier joiners first on a tie. */
export const ranked = (players: readonly Player[]) => [...players].sort((a, b) => b.score - a.score || a.joined - b.joined);

/** Everyone still playing has answered question q (people who stopped answering do not hold the game up). */
export function allAnswered(players: readonly Player[], q: number): boolean {
  const active = players.filter((p) => q === 0 || (p.a && p.a.q >= q - 1));
  return active.length > 0 && active.every((p) => p.a?.q === q);
}

/** Six digits: easy to read out and to type on a phone. */
export const makeCode = (rng: () => number = Math.random) => String(Math.floor(rng() * 900000) + 100000);
export const cleanName = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 16);
