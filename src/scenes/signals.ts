// Lights, day shapes and flags. The examples follow the Estonian Transport
// Administration handbook "Abiks paadimehele" (pages on "Tuled ja märgid").
import type { Scene } from './types.ts';
import { GRID_3X3, catalog } from './catalog.ts';

// ---- navigation light sectors, boat seen from above, bow up -------------------
const CX = 400, CY = 380;
const rad = (deg: number) => (deg * Math.PI) / 180;
const at = (deg: number, r: number): [number, number] => [
  Math.round((CX + r * Math.sin(rad(deg))) * 10) / 10,
  Math.round((CY - r * Math.cos(rad(deg))) * 10) / 10,
];
/** Ring segment between two radii, from angle a1 to a2 (clockwise from straight ahead). */
function sector(r1: number, r2: number, a1: number, a2: number): string {
  const big = a2 - a1 > 180 ? 1 : 0;
  const [x1, y1] = at(a1, r2), [x2, y2] = at(a2, r2), [x3, y3] = at(a2, r1), [x4, y4] = at(a1, r1);
  return `M${x1} ${y1} A${r2} ${r2} 0 ${big} 1 ${x2} ${y2} L${x3} ${y3} A${r1} ${r1} 0 ${big} 0 ${x4} ${y4} Z`;
}
const label = (deg: number, r: number, text: string, fill = '#ffffff') => {
  const [x, y] = at(deg, r);
  return `<text x="${x}" y="${y + 7}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="${fill}">${text}</text>`;
};
const stars = [[70, 60], [720, 90], [90, 660], [730, 640], [640, 40], [150, 120], [60, 380], [750, 380]]
  .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#ffffff" opacity=".7"/>`)
  .join('');

export const lights: Scene = {
  id: 'lights',
  size: [800, 740],
  art: `
<rect width="800" height="740" fill="#12284a"/>${stars}
<circle class="t-allroundlight" cx="${CX}" cy="${CY}" r="300" fill="none" stroke="#fff6cf" stroke-width="56" stroke-opacity=".8"/>
<path class="t-mastheadlight" d="${sector(182, 248, -112.5, 112.5)}" fill="#ffffff" stroke="#12284a" stroke-width="2"/>
<g class="t-sidelights" stroke="#12284a" stroke-width="2"><path d="${sector(92, 162, -112.5, 0)}" fill="#ff4d4d"/><path d="${sector(92, 162, 0, 112.5)}" fill="#35d07f"/></g>
<path class="t-sternlight" d="${sector(92, 162, 112.5, 247.5)}" fill="#ffffff" stroke="#12284a" stroke-width="2"/>
<path d="M${CX} ${CY - 64} C${CX + 26} ${CY - 34} ${CX + 28} ${CY + 14} ${CX + 20} ${CY + 56} L${CX - 20} ${CY + 56} C${CX - 28} ${CY + 14} ${CX - 26} ${CY - 34} ${CX} ${CY - 64} Z" fill="#fbfbf7" stroke="#0b1626" stroke-width="3"/>
<circle cx="${CX}" cy="${CY - 8}" r="5" fill="#0b1626"/>
${label(-56, 127, '112,5°')}${label(56, 127, '112,5°', '#0b1626')}${label(180, 127, '135°', '#0b1626')}${label(0, 215, '225°', '#0b1626')}${label(180, 300, '360°', '#0b1626')}
`,
  spots: { mastheadlight: at(60, 215), sidelights: at(-85, 127), sternlight: at(150, 127), allroundlight: at(90, 300) },
};

// ---- silhouettes shared by the night and day cards ----------------------------
const SHIP = `<path d="M14 204 H172 L160 232 H28 Z"/><path d="M40 205 V180 H82 V164 H104 V205 Z"/><path d="M128 205 V52 h4 V205 Z"/><path d="M68 166 V84 h4 V166 Z"/>`;
const YACHT = `<path d="M26 210 H166 Q152 232 132 232 H48 Q32 226 26 210 Z"/><path d="M96 204 V40 h4 V204 Z"/><path d="M94 52 Q56 120 36 196 H94 Z"/><path d="M104 60 Q140 130 156 196 H104 Z"/>`;
const sea = (fill: string) => `<rect x="0" y="232" width="187" height="16" fill="${fill}"/>`;

