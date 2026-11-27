// Two "catalogue" pictures: eight objects each, laid out as cards.
// Every drawing is made in a local box 187 wide and about 280 high.
import type { TermId } from '../data/model.ts';
import type { Scene, SceneId } from './types.ts';

const W = 187, H = 335;

/** Grid of cards; drawings are made for a 187 x 335 card and scaled to fit. */
export interface Layout { cols: number; w: number; h: number; gapX: number; gapY: number; x0: number; y0: number }
const DEFAULT_LAYOUT: Layout = { cols: 4, w: W, h: H, gapX: 10.5, gapY: 17, x0: 10, y0: 22 };
export const GRID_3X3: Layout = { cols: 3, w: 253, h: 225, gapX: 10.5, gapY: 10, x0: 10, y0: 12 };

export function catalog(id: SceneId, bg: string, items: [TermId, string][], card = '#ffffff', defs = '', layout: Layout = DEFAULT_LAYOUT): Scene {
  const { cols, w: cw, h: ch, gapX, gapY, x0, y0 } = layout;
  const s = Math.min(cw / W, ch / H);
  const dx = (cw - W * s) / 2, dy = (ch - H * s) / 2;
  const spots: Scene['spots'] = {};
  const cards = items
    .map(([term, inner], i) => {
      const x = x0 + (i % cols) * (cw + gapX), y = y0 + Math.floor(i / cols) * (ch + gapY);
      spots[term] = [Math.round(x + cw / 2), Math.round(y + ch - 34 * s)];
      const art = s === 1 ? inner : `<g transform="translate(${dx} ${dy}) scale(${s})">${inner}</g>`;
      return `<g transform="translate(${x} ${y})"><rect width="${cw}" height="${ch}" rx="20" fill="${card}" stroke="#c9d6e2" stroke-width="2"/><rect class="t-${term} zone" width="${cw}" height="${ch}" rx="20"/>${art}</g>`;
    })
    .join('');
  return { id, size: [800, 740], art: `${defs}<rect width="800" height="740" fill="${bg}"/>${cards}`, spots };
}

const ROPE = '#e3c074';
const STEEL = '#8a97a5';
const DARK = '#33414d';

