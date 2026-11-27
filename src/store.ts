// Everything the game remembers lives in localStorage in the browser.
import { LESSONS, START_OPEN, TOPICS, type Lesson, type TermId, type TopicId } from './data/model.ts';
import type { Item } from './session.ts';

export interface TermProgress {
  /** 0 = new, 1 = seen, 2 = learned, 3+ = mastered (max 5) */
  box: number;
  /** when the term should come back for practice (ms since epoch) */
  due: number;
  seen: number;
  wrong: number;
}
export type Progress = Partial<Record<TermId, TermProgress>>;

export interface State {
  v: 1;
  /** interface language ("I speak") */
  ui: string;
  /** language whose sailing terms are being learned */
  learn: string;
  typing: boolean;
  /** true once the player has chosen the typing setting themselves */
  typingSet?: boolean;
  /** set while the player is signed in, so the next visit reconnects */
  account?: { name: string };
  /** last worked-out "TOP x %", kept for offline use */
  rank?: { top: number; place?: number; nextXp?: number | null; change?: number; players: number; xp: number; at: number };
  /** the player closed the "sign in to keep your score" banner */
  loginDismissed?: boolean;
  /** topics that are open (shown with their lessons and used in practice) */
  topics: TopicId[];
  /** 2 once open topics follow the basic-to-advanced unlocking */
  openV?: 2;
  xp: number;
  /** signed in: the part of `xp` the account already has; the rest was earned on this device since */
  xpBase?: number;
  streak: number;
  lastDay: string;
  /** progress is kept separately for every learned language */
  progress: Record<string, Progress>;
}

const KEY = 'sailboatparts.v1';
const DAY = 86_400_000;
/** days until a term in box n is due for practice again */
const INTERVAL = [0, 0, 1, 3, 7, 21];
export const MASTERED = 3;

export function defaultState(lang: string): State {
  return { v: 1, ui: lang, learn: lang, typing: true, topics: TOPICS.slice(0, START_OPEN).map((t) => t.id), openV: 2, xp: 0, streak: 0, lastDay: '', progress: {} };
}

export function loadState(lang: string): State {
  const base = defaultState(lang);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const s = JSON.parse(raw) as Partial<State>;
    if (s.v !== 1) return base;
    const state: State = { ...base, ...s, topics: inOrder(s.topics ?? base.topics), progress: s.progress ?? {} };
    if (s.openV !== 2) {
      // earlier versions had every topic open: start from the unlocking rules instead
      state.topics = initialTopics(state);
      state.openV = 2;
    }
    return state;
  } catch {
    return base;
  }
}

let saveListener: (() => void) | null = null;
/** Called after every save; used to upload progress for signed-in players. */
export function setSaveListener(fn: (() => void) | null): void {
  saveListener = fn;
}

/** @param quiet true for saves made by syncing itself, which must not start another upload */
export function saveState(s: State, quiet = false): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode or storage full: the game still works, it just forgets */
  }
  if (!quiet) saveListener?.();
}

// ---- progress stored with an account ---------------------------------------------

/** The part of the state that follows a signed-in player between devices. */
export interface CloudData {
  v: 1;
  xp: number;
  streak: number;
  lastDay: string;
  progress: Record<string, Progress>;
  /** open topics */
  topics?: string[];
  updated: number;
}

export function cloudData(s: State, now = Date.now()): CloudData {
  return { v: 1, xp: s.xp, streak: s.streak, lastDay: s.lastDay, progress: s.progress, topics: s.topics, updated: now };
}

const dayNumber = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return y && m && d ? y * 372 + m * 31 + d : 0;
};

/**
 * Combines saved progress into the state on this device. Nothing is ever lost:
 * for every term the better result wins, and XP takes the higher total.
 * `remote` comes from the network, so its shape is checked rather than trusted.
 */
export function mergeCloud(s: State, remote: unknown): void {
  if (!remote || typeof remote !== 'object') return;
  const r = remote as Partial<CloudData>;
  if (r.progress && typeof r.progress === 'object') {
    for (const [lang, terms] of Object.entries(r.progress)) {
      if (!terms || typeof terms !== 'object') continue;
      const mine = (s.progress[lang] ??= {});
      for (const [id, theirs] of Object.entries(terms) as [TermId, TermProgress][]) {
        if (!theirs || typeof theirs.box !== 'number' || typeof theirs.due !== 'number') continue;
        const box = Math.max(0, Math.min(5, Math.round(theirs.box)));
        const local = mine[id];
        const better = !local || box > local.box || (box === local.box && theirs.due > local.due);
        mine[id] = {
          box: better ? box : local.box,
          due: better ? theirs.due : local.due,
          seen: Math.max(local?.seen ?? 0, Number(theirs.seen) || 0),
          wrong: Math.max(local?.wrong ?? 0, Number(theirs.wrong) || 0),
        };
      }
    }
  }
  if (Array.isArray(r.topics)) s.topics = inOrder([...s.topics, ...r.topics]);
  if (typeof r.xp === 'number' && Number.isFinite(r.xp)) {
    // XP earned on different devices adds up: the account's total plus what this
    // device earned since it last synced. Without a known base (first sign-in on
    // this device) the higher total is kept, so nothing is counted twice.
    const base = s.xpBase;
    if (base === undefined) {
      s.xp = Math.max(s.xp, r.xp);
      s.xpBase = r.xp;
    } else {
      const known = Math.max(r.xp, base);
      s.xp = known + Math.max(0, s.xp - base);
      s.xpBase = known;
    }
  }
  if (typeof r.lastDay === 'string' && typeof r.streak === 'number') {
    const theirs = dayNumber(r.lastDay), mine = dayNumber(s.lastDay);
    if (theirs > mine) {
      s.streak = r.streak;
      s.lastDay = r.lastDay;
    } else if (theirs === mine) {
      s.streak = Math.max(s.streak, r.streak);
    }
  }
}

