// Top view of the boat moored next to a dock, bow up. Port is on the left.
import type { Scene } from './types.ts';
import { dimH, dimV } from './util.ts';

const HULL = 'M400 40 C470 150 520 300 515 440 C512 560 500 650 485 700 L315 700 C300 650 288 560 285 440 C280 300 330 150 400 40 Z';
const DECK = 'M400 62 C460 162 506 304 502 440 C499 556 488 640 474 688 L326 688 C312 640 301 556 298 440 C294 304 340 162 400 62 Z';

const planks = Array.from({ length: 19 }, (_, i) => `<path d="M0 ${20 + i * 38} H92"/>`).join('');
const ripples = [
  [150, 120], [620, 90], [560, 240], [170, 250], [640, 560], [200, 560], [590, 660], [160, 470],
]
  .map(([x, y]) => `<path d="M${x} ${y} q10 -7 20 0 t20 0" />`)
  .join('');

const art = `
<defs>
  <clipPath id="d-left"><rect x="0" y="0" width="400" height="740"/></clipPath>
  <clipPath id="d-right"><rect x="400" y="0" width="400" height="740"/></clipPath>
  <clipPath id="d-fore"><rect x="0" y="0" width="800" height="252"/></clipPath>
</defs>
<rect width="800" height="740" fill="#8fd0ee"/>
<g fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity=".7">${ripples}</g>
<rect x="0" y="0" width="92" height="740" fill="#b98a55"/>
<g stroke="#8a6238" stroke-width="2">${planks}</g>
<path d="M92 0 V740" stroke="#6f4d2b" stroke-width="4"/>

<path class="t-mooringline" d="M322 676 Q200 706 70 690" fill="none" stroke="#f3e2a9" stroke-width="5" stroke-linecap="round"/>
<circle cx="66" cy="690" r="11" fill="#3d4f5c" stroke="#22303a" stroke-width="2"/>
<path d="M291 322 L276 322" stroke="#33475b" stroke-width="2"/>

<path d="${HULL}" fill="#fbfbf7" stroke="#22364a" stroke-width="3" stroke-linejoin="round"/>
<path d="${DECK}" fill="#dcb67a" stroke="#b08a52" stroke-width="1.5"/>
<path class="t-port zone" d="${HULL}" clip-path="url(#d-left)" style="fill:#e53935"/>
<path class="t-starboard zone" d="${HULL}" clip-path="url(#d-right)" style="fill:#2e9e4f"/>
<path class="t-foredeck zone" d="${DECK}" clip-path="url(#d-fore)"/>
<path d="M370 116 Q400 34 430 116" fill="none" stroke="#7d8b99" stroke-width="4" stroke-linecap="round"/>

<g class="t-anchor" fill="none" stroke="#33414d" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M400 80 V124"/><path d="M388 88 H412"/><path d="M382 110 Q400 136 418 110"/><circle cx="400" cy="75" r="4.5"/>
</g>
<g class="t-hatch"><rect x="376" y="160" width="48" height="44" rx="7" fill="#cfe6f5" stroke="#4c5d6e" stroke-width="2.5"/><path d="M376 182 H424" stroke="#4c5d6e" stroke-width="1.5"/></g>
<path d="M352 264 Q400 242 448 264 L458 478 Q400 490 342 478 Z" fill="#f4f6f8" stroke="#4c5d6e" stroke-width="2.5" stroke-linejoin="round"/>
<circle cx="400" cy="298" r="11" fill="#a7b3bf" stroke="#4c5d6e" stroke-width="2.5"/>
<rect x="362" y="340" width="26" height="60" rx="6" fill="#3f6ea6" opacity=".85"/><rect x="412" y="340" width="26" height="60" rx="6" fill="#3f6ea6" opacity=".85"/>
<g class="t-companionway"><rect x="374" y="436" width="52" height="44" rx="5" fill="#3a2a1c" stroke="#22303a" stroke-width="2.5"/><path d="M374 450 H426 M374 464 H426" stroke="#8a6238" stroke-width="3"/></g>

<rect x="346" y="498" width="108" height="176" rx="12" fill="#b9935c" stroke="#7a5a30" stroke-width="2.5"/>
<path d="M400 694 L400 606" stroke="#9c6428" stroke-width="7" stroke-linecap="round"/>
<g class="t-traveler"><rect x="350" y="511" width="100" height="8" rx="3" fill="#4c5d6e"/><rect x="391" y="506" width="18" height="18" rx="4" fill="#d62828" stroke="#22303a" stroke-width="2"/></g>
<g class="t-winch" stroke="#3d4f5c" stroke-width="2.5"><circle cx="322" cy="548" r="13" fill="#c3ced8"/><circle cx="322" cy="548" r="5" fill="#6f8192"/><circle cx="478" cy="548" r="13" fill="#c3ced8"/><circle cx="478" cy="548" r="5" fill="#6f8192"/></g>
<g class="t-cleat" fill="#eef2f5" stroke="#33414d" stroke-width="2.5"><rect x="317" y="664" width="9" height="26" rx="4"/><rect x="474" y="664" width="9" height="26" rx="4"/><rect x="396" y="132" width="9" height="22" rx="4"/></g>
<rect class="t-fender" x="262" y="298" width="17" height="50" rx="8.5" fill="#ffffff" stroke="#1565c0" stroke-width="3"/>

<path d="M285 440 V728 M515 440 V728" stroke="#12263a" stroke-width="1.6" stroke-dasharray="5 6"/>
${dimH(722, 287, 513, 't-beam')}
<path d="M404 40 H730 M487 700 H730" stroke="#12263a" stroke-width="1.6" stroke-dasharray="5 6"/>
${dimV(712, 42, 698, 't-length')}
`;

export const deck: Scene = {
  id: 'deck',
  size: [800, 740],
  art,
  spots: {
    port: [190, 400], starboard: [610, 400], beam: [400, 722], length: [712, 300], foredeck: [400, 232], anchor: [400, 100],
    hatch: [400, 182], companionway: [400, 458], winch: [478, 548], cleat: [478, 677], traveler: [400, 515],
    fender: [270, 323], mooringline: [200, 694],
  },
};
