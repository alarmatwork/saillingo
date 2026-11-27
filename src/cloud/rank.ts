// "TOP x %": where the player's XP stands among everyone who keeps a score.
//
// Signed-in players' XP is stored anonymously in Firestore (scores/<id>: only
// `xp` and `updated`, no names). Counting is done with Firestore's REST count
// query, so players who are not signed in do not need to load Firebase at all.
import { FIREBASE_CONFIG } from './config.ts';

export interface Rank {
  /** e.g. 12 for "TOP 12 %" */
  top: number;
  /** 1 = most XP */
  place: number;
  /** XP of the next player above, or null when this player is first */
  nextXp: number | null;
  /** places gained (positive) or lost since the place before, shown as an arrow */
  change?: number;
  /** players compared with, including this one */
  players: number;
  /** the XP the rank was worked out for */
  xp: number;
  at: number;
}

/** below this many players a percentage says nothing */
export const MIN_PLAYERS = 5;

const endpoint = (what: string) => {
  const c = FIREBASE_CONFIG!;
  return `https://firestore.googleapis.com/v1/projects/${c.projectId}/databases/(default)/documents:${what}?key=${c.apiKey}`;
};
const above = (xp: number) => ({ fieldFilter: { field: { fieldPath: 'xp' }, op: 'GREATER_THAN', value: { integerValue: String(xp) } } });

/** The smallest XP that is still more than this player's: the next place to reach. */
async function nextAbove(xp: number): Promise<number | null> {
  const res = await fetch(endpoint('runQuery'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'scores' }], where: above(xp), orderBy: [{ field: { fieldPath: 'xp' }, direction: 'ASCENDING' }], limit: 1 } }),
  });
  if (!res.ok) throw new Error(`query failed: ${res.status}`);
  const rows = (await res.json()) as { document?: { fields?: { xp?: { integerValue?: string } } } }[];
  const v = rows[0]?.document?.fields?.xp?.integerValue;
  return v === undefined ? null : Number(v);
}

async function count(xpAbove: number | null): Promise<number> {
  const query: Record<string, unknown> = { from: [{ collectionId: 'scores' }] };
  if (xpAbove !== null) query.where = above(xpAbove);
  const res = await fetch(
    endpoint('runAggregationQuery'),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ structuredAggregationQuery: { structuredQuery: query, aggregations: [{ alias: 'n', count: {} }] } }),
    },
  );
  if (!res.ok) throw new Error(`count failed: ${res.status}`);
  const data = (await res.json()) as { result?: { aggregateFields?: { n?: { integerValue?: string } } } }[];
  return Number(data[0]?.result?.aggregateFields?.n?.integerValue ?? 0);
}

/**
 * @param xp       the player's XP
 * @param counted  true when the player's own score is already in the list (signed in)
 */
export async function fetchRank(xp: number, counted: boolean): Promise<Rank | null> {
  if (!FIREBASE_CONFIG) return null;
  const [total, higher, nextXp] = await Promise.all([count(null), count(xp), nextAbove(xp)]);
  const players = total + (counted ? 0 : 1);
  return { top: Math.max(1, Math.ceil(((higher + 1) / players) * 100)), place: higher + 1, nextXp, players, xp, at: Date.now() };
}
