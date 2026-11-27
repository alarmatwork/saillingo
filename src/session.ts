// The drill engine. Pure logic, no DOM: it decides which exercise comes next
// and keeps asking until every term has climbed its whole "ladder" of
// exercise types (recognise -> locate -> recall).
import { GROUPS, LESSONS, isSituation, lessonOf, sceneOf, typingAllowed, type GroupId, type TermId } from './data/model.ts';
import { SCENES } from './scenes/index.ts';

export type StepKind = 'pick' | 'find' | 'define' | 'type' | 'giveway';

export type Exercise =
  | { kind: 'intro'; term: TermId }
  /** part is highlighted on the picture, choose its name (radio buttons) */
  | { kind: 'pick'; term: TermId; options: TermId[] }
  /** name is given, tap the right dot on the picture */
  | { kind: 'find'; term: TermId; pins: TermId[] }
  /** description (or translation) is given, choose the name (radio buttons) */
  | { kind: 'define'; term: TermId; options: TermId[]; by: 'desc' | 'translation' }
  /** part is highlighted, type its name */
  | { kind: 'type'; term: TermId }
  /** a situation with two boats: tap the one that gives way (or choose both) */
  | { kind: 'giveway'; term: TermId }
  /** tick every term that belongs to a category (checkboxes) */
  | { kind: 'group'; group: GroupId; options: TermId[]; correct: TermId[] };

export interface SessionCtx {
  /** current mastery box (0 = never seen) */
  box: (t: TermId) => number;
  /** include typing exercises */
  typing: boolean;
  /** interface language differs from the language being learned */
  bilingual: boolean;
  /** name in the language being learned (used to avoid duplicate options) */
  nameOf: (t: TermId) => string;
  /**
   * Test mode: no introductions, every term is asked exactly twice (locate it,
   * then recall it) and a wrong answer is not repeated.
   */
  test?: boolean;
  rng?: () => number;
}

export interface Item {
  term: TermId;
  ladder: StepKind[];
  step: number;
  mistakes: number;
  last: number;
  isNew: boolean;
}

export function shuffle<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class Session {
  readonly items: Item[];
  /** finished steps / total steps drive the progress bar */
  done = 0;
  total: number;
  asked = 0;
  right = 0;
  private waiting: Item[];
  private active: Item[] = [];
  private turn = 0;
  private lastItem: Item | null = null;
  private groups: GroupId[];
  private groupTotal: number;
  private ctx: SessionCtx;
  private rng: () => number;

  constructor(terms: TermId[], ctx: SessionCtx) {
    this.ctx = ctx;
    this.rng = ctx.rng ?? Math.random;
    this.items = (ctx.test ? shuffle(terms, this.rng) : terms).map((term) => {
      const box = ctx.test ? 5 : ctx.box(term);
      return { term, ladder: this.ladder(box, term), step: 0, mistakes: 0, last: -1, isNew: box === 0 };
    });
    this.waiting = [...this.items];
    const mine = new Set(terms);
    this.groups = ctx.test ? [] : shuffle(
      GROUPS.filter((g) => g.terms.some((t) => mine.has(t)) && this.buildGroup(g.id) !== null).map((g) => g.id),
      this.rng,
    ).slice(0, 2);
    this.groupTotal = this.groups.length;
    this.total = this.items.reduce((n, i) => n + i.ladder.length, 0) + this.groupTotal;
  }

  private ladder(box: number, term: TermId): StepKind[] {
    if (isSituation(term)) {
      if (this.ctx.test) return ['find', 'giveway'];
      return box <= 1 ? ['pick', 'giveway', 'define'] : ['giveway', this.rng() < 0.5 ? 'pick' : 'define'];
    }
    const final: StepKind = this.ctx.typing && typingAllowed(term) ? 'type' : 'define';
    if (this.ctx.test) return ['find', final];
    if (box <= 1) return ['pick', 'find', final];
    return [final === 'type' && this.rng() < 0.5 ? 'define' : 'find', final];
  }

  /** number of wrong answers so far */
  get mistakes(): number {
    return this.items.reduce((n, i) => n + i.mistakes, 0);
  }

  get progress(): number {
    return this.total ? this.done / this.total : 1;
  }

  /** The next exercise, or null when the session is complete. */
  next(): Exercise | null {
    const open = () => this.active.filter((i) => i.step < i.ladder.length);

    // "tick all that apply" questions appear halfway through and near the end
    if (this.groups.length) {
      const termSteps = this.total - this.groupTotal;
      const termDone = this.done - (this.groupTotal - this.groups.length);
      const milestone = this.groups.length === this.groupTotal && this.groupTotal === 2 ? 0.5 : 0.85;
      if (termDone >= termSteps * milestone) {
        const ex = this.buildGroup(this.groups.shift()!);
        if (ex) return ex;
        this.done++; // could not be built any more: count it as finished
      }
    }

    // bring in new terms a few at a time
    for (;;) {
      const o = open();
      const started = o.every((i) => i.step >= 1);
      if (this.waiting.length && (o.length < 2 || (o.length < 3 && started))) {
        const it = this.waiting.shift()!;
        this.active.push(it);
        if (it.isNew) {
          it.last = this.turn;
          this.lastItem = it;
          return { kind: 'intro', term: it.term };
        }
        continue;
      }
      break;
    }

    const o = open();
    if (!o.length) return null;
    let cand = o.filter((i) => i !== this.lastItem);
    if (!cand.length) cand = o;
    cand.sort((a, b) => a.last - b.last);
    const it = cand[Math.floor(this.rng() * Math.min(2, cand.length))];
    this.lastItem = it;
    return this.build(it);
  }

  answer(ex: Exercise, ok: boolean): void {
    if (ex.kind === 'intro') return;
    this.turn++;
    this.asked++;
    if (ok) this.right++;
    if (ex.kind === 'group') {
      this.done++;
      return;
    }
    const it = this.items.find((i) => i.term === ex.term)!;
    it.last = this.turn;
    if (!ok) it.mistakes++;
    if (ok || this.ctx.test) {
      it.step++;
      this.done++;
    }
  }

  private build(it: Item): Exercise {
    const term = it.term;
    const kind = it.ladder[it.step];
    switch (kind) {
      case 'pick':
        return { kind, term, options: shuffle([term, ...this.distractors(term, 3)], this.rng) };
      case 'define':
        return {
          kind,
          term,
          options: shuffle([term, ...this.distractors(term, 3)], this.rng),
          by: this.ctx.bilingual && this.rng() < 0.5 ? 'translation' : 'desc',
        };
      case 'find':
        return { kind, term, pins: this.pins(term) };
      case 'type':
      case 'giveway':
        return { kind, term };
    }
  }

  /** Other terms from the same lesson first, then from the same picture. */
  private neighbours(term: TermId): TermId[] {
    const lesson = lessonOf(term);
    const mates = shuffle(lesson.terms.filter((t) => t !== term), this.rng);
    const scene = shuffle(
      LESSONS.filter((l) => l.topic === lesson.topic && l.id !== lesson.id).flatMap((l) => [...l.terms]),
      this.rng,
    );
    return [...mates, ...scene];
  }

  private distractors(term: TermId, n: number): TermId[] {
    const used = new Set([this.ctx.nameOf(term)]);
    const out: TermId[] = [];
    for (const t of this.neighbours(term)) {
      const name = this.ctx.nameOf(t);
      if (used.has(name)) continue;
      used.add(name);
      out.push(t);
      if (out.length === n) break;
    }
    return out;
  }

  /** The target plus a few other dots that are far enough apart to tap comfortably. */
  private pins(term: TermId, n = 5, minDist = 80): TermId[] {
    const spots = SCENES[sceneOf(term)].spots;
    const chosen = [term];
    for (const t of this.neighbours(term)) {
      const p = spots[t];
      if (!p) continue;
      const clear = chosen.every((c) => {
        const q = spots[c]!;
        return Math.hypot(p[0] - q[0], p[1] - q[1]) >= minDist;
      });
      if (clear) chosen.push(t);
      if (chosen.length === n + 1) break;
    }
    return chosen;
  }

  private buildGroup(id: GroupId): Exercise | null {
    const g = GROUPS.find((x) => x.id === id)!;
    const known = (t: TermId) => this.ctx.box(t) > 0 || this.items.some((i) => i.term === t);
    const member = new Set<TermId>(g.terms);
    const avoid = new Set<TermId>(g.avoid);
    const right = shuffle(g.terms.filter(known), this.rng).slice(0, 3);
    const pool = new Set<TermId>();
    for (const t of right) for (const o of this.neighbours(t)) if (known(o) && !member.has(o) && !avoid.has(o)) pool.add(o);
    const wrong = shuffle([...pool], this.rng).slice(0, 6 - right.length);
    if (right.length < 2 || wrong.length < 2) return null;
    return { kind: 'group', group: id, options: shuffle([...right, ...wrong], this.rng), correct: right };
  }
}

