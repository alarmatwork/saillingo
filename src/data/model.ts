// The language-independent course content: which terms exist, how they are
// grouped into topics and lessons, and which picture (scene) they live on.
// Names and explanations live in the language packs (src/i18n).
import type { SceneId } from '../scenes/types.ts';

export const TERM_IDS = [
  // hull & rig (side view)
  'bow', 'stern', 'hull', 'deck', 'keel', 'rudder',
  'mast', 'boom', 'mainsail', 'jib', 'forestay', 'backstay',
  'cockpit', 'tiller', 'cabin', 'transom', 'shrouds', 'spreaders',
  'pulpit', 'pushpit', 'lifelines', 'stanchions', 'waterline', 'freeboard', 'draft',
  // sails & lines
  'head', 'tack', 'clew', 'luff', 'leech', 'foot',
  'battens', 'reefpoints', 'telltales', 'gooseneck', 'toppinglift',
  'halyard', 'mainsheet', 'jibsheet', 'vang', 'outhaul',
  // deck & gear (top view)
  'port', 'starboard', 'beam', 'length', 'foredeck', 'anchor',
  'hatch', 'companionway', 'winch', 'cleat', 'traveler', 'fender', 'mooringline',
  // wind & points of sail
  'wind', 'windward', 'leeward', 'porttack', 'starboardtack', 'nogo',
  'closehauled', 'beamreach', 'broadreach', 'running', 'tacking', 'gybing',
  // who gives way?
  'rovertaking', 'rpowersail', 'rcrossing', 'rheadon', 'rporttack', 'rwindward', 'rnarrow',
  // advanced: anchoring & harbour
  'anchorchain', 'fluke', 'windlass', 'anchorball', 'seabed', 'depth',
  'quay', 'bollard', 'lighthouse', 'breakwater', 'buoy',
  // advanced: spinnaker & rig details
  'spinnaker', 'spinnakerpole', 'guy', 'spinsheet',
  'masthead', 'windindicator', 'runningbackstays', 'boomend',
  // advanced: fittings
  'block', 'shackle', 'turnbuckle', 'carabiner', 'clutch', 'winchhandle', 'fairlead', 'tackle',
  // advanced: safety equipment
  'lifejacket', 'lifebuoy', 'harness', 'liferaft', 'flare', 'extinguisher', 'firstaid', 'vhf',
  // signals: navigation lights (sectors)
  'mastheadlight', 'sidelights', 'sternlight', 'allroundlight',
  // signals: what a vessel shows at night
  'nsailing', 'npower', 'nanchor', 'naground', 'nrestricted', 'nnotcommand', 'nfishing', 'ntowing',
  // signals: day shapes
  'danchor', 'daground', 'dnotcommand', 'drestricted', 'dfishing', 'dmotorsailing', 'ddistress',
  // signals: code flags
  'fa', 'fl', 'fo', 'fnc', 'fb', 'fu', 'fv', 'fw',
  // signals: the same vessel by night and by day
  'canchor', 'caground', 'cnotcommand', 'crestricted', 'cfishing', 'ctrawling', 'cdraught',
  // light characters of sea marks
  'lfixed', 'locc', 'liso', 'lfl', 'llfl', 'lgrfl', 'lq', 'lgrq',
  // buoys and beacons, IALA region A
  'bport', 'bstarboard', 'bsafewater', 'bisolated', 'bspecial', 'bnorth', 'beast', 'bsouth', 'bwest',
] as const;
export type TermId = (typeof TERM_IDS)[number];

/**
 * Topics from everyday basics to what is needed for the boat exam.
 * New players start with the first START_OPEN topics open; finishing a topic
 * opens the next one (any topic can also be opened by hand).
 */
export const TOPICS = [
  { id: 'hull', scene: 'profile', typing: true },
  { id: 'deck', scene: 'deck', typing: true },
  { id: 'sails', scene: 'sails', typing: true },
  { id: 'wind', scene: 'wind', typing: true },
  { id: 'rightofway', scene: 'rightofway', typing: false },
  { id: 'safety', scene: 'safety', typing: true },
  { id: 'harbour', scene: 'harbour', typing: true },
  { id: 'buoys', scene: 'buoys', typing: false },
  { id: 'hardware', scene: 'hardware', typing: true },
  { id: 'downwind', scene: 'downwind', typing: true },
  { id: 'lights', scene: 'lights', typing: true },
  // the answers in these topics are whole phrases, so they are never asked as typing exercises
  { id: 'nightsignals', scene: 'nightsignals', typing: false },
  { id: 'dayshapes', scene: 'dayshapes', typing: false },
  { id: 'combos', scene: 'combos', typing: false },
  { id: 'lightchars', scene: 'lightchars', typing: true },
  { id: 'flags', scene: 'flags', typing: false },
] as const satisfies readonly { id: string; scene: SceneId; typing: boolean }[];
export const START_OPEN = 3;
export type TopicId = (typeof TOPICS)[number]['id'];

