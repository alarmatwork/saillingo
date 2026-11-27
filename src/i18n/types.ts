import type { GroupId, LessonId, LightId, TermId, TopicId } from '../data/model.ts';
import type { enUi } from './en.ts';

/** Every interface text. English is the reference: its keys define what a pack must contain. */
export type UiKey = keyof typeof enUi;

export interface TermText {
  /** the term as the learner should know it */
  name: string;
  /** real synonyms: shown to the learner as "also called" and accepted when typed */
  alt?: string[];
  /** further answers accepted when typed but never shown: spelling variants, singular forms, loose or unverified words */
  accept?: string[];
  /** related words that find this term in the search but are not its name, e.g. the action: "reefing" for reef points */
  find?: string[];
  /** one short sentence explaining what it is - try not to use the name itself */
  desc: string;
}

/**
 * One language. To add a language: copy en.ts, translate it, and register it in
 * index.ts. TypeScript reports every text that is still missing.
 */
export interface LanguagePack {
  /** BCP 47 code, e.g. "et" */
  code: string;
  /** the language's own name, e.g. "Eesti" */
  name: string;
  ui: Record<UiKey, string>;
  topics: Record<TopicId, { name: string; desc: string }>;
  lessons: Record<LessonId, string>;
  /** full question for each "tick all that apply" category */
  groups: Record<GroupId, string>;
  terms: Record<TermId, TermText>;
  /** names of the lights listed under the night signals */
  lights: Record<LightId, string>;
}
