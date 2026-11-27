// Side view of a sloop, bow to the right. Waterline at y = 560.
import type { Scene } from './types.ts';
import { cloud, dimV, gull, wave } from './util.ts';

const HULL = 'M118 500 L700 478 Q668 540 612 566 Q400 612 168 572 Z';
/** Height of the deck edge (sheer line) at a given x. */
export const sheer = (x: number) => 500 - ((x - 118) * 22) / 582;

const stanchions = [230, 300, 370, 450, 530, 610]
  .map((x) => `<line x1="${x}" y1="${sheer(x)}" x2="${x}" y2="${sheer(x) - 28}"/>`)
  .join('');

/** Sky, sea and the boat's hull, cabin and deck: shared with the downwind picture. */
export const boatBase = `
<defs>
  <linearGradient id="p-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3f4"/><stop offset="1" stop-color="#e3f6fd"/></linearGradient>
  <clipPath id="p-above"><rect x="0" y="0" width="800" height="560"/></clipPath>
  <clipPath id="p-below"><rect x="0" y="560" width="800" height="200"/></clipPath>
</defs>
<rect width="800" height="740" fill="url(#p-sky)"/>
<circle cx="700" cy="92" r="40" fill="#ffd54a"/><circle cx="700" cy="92" r="54" fill="#ffd54a" opacity=".25"/>
${cloud(140, 120, 1.2)}${cloud(590, 200, 0.8)}${cloud(250, 60, 0.7)}
${gull(90, 250)}${gull(130, 230)}${gull(640, 300)}
<rect x="0" y="556" width="800" height="184" fill="#bfe6f7"/>

<path class="t-keel" d="M372 584 L458 584 L446 690 Q420 702 392 690 Z" fill="#3d4f5c" stroke="#22303a" stroke-width="2.5" stroke-linejoin="round"/>
<path class="t-rudder" d="M186 566 L216 572 L212 656 Q200 664 190 656 Z" fill="#3d4f5c" stroke="#22303a" stroke-width="2.5" stroke-linejoin="round"/>
<path class="t-hull" d="${HULL}" fill="#c0392b" clip-path="url(#p-below)"/>
<path class="water" d="${wave(560)}" fill="#1e88c9" opacity=".5"/>
<path class="t-hull" d="${HULL}" fill="#fbfbf7" stroke="#22364a" stroke-width="2.5" stroke-linejoin="round" clip-path="url(#p-above)"/>
<path d="M124 512 L690 490" stroke="#1d4e89" stroke-width="6" stroke-linecap="round"/>
<g class="t-waterline" stroke="#12263a" stroke-width="3" stroke-dasharray="9 6" fill="none"><path d="M161 560 H623"/><path d="M623 560 H772"/></g>
<path class="t-transom" d="M118 500 L160 560" stroke="#22364a" stroke-width="4" stroke-linecap="round"/>
<ellipse class="t-bow zone" cx="652" cy="512" rx="62" ry="50"/>
<ellipse class="t-stern zone" cx="158" cy="522" rx="58" ry="48"/>

<g class="t-cabin"><path d="M300 493 L328 472 L505 466 L545 485 Z" fill="#eef2f5" stroke="#22364a" stroke-width="2.5" stroke-linejoin="round"/>
  <rect x="345" y="475" width="42" height="11" rx="5" fill="#3f6ea6"/><rect x="440" y="472" width="46" height="11" rx="5" fill="#3f6ea6"/></g>
<rect class="t-cockpit zone" x="150" y="462" width="152" height="40" rx="14"/>
<path class="t-cockpit" d="M152 499 L166 487 L286 483 L300 493" fill="#dfe6ec" stroke="#22364a" stroke-width="2.5" stroke-linejoin="round"/>
<path class="t-deck" d="M118 500 L700 478" stroke="#c8954f" stroke-width="6" stroke-linecap="round"/>
`;

