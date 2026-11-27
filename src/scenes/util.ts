/** Closed water shape with a wavy top edge at height y (one wave = 40 units). */
export function wave(y: number, amp = 5, bottom = 760): string {
  let d = `M-80 ${y}`;
  for (let i = 0; i < 24; i++) d += ` q10 ${-amp} 20 0 t20 0`;
  return `${d} V${bottom} H-80Z`;
}

/** Solid arrow head with its tip at (x, y), pointing in direction `angle` (degrees, 0 = right). */
export function arrowHead(x: number, y: number, angle: number, size = 14): string {
  return `<path d="M0 0 L${-size} ${-size / 2} L${-size} ${size / 2}Z" transform="translate(${x} ${y}) rotate(${angle})" stroke="none"/>`;
}

/** Vertical dimension arrow (double headed). */
export function dimV(x: number, y1: number, y2: number, cls: string): string {
  return `<g class="${cls}" stroke="#12263a" fill="#12263a" stroke-width="3" stroke-linecap="round">
    <line x1="${x}" y1="${y1 + 10}" x2="${x}" y2="${y2 - 10}"/>${arrowHead(x, y1, -90)}${arrowHead(x, y2, 90)}</g>`;
}

/** Horizontal dimension arrow (double headed). */
export function dimH(y: number, x1: number, x2: number, cls: string): string {
  return `<g class="${cls}" stroke="#12263a" fill="#12263a" stroke-width="3" stroke-linecap="round">
    <line x1="${x1 + 10}" y1="${y}" x2="${x2 - 10}" y2="${y}"/>${arrowHead(x1, y, 180)}${arrowHead(x2, y, 0)}</g>`;
}

export const cloud = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity=".9"><ellipse cx="0" cy="0" rx="46" ry="16"/><ellipse cx="-18" cy="-12" rx="22" ry="15"/><ellipse cx="14" cy="-16" rx="26" ry="18"/></g>`;

export const gull = (x: number, y: number) =>
  `<path d="M${x} ${y} q7 -8 14 0 q7 -8 14 0" fill="none" stroke="#3b5166" stroke-width="2.5" stroke-linecap="round"/>`;