// ---- checking typed answers -------------------------------------------------

/** Lower-case, strip accents and punctuation: "Vöör-staak" -> "voor staak". */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function editDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/**
 * The same word in the other number: "reeling" for "reelingud", "pardatuli" for
 * "pardatuled", "shroud" for "shrouds", and the other way round.
 */
function otherNumber(input: string, name: string): boolean {
  const i = normalize(input).replace(/ /g, ''), n = normalize(name).replace(/ /g, '');
  const singulars = (w: string) => {
    const out: string[] = [];
    if (/[aeiou]d$/.test(w)) out.push(w.slice(0, -1), w.slice(0, -2)); // reelingud -> reelingu, reeling
    if (/es$/.test(w)) out.push(w.slice(0, -2)); // fairleads/boxes
    if (/s$/.test(w)) out.push(w.slice(0, -1)); // shrouds -> shroud
    return out;
  };
  // one small difference is allowed for longer words: "pardatuli" ~ "pardatul(ed)"
  const near = (a: string, b: string) => a.length >= 4 && b.length >= 4 && (a === b || (Math.min(a.length, b.length) >= 5 && editDistance(a, b) <= 1));
  return singulars(n).some((s) => near(i, s)) || singulars(i).some((s) => near(s, n));
}

/**
 * 'exact'  - spelled right (case and spaces/hyphens aside)
 * 'close'  - right word, but accents missing or one typo: accepted, spelling is shown
 * 'form'   - right word in the other number (singular for plural or vice versa): accepted, usual form is shown
 * 'wrong'
 */
export function checkTyped(input: string, accepted: string[]): 'exact' | 'close' | 'form' | 'wrong' {
  const loose = (s: string) => s.toLowerCase().replace(/[\s\-'’]+/g, '');
  const raw = loose(input);
  if (!raw) return 'wrong';
  if (accepted.some((a) => loose(a) === raw)) return 'exact';
  const n = normalize(input).replace(/ /g, '');
  const forms = accepted.map((a) => normalize(a).replace(/ /g, ''));
  if (forms.some((m) => m === n)) return 'close'; // only accents missing
  if (accepted.some((a) => otherNumber(input, a))) return 'form';
  if (forms.some((m) => m.length >= 5 && editDistance(m, n) <= 1)) return 'close'; // one typo
  return 'wrong';
}