/** Guard rails, pulpit, pushpit and tiller: shared with the downwind picture. */
export const boatRails = `
<g class="t-stanchions" stroke="#7d8b99" stroke-width="3" stroke-linecap="round">${stanchions}</g>
<g class="t-lifelines" stroke="#7d8b99" stroke-width="1.8"><line x1="170" y1="${sheer(170) - 28}" x2="645" y2="${sheer(645) - 28}"/><line x1="170" y1="${sheer(170) - 14}" x2="645" y2="${sheer(645) - 14}"/></g>
<path class="t-pulpit" d="M645 480 V452 L688 449 L697 478 M645 466 L692 463" fill="none" stroke="#7d8b99" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>
<path class="t-pushpit" d="M124 500 V470 L170 469 V498 M124 485 H170" fill="none" stroke="#7d8b99" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>
<path class="t-tiller" d="M200 497 L258 473" stroke="#9c6428" stroke-width="7" stroke-linecap="round"/>
`;

const art = `${boatBase}
<path class="t-backstay" d="M420 58 L122 499" stroke="#33475b" stroke-width="2.2"/>
<path class="t-forestay" d="M422 100 L694 479" stroke="#33475b" stroke-width="2.2"/>
<path class="t-mainsail" d="M416 72 L416 416 L226 416 Q306 236 416 72 Z" fill="#ffffff" stroke="#8aa2b8" stroke-width="2.5" stroke-linejoin="round"/>
<g stroke="#c9d6e2" stroke-width="1.5"><path d="M416 150 L366 150"/><path d="M416 236 L316 236"/><path d="M416 322 L270 322"/></g>
<g stroke="#e4572e" stroke-width="4" stroke-linecap="round"><path d="M363 155 L398 151"/><path d="M314 240 L364 235"/><path d="M268 327 L318 322"/></g>
<path d="M352 372 l26 -34 l10 34 Z" fill="#e4572e"/>
<path class="t-jib" d="M438 124 L682 465 L442 447 Q434 290 438 124 Z" fill="#ffd166" stroke="#c9962b" stroke-width="2.5" stroke-linejoin="round"/>
<g stroke="#e9b949" stroke-width="1.5"><path d="M437 230 L514 230"/><path d="M437 340 L592 340"/></g>

<g class="t-shrouds" stroke="#33475b" stroke-width="2.2" fill="none"><path d="M419 100 L402 268 L398 489"/><path d="M418 270 L407 489"/></g>
<path class="t-spreaders" d="M420 268 L400 268" stroke="#5c6b7a" stroke-width="6" stroke-linecap="round"/>
<rect class="t-mast" x="416" y="58" width="8" height="412" rx="2" fill="#a7b3bf" stroke="#4c5d6e" stroke-width="2"/>
<path d="M421 58 V38 L447 45 L421 52" fill="#e4572e" stroke="#4c5d6e" stroke-width="1.5" stroke-linejoin="round"/>
<rect class="t-boom" x="212" y="418" width="207" height="8" rx="4" fill="#a7b3bf" stroke="#4c5d6e" stroke-width="2"/>
<path d="M380 426 L418 466" stroke="#7b2cbf" stroke-width="2.5"/>
<path d="M250 426 L246 490 M258 426 L254 490" stroke="#1d6fb8" stroke-width="2"/>
${boatRails}
<path d="M706 478 H772 M452 696 H772" stroke="#12263a" stroke-width="1.6" stroke-dasharray="5 6"/>
${dimV(752, 480, 557, 't-freeboard')}
${dimV(752, 563, 694, 't-draft')}
`;

export const profile: Scene = {
  id: 'profile',
  size: [800, 740],
  art,
  spots: {
    bow: [655, 514], stern: [172, 522], hull: [480, 530], deck: [585, 482], keel: [418, 640], rudder: [201, 622],
    mast: [420, 180], boom: [300, 422], mainsail: [350, 330], jib: [520, 380], forestay: [585, 327], backstay: [250, 307],
    cockpit: [274, 488], tiller: [234, 483], cabin: [470, 477], transom: [139, 530], shrouds: [400, 385], spreaders: [404, 268],
    pulpit: [672, 450], pushpit: [146, 469], lifelines: [490, 458], stanchions: [610, 468],
    waterline: [700, 560], freeboard: [752, 519], draft: [752, 628],
  },
};
