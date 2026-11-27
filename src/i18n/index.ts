import type { LanguagePack } from './types.ts';
import { en } from './en.ts';
import { et } from './et.ts';

/**
 * All available languages. To add one:
 *   1. copy en.ts to <code>.ts and translate every text,
 *   2. import it here and add it to this list.
 * Every language can be used both as "I speak" and as "I learn the terms in".
 */
export const LANGS: Record<string, LanguagePack> = Object.fromEntries([en, et].map((l) => [l.code, l]));
export const LANG_LIST: LanguagePack[] = Object.values(LANGS);
export const FALLBACK = en;

/** Best match for the browser's language, e.g. "et-EE" -> "et". */
export function detectLang(preferred: readonly string[]): string {
  for (const p of preferred) {
    const code = p.toLowerCase().split('-')[0];
    if (LANGS[code]) return code;
  }
  return FALLBACK.code;
}