const WHITE = '#ffffff', RED = '#ff4d4d', GREEN = '#35d07f', YELLOW = '#ffd54a';
const lamp = (x: number, y: number, c: string) => `<circle cx="${x}" cy="${y}" r="16" fill="${c}" opacity=".3"/><circle cx="${x}" cy="${y}" r="8" fill="${c}"/>`;
const sides = lamp(148, 214, RED) + lamp(166, 214, GREEN);
const stern = lamp(16, 200, WHITE);
const night = (boat: string, lamps: string) => `<g fill="#0b1626">${boat}</g>${sea('#0b1626')}${lamps}`;

const NIGHT = {
  nsailing: night(YACHT, lamp(152, 216, RED) + lamp(168, 212, GREEN) + lamp(24, 204, WHITE)),
  npower: night(SHIP, lamp(130, 58, WHITE) + sides + stern),
  nanchor: night(SHIP, lamp(130, 58, WHITE)),
  naground: night(SHIP, lamp(130, 58, RED) + lamp(130, 92, RED) + lamp(160, 186, WHITE) + lamp(26, 186, WHITE)),
  nnotcommand: night(SHIP, lamp(130, 58, RED) + lamp(130, 92, RED) + sides + stern),
  nrestricted: night(SHIP, lamp(130, 52, RED) + lamp(130, 86, WHITE) + lamp(130, 120, RED) + lamp(70, 88, WHITE) + sides + stern),
  nfishing: night(SHIP, lamp(130, 58, RED) + lamp(130, 92, WHITE) + sides + stern),
  ntowing: night(SHIP, lamp(130, 52, WHITE) + lamp(130, 86, WHITE) + sides + stern + lamp(16, 166, YELLOW)),
  ntrawling: night(SHIP, lamp(130, 58, GREEN) + lamp(130, 92, WHITE) + sides + stern),
  ndraught: night(SHIP, lamp(130, 52, RED) + lamp(130, 86, RED) + lamp(130, 120, RED) + lamp(70, 88, WHITE) + sides + stern),
};

export const nightsignals = catalog('nightsignals', '#1c3254', [
  ['nsailing', NIGHT.nsailing], ['npower', NIGHT.npower], ['nanchor', NIGHT.nanchor], ['naground', NIGHT.naground],
  ['nnotcommand', NIGHT.nnotcommand], ['nrestricted', NIGHT.nrestricted], ['nfishing', NIGHT.nfishing], ['ntowing', NIGHT.ntowing],
], '#3d5a80');

