// A boat moored stern-to at a quay with her anchor out, seen from the side.
// Water surface at y = 360, seabed at about y = 668.
import type { Scene } from './types.ts';
import { cloud, dimV, gull, wave } from './util.ts';

const seabed = `M0 668 ${'q40 -10 80 0 t80 0 '.repeat(5)}V740 H0 Z`;
const stones = [[0, 340], [0, 400], [0, 460], [0, 520], [0, 580], [0, 640]]
  .map(([, y], i) => `<path d="M0 ${y} H170 M${i % 2 ? 60 : 110} ${y} v60"/>`)
  .join('');

const art = `
<defs>
  <linearGradient id="h-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3f4"/><stop offset="1" stop-color="#e3f6fd"/></linearGradient>
</defs>
<rect width="800" height="740" fill="url(#h-sky)"/>
<circle cx="560" cy="86" r="36" fill="#ffd54a"/><circle cx="560" cy="86" r="50" fill="#ffd54a" opacity=".25"/>
${cloud(180, 90, 1.1)}${cloud(440, 170, 0.7)}${gull(250, 190)}${gull(285, 172)}
<rect x="0" y="356" width="800" height="384" fill="#bfe6f7"/>

<path d="M600 700 Q640 372 690 372 H800 V700 Z" fill="#7f8d9a"/>
<g class="t-breakwater"><path d="M632 372 Q656 322 700 324 L800 318 V372 Z" fill="#9aa5b1" stroke="#5c6b7a" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M660 350 q14 -12 28 0 M704 346 q16 -12 30 0 M750 350 q14 -12 28 0 M682 366 q14 -10 26 0 M730 366 q14 -10 26 0" fill="none" stroke="#5c6b7a" stroke-width="2"/></g>
<g class="t-lighthouse"><path d="M708 100 L640 60 M708 100 L640 140" stroke="#ffe082" stroke-width="14" stroke-linecap="round" opacity=".55"/>
  <path d="M712 322 L720 150 H748 L756 322 Z" fill="#ffffff" stroke="#4c5d6e" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M714.4 270 L716.7 220 H751.3 L753.6 270 Z" fill="#e53935"/><path d="M718.6 180 L720 150 H748 L749.4 180 Z" fill="#e53935"/>
  <rect x="712" y="140" width="44" height="11" rx="3" fill="#33414d"/><rect x="722" y="112" width="24" height="28" fill="#ffe082" stroke="#33414d" stroke-width="2.5"/>
  <path d="M716 112 L734 90 L752 112 Z" fill="#e53935" stroke="#33414d" stroke-width="2" stroke-linejoin="round"/></g>

<g class="t-quay"><path d="M0 300 H170 V700 H0 Z" fill="#aab4be" stroke="#5c6b7a" stroke-width="2.5"/><g stroke="#7d8b99" stroke-width="2" fill="none">${stones}</g>
  <rect x="0" y="290" width="178" height="14" rx="3" fill="#d0d8df" stroke="#5c6b7a" stroke-width="2"/></g>
<g class="t-bollard"><path d="M116 290 V270 Q116 258 128 258 Q140 258 140 270 V290 Z" fill="#3d4f5c" stroke="#22303a" stroke-width="2"/><rect x="109" y="252" width="38" height="10" rx="5" fill="#22303a"/></g>
<path class="t-seabed" d="${seabed}" fill="#e2c48d" stroke="#b9975a" stroke-width="2.5"/>
<path d="M300 690 q6 -30 0 -52 M312 692 q-8 -24 4 -40 M690 690 q8 -28 0 -48" fill="none" stroke="#2e9e4f" stroke-width="4" stroke-linecap="round"/>

<path class="t-anchorchain" d="M438 334 Q444 560 520 648" fill="none" stroke="#3d4f5c" stroke-width="4.5" stroke-dasharray="8 4"/>
<g fill="none" stroke="#22303a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M520 648 L566 654"/><path d="M554 630 Q580 654 554 678"/><circle cx="516" cy="648" r="5" stroke-width="3"/></g>
<g class="t-fluke" fill="#22303a" stroke="#22303a" stroke-width="2" stroke-linejoin="round"><path d="M554 630 l-16 2 l14 14 Z"/><path d="M554 678 l-16 -2 l14 -14 Z"/></g>

<path d="M234 338 Q180 332 132 280" fill="none" stroke="#e8cf8a" stroke-width="3.5"/>
<path d="M318 366 L352 366 L346 420 L324 420 Z" fill="#3d4f5c"/><path d="M254 360 L266 362 L264 398 L256 398 Z" fill="#3d4f5c"/>
<path d="M232 338 L442 330 Q430 356 408 364 Q330 378 250 366 Z" fill="#fbfbf7" stroke="#22364a" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M236 345 L436 337" stroke="#1d4e89" stroke-width="4"/>
<path d="M290 336 L302 322 L372 319 L388 333 Z" fill="#eef2f5" stroke="#22364a" stroke-width="2"/>
<path d="M341 112 L440 330 M341 112 L234 337" stroke="#33475b" stroke-width="1.8"/>
<rect x="338" y="110" width="6" height="212" fill="#a7b3bf" stroke="#4c5d6e" stroke-width="1.5"/>
<rect x="258" y="294" width="82" height="10" rx="5" fill="#1d4e89"/>
<circle class="t-anchorball" cx="390" cy="220" r="12" fill="#111820" stroke="#111820" stroke-width="1"/>
<g class="t-windlass"><rect x="406" y="321" width="24" height="11" rx="3" fill="#6f8192" stroke="#33414d" stroke-width="2"/><circle cx="418" cy="320" r="8" fill="#c3ced8" stroke="#33414d" stroke-width="2"/></g>

<g class="t-buoy"><path d="M506 366 L512 326 H528 L534 366 Z" fill="#e53935" stroke="#7f1d1d" stroke-width="2.5" stroke-linejoin="round"/><path d="M520 326 V308" stroke="#7f1d1d" stroke-width="3"/><rect x="512" y="296" width="16" height="13" fill="#e53935" stroke="#7f1d1d" stroke-width="2"/></g>
<path class="water" d="${wave(360)}" fill="#1e88c9" opacity=".42"/>
<path d="M178 664 H222 M178 362 H222" stroke="#12263a" stroke-width="1.6" stroke-dasharray="5 6"/>
${dimV(200, 364, 662, 't-depth')}
`;

export const harbour: Scene = {
  id: 'harbour',
  size: [800, 740],
  art,
  spots: {
    anchorchain: [462, 526], fluke: [552, 634], windlass: [418, 322], anchorball: [390, 220], seabed: [360, 702], depth: [200, 514],
    quay: [85, 480], bollard: [128, 268], lighthouse: [734, 232], breakwater: [676, 346], buoy: [520, 344],
  },
};
