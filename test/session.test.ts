import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LESSONS, type TermId } from '../src/data/model.ts';
import { en } from '../src/i18n/en.ts';
import { Session, checkTyped, type Exercise } from '../src/session.ts';
import { cloudData, defaultState, initialTopics, mergeCloud, unlockNext } from '../src/store.ts';
import { START_OPEN, TOPICS } from '../src/data/model.ts';

/** small deterministic random generator so failures are reproducible */
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function play(terms: TermId[], opts: { box?: number; typing?: boolean; errorRate?: number; seed?: number } = {}) {
  const rng = seeded(opts.seed ?? 1);
  const sess = new Session(terms, {
    box: () => opts.box ?? 0,
    typing: opts.typing ?? true,
    bilingual: false,
    nameOf: (t) => en.terms[t].name,
    rng,
  });
  const log: Exercise[] = [];
  for (let i = 0; i < 2000; i++) {
    const ex = sess.next();
    if (!ex) return { sess, log };
    log.push(ex);
    sess.answer(ex, rng() >= (opts.errorRate ?? 0));
  }
  throw new Error('session did not finish');
}

test('every lesson can be completed, with and without mistakes', () => {
  for (const lesson of LESSONS)
    for (const errorRate of [0, 0.4])
      for (const typing of [true, false]) {
        const { sess } = play([...lesson.terms], { errorRate, typing, seed: lesson.terms.length + (typing ? 7 : 3) });
        assert.equal(sess.done, sess.total, lesson.id);
        assert.equal(sess.progress, 1);
        for (const it of sess.items) assert.equal(it.step, it.ladder.length);
      }
});

test('new terms are introduced before they are asked, and only once', () => {
  const { log } = play([...LESSONS[0].terms], { errorRate: 0.3 });
  const seen = new Set<TermId>();
  for (const ex of log) {
    if (ex.kind === 'intro') {
      assert.ok(!seen.has(ex.term));
      seen.add(ex.term);
    } else if (ex.kind !== 'group') {
      assert.ok(seen.has(ex.term), `${ex.term} asked before its introduction`);
    }
  }
  assert.equal(seen.size, LESSONS[0].terms.length);
});

test('known terms are not introduced again and get a shorter ladder', () => {
  const { log, sess } = play([...LESSONS[1].terms], { box: 2 });
  assert.ok(log.every((e) => e.kind !== 'intro'));
  assert.ok(sess.items.every((i) => i.ladder.length === 2));
});

test('exercises are well formed', () => {
  for (const lesson of LESSONS) {
    const { log } = play([...lesson.terms], { errorRate: 0.2, seed: 42 });
    for (const ex of log) {
      if (ex.kind === 'pick' || ex.kind === 'define') {
        assert.equal(ex.options.length, 4);
        assert.ok(ex.options.includes(ex.term));
        assert.equal(new Set(ex.options).size, 4);
      } else if (ex.kind === 'find') {
        assert.ok(ex.pins.includes(ex.term));
        assert.ok(ex.pins.length >= 3, `${ex.term}: only ${ex.pins.length} dots`);
      } else if (ex.kind === 'group') {
        assert.ok(ex.correct.length >= 2 && ex.correct.length < ex.options.length);
        assert.ok(ex.correct.every((c) => ex.options.includes(c)));
      }
    }
  }
});

test('without typing there are no typing exercises', () => {
  const { log } = play([...LESSONS[0].terms], { typing: false });
  assert.ok(log.every((e) => e.kind !== 'type'));
});

test('typed answers: exact, close and wrong', () => {
  const acc = ['vöörstaak', 'eestaak'];
  assert.equal(checkTyped('Vöörstaak ', acc), 'exact');
  assert.equal(checkTyped('eestaak', acc), 'exact');
  assert.equal(checkTyped('voorstaak', acc), 'close'); // accents missing
  assert.equal(checkTyped('vöörstak', acc), 'close'); // one typo
  assert.equal(checkTyped('ahterstaak', acc), 'wrong');
  assert.equal(checkTyped('', acc), 'wrong');
  assert.equal(checkTyped('close hauled', ['close-hauled']), 'exact');
  assert.equal(checkTyped('bot', ['bow']), 'wrong'); // short words must be exact
});