export const hardware = catalog('hardware', '#dcecf6', [
  ['block', `<path d="M62 270 V140 A31 31 0 0 1 124 140 V270" fill="none" stroke="${ROPE}" stroke-width="10"/>
    <circle cx="93" cy="62" r="14" fill="none" stroke="${STEEL}" stroke-width="8"/>
    <rect x="52" y="78" width="82" height="112" rx="34" fill="#c3ced8" stroke="${DARK}" stroke-width="3"/>
    <circle cx="93" cy="140" r="26" fill="#6f8192" stroke="${DARK}" stroke-width="3"/><circle cx="93" cy="140" r="7" fill="${DARK}"/>`],
  ['shackle', `<path d="M58 96 V170 A35 35 0 0 0 128 170 V96" fill="none" stroke="${STEEL}" stroke-width="18" stroke-linecap="round"/>
    <circle cx="58" cy="92" r="15" fill="${STEEL}" stroke="${DARK}" stroke-width="2.5"/><circle cx="128" cy="92" r="15" fill="${STEEL}" stroke="${DARK}" stroke-width="2.5"/>
    <path d="M34 92 H152" stroke="${DARK}" stroke-width="9" stroke-linecap="round"/><circle cx="32" cy="92" r="11" fill="${DARK}"/>`],
  ['turnbuckle', `<circle cx="93" cy="34" r="13" fill="none" stroke="${DARK}" stroke-width="7"/><path d="M93 47 V98" stroke="${DARK}" stroke-width="7"/>
    <path d="M86 58 h14 M86 68 h14 M86 78 h14 M86 88 h14 M86 200 h14 M86 210 h14 M86 220 h14 M86 230 h14" stroke="#c3ced8" stroke-width="2"/>
    <rect x="72" y="96" width="42" height="96" rx="10" fill="none" stroke="${STEEL}" stroke-width="10"/>
    <path d="M93 190 V244" stroke="${DARK}" stroke-width="7"/><path d="M80 268 V246 H106 V268" fill="none" stroke="${DARK}" stroke-width="7" stroke-linejoin="round"/>`],
  ['carabiner', `<path d="M76 46 Q58 46 58 70 V210 Q58 246 93 246 Q128 246 128 210 V92 Q128 46 100 46 Z" fill="none" stroke="#e4572e" stroke-width="15" stroke-linejoin="round"/>
    <path d="M128 96 V196" stroke="${DARK}" stroke-width="9" stroke-linecap="round"/><circle cx="128" cy="200" r="7" fill="${DARK}"/>`],
  ['clutch', `<path d="M8 196 H180" stroke="${ROPE}" stroke-width="12" stroke-linecap="round"/>
    <rect x="40" y="166" width="108" height="62" rx="10" fill="${DARK}" stroke="#111820" stroke-width="3"/>
    <path d="M58 176 L146 96" stroke="#d62828" stroke-width="18" stroke-linecap="round"/><circle cx="58" cy="178" r="8" fill="#c3ced8"/>
    <path d="M40 240 H148" stroke="${STEEL}" stroke-width="8" stroke-linecap="round"/>`],
  ['winchhandle', `<rect x="124" y="40" width="28" height="92" rx="12" fill="#d62828" stroke="#7f1d1d" stroke-width="3"/>
    <path d="M138 126 L60 226" stroke="${STEEL}" stroke-width="18" stroke-linecap="round"/>
    <rect x="42" y="208" width="36" height="36" rx="6" fill="${DARK}"/><path d="M52 218 h16 v16 h-16 Z" fill="#c3ced8"/>`],
  ['fairlead', `<path d="M10 150 H178" stroke="${ROPE}" stroke-width="12" stroke-linecap="round"/>
    <path d="M54 214 Q38 130 82 118" fill="none" stroke="${STEEL}" stroke-width="18" stroke-linecap="round"/>
    <path d="M132 214 Q148 130 104 118" fill="none" stroke="${STEEL}" stroke-width="18" stroke-linecap="round"/>
    <rect x="30" y="206" width="126" height="22" rx="8" fill="${STEEL}" stroke="${DARK}" stroke-width="3"/>
    <circle cx="48" cy="217" r="4" fill="${DARK}"/><circle cx="138" cy="217" r="4" fill="${DARK}"/>`],
  ['tackle', `<path d="M78 70 V212 M93 76 V206 M108 70 V212" stroke="${ROPE}" stroke-width="6"/><path d="M108 212 Q130 150 150 262" fill="none" stroke="${ROPE}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="93" cy="30" r="10" fill="none" stroke="${STEEL}" stroke-width="6"/>
    <rect x="62" y="40" width="62" height="48" rx="20" fill="#c3ced8" stroke="${DARK}" stroke-width="3"/><circle cx="93" cy="64" r="8" fill="${DARK}"/>
    <rect x="62" y="194" width="62" height="48" rx="20" fill="#c3ced8" stroke="${DARK}" stroke-width="3"/><circle cx="93" cy="218" r="8" fill="${DARK}"/>
    <circle cx="93" cy="254" r="10" fill="none" stroke="${STEEL}" stroke-width="6"/>`],
]);

