// Sailors' words inside descriptions ("vaierid", ...) become links; tapping one
// opens a small card that explains the word, so a learner can look up words they
// do not know yet without leaving the page.
import { h } from './dom.ts';
import type { GlossaryWord, LanguagePack } from './i18n/types.ts';

const patterns = new WeakMap<LanguagePack, { re: RegExp; byForm: Map<string, string> }>();

function patternOf(pack: LanguagePack) {
  const known = patterns.get(pack);
  if (known) return known;
  const byForm = new Map<string, string>();
  const auto: string[] = [];
  for (const [id, w] of Object.entries(pack.words ?? {}))
    for (const f of w.forms) {
      byForm.set(f.toLowerCase(), id);
      if (!w.marked) auto.push(f.toLowerCase());
    }
  const escaped = auto.sort((a, b) => b.length - a.length).map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  // [marked] words, or the forms of words that link wherever they appear
  const re = new RegExp(`\\[([^[\\]]+)\\]${escaped.length ? `|(?<!\\p{L})(${escaped.join('|')})(?!\\p{L})` : ''}`, 'giu');
  const found = { re, byForm };
  patterns.set(pack, found);
  return found;
}

/** The text with every explained word turned into a link that opens its card. */
export function linkWords(text: string, pack: LanguagePack, title: string): (string | Node)[] {
  const { re, byForm } = patternOf(pack);
  const out: (string | Node)[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const word = m[1] ?? m[2];
    const id = byForm.get(word.toLowerCase());
    out.push(text.slice(last, m.index));
    out.push(id ? h('button', {
      type: 'button', class: 'wordlink',
      onclick: (e: Event) => { e.stopPropagation(); openWord(pack.words![id], title, e.currentTarget as HTMLElement); },
    }, word) : word);
    last = m.index! + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}

let current: HTMLElement | null = null;
const closeWord = () => {
  current?.remove();
  current = null;
  document.removeEventListener('keydown', onEsc, true);
};
const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); closeWord(); } };

/** A small card explaining the word, under the link that opened it (or in the middle of the screen). */
export function openWord(w: GlossaryWord, title: string, from?: HTMLElement) {
  closeWord();
  const card = h('div', { class: 'wordcard', role: 'dialog', 'aria-label': w.name },
    h('small', null, `📖 ${title}`),
    h('b', null, w.name),
    h('p', null, w.desc));
  const layer = h('div', { class: 'wordlayer', onclick: closeWord }, card);
  document.body.append(layer);
  current = layer;
  document.addEventListener('keydown', onEsc, true);
  if (from) {
    const r = from.getBoundingClientRect();
    const width = Math.min(320, innerWidth - 32);
    card.style.width = `${width}px`;
    card.style.left = `${Math.max(16, Math.min(innerWidth - width - 16, r.left + r.width / 2 - width / 2))}px`;
    const below = r.bottom + 8;
    // below the word when it fits, otherwise above it
    if (below + card.offsetHeight < innerHeight - 8) card.style.top = `${below}px`;
    else card.style.top = `${Math.max(8, r.top - 8 - card.offsetHeight)}px`;
  } else card.classList.add('center');
}