export function progressOf(s: State): Progress {
  return (s.progress[s.learn] ??= {});
}

export const boxOf = (p: Progress, t: TermId) => p[t]?.box ?? 0;

/** 0 = not finished, 1 = finished, 2 = learned, 3 = mastered */
export function lessonStars(p: Progress, lesson: Lesson): number {
  return Math.min(3, ...lesson.terms.map((t) => boxOf(p, t)));
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

export function currentStreak(s: State, now = new Date()): number {
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - DAY));
  return s.lastDay === today || s.lastDay === yesterday ? s.streak : 0;
}

/** Stores the outcome of a finished session; returns the XP earned. */
export function recordSession(s: State, items: Item[], now = new Date()): number {
  const p = progressOf(s);
  let xp = 0;
  for (const it of items) {
    const tp = p[it.term] ?? { box: 0, due: 0, seen: 0, wrong: 0 };
    const clean = it.mistakes === 0;
    tp.box = clean ? Math.min(5, Math.max(tp.box, 1) + 1) : Math.max(1, tp.box - 1);
    tp.seen++;
    tp.wrong += it.mistakes;
    tp.due = now.getTime() + INTERVAL[tp.box] * DAY;
    p[it.term] = tp;
    xp += clean ? 12 : 8;
  }
  const today = dayKey(now);
  if (s.lastDay !== today) {
    s.streak = currentStreak(s, now) + 1;
    s.lastDay = today;
  }
  s.xp += xp;
  saveState(s);
  return xp;
}

/**
 * Stores a passed test: every term counts as mastered, except the ones that
 * were answered wrong, which count as learned and come back in practice.
 */
export function recordTest(s: State, items: Item[], now = new Date()): number {
  const p = progressOf(s);
  let xp = 0;
  for (const it of items) {
    const tp = p[it.term] ?? { box: 0, due: 0, seen: 0, wrong: 0 };
    tp.box = Math.max(tp.box, it.mistakes ? 2 : MASTERED);
    tp.seen++;
    tp.wrong += it.mistakes;
    tp.due = now.getTime() + INTERVAL[tp.box] * DAY;
    p[it.term] = tp;
    xp += it.mistakes ? 8 : 12;
  }
  const today = dayKey(now);
  if (s.lastDay !== today) {
    s.streak = currentStreak(s, now) + 1;
    s.lastDay = today;
  }
  s.xp += xp;
  saveState(s);
  return xp;
}

/** Terms worth practising now: due ones first, weakest first. */
export function practiceTerms(s: State, max = 8, now = Date.now()): TermId[] {
  const p = progressOf(s);
  const pool = LESSONS.filter((l) => s.topics.includes(l.topic))
    .flatMap((l) => [...l.terms])
    .filter((t) => boxOf(p, t) > 0);
  const overdue = (t: TermId) => (p[t]!.due <= now ? 0 : 1);
  pool.sort((a, b) => overdue(a) - overdue(b) || boxOf(p, a) - boxOf(p, b) || p[a]!.due - p[b]!.due);
  return pool.slice(0, max);
}

// ---- opening topics ------------------------------------------------------------------

/** Known topic ids only, without duplicates, in course order. */
export function inOrder(ids: readonly unknown[]): TopicId[] {
  return TOPICS.map((t) => t.id).filter((id) => ids.includes(id));
}

/** Every lesson of the topic has been finished at least once. */
export function topicDone(p: Progress, topic: TopicId): boolean {
  return LESSONS.filter((l) => l.topic === topic).every((l) => lessonStars(p, l) >= 1);
}

/** Open topics for a player coming from an older version: the first few, everything already practised, and the topic after each finished one. */
export function initialTopics(s: State): TopicId[] {
  const open = new Set<TopicId>(TOPICS.slice(0, START_OPEN).map((t) => t.id));
  const played = new Set<TermId>(Object.values(s.progress).flatMap((p) => Object.keys(p ?? {}) as TermId[]));
  const p = progressOf(s);
  TOPICS.forEach((t, i) => {
    if (LESSONS.some((l) => l.topic === t.id && l.terms.some((x) => played.has(x)))) open.add(t.id);
    if (topicDone(p, t.id) && TOPICS[i + 1]) open.add(TOPICS[i + 1].id);
  });
  return inOrder([...open]);
}

/** After a lesson: if its topic is now finished, open the next topic. Returns the topic that was opened. */
export function unlockNext(s: State, topic: TopicId): TopicId | null {
  const i = TOPICS.findIndex((t) => t.id === topic);
  const next = TOPICS[i + 1]?.id;
  if (!next || s.topics.includes(next) || !topicDone(progressOf(s), topic)) return null;
  s.topics = inOrder([...s.topics, next]);
  saveState(s);
  return next;
}

export function openTopic(s: State, topic: TopicId, open = true): void {
  s.topics = inOrder(open ? [...s.topics, topic] : s.topics.filter((x) => x !== topic));
  saveState(s);
}
