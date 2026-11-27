import './style.css';
import { initAnalytics, track } from './analytics.ts';
import { createAccount } from './cloud/account.ts';
import { PARTNERS, SUPPORTERS, SUPPORT_LINKS, activeBanner, supportEnabled } from './support.ts';
import { h } from './dom.ts';
import { LESSONS, LIGHTS_SHOWN, LIGHT_COLORS, TERM_IDS, TOPICS, isSituation, sceneOf, sceneOfTopic, termsOfTopic, type Lesson, type TermId, type TopicId } from './data/model.ts';
import { FALLBACK, LANGS, LANG_LIST, detectLang } from './i18n/index.ts';
import type { UiKey } from './i18n/types.ts';
import { SCENES } from './scenes/index.ts';
import { sceneView, type SceneHandle } from './sceneView.ts';
import { givesWay, situationView } from './situationView.ts';
import { Session, checkTyped, type Exercise } from './session.ts';
import { search } from './search.ts';
import { MIN_PLAYERS, fetchRank } from './cloud/rank.ts';
import { sendMessage } from './cloud/messages.ts';
import { liveAvailable, liveOnHome } from './live/backend.ts';
import { createLive } from './live/ui.ts';
import { createAdmin } from './adminView.ts';
import { MASTERED, boxOf, currentStreak, defaultState, lessonStars, loadState, openTopic, practiceTerms, progressOf, recordSession, recordTest, saveState, unlockNext } from './store.ts';

/** how long a correct answer stays on screen before the next exercise appears */
const AUTO_NEXT_MS = 1200;

const app = document.getElementById('app')!;
let st = loadState(detectLang(navigator.languages ?? [navigator.language]));
// Typing on a phone keyboard is slow, so typing exercises start switched off on
// touch devices. Once the player flips the switch, their choice is remembered.
if (!st.typingSet) st.typing = !matchMedia('(pointer: coarse)').matches;
if (!LANGS[st.ui]) st.ui = FALLBACK.code;
if (!LANGS[st.learn]) st.learn = st.ui;

// optional sign-in; does nothing unless a Firebase project is configured
const account = createAccount(
  () => st,
  () => {
    if (app.querySelector('.signin') && account.user) goHome();
    else if (app.querySelector('.home')) home();
    else if (app.querySelector('.admin')) admin.draw();
  },
  () => prompt(t('emailPrompt')),
);
const openSignIn = () => navigate('signin');

/**
 * Signing out leaves the device clean: the progress is safe in the account, and
 * whoever signs in next starts from their own progress only (instead of
 * inheriting this player's). Settings such as languages are kept.
 */
async function signOutAndClear() {
  if (!confirm(t('signOutConfirm'))) return;
  try {
    await account.signOut();
  } catch {
    return toast(t('signInOffline'));
  }
  st = { ...defaultState(st.ui), learn: st.learn, typing: st.typing, typingSet: st.typingSet, loginDismissed: st.loginDismissed };
  saveState(st);
  home();
  toast(t('signedOut'));
}

/** The optional sign-in page: Google, Apple, or a link sent by email. */
function signInScreen(sentTo = '') {
  const attempt = async (action: () => Promise<void>, done?: () => void) => {
    try {
      await action();
      done?.();
    } catch (e) {
      const code = String((e as { code?: string }).code ?? '');
      // closing the provider's window is not an error worth reporting
      if (/popup-closed|cancelled-popup/.test(code)) return;
      track(`signin-error/${code || 'unknown'}`);
      // say what went wrong when it is something the player can act on
      toast(/quota-exceeded/.test(code) ? t('emailQuota')
        : /operation-not-allowed|invalid-oauth|configuration/.test(code) ? t('signInUnavailable')
        : /network-request-failed/.test(code) ? t('signInOffline')
        : t('signInFailed'));
    }
  };
  const email = h('input', { type: 'email', class: 'answer', placeholder: t('emailPlaceholder'), autocomplete: 'email', inputmode: 'email', required: true });
  const form = h('form', { class: 'emailform', onsubmit: (e: Event) => {
    e.preventDefault();
    const address = email.value.trim();
    if (address) attempt(() => account.sendEmailLink(address), () => signInScreen(address));
  } }, email, h('button', { type: 'submit', class: 'btn primary' }, t('sendLink')));
  show(h('div', { class: 'screen signin' },
    h('div', { class: 'topbar' }, button('←', goHome, 'icon'), h('h2', null, t('signInTitle'))),
    h('p', { class: 'hint' }, t('signInDesc')),
    sentTo
      ? h('div', { class: 'quote' }, `✉️ ${t('linkSent', { email: sentTo })}`)
      : [
          button(t('withGoogle'), () => attempt(() => account.signIn('google')), 'btn provider'),
          button(t('withApple'), () => attempt(() => account.signIn('apple')), 'btn provider'),
          h('p', { class: 'hint or' }, t('orEmail')),
          form,
        ],
    h('small', null, t('privacyNote'))));
}

// ---- language helpers -------------------------------------------------------
const UI = () => LANGS[st.ui];
const LEARN = () => LANGS[st.learn];
const bilingual = () => st.ui !== st.learn;
function t(key: UiKey, vars: Record<string, string | number> = {}): string {
  let s = UI().ui[key] ?? FALLBACK.ui[key];
  for (const k in vars) s = s.replaceAll(`{${k}}`, String(vars[k]));
  return s;
}
/** the term in the language being learned */
const termName = (id: TermId) => LEARN().terms[id].name;
/** the same term in the language the learner speaks */
const termHint = (id: TermId) => UI().terms[id].name;
/** a term's explanation; a line break in the text starts a new short paragraph */
const termDesc = (id: TermId) => UI().terms[id].desc.split('\n').map((part) => h('span', { class: 'para' }, part));

let onKey: ((e: KeyboardEvent) => void) | null = null;
document.addEventListener('keydown', (e) => onKey?.(e));

