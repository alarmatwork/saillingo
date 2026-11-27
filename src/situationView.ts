import type { TermId } from './data/model.ts';
import { SITUATIONS, SIT_H, SIT_W } from './scenes/situations.ts';

export type Choice = 'a' | 'b' | 'both';

export interface SituationHandle {
  el: HTMLElement;
  /** marks the boat(s) that give way; `chosen` (if wrong) is marked red */
  reveal(chosen?: Choice): void;
}

/**
 * One "who gives way?" situation, large. With `onChoose` both boats can be
 * tapped; with `mark` the boat that gives way is shown straight away.
 */
export function situationView(term: TermId, o: { mark?: boolean; onChoose?: (c: Choice) => void } = {}): SituationHandle {
  const s = SITUATIONS[term]!;
  const pin = (id: 'a' | 'b', [x, y]: [number, number]) =>
    `<g class="pin" data-id="${id}" transform="translate(${x} ${y})"${o.onChoose ? ' tabindex="0" role="button"' : ''}>
      <circle class="hit" r="78"/><circle class="ring" r="72"/></g>`;
  const el = document.createElement('div');
  el.className = 'scene-wrap situation';
  el.style.setProperty('--ratio', String(SIT_W / SIT_H));
  el.innerHTML = `<svg class="scene" viewBox="0 0 ${SIT_W} ${SIT_H}" xmlns="http://www.w3.org/2000/svg">${s.art}${pin('a', s.a)}${pin('b', s.b)}</svg>`;
  const set = (id: 'a' | 'b', state: string) => el.querySelector(`.pin[data-id="${id}"]`)!.setAttribute('class', `pin ${state}`);
  const handle: SituationHandle = {
    el,
    reveal(chosen) {
      for (const id of ['a', 'b'] as const) {
        const gives = s.giveway === id || s.giveway === 'both';
        if (gives) set(id, 'ok');
        else if (chosen === id) set(id, 'bad');
      }
    },
  };
  if (o.mark) for (const id of ['a', 'b'] as const) if (s.giveway === id || s.giveway === 'both') set(id, 'target');
  if (o.onChoose) {
    el.querySelectorAll<SVGGElement>('.pin').forEach((g) => {
      const fire = () => o.onChoose!(g.dataset.id as Choice);
      g.addEventListener('click', fire);
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fire();
        }
      });
    });
  }
  return handle;
}

export const givesWay = (term: TermId) => SITUATIONS[term]!.giveway;
