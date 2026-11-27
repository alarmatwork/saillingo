// Points of sail seen from above. The wind blows from the top of the picture.
// Boats sit on a circle around (400, 410); the angle is measured clockwise from "straight upwind".
import type { Scene } from './types.ts';
import { arrowHead } from './util.ts';

const CX = 400, CY = 410, R = 235;
const rad = (deg: number) => (deg * Math.PI) / 180;
const at = (deg: number, r = R): [number, number] => [
  Math.round((CX + r * Math.sin(rad(deg))) * 10) / 10,
  Math.round((CY - r * Math.cos(rad(deg))) * 10) / 10,
];

/** A little boat seen from above. `boom` > 0 swings the sail to port, < 0 to starboard. */
export function boat(x: number, y: number, heading: number, boom: number, cls: string, scale = 1): string {
  const belly = boom === 0 ? 'M0 -10 q7 10 0 22 q-7 10 0 22' : `M0 -10 Q${boom > 0 ? -11 : 11} 14 0 36`;
  return `<g class="${cls}" transform="translate(${x} ${y}) rotate(${heading}) scale(${scale})">
    <path d="M0 -36 C15 -18 17 8 11 32 L-11 32 C-17 8 -15 -18 0 -36Z" fill="#fbfbf7" stroke="#22364a" stroke-width="2.5"/>
    <g transform="rotate(${boom} 0 -10)"><path d="${belly}" fill="none" stroke="#e4572e" stroke-width="4.5" stroke-linecap="round"/></g>
    <circle cx="0" cy="-10" r="3.2" fill="#22364a" stroke="none"/></g>`;
}

const onCircle = (deg: number, boom: number, cls: string) => boat(...at(deg), deg, boom, cls);
const arc = (from: number, to: number, r: number, sweep: 0 | 1) => {
  const [x1, y1] = at(from, r), [x2, y2] = at(to, r);
  return `M${x1} ${y1} A${r} ${r} 0 0 ${sweep} ${x2} ${y2}`;
};

const [nl, nr, il, ir] = [at(-38, 272), at(38, 272), at(-38, 140), at(38, 140)];
const ripples = [[90, 90], [690, 120], [80, 650], [690, 660], [300, 520], [520, 330]]
  .map(([x, y]) => `<path d="M${x} ${y} q10 -7 20 0 t20 0"/>`)
  .join('');

const art = `
<rect width="800" height="740" fill="#a9dcf3"/>
<g fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity=".7">${ripples}</g>
<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="4 10" opacity=".9"/>

<path class="t-nogo" d="M${nl[0]} ${nl[1]} A272 272 0 0 1 ${nr[0]} ${nr[1]} L${ir[0]} ${ir[1]} A140 140 0 0 0 ${il[0]} ${il[1]} Z" fill="#e53935" fill-opacity=".22" stroke="#c62828" stroke-width="2.5" stroke-dasharray="8 6"/>

<g class="t-wind"><path d="M388 10 H412 V58 H430 L400 96 L370 58 H388 Z" fill="#4aa3df" stroke="#1b4f72" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M340 22 v36 M460 22 v36 M300 34 v24 M500 34 v24" stroke="#4aa3df" stroke-width="5" stroke-linecap="round"/></g>

<path class="t-porttack" d="${arc(50, 130, 300, 1)}" fill="none" stroke="#e53935" stroke-width="8" stroke-linecap="round" opacity=".85"/>
<path class="t-starboardtack" d="${arc(-50, -130, 300, 0)}" fill="none" stroke="#2e9e4f" stroke-width="8" stroke-linecap="round" opacity=".85"/>

<g class="t-tacking" stroke="#6a1b9a" fill="#6a1b9a" stroke-width="4" stroke-linecap="round"><path d="${arc(-28, 28, 290, 1)}" fill="none" stroke-dasharray="10 8"/>${arrowHead(...at(30, 290), 30, 18)}${arrowHead(...at(-30, 290), 150, 18)}</g>
<g class="t-gybing" stroke="#6a1b9a" fill="#6a1b9a" stroke-width="4" stroke-linecap="round"><path d="${arc(152, 208, 290, 1)}" fill="none" stroke-dasharray="10 8"/>${arrowHead(...at(210, 290), 210, 18)}${arrowHead(...at(150, 290), -30, 18)}</g>

${onCircle(0, 0, 't-nogo')}
${onCircle(45, -14, 't-closehauled t-porttack')}${onCircle(-45, 14, 't-closehauled t-starboardtack')}
${onCircle(90, -45, 't-beamreach t-porttack')}${onCircle(-90, 45, 't-beamreach t-starboardtack')}
${onCircle(135, -68, 't-broadreach t-porttack')}${onCircle(-135, 68, 't-broadreach t-starboardtack')}
${onCircle(180, 86, 't-running')}

<circle cx="${CX}" cy="${CY}" r="88" fill="#ffffff" fill-opacity=".35" stroke="#ffffff" stroke-width="2"/>
<path class="t-windward zone" d="M312 410 A88 88 0 0 1 488 410 Z" style="fill:#1e88c9"/>
<path class="t-leeward zone" d="M312 410 A88 88 0 0 0 488 410 Z" style="fill:#f77f00"/>
<path d="M312 410 H488" stroke="#ffffff" stroke-width="2" stroke-dasharray="5 6"/>
${boat(CX, CY, 90, -45, '', 1.5)}
`;

export const wind: Scene = {
  id: 'wind',
  size: [800, 740],
  art,
  spots: {
    wind: [400, 44], windward: [400, 350], leeward: [400, 472], porttack: [682, 513], starboardtack: [118, 513],
    nogo: [332, 222], closehauled: at(-45), beamreach: at(-90), broadreach: at(-135), running: [400, 640],
    tacking: [400, 120], gybing: [400, 700],
  },
};