function show(screen: HTMLElement, keys: typeof onKey = null) {
  onKey = keys;
  document.documentElement.lang = st.ui;
  document.title = t('appTitle');
  app.replaceChildren(screen);
  window.scrollTo(0, 0);
  applyUpdateWhenSafe();
}

const stars = (n: number) =>
  h('span', { class: 'stars', 'aria-label': `${n}/3` }, [0, 1, 2].map((i) => h('span', { class: i < n ? 'on' : '' }, '★')));

function button(label: string, onclick: () => void, cls = 'btn primary', disabled = false) {
  return h('button', { type: 'button', class: cls, onclick, disabled }, label);
}

// ---- home -------------------------------------------------------------------
/** @param toProgress scroll down to the topic the player is working on */
function home({ toProgress = false } = {}) {
  const y = window.scrollY;
  const p = progressOf(st);
  const active = LESSONS.filter((l) => st.topics.includes(l.topic));
  const terms = active.flatMap((l) => [...l.terms]);
  const mastered = terms.filter((x) => boxOf(p, x) >= MASTERED).length;
  const nextUp = active.find((l) => lessonStars(p, l) === 0);
  const practice = practiceTerms(st);

  const langSelect = (label: string, value: string, set: (v: string) => void) =>
    h('label', { class: 'lang' }, h('span', null, label),
      h('select', { onchange: (e: Event) => { set((e.target as HTMLSelectElement).value); saveState(st); home(); } },
        LANG_LIST.map((l) => h('option', { value: l.code, selected: l.code === value }, l.name))));

  const topicCard = (topic: (typeof TOPICS)[number]) => {
    const on = st.topics.includes(topic.id);
    const info = UI().topics[topic.id];
    const tt = termsOfTopic(topic.id);
    const done = tt.filter((x) => boxOf(p, x) >= MASTERED).length;
    const toggle = h('input', {
      type: 'checkbox', checked: on, 'aria-label': t('topicToggle'),
      onchange: () => { openTopic(st, topic.id, !on); home(); },
    });
    const lessons = LESSONS.filter((l) => l.topic === topic.id).map((l) =>
      h('div', { class: 'lessonrow' },
        h('button', { type: 'button', class: `lesson${l === nextUp ? ' next' : ''}`, onclick: () => startLesson(l) },
          h('span', { class: 'num' }, String(LESSONS.indexOf(l) + 1)),
          h('span', { class: 'lt' }, h('b', null, UI().lessons[l.id]), h('small', null, l.terms.map(termName).join(' · '))),
          l === nextUp ? h('span', { class: 'go' }, t('start')) : stars(lessonStars(p, l))),
        lessonStars(p, l) < 3 && h('button', { type: 'button', class: 'icon test', 'aria-label': t('test'), title: t('test'), onclick: () => navigate(`test=${l.id}`) }, '🎯'),
        shareButton(`lesson=${l.id}`, UI().lessons[l.id])));
    return h('section', { class: `topic${on ? '' : ' off'}`, 'data-topic': topic.id },
      h('header', null,
        h('div', { class: 'thumb' }, sceneView(SCENES[topic.scene]).el),
        h('div', { class: 'tt' }, h('h2', null, info.name), h('p', null, info.desc),
          h('div', { class: 'meter' }, h('i', { style: `width:${(done / tt.length) * 100}%` })),
          h('small', null, `${done} / ${tt.length} ${t('mastered')}`)),
        h('label', { class: 'switch', title: t('topicToggle') }, toggle, h('span', null))),
      !on && h('div', { class: 'locked' }, h('p', null, `🔒 ${t('lockedHint')}`),
        button(t('openTopic'), () => { openTopic(st, topic.id); home(); }, 'btn ghost small')),
      on && h('div', { class: 'lessons' }, lessons),
      on && button(`🔍 ${t('explore')}`, () => navigate(`explore=${topic.id}`), 'btn ghost'));
  };

  show(h('div', { class: 'screen home' },
    h('header', { class: 'hero' },
      h('div', { class: 'logo', html: LOGO }),
      h('div', null, h('h1', null, t('appTitle')), h('p', null, t('tagline'))),
      h('div', { class: 'heroactions' },
        h('button', { type: 'button', class: 'iconbtn', 'aria-label': t('search'), title: t('search'), onclick: () => navigate('search') }, '🔍'),
        supportEnabled() && h('button', { type: 'button', class: 'toplink', title: t('supportTitle'), onclick: () => navigate('support') }, `❤️ ${t('supportShort')}`))),
    h('div', { class: 'langs' },
      langSelect(t('iSpeak'), st.ui, (v) => (st.ui = v)),
      langSelect(t('iLearn'), st.learn, (v) => (st.learn = v))),
    h('div', { class: 'stats' },
      h('div', null, h('b', null, `🔥 ${currentStreak(st)}`), h('small', null, t('streak'))),
      h('div', null, h('b', null, `⭐ ${st.xp}`), h('small', null, t('xp'))),
      h('div', null, h('b', null, `⚓ ${mastered}/${terms.length}`), h('small', null, t('mastered'))),
      rankTile()),
    rankDetails(),
    account.available && !account.user && !st.account && !st.loginDismissed && h('div', { class: 'banner' },
      h('span', { class: 'bi' }, '☁️'),
      h('div', null, h('p', null, t('syncBanner')),
        h('div', { class: 'ba' }, button(t('signIn'), openSignIn, 'btn primary small'),
          button(t('notNow'), () => { st.loginDismissed = true; saveState(st); home(); }, 'btn link'))),
      ),
    // practice and the party quiz side by side
    h('div', { class: 'duo' },
      h('button', { type: 'button', class: 'practice', disabled: !practice.length, onclick: startPractice },
        h('span', { class: 'pi' }, '🧭'),
        h('span', null, h('b', null, t('practice')), h('small', null, practice.length ? t('practiceDesc') : t('practiceNone')))),
      liveOnHome() && h('button', { type: 'button', class: 'practice party', onclick: () => navigate('party') },
        h('span', { class: 'pi' }, '🎉'),
        h('span', null, h('b', null, t('liveTile')), h('small', null, t('liveTileDesc'))))),
    sponsorBanner(),
    h('h3', { class: 'section' }, t('topics')),
    h('p', { class: 'hint' }, t('testHint')),
    TOPICS.map(topicCard),
    supportEnabled() && supportCard(),
    h('h3', { class: 'section' }, t('settings')),
    h('section', { class: 'settings' },
      h('label', { class: 'row' },
        h('span', null, h('b', null, t('typing')), h('small', null, t('typingDesc'))),
        h('span', { class: 'switch' }, h('input', { type: 'checkbox', checked: st.typing, onchange: () => { st.typing = !st.typing; st.typingSet = true; saveState(st); } }), h('span', null))),
      account.available && h('div', { class: 'row' },
        h('span', null, h('b', null, account.user || st.account ? t('signedInAs', { name: (account.user ?? st.account)!.name }) : t('account')),
          h('small', null, account.user
            ? account.status === 'error' ? t('syncError') : account.status === 'loading' ? '…' : t('syncOk')
            : st.account ? t('syncError') : t('accountDesc'))),
        account.user || st.account
          ? button(t('signOut'), signOutAndClear, 'btn ghost small')
          : button(t('signIn'), openSignIn, 'btn primary small')),
      button(t('reset'), () => {
        if (!confirm(t('resetConfirm'))) return;
        st = { ...defaultState(st.ui), learn: st.learn, typing: st.typing, typingSet: st.typingSet, topics: st.topics, account: st.account, loginDismissed: st.loginDismissed };
        saveState(st);
        home();
      }, 'btn ghost danger')),
    h('footer', null, t('footer'), account.available && ` ${t('privacyNote')}`,
      supportEnabled() && h('div', null, h('button', { type: 'button', class: 'btn link', onclick: () => navigate('support') }, t('supportLink'))),
      h('div', null, h('button', { type: 'button', class: 'btn link', onclick: () => navigate('changelog') }, `${t('version', { n: __VERSION__ })} · ${t('whatsNew')}`)))));

  // Coming back to the list: show the topic being worked on (or the next closed one),
  // unless it is one of the first two, which are visible anyway.
  const target = nextUp?.topic ?? TOPICS.find((x) => !st.topics.includes(x.id))?.id;
  const el = toProgress && target && TOPICS.findIndex((x) => x.id === target) >= 2 ? app.querySelector<HTMLElement>(`.topic[data-topic="${target}"]`) : null;
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' });
  else if (!toProgress) window.scrollTo(0, y);
}