test('test mode asks every term exactly twice, without introductions or repeats', () => {
  for (const lesson of LESSONS)
    for (const errorRate of [0, 0.5]) {
      const rng = seeded(11);
      const sess = new Session([...lesson.terms], { box: () => 0, typing: true, bilingual: false, nameOf: (t) => en.terms[t].name, test: true, rng });
      const count = new Map<TermId, number>();
      for (let i = 0; i < 100; i++) {
        const ex = sess.next();
        if (!ex) break;
        assert.ok(ex.kind === 'find' || ex.kind === 'type' || ex.kind === 'define' || ex.kind === 'giveway', `${lesson.id}: ${ex.kind}`);
        count.set(ex.term, (count.get(ex.term) ?? 0) + 1);
        sess.answer(ex, rng() >= errorRate);
      }
      assert.equal(sess.next(), null, lesson.id);
      assert.equal(sess.asked, lesson.terms.length * 2);
      assert.ok([...count.values()].every((n) => n === 2));
      if (errorRate === 0) assert.equal(sess.mistakes, 0);
    }
});

test('merging account progress keeps the better result and never loses anything', () => {
  const local = defaultState('en');
  local.xp = 50; local.streak = 2; local.lastDay = '2026-11-20';
  local.progress.et = { bow: { box: 3, due: 100, seen: 4, wrong: 1 }, keel: { box: 1, due: 5, seen: 1, wrong: 0 } };
  const other = defaultState('en');
  other.xp = 80; other.streak = 5; other.lastDay = '2026-11-25';
  other.progress.et = { bow: { box: 1, due: 900, seen: 2, wrong: 3 }, keel: { box: 4, due: 50, seen: 6, wrong: 0 }, mast: { box: 2, due: 7, seen: 1, wrong: 0 } };
  other.progress.en = { hull: { box: 2, due: 1, seen: 1, wrong: 0 } };
  mergeCloud(local, JSON.parse(JSON.stringify(cloudData(other))));
  assert.deepEqual(local.progress.et!.bow, { box: 3, due: 100, seen: 4, wrong: 3 });
  assert.equal(local.progress.et!.keel!.box, 4);
  assert.equal(local.progress.et!.mast!.box, 2);
  assert.equal(local.progress.en!.hull!.box, 2);
  assert.equal(local.xp, 80);
  assert.deepEqual([local.streak, local.lastDay], [5, '2026-11-25']);
  // garbage from the network is ignored rather than trusted
  const before = JSON.stringify(local);
  for (const junk of [null, 'x', 42, { progress: { et: { bow: 'nope', keel: { box: 'high' } } }, xp: 'lots' }]) mergeCloud(local, junk);
  assert.equal(JSON.stringify(local), before);
  mergeCloud(local, { progress: { et: { stern: { box: 99, due: 1 } } } });
  assert.equal(local.progress.et!.stern!.box, 5);
});

test('topics open from basic to advanced', () => {
  const s = defaultState('en');
  assert.deepEqual(s.topics, TOPICS.slice(0, START_OPEN).map((t) => t.id));
  const first = TOPICS[0].id;
  assert.equal(unlockNext(s, first), null); // nothing finished yet
  s.progress.en = Object.fromEntries(LESSONS.filter((l) => l.topic === first).flatMap((l) => l.terms.map((t) => [t, { box: 2, due: 0, seen: 1, wrong: 0 }])));
  // the next topic is already open, so finishing the first opens nothing new
  assert.equal(unlockNext(s, first), null);
  const third = TOPICS[START_OPEN - 1].id;
  for (const l of LESSONS.filter((l) => l.topic === third)) for (const t of l.terms) s.progress.en[t] = { box: 1, due: 0, seen: 1, wrong: 0 };
  assert.equal(unlockNext(s, third), TOPICS[START_OPEN].id);
  assert.ok(s.topics.includes(TOPICS[START_OPEN].id));
  // a player from an older version keeps the topics they already practised
  const old = defaultState('en');
  old.progress.en = { flare: { box: 1, due: 0, seen: 1, wrong: 0 } };
  assert.ok(initialTopics(old).includes('safety'));
  assert.ok(!initialTopics(old).includes('flags'));
});

