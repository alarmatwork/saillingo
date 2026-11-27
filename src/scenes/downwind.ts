// The same boat running downwind under spinnaker, with a closer look at the mast top.
import { boatBase, boatRails } from './profile.ts';
import type { Scene } from './types.ts';

const art = `${boatBase}
<path d="M420 58 L122 499" stroke="#33475b" stroke-width="2.2"/>
<path d="M422 100 L694 479" stroke="#33475b" stroke-width="2.2"/>
<path d="M416 72 L416 416 L226 416 Q306 236 416 72 Z" fill="#ffffff" stroke="#8aa2b8" stroke-width="2.5" stroke-linejoin="round"/>
<g stroke="#c9d6e2" stroke-width="1.5"><path d="M416 150 L366 150"/><path d="M416 236 L316 236"/><path d="M416 322 L270 322"/></g>
<g stroke="#e4572e" stroke-width="4" stroke-linecap="round"><path d="M363 155 L398 151"/><path d="M314 240 L364 235"/><path d="M268 327 L318 322"/></g>
<path class="t-runningbackstays" d="M419 150 L165 497" stroke="#168a7a" stroke-width="3.2"/>

<g class="t-spinnaker"><path d="M424 64 C570 84 712 250 652 398 C596 446 520 446 462 420 C506 300 478 160 424 64 Z" fill="#e53935" stroke="#9b1c1c" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M462 138 C530 150 610 190 656 262 C670 300 668 340 660 372 C600 350 540 340 486 338 C494 270 486 200 462 138 Z" fill="#ffffff" stroke="none"/>
  <path d="M478 200 C540 212 620 240 664 290 C668 318 666 340 662 356 C600 318 540 300 490 296 C490 262 486 230 478 200 Z" fill="#1d6fb8" stroke="none"/></g>
<path class="t-spinnakerpole" d="M424 402 L654 398" stroke="#4c5d6e" stroke-width="8" stroke-linecap="round"/>
<path class="t-guy" d="M652 398 L190 494" stroke="#2e9e4f" stroke-width="3.6"/>
<path class="t-spinsheet" d="M462 420 L150 496" stroke="#f77f00" stroke-width="3.6"/>

<g stroke="#33475b" stroke-width="2.2" fill="none"><path d="M419 100 L402 268 L398 489"/><path d="M418 270 L407 489"/></g>
<path d="M420 268 L400 268" stroke="#5c6b7a" stroke-width="6" stroke-linecap="round"/>
<rect x="416" y="58" width="8" height="412" rx="2" fill="#a7b3bf" stroke="#4c5d6e" stroke-width="2"/>
<circle class="t-masthead zone" cx="420" cy="62" r="26"/>
<rect class="t-masthead" x="408" y="54" width="24" height="9" rx="3" fill="#4c5d6e"/>
<g class="t-windindicator" stroke="#12263a" stroke-width="3.5" stroke-linecap="round" fill="none"><path d="M420 54 V30"/><path d="M394 30 H448"/><path d="M448 30 l-13 -7 M448 30 l-13 7"/><path d="M394 30 l-9 -9 M394 30 l-9 9"/></g>
<rect x="212" y="418" width="207" height="8" rx="4" fill="#a7b3bf" stroke="#4c5d6e" stroke-width="2"/>
<circle class="t-boomend zone" cx="216" cy="422" r="24"/>
<rect class="t-boomend" x="208" y="416" width="14" height="12" rx="3" fill="#4c5d6e"/>
<path d="M380 426 L418 466" stroke="#7b2cbf" stroke-width="2.5"/>
<path d="M250 426 L246 490 M258 426 L254 490" stroke="#1d6fb8" stroke-width="2"/>
${boatRails}
`;

export const downwind: Scene = {
  id: 'downwind',
  size: [800, 740],
  art,
  spots: {
    spinnaker: [585, 160], spinnakerpole: [540, 400], guy: [380, 455], spinsheet: [215, 480],
    masthead: [420, 62], windindicator: [448, 30], runningbackstays: [290, 327], boomend: [216, 422],
  },
};