// ---- supporting the project ------------------------------------------------------
/** A small, friendly invitation; never blocks anything. */
function supportCard() {
  return h('button', { type: 'button', class: 'supportcard', onclick: () => navigate('support') },
    h('span', { class: 'si' }, '❤️'),
    h('span', null, h('b', null, t('supportCardTitle')), h('small', null, t('supportCardText'))));
}

function supportScreen() {
  track('support-open');
  const link = (href: string | null, label: string, cls: string, name: string) =>
    href && h('a', { class: `btn ${cls}`, href, target: '_blank', rel: 'noopener', onclick: () => track(`support-click/${name}`) }, label);
  show(h('div', { class: 'screen support' },
    h('div', { class: 'topbar' }, button('←', goHome, 'icon'), h('h2', null, t('supportTitle'))),
    h('div', { class: 'trophy' }, '⛵'),
    // sharing first: it helps the most and costs nothing
    t('supportIntro').split('\n').map((line) => h('p', null, line)),
    button(`📣 ${t('supportShare')}`, () => { track('support-click/share'); share('', t('appTitle')); }, 'btn primary'),
    h('section', { class: 'settings' },
      h('b', null, `☕ ${t('supportPayTitle')}`),
      h('p', null, t('supportPayText')),
      h('p', { class: 'hint' }, t('supportHow')),
      link(SUPPORT_LINKS.wise, `💸 ${t('supportWise')}`, 'provider', 'wise'),
      link(SUPPORT_LINKS.kofi, `☕ ${t('supportKofi')}`, 'provider', 'kofi'),
      link(SUPPORT_LINKS.github, `💙 ${t('supportGithub')}`, 'provider', 'github')),
    h('section', { class: 'settings' },
      h('b', null, `🤝 ${t('supportPartnersTitle')}`),
      h('p', { class: 'hint' }, t('supportPartnersText')),
      PARTNERS.map((pt) => h('div', { class: 'partner' },
        pt.url ? h('a', { href: pt.url, target: '_blank', rel: 'noopener' }, pt.name) : h('b', null, pt.name),
        pt.note && h('small', null, pt.note[st.ui] ?? pt.note.en ?? ''))),
      partnerContact()),
    h('section', { class: 'settings' },
      h('b', null, `🙏 ${t('supportThanksTitle')}`),
      h('p', null, t('supportThanksText')),
      SUPPORTERS.length ? h('p', { class: 'supporters' }, SUPPORTERS.join(' · ')) : h('small', null, t('supportNone')))));
}

/** A partner's banner for the agreed period; nothing when there is none. */
function sponsorBanner() {
  const b = activeBanner();
  if (!b) return null;
  return h('a', { class: 'sponsor', href: b.url, target: '_blank', rel: 'noopener sponsored', onclick: () => track(`partner-click/${b.name}`) },
    h('small', null, t('partnerLabel')),
    b.image ? h('img', { src: b.image, alt: b.name, loading: 'lazy' }) : h('b', null, b.name),
    h('span', null, b.text[st.ui] ?? b.text.en ?? ''));
}

