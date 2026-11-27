// "Who gives way?" situations, seen from above. Each one is drawn in an
// 800 x 520 box; boat `a` and boat `b` are the two tappable boats.
// The rules follow the handbook "Abiks paadimehele" (Põhilised teeandmise reeglid).
import type { TermId } from '../data/model.ts';
import type { Scene } from './types.ts';
import { arrowHead } from './util.ts';
import { boat as sailboat } from './wind.ts';

export interface Situation {
  art: string;
  a: [number, number];
  b: [number, number];
  /** which boat must keep out of the way */
  giveway: 'a' | 'b' | 'both';
}

export const SIT_W = 800, SIT_H = 520;

const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;

function motorboat(x: number, y: number, heading: number, scale = 1.9): string {
  return `<g transform="translate(${x} ${y}) rotate(${heading}) scale(${scale})">
    <path d="M-10 38 l-9 30 M10 38 l9 30 M0 38 v26" stroke="#ffffff" stroke-width="4" opacity=".85" stroke-linecap="round"/>
    <path d="M0 -42 C17 -22 18 10 15 36 L-15 36 C-18 10 -17 -22 0 -42Z" fill="#fbfbf7" stroke="#22364a" stroke-width="2.5"/>
    <path d="M-11 -4 Q0 -14 11 -4 L11 4 L-11 4 Z" fill="#3f6ea6"/>
    <rect x="-9" y="10" width="18" height="16" rx="3" fill="#dfe6ec" stroke="#22364a" stroke-width="1.5"/></g>`;
}

function ship(x: number, y: number): string {
  return `<g transform="translate(${x} ${y})">
    <path d="M0 -150 C24 -110 26 -40 24 140 L-24 140 C-26 -40 -24 -110 0 -150Z" fill="#7d8b99" stroke="#33414d" stroke-width="3"/>
    <rect x="-17" y="72" width="34" height="50" rx="4" fill="#ffffff" stroke="#33414d" stroke-width="2"/>
    <path d="M-12 -60 H12 M-12 -20 H12 M-12 20 H12" stroke="#5c6b7a" stroke-width="10"/></g>`;
}

/** Dashed course line ahead of a boat, ending in an arrow. */
function course(x: number, y: number, heading: number, len = 150, from = 82): string {
  const r = rad(heading);
  const x1 = x + Math.cos(r) * from, y1 = y + Math.sin(r) * from;
  const x2 = x + Math.cos(r) * len, y2 = y + Math.sin(r) * len;
  return `<g stroke="#12263a" fill="#12263a" stroke-width="3"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-dasharray="10 8"/>${arrowHead(x2, y2, heading - 90, 16)}</g>`;
}

const WIND = `<g transform="translate(60 20)"><path d="M-8 0 H8 V44 H20 L0 72 L-20 44 H-8 Z" fill="#4aa3df" stroke="#1b4f72" stroke-width="2.5" stroke-linejoin="round"/></g>`;
const water = (extra = '') => `<rect width="${SIT_W}" height="${SIT_H}" fill="#a9dcf3"/>
  <g fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity=".7">
    <path d="M120 120 q10 -7 20 0 t20 0"/><path d="M640 90 q10 -7 20 0 t20 0"/><path d="M90 450 q10 -7 20 0 t20 0"/><path d="M690 460 q10 -7 20 0 t20 0"/><path d="M420 470 q10 -7 20 0 t20 0"/></g>${extra}`;

