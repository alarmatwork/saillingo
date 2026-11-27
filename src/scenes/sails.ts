// Close-up of the rig: mainsail (left) and jib (right) with the lines that control them.
import type { Scene } from './types.ts';
import { cloud, gull } from './util.ts';

const LEECH = 'M380 70 Q236 300 125 548';

const art = `
<defs>
  <linearGradient id="s-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3f4"/><stop offset="1" stop-color="#e3f6fd"/></linearGradient>
</defs>
<rect width="800" height="740" fill="url(#s-sky)"/>
${cloud(120, 110, 1.1)}${cloud(650, 150, 0.9)}${gull(600, 70)}${gull(560, 95)}
<rect x="0" y="704" width="800" height="36" fill="#1e88c9" opacity=".55"/>
<path d="M30 660 H780 L756 716 H60 Z" fill="#fbfbf7" stroke="#22364a" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M44 682 H770" stroke="#1d4e89" stroke-width="6"/>
<path d="M30 660 H780" stroke="#c8954f" stroke-width="7" stroke-linecap="round"/>

<path class="t-toppinglift" d="M368 44 L88 556" stroke="#168a7a" stroke-width="2.6" fill="none"/>
<path d="M388 120 L720 656" stroke="#33475b" stroke-width="2.4"/>

<path d="M380 70 L380 548 L125 548 Q236 300 380 70 Z" fill="#ffffff" stroke="#8aa2b8" stroke-width="2.5" stroke-linejoin="round"/>
<g stroke="#d5dfe8" stroke-width="1.5"><path d="M380 210 L296 210"/><path d="M380 305 L242 305"/><path d="M380 400 L195 400"/></g>
<path class="t-head" d="M380 70 L380 108 L360 101 Z" fill="#9db4c8"/>
<path class="t-tack" d="M380 548 L380 512 L344 548 Z" fill="#9db4c8"/>
<path class="t-clew" d="M125 548 L167 548 L141 514 Z" fill="#9db4c8"/>
<path class="t-luff" d="M380 110 L380 510" fill="none"/>
<path class="t-leech" d="${LEECH}" fill="none"/>
<path class="t-foot" d="M168 548 L343 548" fill="none"/>
<g class="t-battens" stroke="#e4572e" stroke-width="5" stroke-linecap="round"><path d="M324 163 L366 159"/><path d="M270 257 L330 251"/><path d="M219 352 L284 346"/><path d="M171 450 L236 444"/></g>
<g class="t-reefpoints" stroke="#33475b" stroke-width="2.5" stroke-linecap="round" fill="none">
  <path d="M170 478 H372" stroke-dasharray="3 9"/>
  <path d="M200 470 v18 M235 470 v18 M270 470 v18 M305 470 v18 M340 470 v18"/>
  <circle cx="372" cy="478" r="5" fill="#fff"/><circle cx="166" cy="478" r="5" fill="#fff"/>
</g>

<path d="M408 152 L706 636 L425 612 Q412 380 408 152 Z" fill="#ffd166" stroke="#c9962b" stroke-width="2.5" stroke-linejoin="round"/>
<g stroke="#e9b949" stroke-width="1.5"><path d="M410 300 L500 300"/><path d="M414 450 L592 450"/></g>
<g class="t-telltales" stroke="#d62828" stroke-width="4" stroke-linecap="round" fill="none">
  <path d="M462 279 q-14 -4 -28 4"/><path d="M536 400 q-14 -4 -28 4"/><path d="M610 521 q-14 -4 -28 4"/>
</g>

<path class="t-jibsheet" d="M425 612 Q396 640 322 656" stroke="#2e9e4f" stroke-width="4" fill="none" stroke-linecap="round"/>
<circle cx="322" cy="656" r="6" fill="#33475b"/>
<rect x="380" y="40" width="10" height="620" rx="2" fill="#a7b3bf" stroke="#4c5d6e" stroke-width="2"/>
<rect x="362" y="38" width="30" height="7" rx="3" fill="#4c5d6e"/>
<path class="t-halyard" d="M380 72 L374 48 L385 44 L385 596 L370 618" stroke="#d62828" stroke-width="3.2" stroke-dasharray="9 5" fill="none" stroke-linejoin="round"/>
<path d="M362 618 h16" stroke="#22303a" stroke-width="5" stroke-linecap="round"/>
<rect x="84" y="556" width="300" height="9" rx="4" fill="#a7b3bf" stroke="#4c5d6e" stroke-width="2"/>
<path class="t-outhaul" d="M125 548 L90 557" stroke="#f77f00" stroke-width="5" stroke-linecap="round"/>
<path class="t-vang" d="M300 566 L378 646" stroke="#7b2cbf" stroke-width="5" stroke-linecap="round"/>
<g class="t-mainsheet" stroke="#1d6fb8" stroke-width="3.2" stroke-linecap="round"><path d="M164 570 L176 652"/><path d="M172 570 L184 652"/><path d="M180 570 L180 652"/>
  <circle cx="172" cy="569" r="6" fill="#33475b" stroke="none"/><circle cx="180" cy="654" r="6" fill="#33475b" stroke="none"/></g>
<circle class="t-gooseneck" cx="381" cy="560" r="8" fill="#33475b" stroke="#fff" stroke-width="2"/>
`;

export const sails: Scene = {
  id: 'sails',
  size: [800, 740],
  art,
  spots: {
    head: [372, 92], tack: [368, 536], clew: [144, 537], luff: [380, 300], leech: [244, 304], foot: [255, 548],
    battens: [300, 254], reefpoints: [270, 478], telltales: [522, 402], gooseneck: [381, 560], toppinglift: [299, 170],
    halyard: [385, 200], mainsheet: [176, 612], jibsheet: [356, 650], vang: [340, 607], outhaul: [106, 553],
  },
};
