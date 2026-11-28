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
  /**
   * Everyday sailors' words used in the descriptions, explained in a popup when
   * tapped and found by the search. Same id in every language.
   */
  words?: Record<string, GlossaryWord>;
}

export interface GlossaryWord {
  name: string;
  alt?: string[];
  /** the forms that turn into a link in this language's descriptions (lower case), e.g. vaierid, vaiereid */
  forms: string[];
  /**
   * For words that also have an everyday meaning ("ots" is a rope, but also an
   * end): only places written in [brackets] in the texts become links.
   */
  marked?: boolean;
  desc: string;
}

/** A description without its [marks] (see GlossaryWord.marked), for places that show plain text. */
export const plain = (text: string) => text.replace(/\[([^[\]]+)\]/g, '$1');