// ---- TOP x % ----------------------------------------------------------------------
let rankLoading = false;
let rankOpen = false;
/** The fourth stat tile: the player's place among everyone with a score; tap for details. */
function rankTile() {
  if (!account.available || st.xp <= 0) return null;
  const r = st.rank;
  // refresh when the XP changed or the figure is older than ten minutes
  if (!rankLoading && (!r || r.xp !== st.xp || Date.now() - r.at > 10 * 60_000)) {
    rankLoading = true;
    fetchRank(st.xp, Boolean(account.user))
      .then((fresh) => {
        if (!fresh) return;
        // remember whether the standing went up or down, to show it as an arrow
        const old = st.rank?.top;
        fresh.change = old === undefined ? 0 : old === fresh.top ? st.rank?.change ?? 0 : old - fresh.top;
        st.rank = fresh;
        saveState(st);
        if (app.querySelector('.home')) home();
      })
      .catch(() => {
        /* offline or not set up yet: keep the last figure */
      })
      .finally(() => { rankLoading = false; });
  }
  // the number of players is not shown: only where this player stands
  if (!r || r.players < MIN_PLAYERS) return null;
  const change = r.change ?? 0;
  return h('div', { class: `ranktile${rankOpen ? ' open' : ''}`, role: 'button', tabindex: 0, title: t('rankTitle'),
    onclick: () => { rankOpen = !rankOpen; home(); } },
    h('b', null, `🏆 ${r.top}%`),
    h('small', null, t('rankTop'), change > 0 && h('span', { class: 'up' }, ' ↑'), change < 0 && h('span', { class: 'down' }, ' ↓')));
}

/** Shown under the stats after tapping the ranking tile. */
function rankDetails() {
  const r = st.rank;
  if (!rankOpen || !r || r.players < MIN_PLAYERS) return null;
  return h('div', { class: 'quote rankdetails' },
    t('rankPlace', { top: r.top }), ' ',
    r.nextXp === null || r.nextXp === undefined ? t('rankFirst') : t('rankNext', { xp: r.nextXp - r.xp + 1 }));
}

// ---- messages to the developer -------------------------------------------------------
/** "Become a partner": a short form that is stored for the developer to read. */
function partnerContact() {
  const box = h('div', { class: 'partnerbox' });
  const openForm = () => {
    track('support-click/partner');
    const name = h('input', { class: 'answer small', placeholder: t('partnerName'), autocomplete: 'organization' });
    const contact = h('input', { class: 'answer small', placeholder: t('partnerContactField'), autocomplete: 'email', required: true });
    const text = h('textarea', { class: 'answer small', rows: 3, placeholder: t('partnerMessage') });
    const send = h('button', { type: 'submit', class: 'btn primary' }, t('send'));
    const form = h('form', { class: 'emailform', onsubmit: async (e: Event) => {
      e.preventDefault();
      if (!contact.value.trim()) return contact.focus();
      send.disabled = true;
      try {
        await sendMessage({ kind: 'partner', name: name.value.trim(), contact: contact.value.trim(), text: text.value.trim() || '-', lang: st.ui });
        track('partner-sent');
        box.replaceChildren(h('div', { class: 'quote unlock' }, `✓ ${t('sentThanks')}`));
      } catch {
        send.disabled = false;
        toast(t('sendFailed'));
      }
    } }, name, contact, text, send);
    box.replaceChildren(form);
    name.focus();
  };
  box.replaceChildren(button(`✉️ ${t('supportContact')}`, openForm, 'btn ghost small'));
  return box;
}

/** "Suggest adding it" in the search: one tap sends the missing word. */
function suggestButton(q: string) {
  const b = button(`✉️ ${t('searchSuggest')}`, async () => {
    b.disabled = true;
    try {
      await sendMessage({ kind: 'term', text: q, lang: st.ui });
      track('search-suggest');
      b.replaceWith(h('p', { class: 'sent' }, `✓ ${t('suggestSent', { q })}`));
    } catch {
      b.disabled = false;
      toast(t('sendFailed'));
    }
  }, 'btn ghost small');
  return b;
}

// ---- search ----------------------------------------------------------------------
function searchScreen(initial = '') {
  const input = h('input', {
    type: 'search', class: 'answer', value: initial, placeholder: t('searchPlaceholder'), 'aria-label': t('search'),
    autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'search',
  });
  const list = h('div', { class: 'results-list' });
  const langs = [...new Set([LEARN(), UI(), ...LANG_LIST])];
  const render = () => {
    const q = input.value.trim();
    if (q.length < 2) return list.replaceChildren(h('p', { class: 'hint' }, t('searchHint')));
    const hits = search(q, langs);
    if (!hits.length) {
      return list.replaceChildren(h('div', { class: 'quote' },
        h('p', null, t('searchNone', { q })),
        suggestButton(q)));
    }
    list.replaceChildren(...hits.map((hit) => h('button', {
      type: 'button', class: 'hit',
      onclick: () => {
        track('search-open');
        // keep the query in the address so Back returns to these results
        history.replaceState(null, '', `#search=${encodeURIComponent(q)}`);
        navigate(`explore=${hit.topic}&term=${hit.term}`);
      },
    },
      h('span', { class: 'ht' }, h('b', null, termName(hit.term)), bilingual() && h('small', null, termHint(hit.term))),
      h('small', { class: 'htopic' }, `${st.topics.includes(hit.topic) ? '' : '🔒 '}${UI().topics[hit.topic].name}`))));
  };
  input.addEventListener('input', render);
  show(h('div', { class: 'screen search' },
    h('div', { class: 'topbar' }, button('←', goHome, 'icon'), h('h2', null, t('search'))),
    input, list));
  render();
  input.focus();
}

