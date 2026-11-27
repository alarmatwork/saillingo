import type { Scene, SceneId } from './types.ts';
import { profile } from './profile.ts';
import { sails } from './sails.ts';
import { deck } from './deck.ts';
import { wind } from './wind.ts';
import { harbour } from './harbour.ts';
import { downwind } from './downwind.ts';
import { hardware, safety } from './catalog.ts';
import { situationsScene } from './situations.ts';
import { LESSONS } from '../data/model.ts';
import { buoys, combos, dayshapes, flags, lightchars, lights, nightsignals } from './signals.ts';

export const SCENES: Record<SceneId, Scene> = { profile, sails, deck, wind, harbour, downwind, hardware, safety, lights, nightsignals, dayshapes, flags, combos, lightchars, buoys,
  rightofway: situationsScene(LESSONS.filter((l) => l.topic === 'rightofway').flatMap((l) => [...l.terms])) };
export type { Scene, SceneId };
