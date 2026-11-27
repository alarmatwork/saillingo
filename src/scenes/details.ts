// Close-up drawings for parts that are too small to make out on the main picture.
// Each one is drawn in a 200 x 200 box and shown in a round "magnifier" next to
// the part. To add one: add an entry here under the term's id.
import type { TermId } from '../data/model.ts';

const SKY = '<rect width="200" height="200" fill="#cfe8f6"/>';
const DECK = '<rect y="150" width="200" height="50" fill="#dcb67a"/><path d="M0 150 H200" stroke="#b08a52" stroke-width="3"/>';
const ROPE = '#e3c074', STEEL = '#8a97a5', DARK = '#33414d', LIGHT = '#c3ced8';

export const DETAILS: Partial<Record<TermId, string>> = {
  windlass: `${SKY}${DECK}
    <path d="M200 116 L130 80 A36 36 0 0 0 64 100 V150" fill="none" stroke="${DARK}" stroke-width="11" stroke-dasharray="13 6" stroke-linecap="round"/>
    <rect x="56" y="122" width="92" height="30" rx="7" fill="${STEEL}" stroke="${DARK}" stroke-width="3"/>
    <circle cx="100" cy="100" r="30" fill="${LIGHT}" stroke="${DARK}" stroke-width="3"/>
    <path d="M100 74 V126 M74 100 H126 M82 82 L118 118 M118 82 L82 118" stroke="${STEEL}" stroke-width="4"/>
    <circle cx="100" cy="100" r="9" fill="${DARK}"/>`,

  gooseneck: `${SKY}
    <path d="M0 0 H118 V86 H0 Z" fill="#ffffff" stroke="#8aa2b8" stroke-width="2"/>
    <rect x="122" y="0" width="30" height="200" fill="#a7b3bf" stroke="#4c5d6e" stroke-width="3"/>
    <rect x="0" y="92" width="98" height="22" rx="5" fill="#a7b3bf" stroke="#4c5d6e" stroke-width="3"/>
    <path d="M94 96 H112 V110 H94" fill="none" stroke="${DARK}" stroke-width="7" stroke-linejoin="round"/>
    <rect x="106" y="84" width="18" height="38" rx="4" fill="${DARK}"/>
    <circle cx="112" cy="103" r="6" fill="${LIGHT}"/>
    <path d="M36 146 Q72 172 108 146" fill="none" stroke="#ff2d87" stroke-width="4" stroke-linecap="round"/>
    <path d="M108 146 l-14 0 l8 12 Z M36 146 l14 0 l-8 12 Z" fill="#ff2d87"/>`,

  winch: `${SKY}${DECK}
    <path d="M0 136 L72 128" stroke="${ROPE}" stroke-width="9" stroke-linecap="round"/>
    <ellipse cx="100" cy="150" rx="40" ry="8" fill="${STEEL}" stroke="${DARK}" stroke-width="3"/>
    <path d="M68 150 L78 66 H122 L132 150 Z" fill="${LIGHT}" stroke="${DARK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M73 128 H127 M75 112 H125 M77 96 H123" stroke="${ROPE}" stroke-width="9"/>
    <ellipse cx="100" cy="66" rx="24" ry="7" fill="${STEEL}" stroke="${DARK}" stroke-width="3"/>
    <path d="M100 62 L166 48" stroke="${STEEL}" stroke-width="9" stroke-linecap="round"/>
    <rect x="160" y="16" width="14" height="36" rx="6" fill="#d62828" stroke="#7f1d1d" stroke-width="2"/>`,

  cleat: `${SKY}${DECK}
    <rect x="76" y="124" width="14" height="28" fill="${STEEL}" stroke="${DARK}" stroke-width="3"/><rect x="110" y="124" width="14" height="28" fill="${STEEL}" stroke="${DARK}" stroke-width="3"/>
    <path d="M26 112 Q100 96 174 112 Q176 126 162 128 H38 Q24 126 26 112 Z" fill="#eef2f5" stroke="${DARK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M0 170 L70 136 L160 106 M158 106 Q182 114 156 130 L46 106 Q20 114 46 130 L150 110" fill="none" stroke="${ROPE}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,

  // the steering wheel seen from behind, standing on its pedestal in the cockpit
  wheel: `${SKY}<rect y="168" width="200" height="32" fill="#b9935c"/><path d="M0 168 H200" stroke="#7a5a30" stroke-width="3"/>
    <path d="M88 170 L92 104 H108 L112 170 Z" fill="${STEEL}" stroke="${DARK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M100 30 V154 M38 92 H162 M56 48 L144 136 M144 48 L56 136" stroke="${LIGHT}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="100" cy="92" r="62" fill="none" stroke="${DARK}" stroke-width="11"/>
    <circle cx="100" cy="92" r="62" fill="none" stroke="#5a6a78" stroke-width="3" stroke-dasharray="2 7"/>
    <circle cx="100" cy="92" r="14" fill="${STEEL}" stroke="${DARK}" stroke-width="3"/><circle cx="100" cy="92" r="5" fill="${DARK}"/>`,

  // a delta anchor stowed in the bow roller, seen from the side
  anchor: `${SKY}<rect y="168" width="200" height="32" fill="#9fd0ea"/>
    <path d="M0 100 H92 L120 106 L104 176 H0 Z" fill="#fbfbf7" stroke="#22364a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M0 100 H92 L120 106" fill="none" stroke="#b08a52" stroke-width="4"/>
    <path d="M6 88 L66 94" stroke="${DARK}" stroke-width="8" stroke-dasharray="10 5" stroke-linecap="round"/>
    <rect x="62" y="84" width="58" height="16" rx="5" fill="${STEEL}" stroke="${DARK}" stroke-width="3"/>
    <circle cx="112" cy="96" r="8" fill="${LIGHT}" stroke="${DARK}" stroke-width="3"/>
    <path d="M66 90 L118 96 L140 136" fill="none" stroke="${DARK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M140 132 L118 166 L144 158 L170 164 Z" fill="${STEEL}" stroke="${DARK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M140 134 L144 158" stroke="${DARK}" stroke-width="4" stroke-linecap="round"/>`,

  // a fender hanging over the side between the hull and the quay (quay on the left, as on the deck picture)
  fender: `${SKY}<rect y="150" width="200" height="50" fill="#9fd0ea"/><g transform="translate(200 0) scale(-1 1)">
    <path d="M150 64 H200 V200 H150 Z" fill="#b08a5c" stroke="#7a5a36" stroke-width="3"/>
    <path d="M150 88 H200 M150 112 H200 M150 136 H200 M150 160 H200" stroke="#7a5a36" stroke-width="2"/>
    <path d="M0 40 H72 Q100 40 96 70 L84 172 Q80 190 60 190 H0 Z" fill="#fbfbf7" stroke="#22364a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M0 40 H72 Q90 40 94 52" fill="none" stroke="#b08a52" stroke-width="5"/>
    <rect x="60" y="8" width="7" height="34" fill="${STEEL}" stroke="${DARK}" stroke-width="2"/>
    <path d="M0 14 H96" stroke="${STEEL}" stroke-width="3"/>
    <path d="M64 16 Q96 22 120 66" fill="none" stroke="${ROPE}" stroke-width="5" stroke-linecap="round"/>
    <rect x="102" y="66" width="38" height="92" rx="19" fill="#ffffff" stroke="#1565c0" stroke-width="4"/>
    <path d="M104 84 H138 M104 140 H138" stroke="#1565c0" stroke-width="3"/>
    <circle cx="121" cy="68" r="4" fill="#1565c0"/></g>`,

  fluke: `<rect width="200" height="200" fill="#9fd0ea"/><path d="M0 150 q25 -10 50 0 t50 0 t50 0 t50 0 V200 H0 Z" fill="#e2c48d" stroke="#b9975a" stroke-width="3"/>
    <path d="M0 14 L34 44" stroke="${DARK}" stroke-width="9" stroke-dasharray="11 6" stroke-linecap="round"/>
    <circle cx="40" cy="50" r="10" fill="none" stroke="${DARK}" stroke-width="6"/>
    <path d="M46 58 L146 150" stroke="${DARK}" stroke-width="12" stroke-linecap="round"/>
    <path d="M146 150 L64 164 L112 104 Z" fill="#f77f00" stroke="#9a4a00" stroke-width="4" stroke-linejoin="round"/>
    <path d="M146 150 L178 108 L128 110 Z" fill="#f77f00" stroke="#9a4a00" stroke-width="4" stroke-linejoin="round" opacity=".75"/>`,

  windindicator: `${SKY}
    <rect x="90" y="140" width="20" height="60" fill="#a7b3bf" stroke="#4c5d6e" stroke-width="3"/><rect x="80" y="132" width="40" height="12" rx="4" fill="#4c5d6e"/>
    <path d="M100 132 V70" stroke="${DARK}" stroke-width="5"/>
    <path d="M100 120 L52 146 M100 120 L148 146" stroke="${DARK}" stroke-width="4" stroke-linecap="round"/>
    <rect x="42" y="140" width="14" height="14" fill="#d62828"/><rect x="144" y="140" width="14" height="14" fill="#d62828"/>
    <path d="M36 70 H150" stroke="${DARK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M172 70 L142 56 V84 Z" fill="${DARK}"/>
    <path d="M50 70 L28 42 H52 L66 70 L52 98 H28 Z" fill="#e4572e" stroke="#9b1c1c" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="100" cy="70" r="6" fill="${LIGHT}" stroke="${DARK}" stroke-width="3"/>`,

  spreaders: `${SKY}
    <path d="M100 0 L26 92 L50 200 M100 0 L174 92 L150 200" fill="none" stroke="#33475b" stroke-width="3.5"/>
    <rect x="90" y="0" width="20" height="200" fill="#a7b3bf" stroke="#4c5d6e" stroke-width="3"/>
    <path d="M94 104 L28 92 M106 104 L172 92" stroke="#5c6b7a" stroke-width="11" stroke-linecap="round"/>
    <circle cx="26" cy="92" r="7" fill="${LIGHT}" stroke="${DARK}" stroke-width="3"/><circle cx="174" cy="92" r="7" fill="${LIGHT}" stroke="${DARK}" stroke-width="3"/>
    <rect x="84" y="96" width="32" height="16" rx="4" fill="${DARK}"/>`,

  telltales: `<rect width="200" height="200" fill="#ffd166"/><path d="M0 60 H200 M0 150 H200" stroke="#e9b949" stroke-width="3"/>
    <path d="M40 0 L130 200" stroke="#c9962b" stroke-width="6"/>
    <g fill="none" stroke-linecap="round" stroke-width="6"><path d="M70 62 q18 12 36 0 t36 0" stroke="#2e9e4f" opacity=".55"/><path d="M70 50 q18 -10 36 0 t36 0" stroke="#d62828"/>
      <path d="M104 132 q18 12 36 0 t36 0" stroke="#2e9e4f" opacity=".55"/><path d="M104 120 q18 -10 36 0 t36 0" stroke="#d62828"/></g>
    <circle cx="68" cy="52" r="6" fill="#ffffff" stroke="${DARK}" stroke-width="2"/><circle cx="102" cy="122" r="6" fill="#ffffff" stroke="${DARK}" stroke-width="2"/>`,

  reefpoints: `<rect width="200" height="200" fill="#ffffff"/><rect y="84" width="200" height="30" fill="#e3eaf0"/><path d="M0 84 H200 M0 114 H200" stroke="#b9c7d4" stroke-width="2" stroke-dasharray="6 5"/>
    <circle cx="30" cy="99" r="13" fill="#cfe8f6" stroke="${STEEL}" stroke-width="7"/>
    <g fill="none" stroke="${DARK}" stroke-width="5" stroke-linecap="round"><path d="M84 99 q-8 34 6 62"/><path d="M130 99 q-8 34 6 62"/><path d="M176 99 q-8 34 6 62"/></g>
    <g fill="${DARK}"><circle cx="84" cy="99" r="6"/><circle cx="130" cy="99" r="6"/><circle cx="176" cy="99" r="6"/></g>`,

  traveler: `<rect width="200" height="200" fill="#b9935c"/>
    <path d="M90 62 L78 0 M110 62 L122 0" stroke="#1d6fb8" stroke-width="6" stroke-linecap="round"/>
    <rect x="0" y="126" width="200" height="14" fill="${DARK}"/>
    <path d="M0 116 H70 M130 116 H200" stroke="${ROPE}" stroke-width="5"/>
    <rect x="68" y="100" width="64" height="44" rx="8" fill="#d62828" stroke="#7f1d1d" stroke-width="3"/>
    <circle cx="100" cy="80" r="20" fill="${LIGHT}" stroke="${DARK}" stroke-width="3"/><circle cx="100" cy="80" r="6" fill="${DARK}"/>
    <path d="M26 170 H174" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/><path d="M26 170 l14 -9 v18 Z M174 170 l-14 -9 v18 Z" fill="#ffffff"/>`,

  stanchions: `${SKY}<rect y="160" width="200" height="40" fill="#dcb67a"/><path d="M0 160 H200" stroke="#b08a52" stroke-width="3"/>
    <path d="M0 46 H200 M0 100 H200" stroke="#5c6b7a" stroke-width="4"/>
    <rect x="94" y="26" width="12" height="130" rx="4" fill="${STEEL}" stroke="${DARK}" stroke-width="3"/>
    <rect x="80" y="150" width="40" height="14" rx="4" fill="${DARK}"/>
    <circle cx="100" cy="46" r="5" fill="${LIGHT}"/><circle cx="100" cy="100" r="5" fill="${LIGHT}"/>`,

  bollard: `${SKY}<rect y="140" width="200" height="60" fill="#aab4be"/><path d="M0 140 H200" stroke="#5c6b7a" stroke-width="3"/>
    <path d="M68 140 V92 Q68 72 100 72 Q132 72 132 92 V140 Z" fill="#3d4f5c" stroke="#22303a" stroke-width="3"/>
    <rect x="54" y="58" width="92" height="22" rx="11" fill="#22303a"/>
    <ellipse cx="100" cy="116" rx="40" ry="10" fill="none" stroke="${ROPE}" stroke-width="9"/>
    <path d="M138 116 L200 86" stroke="${ROPE}" stroke-width="9" stroke-linecap="round"/>`,

  vang: `${SKY}
    <rect x="150" y="0" width="24" height="200" fill="#a7b3bf" stroke="#4c5d6e" stroke-width="3"/>
    <rect x="0" y="36" width="150" height="18" rx="5" fill="#a7b3bf" stroke="#4c5d6e" stroke-width="3"/>
    <path d="M58 62 L146 172 M68 58 L152 164" stroke="#7b2cbf" stroke-width="5" stroke-linecap="round"/>
    <circle cx="62" cy="60" r="11" fill="${LIGHT}" stroke="${DARK}" stroke-width="3"/><circle cx="148" cy="170" r="11" fill="${LIGHT}" stroke="${DARK}" stroke-width="3"/>
    <rect x="144" y="176" width="14" height="14" rx="3" fill="${DARK}"/>`,
};