// ---- what's new ---------------------------------------------------------------
function changelog() {
  const days = new Map<string, typeof __CHANGELOG__>();
  for (const e of __CHANGELOG__) days.set(e.date, [...(days.get(e.date) ?? []), e]);
  show(h('div', { class: 'screen changelog' },
    h('div', { class: 'topbar' }, button('←', goHome, 'icon'), h('h2', null, t('whatsNew'))),
    h('p', { class: 'hint' }, t('version', { n: __VERSION__ })),
    [...days].map(([date, entries]) => h('section', { class: 'settings' },
      h('small', null, new Date(date).toLocaleDateString(st.ui, { year: 'numeric', month: 'long', day: 'numeric' })),
      h('ul', null, entries.map((e) => h('li', null, h('b', null, `v${e.v} `), e.text)))))));
}

const LOGO = `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="32" fill="#0b6fb8"/><path d="M33 10 V44 H13 Q24 30 33 10Z" fill="#fff"/><path d="M37 16 Q50 30 52 44 H37Z" fill="#ffd166"/><path d="M10 48 H54 L48 56 H16Z" fill="#fff"/></svg>`;

// ---- explore ----------------------------------------------------------------
function explore(topic: TopicId, selected?: TermId) {
  const scene = SCENES[sceneOfTopic(topic)];
  const terms = termsOfTopic(topic);
  const view = sceneView(scene, {
    dense: true,
    detail: selected,
    highlight: selected ? [selected] : [],
    pins: terms.map((id) => ({ id, state: id === selected ? 'sel' : undefined })),
    onPin: (id) => explore(topic, id),
  });
  const y = window.scrollY;
  show(h('div', { class: 'screen explore' },
    h('div', { class: 'topbar' }, button('←', goHome, 'icon'), h('h2', null, UI().topics[topic].name), shareButton(`explore=${topic}`, UI().topics[topic].name)),
    view.el,
    selected && isSituation(selected) && situationView(selected, { mark: true }).el,
    selected ? termCard(selected) : h('p', { class: 'hint' }, t('exploreHint')),
    h('div', { class: 'chips' }, terms.map((id) =>
      h('button', { type: 'button', class: `chip${id === selected ? ' on' : ''}`, onclick: () => explore(topic, id) }, termName(id))))));
  window.scrollTo(0, y);
}

/** For night signals: the lights that are on, each with coloured dots. */
function lightList(id: TermId) {
  const lights = LIGHTS_SHOWN[id];
  if (!lights) return null;
  return h('div', { class: 'lightlist' },
    h('small', null, t('lightsOn')),
    h('ul', null, lights.map((l) => h('li', null,
      h('span', { class: 'dots', 'aria-hidden': 'true' }, [...LIGHT_COLORS[l]].map((c) => h('i', { class: `lc-${c}` }))),
      UI().lights[l]))));
}

function termCard(id: TermId, label?: string) {
  const alt = LEARN().terms[id].alt ?? [];
  return h('div', { class: 'termcard' },
    label && h('small', { class: 'tag' }, label),
    h('b', { class: 'name' }, termName(id)),
    bilingual() && h('span', { class: 'tr' }, `${UI().name}: ${termHint(id)}`),
    h('p', null, termDesc(id)),
    lightList(id),
    alt.length > 0 && h('div', { class: 'alts' }, h('span', null, t('alsoCalled')), alt.map((a) => h('b', null, a))));
}

// ---- sessions ---------------------------------------------------------------
function newSession(terms: TermId[]) {
  const p = progressOf(st);
  return new Session(terms, { box: (x) => boxOf(p, x), typing: st.typing, bilingual: bilingual(), nameOf: termName });
}
const startLesson = (lesson: Lesson) => navigate(`lesson=${lesson.id}`);
const startPractice = () => navigate('practice');
function openLesson(lesson: Lesson) {
  track(`lesson-start/${lesson.id}`);
  runSession(newSession([...lesson.terms]), lesson);
}
/** A lesson's test: pass it and the lesson counts as mastered without doing the drills. */
function openTest(lesson: Lesson) {
  track(`test-start/${lesson.id}`);
  const p = progressOf(st);
  const sess = new Session([...lesson.terms], { box: (x) => boxOf(p, x), typing: st.typing, bilingual: bilingual(), nameOf: termName, test: true });
  runSession(sess, lesson, true);
}
/** how many wrong answers a test of n questions forgives */
const allowedMistakes = (questions: number) => Math.floor(questions * 0.15);
function openPractice(terms: TermId[]) {
  track('practice-start');
  runSession(newSession(terms), null);
}

// ---- links ------------------------------------------------------------------
// The part of the address after # says what is open, e.g. #lesson=hull2&learn=et,
// so a lesson or picture can be sent to someone as a link.
const linkTo = (target: string) => `${target}&learn=${st.learn}`;

function navigate(target: string) {
  const hash = target ? `#${linkTo(target)}` : '';
  if (location.hash === hash || (!hash && location.hash.length <= 1)) route();
  else location.hash = hash;
}
const goHome = () => navigate('');

function route() {
  const q = new URLSearchParams(location.hash.slice(1));
  const learn = q.get('learn');
  if (learn && LANGS[learn] && learn !== st.learn) {
    st.learn = learn;
    saveState(st);
  }
  const lesson = LESSONS.find((l) => l.id === q.get('lesson'));
  if (lesson) return openLesson(lesson);
  const test = LESSONS.find((l) => l.id === q.get('test'));
  if (test) return openTest(test);
  const topic = TOPICS.find((x) => x.id === q.get('explore'));
  if (topic) {
    const term = TERM_IDS.find((x) => x === q.get('term'));
    return explore(topic.id, term && termsOfTopic(topic.id).includes(term) ? term : undefined);
  }
  if (liveAvailable()) {
    // the party quiz: #party to create or join, #game=<code> to play or host, #screen=<code> for the big screen
    const game = q.get('game') ?? q.get('screen');
    if (game && /^\d{6}$/.test(game)) return void live.run(game, q.has('screen'));
    if (q.has('party')) return live.hub();
  }
  if (q.has('admin') && account.available) return admin.screen();
  if (q.has('search')) return searchScreen(q.get('search') ?? '');
  if (q.has('changelog')) return changelog();
  if (q.has('support') && supportEnabled()) return supportScreen();
  if (q.has('signin') && account.available && !account.user) return signInScreen();
  if (q.has('practice')) {
    const terms = practiceTerms(st);
    if (terms.length) return openPractice(terms);
  }
  home({ toProgress: true });
}
window.addEventListener('hashchange', route);