test('typed answers: singular for plural and the other way round', () => {
  assert.equal(checkTyped('reeling', ['reelingud']), 'form');
  assert.equal(checkTyped('saaling', ['saalingud']), 'form');
  assert.equal(checkTyped('pardatuli', ['pardatuled']), 'form');
  assert.equal(checkTyped('tuuleniit', ['tuuleniidid']), 'form');
  assert.equal(checkTyped('purjeliistud', ['purjeliist']), 'form');
  assert.equal(checkTyped('shroud', ['shrouds']), 'form');
  assert.equal(checkTyped('lifeline', ['lifelines']), 'form');
  assert.equal(checkTyped('vandid', ['vandid']), 'exact');
  assert.equal(checkTyped('vant', ['vandid']), 'wrong'); // too short to guess safely
  assert.equal(checkTyped('kiil', ['kiilud']), 'form');
  assert.equal(checkTyped('mast', ['masts']), 'form');
  assert.equal(checkTyped('poom', ['poomid']), 'form');
  assert.equal(checkTyped('kiilud', ['kiil']), 'form'); // plural typed for a singular term
  assert.equal(checkTyped('saalinud', ['saalingud']), 'close'); // a typo is still a typo
  assert.equal(checkTyped('ahter', ['vöör']), 'wrong');
});

test('XP earned on two signed-in devices adds up, and syncing twice counts nothing twice', () => {
  let cloud = cloudData(defaultState('et'));
  const sync = (s: ReturnType<typeof defaultState>) => {
    mergeCloud(s, JSON.parse(JSON.stringify(cloud)));
    cloud = cloudData(s);
    s.xpBase = s.xp;
  };
  const phone = defaultState('et'), computer = defaultState('et');
  phone.xp = 40; // played before signing in
  sync(phone); sync(computer);
  assert.equal(computer.xp, 40);
  phone.xp += 12; computer.xp += 24; // both play without seeing each other
  sync(phone); sync(computer); sync(phone);
  assert.equal(phone.xp, 76);
  assert.equal(computer.xp, 76);
  sync(phone); sync(computer); // nothing new: nothing changes
  assert.deepEqual([phone.xp, computer.xp, cloud.xp], [76, 76, 76]);
});

