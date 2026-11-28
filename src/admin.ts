// The numbers behind the admin page (#admin): sign-ups, active players and party
// games, straight from Firestore, plus visits from GoatCounter when its API
// token has been saved. Only the accounts listed as admin in the Firestore
// rules can read these; for everyone else the requests are simply refused.
import { GOATCOUNTER_CODE } from './analytics.ts';
import { FIREBASE_CONFIG } from './cloud/config.ts';

export interface UserRow { created: number; updated: number; xp: number }
export interface GameRow { code: string; created: number; started: boolean; players: number }
export interface Bucket { start: number; label: string; value: number }

const DAY = 86_400_000;
const docs = () => `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG!.projectId}/databases/(default)/documents`;

export class Forbidden extends Error {}
/** The browser never reached GoatCounter: tracker blocking (Safari, Brave, Firefox, ad blockers) or no network. */
export class VisitsBlocked extends Error {}
/** GoatCounter answered, but not with statistics (wrong token, missing "Read statistics", rate limit). */
export class VisitsRefused extends Error {
  status: number;
  constructor(status: number) { super(`GoatCounter: ${status}`); this.status = status; }
}

async function call(url: string, token: string, body?: unknown, method = body ? 'POST' : 'GET'): Promise<unknown> {
  const res = await fetch(url, { method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 403 || res.status === 401) throw new Forbidden();
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res.json();
}

type Value = { integerValue?: string; doubleValue?: number; stringValue?: string };
type Row = { document?: { name: string; fields?: Record<string, Value> } };
const num = (v?: Value) => Number(v?.integerValue ?? v?.doubleValue ?? 0) || 0;
const select = (...fields: string[]) => ({ fields: fields.map((fieldPath) => ({ fieldPath })) });

export async function loadUsers(token: string): Promise<UserRow[]> {
  const rows = (await call(`${docs()}:runQuery`, token, { structuredQuery: { from: [{ collectionId: 'users' }], select: select('created', 'updated', 'xp') } })) as Row[];
  return rows.filter((r) => r.document).map((r) => ({ created: num(r.document!.fields?.created), updated: num(r.document!.fields?.updated), xp: num(r.document!.fields?.xp) }));
}

/** Party games created since `since`, each with its number of players (for the newest 80). */
export async function loadGames(token: string, since: number): Promise<GameRow[]> {
  const rows = (await call(`${docs()}:runQuery`, token, {
    structuredQuery: {
      from: [{ collectionId: 'games' }], select: select('created', 'status'),
      where: { fieldFilter: { field: { fieldPath: 'created' }, op: 'GREATER_THAN_OR_EQUAL', value: { doubleValue: since } } },
      orderBy: [{ field: { fieldPath: 'created' }, direction: 'DESCENDING' }], limit: 1000,
    },
  })) as Row[];
  const games = rows.filter((r) => r.document).map((r) => ({
    code: r.document!.name.split('/').pop()!, created: num(r.document!.fields?.created), started: r.document!.fields?.status?.stringValue === 'run', players: 0,
  }));
  await Promise.all(games.slice(0, 80).map(async (g) => {
    const res = (await call(`${docs()}/games/${g.code}:runAggregationQuery`, token, {
      structuredAggregationQuery: { structuredQuery: { from: [{ collectionId: 'players' }] }, aggregations: [{ alias: 'n', count: {} }] },
    }).catch(() => null)) as { result?: { aggregateFields?: { n?: Value } } }[] | null;
    g.players = num(res?.[0]?.result?.aggregateFields?.n);
  }));
  return games;
}

/** The GoatCounter API token, kept in a document only admins can read, so it follows the admin between devices. */
export async function loadVisitToken(token: string): Promise<string> {
  const doc = (await call(`${docs()}/admin/settings`, token)) as { fields?: Record<string, Value> } | null;
  return doc?.fields?.goatToken?.stringValue ?? '';
}
export const saveVisitToken = (token: string, goatToken: string) =>
  call(`${docs()}/admin/settings`, token, { fields: { goatToken: { stringValue: goatToken } } }, 'PATCH');

export interface Visits {
  byDay: Map<string, number>;
  /** visitors per hour, for each day ("2026-11-27" -> 24 numbers) */
  byHour: Map<string, number[]>;
  total: number;
  events: { name: string; count: number }[];
}
/** Visits per day (pages only) and how often each tracked action happened. */
export async function loadVisits(goatToken: string, since: number, until: number): Promise<Visits> {
  const iso = (t: number) => new Date(Math.floor(t / 3_600_000) * 3_600_000).toISOString();
  let res: Response;
  try {
    res = await fetch(`https://${GOATCOUNTER_CODE}.goatcounter.com/api/v0/stats/hits?start=${iso(since)}&end=${iso(until + 3_600_000)}&limit=100&daily=true`, {
      headers: { authorization: `Bearer ${goatToken}`, 'content-type': 'application/json' },
    });
  } catch {
    throw new VisitsBlocked();
  }
  if (!res.ok) throw new VisitsRefused(res.status);
  const data = (await res.json()) as { hits?: { count: number; event: boolean; path: string; stats?: { day: string; daily: number; hourly?: number[] }[] }[] };
  const byDay = new Map<string, number>();
  const byHour = new Map<string, number[]>();
  let total = 0;
  const events: Visits['events'] = [];
  for (const hit of data.hits ?? []) {
    if (hit.event) {
      events.push({ name: hit.path, count: hit.count });
      continue;
    }
    total += hit.count;
    for (const s of (hit.stats ?? []) as { day: string; daily: number; hourly?: number[] }[]) {
      byDay.set(s.day, (byDay.get(s.day) ?? 0) + (s.daily ?? 0));
      const hours = byHour.get(s.day) ?? new Array<number>(24).fill(0);
      (s.hourly ?? []).forEach((n, i) => { hours[i] += n || 0; });
      byHour.set(s.day, hours);
    }
  }
  events.sort((a, b) => b.count - a.count);
  return { byDay, byHour, total, events };
}

// ---- turning rows into the figures on the page (no network: tested) ------------------

/** The "add to home screen" steps, from the tracked actions (each name may have a /<browser> ending). */
export const INSTALL_STEPS = [
  ['install-note', 'Saw the note'],
  ['install-close', 'Closed the note'],
  ['install-prompt', 'Tapped the install button'],
  ['install-yes', 'Said yes in the install window'],
  ['installed', 'Installed (Android/Chrome reports it)'],
  ['app-first-open', 'First start from the home screen (any phone)'],
  ['app-open', 'Starts from the home screen'],
] as const;
export function installFunnel(events: Visits['events']): { label: string; count: number; ways: string }[] {
  return INSTALL_STEPS.map(([name, label]) => {
    const hits = events.filter((e) => e.name === name || e.name.startsWith(`${name}/`));
    const ways = hits.filter((e) => e.name.includes('/')).map((e) => `${e.name.split('/')[1]} ${e.count}`).join(', ');
    return { label, count: hits.reduce((n, e) => n + e.count, 0), ways };
  });
}

const dayStart = (t: number) => new Date(new Date(t).getFullYear(), new Date(t).getMonth(), new Date(t).getDate()).getTime();
export const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Empty buckets covering the last `days` days up to `now`: one per day, one per week for long periods, or one per hour for today (days = 1). */
export function buckets(days: number, now: number): Bucket[] {
  if (days === 1) return Array.from({ length: 24 }, (_, hour) => ({ start: dayStart(now) + hour * 3_600_000, label: `${hour}:00`, value: 0 }));
  const step = days > 45 ? 7 : 1;
  const end = dayStart(now) + DAY;
  const out: Bucket[] = [];
  for (let i = Math.ceil(days / step); i > 0; i--) {
    // noon avoids landing on the wrong day when the clocks change
    const start = dayStart(end - i * step * DAY + DAY / 2);
    const d = new Date(start);
    out.push({ start, label: `${d.getDate()}.${d.getMonth() + 1}`, value: 0 });
  }
  return out;
}

/** Counts the times into the buckets; times outside the period are left out. */
export function fill(empty: Bucket[], times: number[], weights?: number[]): Bucket[] {
  const out = empty.map((b) => ({ ...b }));
  times.forEach((t, k) => {
    for (let i = out.length - 1; i >= 0; i--) {
      if (t >= out[i].start) {
        const end = i + 1 < out.length ? out[i + 1].start : Infinity;
        if (t < end) out[i].value += weights ? weights[k] : 1;
        break;
      }
    }
  });
  return out;
}

/**
 * GoatCounter visitors spread over the buckets: per hour for today, otherwise
 * per day (counted at noon, so a day never lands in the wrong bucket).
 */
export function visitorsBy(empty: Bucket[], v: Pick<Visits, 'byDay' | 'byHour'>, today: boolean, now: number): Bucket[] {
  if (today) {
    const hours = v.byHour.get(dayKey(now)) ?? [];
    return empty.map((b, i) => ({ ...b, value: hours[i] ?? 0 }));
  }
  const since = dayKey(empty[0].start);
  const days = [...v.byDay].filter(([day]) => day >= since);
  return fill(empty, days.map(([day]) => new Date(`${day}T12:00:00`).getTime()), days.map(([, n]) => n));
}

export function summarize(users: UserRow[], games: GameRow[], days: number, now: number) {
  const empty = buckets(days, now);
  const since = empty[0].start;
  const inPeriod = (t: number) => t >= since && t <= now + DAY;
  const signups = users.filter((u) => inPeriod(u.created));
  const active = users.filter((u) => inPeriod(u.updated));
  const mine = games.filter((g) => inPeriod(g.created));
  return {
    since,
    totalUsers: users.length,
    signups: signups.length,
    active: active.length,
    games: mine.length,
    started: mine.filter((g) => g.started).length,
    players: mine.reduce((n, g) => n + g.players, 0),
    signupsBy: fill(empty, signups.map((u) => u.created)),
    activeBy: fill(empty, active.map((u) => u.updated)),
    gamesBy: fill(empty, mine.map((g) => g.created)),
    empty,
  };
}