const LESSON_LIST = [
  { id: 'hull1', topic: 'hull', terms: ['bow', 'stern', 'hull', 'deck', 'keel', 'rudder'] },
  { id: 'hull2', topic: 'hull', terms: ['mast', 'boom', 'mainsail', 'jib', 'forestay', 'backstay'] },
  { id: 'hull3', topic: 'hull', terms: ['cockpit', 'tiller', 'cabin', 'transom', 'shrouds', 'spreaders'] },
  { id: 'hull4', topic: 'hull', terms: ['pulpit', 'pushpit', 'lifelines', 'stanchions', 'waterline', 'freeboard', 'draft'] },
  { id: 'sails1', topic: 'sails', terms: ['head', 'tack', 'clew', 'luff', 'leech', 'foot'] },
  { id: 'sails2', topic: 'sails', terms: ['battens', 'reefpoints', 'telltales', 'gooseneck', 'toppinglift'] },
  { id: 'sails3', topic: 'sails', terms: ['halyard', 'mainsheet', 'jibsheet', 'vang', 'outhaul'] },
  { id: 'deck1', topic: 'deck', terms: ['port', 'starboard', 'beam', 'length', 'foredeck', 'anchor'] },
  { id: 'deck2', topic: 'deck', terms: ['hatch', 'companionway', 'winch', 'cleat', 'traveler', 'fender', 'mooringline'] },
  { id: 'wind1', topic: 'wind', terms: ['wind', 'windward', 'leeward', 'porttack', 'starboardtack', 'nogo'] },
  { id: 'wind2', topic: 'wind', terms: ['closehauled', 'beamreach', 'broadreach', 'running', 'tacking', 'gybing'] },
  { id: 'row1', topic: 'rightofway', terms: ['rovertaking', 'rpowersail', 'rcrossing', 'rheadon'] },
  { id: 'row2', topic: 'rightofway', terms: ['rporttack', 'rwindward', 'rnarrow'] },
  { id: 'harbour1', topic: 'harbour', terms: ['anchorchain', 'fluke', 'windlass', 'anchorball', 'seabed', 'depth'] },
  { id: 'harbour2', topic: 'harbour', terms: ['quay', 'bollard', 'lighthouse', 'breakwater', 'buoy'] },
  { id: 'downwind1', topic: 'downwind', terms: ['spinnaker', 'spinnakerpole', 'guy', 'spinsheet'] },
  { id: 'downwind2', topic: 'downwind', terms: ['masthead', 'windindicator', 'runningbackstays', 'boomend'] },
  { id: 'hardware1', topic: 'hardware', terms: ['block', 'shackle', 'turnbuckle', 'carabiner'] },
  { id: 'hardware2', topic: 'hardware', terms: ['clutch', 'winchhandle', 'fairlead', 'tackle'] },
  { id: 'safety1', topic: 'safety', terms: ['lifejacket', 'lifebuoy', 'harness', 'liferaft'] },
  { id: 'safety2', topic: 'safety', terms: ['flare', 'extinguisher', 'firstaid', 'vhf'] },
  { id: 'lights1', topic: 'lights', terms: ['mastheadlight', 'sidelights', 'sternlight', 'allroundlight'] },
  { id: 'night1', topic: 'nightsignals', terms: ['nsailing', 'npower', 'nanchor', 'naground'] },
  { id: 'night2', topic: 'nightsignals', terms: ['nnotcommand', 'nrestricted', 'nfishing', 'ntowing'] },
  { id: 'day1', topic: 'dayshapes', terms: ['danchor', 'daground', 'dnotcommand', 'drestricted'] },
  { id: 'day2', topic: 'dayshapes', terms: ['dfishing', 'dmotorsailing', 'ddistress'] },
  { id: 'combo1', topic: 'combos', terms: ['canchor', 'caground', 'cnotcommand', 'crestricted'] },
  { id: 'combo2', topic: 'combos', terms: ['cfishing', 'ctrawling', 'cdraught'] },
  { id: 'chars1', topic: 'lightchars', terms: ['lfixed', 'locc', 'liso', 'lfl'] },
  { id: 'chars2', topic: 'lightchars', terms: ['llfl', 'lgrfl', 'lq', 'lgrq'] },
  { id: 'buoys1', topic: 'buoys', terms: ['bport', 'bstarboard', 'bsafewater', 'bisolated', 'bspecial'] },
  { id: 'buoys2', topic: 'buoys', terms: ['bnorth', 'beast', 'bsouth', 'bwest'] },
  { id: 'flags1', topic: 'flags', terms: ['fa', 'fl', 'fo', 'fnc'] },
  { id: 'flags2', topic: 'flags', terms: ['fb', 'fu', 'fv', 'fw'] },
] as const satisfies readonly { id: string; topic: TopicId; terms: readonly TermId[] }[];
export type Lesson = (typeof LESSON_LIST)[number];
const topicIndex = (id: TopicId) => TOPICS.findIndex((t) => t.id === id);
/** All lessons in topic order, so lesson numbers run from basic to advanced. */
export const LESSONS: readonly Lesson[] = [...LESSON_LIST].sort((a, b) => topicIndex(a.topic) - topicIndex(b.topic));
export type LessonId = Lesson['id'];