export const safety = catalog('safety', '#fdebd3', [
  ['lifejacket', `<path d="M52 52 Q93 96 134 52 L158 84 V236 H28 V84 Z" fill="#f77f00" stroke="#9a4a00" stroke-width="3" stroke-linejoin="round"/>
    <path d="M93 84 V236" stroke="#9a4a00" stroke-width="3"/><rect x="28" y="150" width="130" height="14" fill="${DARK}"/><rect x="28" y="196" width="130" height="14" fill="${DARK}"/>
    <rect x="42" y="104" width="34" height="12" fill="#e8edf1"/><rect x="110" y="104" width="34" height="12" fill="#e8edf1"/>`],
  ['lifebuoy', `<circle cx="93" cy="142" r="60" fill="none" stroke="#e53935" stroke-width="36"/>
    <circle cx="93" cy="142" r="60" fill="none" stroke="#ffffff" stroke-width="36" stroke-dasharray="47.1 141.4" stroke-dashoffset="23.5"/>
    <circle cx="93" cy="142" r="78" fill="none" stroke="${DARK}" stroke-width="2.5"/><circle cx="93" cy="142" r="42" fill="none" stroke="${DARK}" stroke-width="2.5"/>`],
  ['harness', `<path d="M58 48 V214 M128 48 V214" stroke="#1d4e89" stroke-width="14" stroke-linecap="round"/>
    <path d="M58 60 Q93 86 128 60 M58 132 H128 M58 204 H128" fill="none" stroke="#1d4e89" stroke-width="14"/>
    <circle cx="93" cy="132" r="13" fill="none" stroke="${STEEL}" stroke-width="7"/>
    <path d="M93 146 Q86 236 150 252" fill="none" stroke="#f5c400" stroke-width="8" stroke-linecap="round"/><circle cx="158" cy="254" r="10" fill="none" stroke="${STEEL}" stroke-width="6"/>`],
  ['liferaft', `<path d="M34 196 Q93 50 152 196 Z" fill="#f77f00" stroke="#9a4a00" stroke-width="3" stroke-linejoin="round"/>
    <path d="M72 196 Q93 128 114 196 Z" fill="#5a2b00"/><rect x="88" y="62" width="10" height="16" rx="3" fill="#ffe082" stroke="${DARK}" stroke-width="2"/>
    <rect x="18" y="190" width="150" height="26" rx="13" fill="#22303a"/><rect x="18" y="212" width="150" height="26" rx="13" fill="#22303a" stroke="#4c5d6e" stroke-width="2"/>
    <path d="M6 246 q12 -8 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" fill="none" stroke="#1e88c9" stroke-width="5" stroke-linecap="round"/>`],
  ['flare', `<path d="M93 20 l10 30 l30 -12 l-16 28 l30 12 l-32 8 l8 32 l-30 -18 l-30 18 l8 -32 l-32 -8 l30 -12 l-16 -28 l30 12 Z" fill="#ffd54a" stroke="#f77f00" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="93" cy="76" r="14" fill="#fff3c4"/>
    <rect x="78" y="120" width="30" height="138" rx="7" fill="#e53935" stroke="#7f1d1d" stroke-width="3"/><rect x="78" y="200" width="30" height="58" rx="7" fill="${DARK}"/>`],
  ['extinguisher', `<path d="M110 70 Q156 74 152 132" fill="none" stroke="#111820" stroke-width="9" stroke-linecap="round"/>
    <rect x="80" y="52" width="26" height="30" rx="4" fill="${DARK}"/><path d="M70 50 H124" stroke="${DARK}" stroke-width="9" stroke-linecap="round"/>
    <rect x="60" y="80" width="66" height="180" rx="22" fill="#e53935" stroke="#7f1d1d" stroke-width="3"/>
    <rect x="70" y="130" width="46" height="56" rx="5" fill="#ffffff"/><path d="M80 170 q13 -40 26 0 Z" fill="#f77f00"/>`],
  ['firstaid', `<path d="M68 96 V76 Q68 62 82 62 H104 Q118 62 118 76 V96" fill="none" stroke="${DARK}" stroke-width="8"/>
    <rect x="24" y="94" width="138" height="124" rx="14" fill="#ffffff" stroke="${DARK}" stroke-width="3"/>
    <path d="M93 122 V190 M59 156 H127" stroke="#2e9e4f" stroke-width="24"/>`],
  ['vhf', `<rect x="72" y="26" width="12" height="78" rx="5" fill="#111820"/>
    <rect x="62" y="96" width="64" height="164" rx="12" fill="#2b3a4a" stroke="#111820" stroke-width="3"/>
    <rect x="72" y="110" width="44" height="32" rx="4" fill="#a8dcb4"/><path d="M78 122 h20 M78 132 h30" stroke="#2b3a4a" stroke-width="3"/>
    <g fill="#8a97a5"><circle cx="80" cy="162" r="6"/><circle cx="94" cy="162" r="6"/><circle cx="108" cy="162" r="6"/><circle cx="80" cy="182" r="6"/><circle cx="94" cy="182" r="6"/><circle cx="108" cy="182" r="6"/></g>
    <g stroke="#8a97a5" stroke-width="3" stroke-linecap="round"><path d="M78 210 H110 M78 222 H110 M78 234 H110"/></g>
    <rect x="104" y="80" width="16" height="18" rx="4" fill="#d62828"/>`],
]);
