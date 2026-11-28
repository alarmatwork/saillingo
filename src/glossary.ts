// Sailors' words inside descriptions ("vaierid", ...) become links; tapping one
// opens a small card that explains the word, so a learner can look up words they
// do not know yet without leaving the page.
import { h } from './dom.ts';
import type { GlossaryWord, LanguagePack } from './i18n/types.ts';

const patterns = new WeakMap<LanguagePack, { re: RegExp; byForm: Map<string, string> } | null>();

function patternOf(pack: LanguagePack) {
  if (patterns.has(pack)) return patterns.get(pack)!;
  const byForm = new Map<string, string>();
  for (const [id, w] of Object.entries(pack.words ?? {})) for (const f of w.forms) byForm.set(f.toLowerCase(), id);
  const forms = [...byForm.keys()].sort((a, b) => b.length - a.length).map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const found = forms.length ? { re: new RegExp(`(?<!\\p{L})(${forms.join('|')})(?!\\p{L})`, 'giu'), byForm } : null;
  patterns.set(pack, found);
  return found;
}

/** The text with every explained word turned into a link that opens its card. */
export function linkWords(text: string, pack: LanguagePack, title: string): (string | Node)[] {
  const p = patternOf(pack);
  if (!p) return [text];
  const out: (string | Node)[] = [];
  let last = 0;
  for (const m of text.matchAll(p.re)) {
    const id = p.byForm.get(m[0].toLowerCase())!;
    out.push(text.slice(last, m.index), h('button', {
      type: 'button', class: 'wordlink',
      onclick: (e: Event) => { e.stopPropagation(); openWord(pack.words![id], title, e.currentTarget as HTMLElement); },
    }, m[0]));
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