/**
 * Categories for "tick all that apply" questions.
 * `avoid` lists borderline terms that are never offered as wrong options.
 */
export const GROUPS = [
  { id: 'standing', terms: ['forestay', 'backstay', 'shrouds', 'runningbackstays'], avoid: ['spreaders', 'mast', 'lifelines', 'masthead'] },
  { id: 'running', terms: ['halyard', 'mainsheet', 'jibsheet', 'vang', 'outhaul', 'toppinglift', 'guy', 'spinsheet'], avoid: ['mooringline', 'traveler', 'spinnakerpole'] },
  { id: 'underwater', terms: ['keel', 'rudder'], avoid: ['hull', 'draft', 'waterline', 'anchor'] },
  { id: 'corners', terms: ['head', 'tack', 'clew'], avoid: [] },
  { id: 'edges', terms: ['luff', 'leech', 'foot'], avoid: [] },
  { id: 'rails', terms: ['pulpit', 'pushpit', 'lifelines', 'stanchions'], avoid: [] },
  { id: 'measures', terms: ['beam', 'length', 'draft', 'freeboard'], avoid: ['waterline'] },
  { id: 'points', terms: ['closehauled', 'beamreach', 'broadreach', 'running'], avoid: ['nogo', 'porttack', 'starboardtack'] },
  { id: 'groundtackle', terms: ['anchorchain', 'fluke', 'windlass'], avoid: ['anchorball', 'seabed', 'depth'] },
  { id: 'lifesaving', terms: ['lifejacket', 'lifebuoy', 'liferaft'], avoid: ['harness'] },
  { id: 'cardinal', terms: ['bnorth', 'beast', 'bsouth', 'bwest'], avoid: [] },
] as const satisfies readonly { id: string; terms: readonly TermId[]; avoid: readonly TermId[] }[];
export type GroupId = (typeof GROUPS)[number]['id'];

/** Lights (or groups of lights) that can be listed under a night signal. */
export const LIGHT_IDS = [
  'masthead', 'masthead2', 'sides', 'stern', 'towing', 'anchorOne', 'anchorFwdAft',
  'redRed', 'redWhiteRed', 'redOverWhite', 'movingMasthead', 'movingSidesStern', 'greenOverWhite', 'redRedRed',
] as const;
export type LightId = (typeof LIGHT_IDS)[number];

/** colours of the dots drawn in front of each light in the list: w(hite), r(ed), g(reen), y(ellow) */
export const LIGHT_COLORS: Record<LightId, string> = {
  masthead: 'w', masthead2: 'ww', sides: 'rg', stern: 'w', towing: 'y', anchorOne: 'w', anchorFwdAft: 'ww',
  redRed: 'rr', redWhiteRed: 'rwr', redOverWhite: 'rw', movingMasthead: 'w', movingSidesStern: 'rgw',
  greenOverWhite: 'gw', redRedRed: 'rrr',
};

/** Which lights each night-signal picture shows (COLREG rules 23-30). */
export const LIGHTS_SHOWN: Partial<Record<TermId, LightId[]>> = {
  nsailing: ['sides', 'stern'],
  npower: ['masthead', 'sides', 'stern'],
  nanchor: ['anchorOne'],
  naground: ['redRed', 'anchorFwdAft'],
  nnotcommand: ['redRed', 'movingSidesStern'],
  nrestricted: ['redWhiteRed', 'movingMasthead', 'movingSidesStern'],
  nfishing: ['redOverWhite', 'movingSidesStern'],
  ntowing: ['masthead2', 'sides', 'stern', 'towing'],
  canchor: ['anchorOne'],
  caground: ['redRed', 'anchorFwdAft'],
  cnotcommand: ['redRed', 'movingSidesStern'],
  crestricted: ['redWhiteRed', 'movingMasthead', 'movingSidesStern'],
  cfishing: ['redOverWhite', 'movingSidesStern'],
  ctrawling: ['greenOverWhite', 'movingSidesStern'],
  cdraught: ['redRedRed', 'masthead', 'sides', 'stern'],
};

const lessonByTerm = new Map<TermId, Lesson>();
for (const l of LESSONS) for (const t of l.terms) lessonByTerm.set(t, l);

export function lessonOf(term: TermId): Lesson {
  return lessonByTerm.get(term)!;
}
export function sceneOfTopic(topic: TopicId): SceneId {
  return TOPICS.find((t) => t.id === topic)!.scene;
}
export function sceneOf(term: TermId): SceneId {
  return sceneOfTopic(lessonOf(term).topic);
}
/** "Who gives way?" situations get their own kind of exercise */
export function isSituation(term: TermId): boolean {
  return lessonOf(term).topic === 'rightofway';
}
/** false for topics whose answers are phrases too long to type */
export function typingAllowed(term: TermId): boolean {
  return TOPICS.find((t) => t.id === lessonOf(term).topic)!.typing;
}
export function termsOfTopic(topic: TopicId): TermId[] {
  return LESSONS.filter((l) => l.topic === topic).flatMap((l) => [...l.terms]);
}
