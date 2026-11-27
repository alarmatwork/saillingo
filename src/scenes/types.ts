import type { TermId } from '../data/model.ts';

export type SceneId = 'profile' | 'sails' | 'deck' | 'wind' | 'harbour' | 'downwind' | 'hardware' | 'safety'
  | 'lights' | 'nightsignals' | 'dayshapes' | 'flags' | 'combos' | 'lightchars' | 'buoys' | 'rightofway';

/**
 * A picture. `art` is SVG markup; every element that belongs to a term carries
 * the class `t-<termId>` so it can be highlighted. `spots` are the positions of
 * the tappable dots, in viewBox units.
 */
export interface Scene {
  id: SceneId;
  size: [number, number];
  art: string;
  spots: Partial<Record<TermId, [number, number]>>;
}
