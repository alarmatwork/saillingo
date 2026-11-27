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