const admin = createAdmin({ show, goHome, toast, signIn: () => navigate('signin'), user: () => account.user, expectsUser: () => Boolean(st.account) && !account.user && account.status !== 'error', token: () => account.token() });
const live = createLive({ show, toast, goHome, navigate, track, ui: () => st.ui, setUi: (lang) => { st.ui = lang; saveState(st); }, learn: () => st.learn, topics: () => st.topics });

function toast(message: string) {
  const el = h('div', { class: 'toast', role: 'status' }, message);
  document.body.append(el);
  setTimeout(() => el.remove(), 2200);
}

async function share(target: string, title: string) {
  const base = location.href.split('#')[0];
  const url = target ? `${base}#${linkTo(target)}` : base;
  if (navigator.share) {
    try {
      await navigator.share({ title: `${t('appTitle')}: ${title}`, url });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return; // the share sheet was closed
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast(t('linkCopied'));
  } catch {
    prompt(t('share'), url);
  }
}

const SHARE_ICON = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.7l6.8-4M8.6 13.3l6.8 4"/></svg>`;
const shareButton = (target: string, title: string) =>
  h('button', { type: 'button', class: 'icon share', 'aria-label': t('share'), title: t('share'), html: SHARE_ICON, onclick: () => share(target, title) });

function runSession(sess: Session, lesson: Lesson | null, test = false) {
  const bar = h('i', null);
  const body = h('div', { class: 'ex' });
  const foot = h('div', { class: 'foot' });
  const quit = () => { if (sess.asked === 0 || confirm(t('quitConfirm'))) goHome(); };
  const root = h('div', { class: 'screen session' },
    h('div', { class: 'topbar' }, h('button', { type: 'button', class: 'icon', 'aria-label': t('quit'), onclick: quit }, '✕'), h('div', { class: 'meter big' }, bar)),
    body, foot);

  let ex: Exercise | null = null;
  let options: HTMLButtonElement[] = [];

  const advance = () => {
    bar.style.width = `${sess.progress * 100}%`;
    ex = sess.next();
    if (!ex) return test && lesson ? testResults(sess, lesson) : results(sess, lesson);
    render(ex);
  };

  const done = (e: Exercise, ok: boolean) => { sess.answer(e, ok); advance(); };

  /** Bottom panel after an answer: verdict, the right answer, Continue. */
  const verdict = (e: Exercise, result: 'ok' | 'close' | 'form' | 'bad', term?: TermId) => {
    foot.className = `foot ${result === 'bad' ? 'bad' : 'ok'}`;
    // A fully correct answer moves on by itself after a moment; anything the
    // learner should read (a mistake, a spelling note) waits for a tap.
    let gone = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const go = () => {
      if (gone) return;
      gone = true;
      clearTimeout(timer);
      if (root.isConnected) done(e, result !== 'bad');
    };
    const also = term ? (LEARN().terms[term].alt ?? []).slice(0, 2) : [];
    // other names for the same thing are worth a moment longer on screen
    const wait = also.length ? AUTO_NEXT_MS + 1000 : AUTO_NEXT_MS;
    const next = button(t('next'), go, result === 'ok' ? 'btn primary auto' : 'btn primary');
    next.style.setProperty('--auto', `${wait}ms`);
    if (result === 'ok') timer = setTimeout(go, wait);
    foot.replaceChildren(
      h('div', { class: 'fb' },
        h('strong', null, result === 'ok' ? `✓ ${t('correct')}` : result === 'close' ? `✓ ${t('almost')}` : result === 'form' ? `✓ ${t('otherForm')}` : `✗ ${t('wrong')}`),
        term && (result !== 'ok' || bilingual() || also.length > 0) && h('div', { class: 'ans' },
          result === 'bad' && h('span', null, `${t('answerIs')} `), h('b', null, termName(term)), bilingual() && ` · ${termHint(term)}`),
        also.length > 0 && h('small', { class: 'also' }, `${t('alsoCalled')} ${also.join(', ')}`),
        term && result === 'bad' && h('p', null, termDesc(term)),
        term && result === 'bad' && lightList(term)),
      next);
    next.focus();
  };

  /** Exercises answered with a single tap need no Check button. */
  const noButton = () => {
    foot.className = 'foot';
    foot.replaceChildren();
  };

  const checkButton = (onCheck: () => void, enabled = false) => {
    const b = button(t('check'), onCheck, 'btn primary', !enabled);
    foot.className = 'foot';
    foot.replaceChildren(b);
    return b;
  };

  /** Radio (single) or checkbox (multi) list of terms. */
  const choices = (ids: TermId[], multi: boolean, onChange: (sel: TermId[]) => void) => {
    const sel = new Set<TermId>();
    options = ids.map((id) => {
      const b = h('button', { type: 'button', class: 'opt', role: multi ? 'checkbox' : 'radio', 'aria-checked': 'false', 'data-id': id },
        h('span', { class: `mark ${multi ? 'box' : 'radio'}` }), h('span', null, termName(id)));
      b.addEventListener('click', () => {
        if (!multi) sel.clear();
        if (multi && sel.has(id)) sel.delete(id); else sel.add(id);
        for (const o of options) {
          const on = sel.has(o.dataset.id as TermId);
          o.classList.toggle('on', on);
          o.setAttribute('aria-checked', String(on));
        }
        onChange([...sel]);
      });
      return b;
    });
    const el = h('div', { class: 'opts', role: multi ? 'group' : 'radiogroup' }, options);
    const reveal = (correct: TermId[]) => {
      for (const o of options) {
        const id = o.dataset.id as TermId;
        o.disabled = true;
        if (correct.includes(id)) o.classList.add('ok');
        else if (sel.has(id)) o.classList.add('bad');
      }
    };
    return { el, reveal };
  };

  const picture = (term: TermId, highlighted: boolean): SceneHandle =>
    sceneView(SCENES[sceneOf(term)], highlighted ? { highlight: [term], detail: term, pins: [{ id: term, state: 'target' }] } : {});

  function render(e: Exercise) {
    options = [];
    body.className = `ex ${e.kind}`;
    switch (e.kind) {
      case 'intro': {
        body.replaceChildren(isSituation(e.term) ? situationView(e.term, { mark: true }).el : picture(e.term, true).el, termCard(e.term, t('newTerm')));
        foot.className = 'foot';
        const b = button(t('gotIt'), () => done(e, true));
        foot.replaceChildren(b);
        b.focus();
        break;
      }
      case 'pick':
      case 'define': {
        // single choice: the answer is checked as soon as it is tapped
        const list = choices(e.options, false, (s) => {
          list.reveal([e.term]);
          verdict(e, s[0] === e.term ? 'ok' : 'bad', e.term);
        });
        const situation = isSituation(e.term);
        if (situation) list.el.classList.add('wide');
        const view = e.kind === 'pick' ? (situation ? situationView(e.term) : picture(e.term, true)) : null;
        const prompt = e.kind === 'pick'
          ? [h('h2', null, situation ? t('qRule') : t('qPick'))]
          : e.by === 'translation'
            ? [h('h2', null, t('qTranslate', { lang: LEARN().name })), h('div', { class: 'quote big' }, termHint(e.term))]
            : [h('h2', null, t('qDefine')), h('div', { class: 'quote' }, termDesc(e.term))];
        body.replaceChildren(...prompt, ...(view ? [view.el] : []), list.el);
        noButton();
        break;
      }
      case 'find': {
        let locked = false;
        const view = sceneView(SCENES[sceneOf(e.term)], {
          pins: e.pins.map((id) => ({ id })),
          onPin: (id) => {
            if (locked) return;
            locked = true;
            const ok = id === e.term;
            if (!ok) view.setPin(id, 'bad');
            view.setPin(e.term, 'ok');
            view.highlight([e.term]);
            view.detail(e.term);
            verdict(e, ok ? 'ok' : 'bad', e.term);
          },
        });
        body.replaceChildren(h('h2', null, isSituation(e.term) ? t('qFindRule') : t('qFind')), h('div', { class: `quote big${isSituation(e.term) ? ' rule' : ''}` }, termName(e.term)), view.el);
        noButton();
        break;
      }
      case 'type': {
        const input = h('input', { type: 'text', class: 'answer', placeholder: t('typeHere'), autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done', lang: st.learn });
        const submit = (giveUp = false) => {
          const term = LEARN().terms[e.term];
          const r = giveUp ? 'wrong' : checkTyped(input.value, [term.name, ...(term.alt ?? []), ...(term.accept ?? [])]);
          input.disabled = true;
          input.classList.add(r === 'wrong' ? 'bad' : 'ok');
          verdict(e, r === 'exact' ? 'ok' : r === 'close' ? 'close' : r === 'form' ? 'form' : 'bad', e.term);
        };
        input.addEventListener('input', () => { check.disabled = !input.value.trim(); });
        body.replaceChildren(h('h2', null, t('qType')), picture(e.term, true).el,
          bilingual() ? h('div', { class: 'quote' }, `${UI().name}: ${termHint(e.term)}`) : h('div', { class: 'quote' }, termDesc(e.term)),
          input, button(t('skip'), () => submit(true), 'btn link'));
        const check = checkButton(() => submit());
        if (matchMedia('(pointer: fine)').matches) input.focus();
        break;
      }
      case 'giveway': {
        let locked = false;
        const answer = (c: 'a' | 'b' | 'both') => {
          if (locked) return;
          locked = true;
          both.disabled = true;
          view.reveal(c);
          const ok = c === givesWay(e.term);
          if (c === 'both') both.classList.add(ok ? 'ok' : 'bad');
          else if (givesWay(e.term) === 'both') both.classList.add('ok');
          verdict(e, ok ? 'ok' : 'bad', e.term);
        };
        const view = situationView(e.term, { onChoose: answer });
        const both = h('button', { type: 'button', class: 'opt both', onclick: () => answer('both') }, `⇄ ${t('both')}`);
        body.replaceChildren(h('h2', null, t('qGiveWay')), view.el, both);
        noButton();
        break;
      }
      case 'group': {
        let sel: TermId[] = [];
        const list = choices(e.options, true, (s) => { sel = s; check.disabled = !s.length; });
        body.replaceChildren(h('h2', null, UI().groups[e.group]), h('p', { class: 'hint' }, `☑ ${t('selectAll')}`), list.el);
        const check = checkButton(() => {
          list.reveal(e.correct);
          const ok = sel.length === e.correct.length && e.correct.every((c) => sel.includes(c));
          verdict(e, ok ? 'ok' : 'bad');
        });
        break;
      }
    }
    window.scrollTo(0, 0);
  }

  show(root, (e) => {
    const main = foot.querySelector<HTMLButtonElement>('.btn.primary');
    if (e.key === 'Enter' && main && !main.disabled) {
      e.preventDefault();
      main.click();
    } else if (/^[1-9]$/.test(e.key) && !(e.target instanceof HTMLInputElement)) {
      options[Number(e.key) - 1]?.click();
    }
  });
  advance();
}

function testResults(sess: Session, lesson: Lesson) {
  const passed = sess.mistakes <= allowedMistakes(sess.total);
  track(`test-${passed ? 'passed' : 'failed'}/${lesson.id}`);
  if (passed) {
    recordTest(st, sess.items);
    return results(sess, lesson, true);
  }
  const acc = Math.round((sess.right / sess.asked) * 100);
  const primary = button(t('startLesson'), () => startLesson(lesson));
  show(h('div', { class: 'screen results' },
    h('div', { class: 'trophy' }, '🧭'),
    h('h1', null, t('testFailed')),
    h('p', { class: 'hint' }, t('testFailedDesc')),
    h('div', { class: 'stats' },
      h('div', null, h('b', null, `🎯 ${acc}%`), h('small', null, t('accuracy')))),
    h('ul', { class: 'review' }, sess.items.map((it) =>
      h('li', null, h('span', { class: it.mistakes ? 'miss' : 'hit' }, it.mistakes ? '✗' : '✓'),
        h('b', null, termName(it.term)), bilingual() && h('span', null, termHint(it.term))))),
    h('div', { class: 'foot' }, primary, button(t('backHome'), goHome, 'btn ghost'))),
  (e) => { if (e.key === 'Enter') primary.click(); });
  primary.focus();
}

function results(sess: Session, lesson: Lesson | null, test = false) {
  // a passed test has already been stored by testResults
  const xp = test ? sess.items.reduce((n, it) => n + (it.mistakes ? 8 : 12), 0) : recordSession(st, sess.items);
  if (!test) track(lesson ? `lesson-done/${lesson.id}` : 'practice-done');
  const unlocked = lesson ? unlockNext(st, lesson.topic) : null;
  const p = progressOf(st);
  const acc = sess.asked ? Math.round((sess.right / sess.asked) * 100) : 100;
  const nextUp = LESSONS.filter((l) => st.topics.includes(l.topic)).find((l) => lessonStars(p, l) === 0);
  const colors = ['#ff7a1a', '#0b6fb8', '#2e9e4f', '#ffd166', '#e4572e', '#ff2d87'];
  const confetti = h('div', { class: 'confetti', 'aria-hidden': 'true' },
    Array.from({ length: 36 }, (_, i) =>
      h('i', { style: `left:${(i * 37) % 100}%;background:${colors[i % colors.length]};animation-delay:${(i % 9) * 0.12}s;animation-duration:${2.2 + (i % 5) * 0.35}s` })));
  const primary = nextUp ? button(t('nextLesson'), () => startLesson(nextUp)) : button(t('backHome'), goHome);
  show(h('div', { class: 'screen results' },
    confetti,
    h('div', { class: 'trophy' }, lesson ? '🏆' : '🧭'),
    h('h1', null, test ? t('testPassed') : lesson ? t('lessonDone') : t('practiceDone')),
    lesson && h('div', { class: 'bigstars' }, stars(lessonStars(p, lesson))),
    unlocked && h('div', { class: 'quote unlock' }, `🔓 ${t('topicUnlocked', { name: UI().topics[unlocked].name })}`),
    // every fourth finished lesson, a gentle reminder that support is possible
    supportEnabled() && lesson && LESSONS.filter((l) => lessonStars(p, l) > 0).length % 4 === 0 && supportCard(),
    h('div', { class: 'stats' },
      h('div', null, h('b', null, `⭐ +${xp}`), h('small', null, t('xpEarned'))),
      h('div', null, h('b', null, `🎯 ${acc}%`), h('small', null, t('accuracy'))),
      h('div', null, h('b', null, `🔥 ${currentStreak(st)}`), h('small', null, t('streak')))),
    h('ul', { class: 'review' }, sess.items.map((it) =>
      h('li', null, h('span', { class: it.mistakes ? 'miss' : 'hit' }, it.mistakes ? '↻' : '✓'),
        h('b', null, termName(it.term)), bilingual() && h('span', null, termHint(it.term)),
        stars(Math.min(3, boxOf(p, it.term)))))),
    h('div', { class: 'foot' }, primary, nextUp && button(t('backHome'), goHome, 'btn ghost'))),
  (e) => { if (e.key === 'Enter') primary.click(); });
  primary.focus();
}

// ---- updates -------------------------------------------------------------------
// An installed app can stay open in the background for days. It checks now and
// then whether a newer version has been published and, if so, reloads itself at
// a safe moment: never during a lesson, only when a menu or picture is on screen.
const UPDATE_TRY = 'saillingo.updateTry';
const UPDATED_FROM = 'saillingo.updatedFrom';
let newVersion = '';

async function checkForUpdate() {
  if (!location.protocol.startsWith('http') || __VERSION__ === 'dev') return;
  try {
    const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const { version } = (await res.json()) as { version?: string };
    if (!version || version === __VERSION__ || Number(version) < Number(__VERSION__)) return;
    // if reloading did not bring the new version (e.g. a slow cache), do not try again for a while
    const [tried, at] = (sessionStorage.getItem(UPDATE_TRY) ?? '').split('|');
    if (tried === version && Date.now() - Number(at) < 10 * 60_000) return;
    newVersion = version;
    applyUpdateWhenSafe();
  } catch {
    /* offline: try again later */
  }
}

function applyUpdateWhenSafe() {
  if (!newVersion || app.querySelector('.session, .results, .live.game, .live.bigscreen')) return;
  try {
    sessionStorage.setItem(UPDATE_TRY, `${newVersion}|${Date.now()}`);
    sessionStorage.setItem(UPDATED_FROM, __VERSION__);
  } catch {
    /* private mode: reload anyway */
  }
  newVersion = '';
  const sw = 'serviceWorker' in navigator ? navigator.serviceWorker.getRegistration() : Promise.resolve(undefined);
  sw.then((r) => r?.update()).catch(() => {}).finally(() => location.reload());
}

route();
initAnalytics();
try {
  const from = sessionStorage.getItem(UPDATED_FROM);
  sessionStorage.removeItem(UPDATED_FROM);
  if (from && from !== __VERSION__) toast(t('updated', { n: __VERSION__ }));
} catch {
  /* no session storage */
}
setTimeout(checkForUpdate, 5000);
setInterval(checkForUpdate, 30 * 60_000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkForUpdate(); });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