const ball = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="13"/>`;
const diamond = (x: number, y: number) => `<path d="M${x} ${y - 15} l13 15 l-13 15 l-13 -15 Z"/>`;
const day = (boat: string, shapes: string) => `<g fill="#111820">${boat}${shapes}</g>${sea('#3d5a80')}`;
const CONES = `<path d="M114 46 H146 L130 76 Z"/><path d="M130 76 L146 106 H114 Z"/>`;

const DAY = {
  danchor: day(SHIP, ball(130, 64)),
  daground: day(SHIP, ball(130, 50) + ball(130, 82) + ball(130, 114)),
  dnotcommand: day(SHIP, ball(130, 58) + ball(130, 92)),
  drestricted: day(SHIP, ball(130, 48) + diamond(130, 82) + ball(130, 116)),
  dfishing: day(SHIP, CONES),
  ddraught: day(SHIP, `<rect x="117" y="44" width="26" height="46"/>`),
};

export const dayshapes = catalog('dayshapes', '#dcecf6', [
  ['danchor', DAY.danchor], ['daground', DAY.daground], ['dnotcommand', DAY.dnotcommand], ['drestricted', DAY.drestricted],
  ['dfishing', DAY.dfishing],
  ['dmotorsailing', `<g fill="#111820"><path d="M26 210 H166 Q152 232 132 232 H48 Q32 226 26 210 Z"/><path d="M96 204 V40 h4 V204 Z"/><path d="M94 52 Q56 120 36 196 H94 Z"/></g>
    <path d="M104 60 Q140 130 156 196 H104 Z" fill="#ffffff" stroke="#111820" stroke-width="3"/><path d="M110 120 H138 L124 148 Z" fill="#111820"/>${sea('#3d5a80')}`],
  ['ddistress', `<path d="M60 250 V30" stroke="#111820" stroke-width="5" stroke-linecap="round"/><rect x="62" y="40" width="92" height="64" fill="#f77f00" stroke="#9a4a00" stroke-width="3"/><circle cx="60" cy="140" r="17" fill="#111820"/>`],
]);

// ---- the same vessel by night (top) and by day (bottom) -------------------------
const PAIR_SCALE = 0.56;
const pair = (nightArt: string, dayArt: string) => {
  const x = (187 - 187 * PAIR_SCALE) / 2;
  return `<g transform="translate(${x} 4) scale(${PAIR_SCALE})"><rect width="187" height="248" rx="14" fill="#1c3254"/>${nightArt}</g>
    <g transform="translate(${x} 147) scale(${PAIR_SCALE})"><rect width="187" height="248" rx="14" fill="#dcecf6"/>${dayArt}</g>`;
};

export const combos = catalog('combos', '#e6eef5', [
  ['canchor', pair(NIGHT.nanchor, DAY.danchor)],
  ['caground', pair(NIGHT.naground, DAY.daground)],
  ['cnotcommand', pair(NIGHT.nnotcommand, DAY.dnotcommand)],
  ['crestricted', pair(NIGHT.nrestricted, DAY.drestricted)],
  ['cfishing', pair(NIGHT.nfishing, DAY.dfishing)],
  ['ctrawling', pair(NIGHT.ntrawling, DAY.dfishing)],
  ['cdraught', pair(NIGHT.ndraught, DAY.ddraught)],
]);

// ---- light characters: a lamp that blinks in the rhythm, and its 10-second pattern ----
/** [on?, seconds] segments making up one period */
type Rhythm = [0 | 1, number][];
const repeat = (times: number, seg: Rhythm): Rhythm => Array.from({ length: times }, () => seg).flat();
const RHYTHMS: Record<string, Rhythm> = {
  lfixed: [[1, 10]],
  locc: [[1, 3], [0, 1]],
  liso: [[1, 2], [0, 2]],
  lfl: [[1, 0.5], [0, 4.5]],
  llfl: [[1, 2.2], [0, 7.8]],
  lgrfl: [...repeat(2, [[1, 0.4], [0, 0.8]]), [1, 0.4], [0, 7.2]],
  lq: [[1, 0.4], [0, 0.6]],
  lgrq: [...repeat(2, [[1, 0.35], [0, 0.65]]), [1, 0.35], [0, 7.65]],
};
const LAMP = '#ffe27a';
function lightCard(rhythm: Rhythm): string {
  const period = rhythm.reduce((n, [, d]) => n + d, 0);
  let t = 0;
  const times: string[] = [], values: string[] = [];
  for (const [on, d] of rhythm) {
    times.push((t / period).toFixed(4));
    values.push(on ? '1' : '0.08');
    t += d;
  }
  const anim = rhythm.length > 1
    ? `<animate attributeName="opacity" dur="${period}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${times.join(';')}" values="${values.join(';')}"/>`
    : '';
  // the bar shows 10 seconds of the pattern, like a chart's light description
  const X = 18, BW = 151, secs = 10;
  let bar = '';
  for (let start = 0; start < secs; start += period) {
    let s = start;
    for (const [on, d] of rhythm) {
      const a = Math.min(s, secs), b = Math.min(s + d, secs);
      if (on && b > a) bar += `<rect x="${(X + (a / secs) * BW).toFixed(1)}" y="214" width="${Math.max(1.5, ((b - a) / secs) * BW).toFixed(1)}" height="24" fill="${LAMP}"/>`;
      s += d;
    }
  }
  return `<g>${anim}<circle cx="93.5" cy="112" r="78" fill="url(#lamp-glow)"/><circle cx="93.5" cy="112" r="32" fill="${LAMP}"/></g>
    <rect x="${X}" y="214" width="${BW}" height="24" fill="#0b1626" stroke="#5c6b7a" stroke-width="1.5"/>${bar}
    <text x="${X + BW}" y="256" text-anchor="end" font-family="system-ui, sans-serif" font-size="13" fill="#93a8ba">10 s</text>`;
}

export const lightchars = catalog('lightchars', '#0b1626',
  (['lfixed', 'locc', 'liso', 'lfl', 'llfl', 'lgrfl', 'lq', 'lgrq'] as const).map((id) => [id, lightCard(RHYTHMS[id])]),
  '#12284a',
  `<defs><radialGradient id="lamp-glow"><stop offset="0.35" stop-color="${LAMP}" stop-opacity=".75"/><stop offset="1" stop-color="${LAMP}" stop-opacity="0"/></radialGradient></defs>`);

// ---- buoys (IALA region A) ---------------------------------------------------------
const BK = '#1b1f24', YE = '#f5c400', RE = '#e21f26', GR = '#1f9d55', WH = '#ffffff';
const BODY = 'M46 252 L62 212 L82 212 L84 118 L103 118 L105 212 L125 212 L141 252 Z';
const cone = (y: number, up: boolean, c = BK) =>
  up ? `<path d="M93.5 ${y} L106 ${y + 20} L81 ${y + 20} Z" fill="${c}"/>` : `<path d="M81 ${y} L106 ${y} L93.5 ${y + 20} Z" fill="${c}"/>`;
const TOPMARKS: Record<string, [string, number]> = {
  bport: [`<rect x="82" y="66" width="23" height="22" fill="${RE}" stroke="${BK}" stroke-width="2"/>`, 88],
  bstarboard: [cone(66, true, GR), 86],
  bsafewater: [`<circle cx="93.5" cy="74" r="12" fill="${RE}" stroke="${BK}" stroke-width="2"/>`, 86],
  bisolated: [`<circle cx="93.5" cy="54" r="10" fill="${BK}"/><circle cx="93.5" cy="78" r="10" fill="${BK}"/>`, 88],
  bspecial: [`<path d="M82 62 L105 86 M105 62 L82 86" stroke="${YE}" stroke-width="7" stroke-linecap="round"/>`, 86],
  bnorth: [cone(44, true) + cone(68, true), 88],
  bsouth: [cone(44, false) + cone(68, false), 88],
  beast: [cone(44, true) + cone(66, false), 86],
  bwest: [cone(44, false) + cone(66, true), 86],
};
/** horizontal colour bands from top to bottom, as [colour, from, to] fractions of the body height */
const BANDS: Record<string, [string, number, number][]> = {
  bport: [[RE, 0, 1]],
  bstarboard: [[GR, 0, 1]],
  bisolated: [[BK, 0, 0.36], [RE, 0.36, 0.64], [BK, 0.64, 1]],
  bspecial: [[YE, 0, 1]],
  bnorth: [[BK, 0, 0.5], [YE, 0.5, 1]],
  bsouth: [[YE, 0, 0.5], [BK, 0.5, 1]],
  beast: [[BK, 0, 0.34], [YE, 0.34, 0.66], [BK, 0.66, 1]],
  bwest: [[YE, 0, 0.34], [BK, 0.34, 0.66], [YE, 0.66, 1]],
};
function buoy(id: string): string {
  const top = 118, h = 134;
  const fill = id === 'bsafewater'
    ? [0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${46 + i * 13.6}" y="${top}" width="13.6" height="${h}" fill="${i % 2 ? WH : RE}"/>`).join('')
    : BANDS[id].map(([c, a, b]) => `<rect x="40" y="${top + a * h}" width="108" height="${(b - a) * h + 0.5}" fill="${c}"/>`).join('');
  const [mark, bottom] = TOPMARKS[id];
  return `<defs><clipPath id="clip-${id}"><path d="${BODY}"/></clipPath></defs>
    <rect x="0" y="244" width="187" height="34" fill="#5aa9dc"/>
    <path d="M93.5 ${bottom} V120" stroke="${BK}" stroke-width="4"/>${mark}
    <g clip-path="url(#clip-${id})">${fill}</g><path d="${BODY}" fill="none" stroke="${BK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M30 250 q16 -8 32 0 t32 0 t32 0 t32 0" fill="none" stroke="#ffffff" stroke-width="3" opacity=".8"/>`;
}