export const SITUATIONS: Partial<Record<TermId, Situation>> = {
  rovertaking: {
    art: water() + course(230, 310, 80, 230) + course(540, 260, 80, 150) + motorboat(230, 310, 80) + motorboat(540, 260, 80),
    a: [230, 310], b: [540, 260], giveway: 'a',
  },
  rpowersail: {
    art: water(WIND) + course(220, 390, 45, 200) + course(560, 220, 260, 190) + motorboat(220, 390, 45) + sailboat(560, 220, 260, 50, '', 2),
    a: [220, 390], b: [560, 220], giveway: 'a',
  },
  rcrossing: {
    art: water() + course(300, 410, 0, 200) + course(580, 190, 270, 190) + motorboat(300, 410, 0) + motorboat(580, 190, 270),
    a: [300, 410], b: [580, 190], giveway: 'a',
  },
  rheadon: {
    art: water() + `<g stroke="#12263a" fill="#12263a" stroke-width="3" fill-opacity="0">
        <path d="M222 270 Q330 270 372 336" stroke-dasharray="10 8"/><path d="M578 250 Q470 250 428 184" stroke-dasharray="10 8"/></g>
      <g fill="#12263a">${arrowHead(374, 340, 60, 16)}${arrowHead(426, 180, 240, 16)}</g>` + motorboat(160, 270, 90) + motorboat(640, 250, 270),
    a: [160, 270], b: [640, 250], giveway: 'both',
  },
  rporttack: {
    art: water(WIND) + course(230, 410, 45, 220) + course(570, 410, 315, 220) + sailboat(230, 410, 45, -14, '', 2) + sailboat(570, 410, 315, 14, '', 2),
    a: [230, 410], b: [570, 410], giveway: 'a',
  },
  rwindward: {
    art: water(WIND) + course(500, 190, 270, 190) + course(420, 380, 270, 190) + sailboat(500, 190, 270, 45, '', 2) + sailboat(420, 380, 270, 45, '', 2),
    a: [500, 190], b: [420, 380], giveway: 'a',
  },
  rnarrow: {
    art: water(`<rect x="330" y="0" width="140" height="${SIT_H}" fill="#7fc4e6"/>
      <path d="M330 0 V${SIT_H} M470 0 V${SIT_H}" stroke="#ffffff" stroke-width="2" stroke-dasharray="12 10"/>
      <g stroke="#1b1f24" stroke-width="2"><rect x="306" y="60" width="16" height="22" fill="#e21f26"/><rect x="306" y="300" width="16" height="22" fill="#e21f26"/>
      <path d="M486 92 l9 -18 l9 18 Z" fill="#1f9d55"/><path d="M486 332 l9 -18 l9 18 Z" fill="#1f9d55"/></g>`)
      + `<g stroke="#12263a" fill="#12263a" stroke-width="3"><line x1="400" y1="160" x2="400" y2="40" stroke-dasharray="10 8"/>${arrowHead(400, 34, -90, 16)}</g>`
      + ship(400, 330) + course(660, 150, 270, 230) + sailboat(660, 150, 270, 45, '', 2),
    a: [660, 150], b: [400, 330], giveway: 'a',
  },
};

/** All situations as small cards, for the picture page and "tap the situation" questions. */
export function situationsScene(ids: TermId[]): Scene {
  const cw = 385, ch = 170, gap = 10, x0 = 10, y0 = 12;
  const artW = (ch * SIT_W) / SIT_H;
  const spots: Scene['spots'] = {};
  const cards = ids.map((id, i) => {
    const x = x0 + (i % 2) * (cw + gap), y = y0 + Math.floor(i / 2) * (ch + gap);
    spots[id] = [Math.round(x + cw - 30), Math.round(y + ch - 32)];
    return `<g transform="translate(${x} ${y})"><rect width="${cw}" height="${ch}" rx="18" fill="#ffffff" stroke="#c9d6e2" stroke-width="2"/>
      <rect class="t-${id} zone" width="${cw}" height="${ch}" rx="18"/>
      <svg x="10" y="0" width="${artW}" height="${ch}" viewBox="0 0 ${SIT_W} ${SIT_H}">${SITUATIONS[id]!.art}</svg></g>`;
  }).join('');
  return { id: 'rightofway', size: [800, 740], art: `<rect width="800" height="740" fill="#dcecf6"/>${cards}`, spots };
}