test('party quiz: questions, the shared clock and scoring', async () => {
  const { buildQuestions, phaseAt, points, startPatch, revealPatch, nextPatch, allAnswered, REVEAL_MS, BOARD_AFTER_MS, COUNTDOWN_MS } = await import('../src/live/core.ts');
  for (const kinds of ['pick', 'define', 'both'] as const) {
    const qs = buildQuestions(['hull', 'flags', 'rightofway'], 20, kinds, (t) => en.terms[t].name, seeded(5));
    assert.equal(qs.length, 20);
    assert.equal(new Set(qs.map((q) => q.term)).size, 20);
    for (const q of qs) {
      assert.equal(q.options.length, 4);
      assert.ok(q.options.includes(q.term));
      assert.equal(new Set(q.options.map((o) => en.terms[o].name)).size, 4);
      if (kinds !== 'both') assert.equal(q.kind, kinds);
    }
  }
  // a small topic gives as many questions as it has terms
  assert.ok(buildQuestions(['rightofway'], 30, 'both', (t) => en.terms[t].name, seeded(1)).length < 30);

  const g = { status: 'lobby' as 'lobby' | 'run', anchorQ: 0, anchorAt: 0, secs: 20, questions: buildQuestions(['hull'], 3, 'pick', (t) => en.terms[t].name, seeded(2)) };
  assert.equal(phaseAt(g, 0).phase, 'lobby');
  Object.assign(g, startPatch(1000));
  const t0 = 1000 + COUNTDOWN_MS, cycle = 20_000 + REVEAL_MS;
  assert.deepEqual(phaseAt(g, 2000), { phase: 'countdown', q: 0, left: COUNTDOWN_MS - 1000 });
  assert.deepEqual(phaseAt(g, t0 + 5000), { phase: 'ask', q: 0, left: 15_000, total: 20_000 });
  assert.deepEqual(phaseAt(g, t0 + 21_000), { phase: 'reveal', q: 0, left: REVEAL_MS - 1000, board: false });
  assert.equal((phaseAt(g, t0 + 20_000 + BOARD_AFTER_MS) as { board: boolean }).board, true);
  assert.deepEqual(phaseAt(g, t0 + cycle + 1), { phase: 'ask', q: 1, left: 19_999, total: 20_000 });
  // nobody presses anything: the game still reaches the end by itself
  assert.equal(phaseAt(g, t0 + 3 * cycle).phase, 'done');
  // after the last question the answer is shown, then the final results (no standings in between)
  assert.equal(phaseAt(g, t0 + 2 * cycle + 21_000).phase, 'reveal');
  assert.equal(phaseAt(g, t0 + 2 * cycle + 20_000 + BOARD_AFTER_MS).phase, 'done');
  // everybody answered early: the host shows the answer straight away, then moves on
  Object.assign(g, revealPatch(g, 0, t0 + 4000));
  assert.deepEqual(phaseAt(g, t0 + 4000), { phase: 'reveal', q: 0, left: REVEAL_MS, board: false });
  Object.assign(g, nextPatch(0, t0 + 6000));
  assert.equal(phaseAt(g, t0 + 6000).phase, 'countdown');
  assert.equal((phaseAt(g, t0 + 8000) as { q: number }).q, 1);
  Object.assign(g, nextPatch(2, t0 + 9000));
  assert.equal(phaseAt(g, t0 + 9000).phase, 'done');

  assert.equal(points(false, 0, 20_000), 0);
  assert.equal(points(true, 0, 20_000), 1000);
  assert.equal(points(true, 20_000, 20_000), 500);
  assert.ok(points(true, 3000, 20_000) > points(true, 9000, 20_000));

  const pl = (id: string, q?: number) => ({ id, name: id, score: 0, streak: 0, right: 0, joined: 0, ...(q === undefined ? {} : { a: { q, c: 0, ok: true, pts: 1 } }) });
  assert.equal(allAnswered([], 0), false);
  assert.equal(allAnswered([pl('a', 0), pl('b')], 0), false);
  assert.equal(allAnswered([pl('a', 0), pl('b', 0)], 0), true);
  // someone who stopped answering two questions ago does not hold everyone up
  assert.equal(allAnswered([pl('a', 3), pl('b', 3), pl('gone', 0)], 3), true);
  assert.equal(allAnswered([pl('a', 3), pl('b', 2)], 3), false);
});

