// Checks that the course content, pictures and language packs fit together.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GROUPS, LESSONS, TERM_IDS, TOPICS, sceneOf } from '../src/data/model.ts';
import { LANG_LIST } from '../src/i18n/index.ts';
import { en } from '../src/i18n/en.ts';
import { DETAILS } from '../src/scenes/details.ts';
import { SCENES } from '../src/scenes/index.ts';

test('every term belongs to exactly one lesson', () => {
  const used = LESSONS.flatMap((l) => [...l.terms]);
  assert.deepEqual([...used].sort(), [...TERM_IDS].sort());
});

test('every term has a dot and a highlightable shape on its picture', () => {
  for (const id of TERM_IDS) {
    const scene = SCENES[sceneOf(id)];
    const spot = scene.spots[id];
    assert.ok(spot, `${id}: no spot on ${scene.id}`);
    assert.ok(spot[0] > 0 && spot[0] < scene.size[0] && spot[1] > 0 && spot[1] < scene.size[1], `${id}: spot outside picture`);
    assert.match(scene.art, new RegExp(`class="[^"]*\\bt-${id}\\b`), `${id}: nothing to highlight on ${scene.id}`);
  }
});

test('pictures contain no unresolved values', () => {
  for (const scene of Object.values(SCENES)) assert.doesNotMatch(scene.art, /NaN|undefined/, scene.id);
});

for (const lang of LANG_LIST) {
  test(`language pack "${lang.code}" is complete`, () => {
    for (const key of Object.keys(en.ui)) assert.ok(lang.ui[key as keyof typeof en.ui]?.trim(), `ui.${key}`);
    for (const t of TOPICS) assert.ok(lang.topics[t.id]?.name && lang.topics[t.id]?.desc, `topic ${t.id}`);
    for (const l of LESSONS) assert.ok(lang.lessons[l.id], `lesson ${l.id}`);
    for (const g of GROUPS) assert.ok(lang.groups[g.id], `group ${g.id}`);
    for (const id of TERM_IDS) {
      assert.ok(lang.terms[id]?.name.trim(), `term ${id}: name`);
      assert.ok(lang.terms[id]?.desc.trim(), `term ${id}: desc`);
    }
  });

  test(`language pack "${lang.code}": names are unique within a picture`, () => {
    for (const topic of TOPICS) {
      const names = LESSONS.filter((l) => l.topic === topic.id).flatMap((l) => l.terms.map((t) => lang.terms[t].name.toLowerCase()));
      assert.equal(new Set(names).size, names.length, `duplicate name in topic ${topic.id}`);
    }
  });
}

test('close-up drawings belong to terms that have a dot on their picture', () => {
  for (const [id, art] of Object.entries(DETAILS)) {
    assert.ok((TERM_IDS as readonly string[]).includes(id), `${id} is not a term`);
    assert.ok(SCENES[sceneOf(id as (typeof TERM_IDS)[number])].spots[id as (typeof TERM_IDS)[number]], `${id}: no spot`);
    assert.doesNotMatch(art, /NaN|undefined/, id);
  }
});

test('search finds terms despite typos and missing accents', async () => {
  const { search } = await import('../src/search.ts');
  const langs = LANG_LIST;
  const first = (q: string) => search(q, langs)[0]?.term;
  assert.equal(first('roolipinn'), 'tiller');
  assert.equal(first('roolipin'), 'tiller'); // unfinished word
  assert.equal(first('voorstaak'), 'forestay'); // accents missing
  assert.equal(first('vöörstak'), 'forestay'); // typo
  assert.equal(first('tiller'), 'tiller'); // English
  assert.equal(first('kontraso'), 'vang');
  assert.equal(first('Kardinaalmärk')?.startsWith('b'), true);
  const anchor = search('ankur', langs).map((h) => h.term);
  for (const t of ['anchor', 'anchorchain', 'windlass', 'fluke', 'anchorball']) assert.ok(anchor.includes(t as never), `ankur -> ${t}`);
  assert.deepEqual(search('kambüüüs', langs), []); // not in the game (yet)
  assert.deepEqual(search('k', langs), []); // too short to search
});

test('search finds a part by the action it is used for', async () => {
  const { search } = await import('../src/search.ts');
  const { et } = await import('../src/i18n/et.ts');
  const { en } = await import('../src/i18n/en.ts');
  for (const q of ['rehvimine', 'rehvima', 'rehv', 'rehvimin', 'reefing']) assert.equal(search(q, [et, en])[0]?.term, 'reefpoints', q);
  for (const q of ['vaier', 'vaierid']) {
    const found = search(q, [et, en]).map((x) => x.term);
    for (const id of ['forestay', 'backstay', 'shrouds', 'lifelines']) assert.ok(found.includes(id as never), `${q}: ${id}`);
  }
});