export const buoys = catalog('buoys', '#dcecf6',
  (['bnorth', 'beast', 'bsouth', 'bwest', 'bport', 'bstarboard', 'bsafewater', 'bisolated', 'bspecial'] as const).map((id) => [id, buoy(id)]),
  '#ffffff', '', GRID_3X3);

// ---- flags of the International Code of Signals --------------------------------
const FX = 18, FY = 75, FW = 150, FH = 100;
const frame = `<rect x="${FX}" y="${FY}" width="${FW}" height="${FH}" fill="none" stroke="#111820" stroke-width="3"/>`;
const SWALLOW = `M${FX} ${FY} H${FX + FW} L${FX + FW - 32} ${FY + FH / 2} L${FX + FW} ${FY + FH} H${FX} Z`;
const quarters = (a: string, b: string) =>
  `<rect x="${FX}" y="${FY}" width="75" height="50" fill="${a}"/><rect x="${FX + 75}" y="${FY}" width="75" height="50" fill="${b}"/><rect x="${FX}" y="${FY + 50}" width="75" height="50" fill="${b}"/><rect x="${FX + 75}" y="${FY + 50}" width="75" height="50" fill="${a}"/>${frame}`;
const BLUE = '#1456b8', FRED = '#e21f26', FYEL = '#ffd400';
const checks = Array.from({ length: 16 }, (_, i) => {
  const c = i % 4, r = Math.floor(i / 4);
  return `<rect x="${44 + c * 25}" y="${24 + r * 18}" width="25" height="18" fill="${(c + r) % 2 ? '#ffffff' : BLUE}"/>`;
}).join('');
const stripes = [BLUE, '#ffffff', FRED, '#ffffff', BLUE].map((c, i) => `<rect x="44" y="${124 + i * 14.4}" width="100" height="14.4" fill="${c}"/>`).join('');