test('admin statistics: periods, buckets and counts', async () => {
  const { buckets, fill, summarize } = await import('../src/admin.ts');
  const DAY = 86_400_000;
  const now = new Date(2026, 10, 27, 15, 0).getTime();
  const week = buckets(7, now);
  assert.equal(week.length, 7);
  assert.equal(week[6].label, '27.11');
  assert.equal(week[0].label, '21.11');
  assert.equal(buckets(90, now).length, 13); // weekly for long periods
  assert.deepEqual(fill(week, [now, now - DAY, now - DAY, now - 30 * DAY]).map((b) => b.value), [0, 0, 0, 0, 0, 2, 1]);
  const users = [
    { created: now - 2 * DAY, updated: now, xp: 10 },
    { created: 0, updated: now - 3 * DAY, xp: 500 }, // signed up before dates were recorded
    { created: now - 20 * DAY, updated: now - 15 * DAY, xp: 5 },
  ];
  const games = [
    { code: '1', created: now - DAY, started: true, players: 4 },
    { code: '2', created: now - 2 * DAY, started: false, players: 0 },
    { code: '3', created: now - 40 * DAY, started: true, players: 9 },
  ];
  const s7 = summarize(users, games, 7, now);
  assert.deepEqual([s7.totalUsers, s7.signups, s7.active, s7.games, s7.started, s7.players], [3, 1, 2, 2, 1, 4]);
  const s30 = summarize(users, games, 30, now);
  assert.deepEqual([s30.signups, s30.active, s30.games], [2, 3, 2]);
  assert.equal(s30.signupsBy.reduce((n, b) => n + b.value, 0), 2);
  assert.equal(summarize(users, games, 90, now).players, 13);
  // today: by the hour, from midnight
  const today = summarize([...users, { created: now - 3_600_000, updated: now, xp: 1 }], games, 1, now);
  assert.deepEqual([today.signups, today.active, today.games, today.signupsBy.length], [1, 2, 0, 24]);
  assert.equal(today.signupsBy[14].value, 1);
  const { visitorsBy, dayKey } = await import('../src/admin.ts');
  const hours = new Array(24).fill(0); hours[9] = 5; hours[14] = 2;
  const v = { byDay: new Map([[dayKey(now), 7], [dayKey(now - DAY), 4], [dayKey(now - 10 * DAY), 9]]), byHour: new Map([[dayKey(now), hours]]) };
  assert.deepEqual(visitorsBy(today.empty, v, true, now).filter((b) => b.value).map((b) => [b.label, b.value]), [['9:00', 5], ['14:00', 2]]);
  assert.deepEqual(visitorsBy(s7.empty, v, false, now).map((b) => b.value), [0, 0, 0, 0, 0, 4, 7]);
});

test('admin: home screen install steps are added up across browsers', async () => {
  const { installFunnel } = await import('../src/admin.ts');
  const rows = installFunnel([
    { name: 'install-note/ios', count: 7 }, { name: 'install-note/prompt', count: 3 }, { name: 'install-yes', count: 2 },
    { name: 'installed', count: 2 }, { name: 'app-first-open', count: 4 }, { name: 'app-open', count: 30 }, { name: 'lesson-start/hull1', count: 50 },
  ]);
  const by = Object.fromEntries(rows.map((r) => [r.label, r]));
  assert.equal(by['Saw the note'].count, 10);
  assert.equal(by['Saw the note'].ways, 'ios 7, prompt 3');
  assert.equal(by['Installed (Android/Chrome reports it)'].count, 2);
  assert.equal(by['First start from the home screen (any phone)'].count, 4);
  assert.equal(by['Starts from the home screen'].count, 30); // app-first-open is not counted as app-open
  assert.equal(by['Closed the note'].count, 0);
});

test('signing in on a fresh device follows the language that has progress', async () => {
  const { defaultState, mergeCloud, followProgress, noProgress } = await import('../src/store.ts');
  const s = defaultState('en'); // a phone in English
  assert.equal(noProgress(s), true);
  mergeCloud(s, { v: 1, xp: 1268, streak: 1, lastDay: '', progress: { et: { hull: { box: 3, due: 0, seen: 4, wrong: 0 }, bow: { box: 2, due: 0, seen: 2, wrong: 0 } } }, updated: 0 });
  assert.equal(followProgress(s, () => true), true);
  assert.equal(s.learn, 'et');
  // a player who chose a language with progress keeps it
  const t = defaultState('en');
  t.progress = { en: { hull: { box: 1, due: 0, seen: 1, wrong: 0 } }, et: { hull: { box: 3, due: 0, seen: 3, wrong: 0 }, bow: { box: 3, due: 0, seen: 3, wrong: 0 } } };
  assert.equal(followProgress(t, () => true), false);
  assert.equal(t.learn, 'en');
});
