// Screens of the party quiz: the hub (create or join), and one running game seen
// as the host, a player, or the big screen. The rules live in core.ts.
import { TOPICS, isSituation, sceneOf, type TermId, type TopicId } from '../data/model.ts';
import { h } from '../dom.ts';
import { FALLBACK, LANGS, LANG_LIST } from '../i18n/index.ts';
import { plain, type UiKey } from '../i18n/types.ts';
import { SCENES } from '../scenes/index.ts';
import { sceneView } from '../sceneView.ts';
import { situationView } from '../situationView.ts';
import { loadLive, type LiveBackend } from './backend.ts';
import {
  COUNTS, SECONDS, allAnswered, buildQuestions, cleanName, makeCode, nextPatch, phaseAt, points, ranked, revealPatch, startPatch,
  type Game, type Phase, type Player, type Question, type QuestionKinds,
} from './core.ts';

export interface LiveDeps {
  show(screen: HTMLElement): void;
  toast(message: string): void;
  goHome(): void;
  navigate(target: string): void;
  track(name: string): void;
  /** the viewer's interface language, the language they learn, and their open topics */
  ui(): string;
  /** changes (and remembers) the viewer's interface language */
  setUi(lang: string): void;
  learn(): string;
  topics(): TopicId[];
}

const NAME_KEY = 'saillingo.liveName';
const LETTERS = 'ABCD';
const remembered = () => { try { return localStorage.getItem(NAME_KEY) ?? ''; } catch { return ''; } };
const remember = (name: string) => { try { localStorage.setItem(NAME_KEY, name); } catch { /* private mode */ } };