export const flags = catalog('flags', '#e6eef5', [
  ['fa', `<path d="${SWALLOW}" fill="${BLUE}"/><rect x="${FX}" y="${FY}" width="75" height="${FH}" fill="#ffffff"/><path d="${SWALLOW}" fill="none" stroke="#111820" stroke-width="3" stroke-linejoin="round"/>`],
  ['fl', quarters(FYEL, '#111820')],
  ['fo', `<path d="M${FX} ${FY} H${FX + FW} V${FY + FH} Z" fill="${FRED}"/><path d="M${FX} ${FY} V${FY + FH} H${FX + FW} Z" fill="${FYEL}"/>${frame}`],
  ['fnc', `${checks}<rect x="44" y="24" width="100" height="72" fill="none" stroke="#111820" stroke-width="3"/>${stripes}<rect x="44" y="124" width="100" height="72" fill="none" stroke="#111820" stroke-width="3"/>`],
  ['fb', `<path d="${SWALLOW}" fill="${FRED}" stroke="#111820" stroke-width="3" stroke-linejoin="round"/>`],
  ['fu', quarters(FRED, '#ffffff')],
  ['fv', `<rect x="${FX}" y="${FY}" width="${FW}" height="${FH}" fill="#ffffff"/><path d="M${FX} ${FY} L${FX + FW} ${FY + FH} M${FX} ${FY + FH} L${FX + FW} ${FY}" stroke="${FRED}" stroke-width="20" clip-path="url(#f-clip)"/>${frame}`],
  ['fw', `<rect x="${FX}" y="${FY}" width="${FW}" height="${FH}" fill="${BLUE}"/><rect x="${FX + 22}" y="${FY + 18}" width="${FW - 44}" height="${FH - 36}" fill="#ffffff"/><rect x="${FX + 46}" y="${FY + 34}" width="${FW - 92}" height="${FH - 68}" fill="${FRED}"/>${frame}`],
], '#ffffff', `<defs><clipPath id="f-clip"><rect x="${FX}" y="${FY}" width="${FW}" height="${FH}"/></clipPath></defs>`);
