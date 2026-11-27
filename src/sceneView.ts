import type { TermId } from './data/model.ts';
import { DETAILS } from './scenes/details.ts';
import type { Scene } from './scenes/types.ts';

export interface PinSpec {
  id: TermId;
  /** target = pulsing ring around the part being asked about */
  state?: 'target' | 'sel' | 'ok' | 'bad';
}

export interface SceneOptions {
  highlight?: TermId[];
  pins?: PinSpec[];
  onPin?: (id: TermId) => void;
  /** smaller dots, for the explore view where all dots are shown at once */
  dense?: boolean;
  /** show this term's close-up drawing (if it has one) in a magnifier circle */
  detail?: TermId;
}

export interface SceneHandle {
  el: HTMLElement;
  highlight(ids: TermId[]): void;
  setPin(id: TermId, state: PinSpec['state'] | ''): void;
  /** shows (or with no argument hides) a term's close-up */
  detail(id?: TermId): void;
}

/**
 * The magnifier: a circle in the corner furthest from the part, joined to it by
 * a line, holding the 200 x 200 close-up drawing.
 */
function inset(scene: Scene, id: TermId): string {
  const art = DETAILS[id];
  const spot = scene.spots[id];
  if (!art || !spot) return '';
  const [w, hgt] = scene.size;
  const R = 122, pad = 18;
  const cx = spot[0] < w / 2 ? w - R - pad : R + pad;
  const cy = spot[1] < hgt / 2 ? hgt - R - pad : R + pad;
  return `<line class="lead" x1="${spot[0]}" y1="${spot[1]}" x2="${cx}" y2="${cy}"/>
    <circle class="lens" cx="${cx}" cy="${cy}" r="${R + 5}"/>
    <svg x="${cx - R}" y="${cy - R}" width="${2 * R}" height="${2 * R}" viewBox="0 0 200 200"><defs><clipPath id="lens-clip"><circle cx="100" cy="100" r="100"/></clipPath></defs><g clip-path="url(#lens-clip)">${art}</g></svg>`;
}

/** Renders a picture with optional highlighted parts and tappable dots. */
export function sceneView(scene: Scene, o: SceneOptions = {}): SceneHandle {
  const [w, hgt] = scene.size;
  const r = o.dense ? 11 : 15;
  const pins = (o.pins ?? [])
    .map((p) => {
      const s = scene.spots[p.id];
      if (!s) return '';
      const act = o.onPin ? ' tabindex="0" role="button"' : '';
      return `<g class="pin ${p.state ?? ''}" data-id="${p.id}" transform="translate(${s[0]} ${s[1]})"${act}><circle class="hit" r="${o.dense ? 24 : 40}"/><circle class="ring" r="${r + 11}"/><circle class="dot" r="${r}"/></g>`;
    })
    .join('');
  const el = document.createElement('div');
  el.className = 'scene-wrap';
  el.style.setProperty('--ratio', String(w / hgt));
  el.innerHTML = `<svg class="scene" viewBox="0 0 ${w} ${hgt}" xmlns="http://www.w3.org/2000/svg" aria-hidden="${o.onPin ? 'false' : 'true'}">${scene.art}<g class="pins">${pins}</g><g class="inset">${o.detail ? inset(scene, o.detail) : ''}</g></svg>`;

  const pinEl = (id: TermId) => el.querySelector<SVGGElement>(`.pin[data-id="${id}"]`);
  const handle: SceneHandle = {
    el,
    highlight(ids) {
      el.querySelectorAll('.hl').forEach((e) => e.classList.remove('hl'));
      for (const id of ids) el.querySelectorAll(`.t-${id}`).forEach((e) => e.classList.add('hl'));
    },
    setPin(id, state) {
      const g = pinEl(id);
      if (g) g.setAttribute('class', `pin ${state ?? ''}`);
    },
    detail(id) {
      el.querySelector('.inset')!.innerHTML = id ? inset(scene, id) : '';
    },
  };
  if (o.highlight) handle.highlight(o.highlight);
  if (o.onPin) {
    el.querySelectorAll<SVGGElement>('.pin').forEach((g) => {
      const fire = () => o.onPin!(g.dataset.id as TermId);
      g.addEventListener('click', fire);
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          fire();
        }
      });
    });
  }
  return handle;
}