export function createLive(d: LiveDeps) {
  const text = (lang: string) => (key: UiKey, vars: Record<string, string | number> = {}) => {
    let s = (LANGS[lang] ?? FALLBACK).ui[key] ?? FALLBACK.ui[key];
    for (const k in vars) s = s.replaceAll(`{${k}}`, String(vars[k]));
    return s;
  };
  const btn = (label: string, onclick: () => void, cls = 'btn primary', disabled = false) => h('button', { type: 'button', class: cls, onclick, disabled }, label);
  const base = () => location.href.split('#')[0];
  const copy = async (url: string, t: ReturnType<typeof text>) => {
    try {
      await navigator.clipboard.writeText(url);
      d.toast(t('linkCopied'));
    } catch {
      prompt(t('share'), url);
    }
  };

  // ---- hub: join with a code, or set up a new game ----------------------------------
  function hub() {
    const t = text(d.ui());
    let topics = new Set<TopicId>(d.topics());
    let count = 15, secs = 20, kinds: QuestionKinds = 'both', lang = d.learn();
    const root = h('div', { class: 'screen live hub' });

    const seg = <T extends string | number>(values: readonly T[], current: T, label: (v: T) => string, set: (v: T) => void) =>
      h('div', { class: 'seg' }, values.map((v) => h('button', { type: 'button', class: v === current ? 'on' : '', onclick: () => { set(v); draw(); } }, label(v))));

    const join = (code: string) => {
      const c = code.replace(/\D/g, '');
      if (c.length === 6) d.navigate(`game=${c}`);
    };

    let busy = false;
    const create = async () => {
      if (busy) return;
      if (!topics.size) return d.toast(t('liveNoTopics'));
      busy = true;
      draw();
      try {
        const { backend } = await loadLive();
        const host = await backend.uid();
        const names = (LANGS[lang] ?? FALLBACK).terms;
        const game: Game = {
          v: 1, host, lang, ui: d.ui(), secs, status: 'lobby', anchorQ: 0, anchorAt: 0, created: backend.now(),
          questions: buildQuestions([...topics], count, kinds, (x) => names[x].name),
        };
        for (let i = 0; i < 6; i++) {
          const code = makeCode();
          if (await backend.createGame(code, game)) {
            d.track('live-create');
            return d.navigate(`game=${code}`);
          }
        }
        throw new Error('no free code');
      } catch (e) {
        console.warn(e);
        d.toast(t('liveUnavailable'));
      }
      busy = false;
      draw();
    };

    function draw() {
      const code = h('input', { class: 'code', inputmode: 'numeric', maxlength: 7, placeholder: '123456', 'aria-label': t('liveCode'), autocomplete: 'off' });
      const all = topics.size === TOPICS.length;
      root.replaceChildren(
        h('div', { class: 'topbar' }, btn('←', d.goHome, 'icon'), h('h2', null, `🎉 ${t('liveTitle')}`)),
        h('p', null, t('liveIntro')),
        h('section', { class: 'settings' },
          h('b', null, t('liveJoinTitle')),
          h('form', { class: 'joinrow', onsubmit: (e: Event) => { e.preventDefault(); join(code.value); } },
            code, h('button', { type: 'submit', class: 'btn primary small' }, t('liveJoin')))),
        h('section', { class: 'settings' },
          h('b', null, t('liveCreateTitle')),
          h('div', { class: 'field' },
            h('span', null, t('liveTopics'), ' ',
              btn(all ? t('liveNone') : t('liveAll'), () => { topics = new Set(all ? [] : TOPICS.map((x) => x.id)); draw(); }, 'btn link')),
            h('div', { class: 'chips' }, TOPICS.map((topic) =>
              h('button', {
                type: 'button', class: `chip${topics.has(topic.id) ? ' on' : ''}`, 'aria-pressed': String(topics.has(topic.id)),
                onclick: () => { if (topics.has(topic.id)) topics.delete(topic.id); else topics.add(topic.id); draw(); },
              }, (LANGS[d.ui()] ?? FALLBACK).topics[topic.id].name)))),
          h('div', { class: 'field' }, h('span', null, t('liveCount')), seg(COUNTS, count, String, (v) => (count = v))),
          h('div', { class: 'field' }, h('span', null, t('liveSecs')), seg(SECONDS, secs, (v) => `${v} s`, (v) => (secs = v))),
          h('div', { class: 'field' }, h('span', null, t('liveKinds')),
            seg(['both', 'pick', 'define'] as const, kinds, (v) => t(v === 'both' ? 'liveKindBoth' : v === 'pick' ? 'liveKindPick' : 'liveKindDefine'), (v) => (kinds = v))),
          LANG_LIST.length > 1 && h('div', { class: 'field' }, h('span', null, t('liveLang')), seg(LANG_LIST.map((l) => l.code), lang, (v) => LANGS[v].name, (v) => (lang = v))),
          btn(busy ? '…' : `🎉 ${t('liveCreate')}`, create, 'btn primary', busy)));
    }
    draw();
    d.show(root);
  }

  // ---- shared pieces ------------------------------------------------------------------
  /** Like the lessons: a picture comes before the question, a written clue after it. */
  function askParts(q: Question, parts: { prompt: string; media: Node }) {
    const prompt = h('h2', { class: 'prompt' }, parts.prompt);
    const media = h('div', { class: `media ${q.kind}` }, parts.media);
    return q.kind === 'define' ? [prompt, media] : [media, prompt];
  }
  /** The question as shown on every device: what is asked, and the picture or description. */
  function questionParts(q: Question, t: ReturnType<typeof text>, descLang: string) {
    const situation = isSituation(q.term);
    if (q.kind === 'define') {
      const desc = plain((LANGS[descLang] ?? FALLBACK).terms[q.term].desc).split('\n').map((part) => h('span', { class: 'para' }, part));
      return { prompt: t('qDefine'), media: h('div', { class: 'quote' }, desc) };
    }
    const media = situation
      ? situationView(q.term).el
      : sceneView(SCENES[sceneOf(q.term)], { highlight: [q.term], detail: q.term, pins: [{ id: q.term, state: 'target' }] }).el;
    return { prompt: situation ? t('qRule') : t('qPick'), media };
  }

  const confetti = () =>
    h('div', { class: 'confetti', 'aria-hidden': 'true' }, Array.from({ length: 48 }, (_, i) =>
      h('i', { style: `left:${(i * 37) % 100}%;animation-delay:${(i % 12) * 0.25}s;animation-duration:${3 + (i % 5) * 0.6}s;background:${['#ffd166', '#0b6fb8', '#f77f00', '#2a9d8f', '#ff2d87'][i % 5]}` })));

  // ---- one game -----------------------------------------------------------------------
  async function run(code: string, asScreen: boolean) {
    const root = h('div', { class: `screen live ${asScreen ? 'bigscreen' : 'game'}` }, h('p', { class: 'hint center' }, '…'));
    d.show(root);
    let t = text(d.ui());
    const fail = (key: UiKey) => {
      if (!root.isConnected) return;
      root.replaceChildren(h('div', { class: 'topbar' }, btn('←', () => d.navigate('party'), 'icon'), h('h2', null, `🎉 ${t('liveTitle')}`)), h('div', { class: 'quote' }, t(key)));
    };

    let backend: LiveBackend, qr: (s: string) => string;
    let uid = '';
    let me: Player | null = null;
    try {
      ({ backend, qr } = await loadLive());
      if (!asScreen) {
        uid = await backend.uid();
        me = await backend.getPlayer(code, uid).catch(() => null);
      }
    } catch (e) {
      console.warn(e);
      return fail('liveUnavailable');
    }
    if (!root.isConnected) return;

    let game: Game | null = null;
    let players: Player[] = [];
    let lastKey = '';
    let watchingPlayers: (() => void) | null = null;
    /** questions the host has already cut short, so it is done once */
    const cut = new Set<number>();
    /** parts of the current view that change without a full redraw */
    let live: { timer?: HTMLElement; count?: HTMLElement; number?: HTMLElement; place?: HTMLElement; roster?: HTMLElement; start?: HTMLButtonElement } = {};

    const isHost = () => !asScreen && game?.host === uid;
    const names = () => (LANGS[game!.lang] ?? FALLBACK).terms;
    const name = (id: TermId) => names()[id].name;
    const joinUrl = `${base()}#game=${code}`, screenUrl = `${base()}#screen=${code}`;
    /** everyone as this device knows them: the host and the screen see all, a player only themselves */
    const everyone = () => (watchingPlayers ? players : me ? [me] : []);

    const stopGame = backend.watchGame(code, (g) => {
      if (!g) return game ? undefined : fail('liveNotFound');
      game = g;
      if (asScreen) t = text(g.ui);
      if ((asScreen || isHost()) && !watchingPlayers) {
        watchingPlayers = backend.watchPlayers(code, (list) => {
          players = list;
          onPlayers();
        });
      }
      tick();
    });
    const ticker = setInterval(tick, 200);
    function stop() {
      clearInterval(ticker);
      stopGame();
      watchingPlayers?.();
    }

    function tick() {
      if (!root.isConnected) return stop();
      if (!game) return;
      const ph = phaseAt(game, backend.now());
      const q = 'q' in ph ? ph.q : -1;
      const key = [ph.phase, q, ph.phase === 'reveal' && ph.board, me?.a?.q === q, Boolean(me), isHost()].join('|');
      if (key !== lastKey) {
        lastKey = key;
        draw(ph);
      }
      if (ph.phase === 'ask' && live.timer) live.timer.style.width = `${(ph.left / ph.total) * 100}%`;
      if (ph.phase === 'countdown' && live.number) live.number.textContent = String(Math.max(1, Math.ceil(ph.left / 1000)));
      // as soon as everybody has answered the game moves on: done by the host's
      // device and by the big screen, so nobody has to tap anything (a TV has no
      // hands, and the host's phone may be asleep)
      if (ph.phase === 'ask' && (isHost() || asScreen) && !cut.has(ph.q) && allAnswered(everyone(), ph.q)) {
        cut.add(ph.q);
        // the host tries again; the screen does not keep knocking if the rules refuse it
        backend.updateGame(code, revealPatch(game, ph.q, backend.now())).catch(() => { if (!asScreen) cut.delete(ph.q); });
      }
    }

    function onPlayers() {
      if (!game || !root.isConnected) return;
      const ph = phaseAt(game, backend.now());
      if (ph.phase === 'lobby') {
        if (live.roster) fillRoster(live.roster);
        if (live.start) live.start.disabled = !players.length;
      } else if (ph.phase === 'ask') {
        tick();
        if (live.count) live.count.textContent = t('liveAnswered', { n: players.filter((p) => p.a?.q === ph.q).length, total: players.length });
      } else {
        draw(ph); // standings and results follow late answers
      }
    }

    function fillRoster(el: HTMLElement) {
      el.replaceChildren(
        h('b', null, players.length ? t('livePlayers', { n: players.length }) : t('liveNeedPlayers')),
        h('div', { class: 'names' }, ranked(players).reverse().map((p) => h('span', null, p.name))));
    }

    // ---- joining and answering ----
    async function joinAs(raw: string) {
      const n = cleanName(raw);
      if (!n) return;
      remember(n);
      me = { id: uid, name: n, score: 0, streak: 0, right: 0, joined: backend.now() };
      try {
        await backend.savePlayer(code, me);
        d.track('live-join');
      } catch (e) {
        console.warn(e);
        me = null;
        return d.toast(t('liveUnavailable'));
      }
      lastKey = '';
      tick();
    }
    /**
     * The player's own language for questions and descriptions. The answers stay in
     * the game's language: that is what the game is about.
     */
    const langPicker = () => LANG_LIST.length > 1 && h('label', { class: 'lang' }, h('span', null, '🌐'),
      h('select', { 'aria-label': t('iSpeak'), onchange: (e: Event) => {
        d.setUi((e.target as HTMLSelectElement).value);
        t = text(d.ui());
        lastKey = '';
        tick();
      } }, LANG_LIST.map((l) => h('option', { value: l.code, selected: l.code === d.ui() }, l.name))));

    const joinForm = () => {
      const input = h('input', { type: 'text', maxlength: 16, placeholder: t('liveName'), 'aria-label': t('liveName'), value: remembered(), autocomplete: 'nickname' });
      return h('form', { class: 'joinrow', onsubmit: (e: Event) => { e.preventDefault(); void joinAs(input.value); } },
        input, h('button', { type: 'submit', class: 'btn primary small' }, t('liveJoin')));
    };

    function answer(ph: Extract<Phase, { phase: 'ask' }>, choice: number) {
      if (!me || !game || me.a?.q === ph.q) return;
      const q = game.questions[ph.q];
      const ok = q.options[choice] === q.term;
      const pts = points(ok, ph.total - ph.left, ph.total);
      // a missed question breaks the run of correct answers
      const streak = ph.q > 0 && me.a?.q !== ph.q - 1 ? 0 : me.streak;
      me = { ...me, score: me.score + pts, streak: ok ? streak + 1 : 0, right: me.right + (ok ? 1 : 0), a: { q: ph.q, c: choice, ok, pts } };
      backend.savePlayer(code, me).catch(() => d.toast(t('liveUnavailable')));
      if (watchingPlayers) players = players.map((p) => (p.id === me!.id ? me! : p));
      tick();
    }

    const showPlace = (el: HTMLElement) => {
      if (!me) return;
      const set = (above: number) => { el.textContent = `🏅 ${t('livePlace', { n: above + 1 })}`; };
      if (watchingPlayers) set(players.filter((p) => p.score > me!.score).length);
      else backend.countAbove(code, me.score).then(set).catch(() => {});
    };

    // ---- views ----
    const tiles = (q: Question, o: { onPick?: (i: number) => void; chosen?: number; reveal?: boolean; counts?: number[] }) =>
      h('div', { class: 'tiles' }, q.options.map((id, i) => {
        const right = id === q.term;
        const cls = ['tile', `c${i}`, o.reveal ? (right ? 'ok' : 'dim') : '', o.chosen === i ? 'chosen' : ''].filter(Boolean).join(' ');
        const inner = [h('span', { class: 'letter' }, LETTERS[i]), h('span', { class: 'label' }, name(id)), o.counts && h('span', { class: 'n' }, o.reveal && right ? `✓ ${o.counts[i]}` : String(o.counts[i]))];
        return o.onPick ? h('button', { type: 'button', class: cls, onclick: () => o.onPick!(i) }, inner) : h('div', { class: cls }, inner);
      }));

    /** "Question 3 of 15", with a bar showing how far the game has come */
    const heading = (ph: { q: number }) => {
      const total = game!.questions.length;
      return h('div', { class: 'qno' }, h('b', null, t('liveQuestion', { n: ph.q + 1, total })),
        h('span', { class: 'qbar' }, h('i', { style: `width:${((ph.q + 1) / total) * 100}%` })));
    };
    const timer = () => h('div', { class: 'lv-timer' }, (live.timer = h('i', null)));

    function standings(title: string, top: number, q?: number) {
      const list = ranked(players).slice(0, top);
      return h('div', { class: 'board' }, h('h2', null, title),
        h('ol', null, list.map((p, i) =>
          h('li', { class: p.id === me?.id ? 'me' : '' },
            h('span', { class: 'pos' }, String(i + 1)), h('span', { class: 'who' }, p.name),
            q !== undefined && p.a?.q === q && p.a.pts > 0 && h('small', null, `+${p.a.pts}`),
            h('b', null, String(p.score))))));
    }

    function podium() {
      const [first, second, third] = ranked(players);
      const step = (p: Player | undefined, place: number) => p && h('div', { class: `step p${place}` }, h('span', { class: 'medal' }, ['🥇', '🥈', '🥉'][place - 1]), h('b', null, p.name), h('small', null, t('liveScore', { n: p.score })));
      return h('div', { class: 'podium' }, step(second, 2), step(first, 1), step(third, 3));
    }

    /** What the big screen shows (also the host's view when the host is not playing). */
    function screenBody(ph: Phase): (Node | false | null | undefined)[] {
      const g = game!;
      switch (ph.phase) {
        case 'lobby': {
          const roster = (live.roster = h('div', { class: 'roster' }));
          fillRoster(roster);
          return [
            h('h1', null, `🎉 ${t('liveTitle')}`),
            h('div', { class: 'invite' },
              h('div', { class: 'qr', html: qr(joinUrl) }),
              h('div', null, h('small', null, t('liveJoinAt')), h('b', { class: 'url' }, joinUrl.replace(/^https?:\/\//, '')),
                h('small', null, t('liveWithCode')), h('div', { class: 'bigcode' }, `${code.slice(0, 3)} ${code.slice(3)}`))),
            roster,
          ];
        }
        case 'countdown':
          return [h('div', { class: 'ready' }, h('h2', null, ph.q === 0 ? t('liveGetReady') : t('liveQuestion', { n: ph.q + 1, total: g.questions.length })), (live.number = h('div', { class: 'number' }, '')))];
        case 'ask':
        case 'reveal': {
          if (ph.phase === 'reveal' && ph.board) return [heading(ph), standings(t('liveStandings'), 5, ph.q)];
          const q = g.questions[ph.q];
          const parts = questionParts(q, t, g.ui);
          const reveal = ph.phase === 'reveal';
          const counts = reveal ? q.options.map((_, i) => players.filter((p) => p.a?.q === ph.q && p.a.c === i).length) : undefined;
          return [
            h('div', { class: 'qhead' }, heading(ph),
              (live.count = h('small', { class: 'count' }, t('liveAnswered', { n: players.filter((p) => p.a?.q === ph.q).length, total: players.length })))),
            ...askParts(q, parts),
            tiles(q, { reveal, counts }),
            reveal ? h('div', { class: 'lv-timer off' }) : timer(),
          ];
        }
        case 'done':
          return [confetti(), h('h1', null, `🏆 ${t('liveFinal')}`), podium(), players.length > 3 && standings('', 10)];
      }
    }

    /** What a player sees on their phone. */
    function playerBody(ph: Phase): (Node | false | null | undefined)[] {
      const g = game!;
      const p = me!;
      const score = () => h('div', { class: 'myscore' }, h('b', null, p.name), h('span', null, `⭐ ${t('liveScore', { n: p.score })}`));
      switch (ph.phase) {
        case 'lobby':
          return [h('div', { class: 'ready' }, h('div', { class: 'emoji' }, '⛵'), h('h2', null, t('liveYouAreIn', { name: p.name })), h('p', null, t('liveWatchScreen')), langPicker())];
        case 'countdown':
          return [score(), h('div', { class: 'ready' }, h('h2', null, ph.q === 0 ? t('liveGetReady') : t('liveQuestion', { n: ph.q + 1, total: g.questions.length })), (live.number = h('div', { class: 'number' }, '')))];
        case 'ask': {
          const q = g.questions[ph.q];
          const parts = questionParts(q, t, d.ui());
          const answered = p.a?.q === ph.q;
          return [
            score(), heading(ph), ...askParts(q, parts),
            answered ? tiles(q, { chosen: p.a!.c }) : tiles(q, { onPick: (i) => answer(ph, i) }),
            answered ? h('p', { class: 'hint center' }, `✔ ${t('liveLocked')}`) : null,
            timer(),
          ];
        }
        case 'reveal': {
          const q = g.questions[ph.q];
          const a = p.a?.q === ph.q ? p.a : null;
          const place = (live.place = h('div', { class: 'place' }, ''));
          showPlace(place);
          return [
            score(), heading(ph),
            h('div', { class: `result ${a?.ok ? 'ok' : 'bad'}` },
              h('div', { class: 'emoji' }, a ? (a.ok ? '✅' : '❌') : '⏰'),
              h('h2', null, a ? (a.ok ? t('liveRight') : t('liveWrong')) : t('liveTimeUp')),
              a?.ok && h('b', { class: 'pts' }, t('livePoints', { n: a.pts })),
              a?.ok && p.streak >= 2 && h('small', null, `🔥 ${t('liveStreak', { n: p.streak })}`)),
            place,
            // worth a look while waiting: what the right answer was, and what it means
            h('div', { class: 'quote answer' }, h('b', null, name(q.term)),
              h('span', null, plain((LANGS[d.ui()] ?? FALLBACK).terms[q.term].desc).split('\n')[0])),
          ];
        }
        case 'done': {
          const place = (live.place = h('div', { class: 'place big' }, ''));
          showPlace(place);
          return [
            confetti(),
            h('div', { class: 'ready' }, h('div', { class: 'emoji' }, '🏆'), h('h2', null, t('liveFinal')), place,
              h('p', null, `⭐ ${t('liveScore', { n: p.score })} · ✓ ${p.right}/${g.questions.length}`)),
            watchingPlayers && standings(t('liveStandings'), 10),
            btn(`⛵ ${t('liveLearnMore')}`, d.goHome, 'btn primary'),
          ];
        }
      }
    }

    /** The host's lobby: how to invite people, how to get the big screen up, and the start button. */
    function hostLobby(): (Node | false | null | undefined)[] {
      const roster = (live.roster = h('div', { class: 'roster' }));
      fillRoster(roster);
      const share = async () => {
        if (navigator.share) {
          try {
            return await navigator.share({ title: t('liveTitle'), text: t('liveInviteText', { code }), url: joinUrl });
          } catch (e) {
            if ((e as Error).name === 'AbortError') return;
          }
        }
        void copy(joinUrl, t);
      };
      const PR = (window as unknown as { PresentationRequest?: new (urls: string[]) => { start(): Promise<unknown> } }).PresentationRequest;
      const start = (live.start = btn(`▶ ${t('liveStart')}`, () => {
        backend.updateGame(code, startPatch(backend.now())).catch(() => d.toast(t('liveUnavailable')));
        d.track('live-start');
      }, 'btn primary', !players.length));
      return [
        h('div', { class: 'topbar' }, btn('←', () => d.navigate('party'), 'icon'), h('h2', null, `🎉 ${t('liveTitle')}`)),
        h('section', { class: 'settings' },
          h('b', null, `1. 📺 ${t('liveScreenTitle')}`),
          h('p', { class: 'hint' }, t('liveScreenHint')),
          h('code', { class: 'url' }, screenUrl.replace(/^https?:\/\//, '')),
          h('div', { class: 'actions' },
            btn(t('liveCopy'), () => void copy(screenUrl, t), 'btn ghost small'),
            btn(t('liveOpenScreen'), () => window.open(screenUrl, '_blank'), 'btn ghost small'),
            PR && btn(t('liveCast'), () => { new PR([screenUrl]).start().catch(() => {}); }, 'btn ghost small'))),
        h('section', { class: 'settings' },
          h('b', null, `2. 📱 ${t('liveInvite')}`),
          h('p', { class: 'hint' }, t('liveInviteHint')),
          h('div', { class: 'invite' },
            h('div', { class: 'qr', html: qr(joinUrl) }),
            h('div', null, h('small', null, t('liveCode')), h('div', { class: 'bigcode' }, `${code.slice(0, 3)} ${code.slice(3)}`))),
          h('div', { class: 'actions' },
            btn(`📣 ${t('liveShareInvite')}`, () => void share(), 'btn ghost small'),
            btn(t('liveCopy'), () => void copy(joinUrl, t), 'btn ghost small'))),
        h('section', { class: 'settings' },
          h('b', null, `3. ${t('livePlayToo')}`),
          me ? h('p', { class: 'hint' }, `✔ ${t('liveYouAreIn', { name: me.name })}`) : joinForm()),
        roster,
        start,
      ];
    }

    function draw(ph: Phase) {
      live = {};
      const g = game!;
      root.dataset.phase = ph.phase;
      if (asScreen) {
        const full = ph.phase === 'lobby' && document.fullscreenEnabled && !document.fullscreenElement
          && h('button', { type: 'button', class: 'fullscreen', title: 'Fullscreen', 'aria-label': 'Fullscreen', onclick: () => { void document.documentElement.requestFullscreen().catch(() => {}); } }, '⛶');
        return root.replaceChildren(...[full, h('div', { class: 'corner' }, `🎉 ${joinUrl.replace(/^https?:\/\//, '')}`), ...screenBody(ph)].filter((x): x is HTMLElement => Boolean(x)));
      }
      let body: (Node | false | null | undefined)[];
      if (isHost() && ph.phase === 'lobby') body = hostLobby();
      else if (isHost() && !me) body = [h('div', { class: 'hostview' }, ...screenBody(ph).filter((x): x is HTMLElement => Boolean(x)))];
      else if (!me) body = [
        h('div', { class: 'topbar' }, btn('←', () => d.navigate('party'), 'icon'), h('h2', null, `🎉 ${t('liveTitle')}`)),
        ph.phase === 'done' ? h('div', { class: 'quote' }, t('liveFinal')) : h('section', { class: 'settings' }, h('b', null, t('liveJoinTitle')), joinForm(), langPicker()),
      ];
      else body = playerBody(ph);
      // the host can always move the game along by hand
      const bar = isHost() && ph.phase !== 'lobby' && h('div', { class: 'hostbar' },
        h('span', null, `🎉 ${code.slice(0, 3)} ${code.slice(3)} · 👥 ${players.length}`, 'q' in ph ? ` · ❓ ${ph.q + 1}/${g.questions.length}` : ''),
        (ph.phase === 'ask' || ph.phase === 'reveal') && btn(`${t('liveNext')} ▶`, () => {
          const now = backend.now();
          backend.updateGame(code, ph.phase === 'ask' ? revealPatch(g, ph.q, now) : nextPatch(ph.q, now)).catch(() => {});
        }, 'btn ghost small'),
        ph.phase === 'done' && btn(t('liveNewGame'), () => d.navigate('party'), 'btn ghost small'));
      root.replaceChildren(...[bar, ...body].filter((x): x is HTMLElement => Boolean(x)));
    }
  }

  return { hub, run };
}
