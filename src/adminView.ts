// The admin page (#admin): simple numbers and bar charts for a chosen period.
// English only: it is seen by the site's owner, not by players.
import { Forbidden, installFunnel, loadGames, loadUsers, loadVisitToken, loadVisits, saveVisitToken, summarize, visitorsBy, type Bucket, type GameRow, type UserRow, type Visits } from './admin.ts';
import { h } from './dom.ts';

export interface AdminDeps {
  show(screen: HTMLElement): void;
  goHome(): void;
  signIn(): void;
  toast(message: string): void;
  /** the signed-in account, if any, and whether signing in is still being restored */
  user(): { uid: string; name: string } | null;
  expectsUser(): boolean;
  token(): Promise<string | null>;
}

const PERIODS = [1, 7, 30, 90, 365];

/** One measure over time: bars with the value on hover or tap, and the same figures as a table. */
function barChart(title: string, data: Bucket[], weekly: boolean) {
  const max = Math.max(1, ...data.map((b) => b.value));
  const total = data.reduce((n, b) => n + b.value, 0);
  const W = 320, H = 120, pad = 18, slot = W / data.length;
  const bar = Math.max(2, Math.min(18, slot - 2));
  const tip = h('div', { class: 'tip' }, ' ');
  const say = (b: Bucket | null) => { tip.textContent = b ? `${weekly ? 'Week from ' : ''}${b.label}: ${b.value}` : ' '; };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H + pad}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${title}: ${total} in total`);
  let html = `<line x1="0" x2="${W}" y1="${H}" y2="${H}" class="axis"/><text x="0" y="9" class="lbl">${max}</text>`;
  data.forEach((b, i) => {
    const x = i * slot + (slot - bar) / 2, hgt = b.value ? Math.max(2, (b.value / max) * (H - 14)) : 0;
    // labels: first, last, and a few in between, so they never collide
    const every = Math.ceil(data.length / 6);
    if (i % every === 0 || i === data.length - 1) html += `<text x="${Math.min(W - 12, Math.max(12, i * slot + slot / 2))}" y="${H + 13}" class="lbl" text-anchor="middle">${i === data.length - 1 && i % every ? '' : b.label}</text>`;
    html += `<rect x="${x}" y="${H - hgt}" width="${bar}" height="${hgt}" rx="${Math.min(3, bar / 2)}" class="bar"/><rect x="${i * slot}" y="0" width="${slot}" height="${H}" class="hit" data-i="${i}"/>`;
  });
  svg.innerHTML = html;
  svg.addEventListener('pointermove', (e) => { const i = (e.target as Element).getAttribute?.('data-i'); say(i === null ? null : data[Number(i)]); });
  svg.addEventListener('pointerdown', (e) => { const i = (e.target as Element).getAttribute?.('data-i'); say(i === null ? null : data[Number(i)]); });
  svg.addEventListener('pointerleave', () => say(null));
  return h('section', { class: 'settings chart' },
    h('div', { class: 'charthead' }, h('b', null, title), h('span', null, String(total))),
    svg, tip,
    h('details', null, h('summary', null, 'Table'),
      h('table', null, data.filter((b) => b.value).map((b) => h('tr', null, h('td', null, `${weekly ? 'week from ' : ''}${b.label}`), h('td', null, String(b.value)))))));
}

export function createAdmin(d: AdminDeps) {
  let days = 30;
  let users: UserRow[] | null = null, games: GameRow[] | null = null, visits: Visits | null = null;
  let goatToken: string | null = null;
  let state: 'idle' | 'loading' | 'forbidden' | 'error' = 'idle';
  let loadedFor = '';

  const tile = (value: string | number, label: string) => h('div', null, h('b', null, String(value)), h('small', null, label));

  async function load() {
    const token = await d.token();
    if (!token) return;
    state = 'loading';
    draw();
    try {
      const since = Date.now() - 366 * 86_400_000;
      // everything for the longest period is fetched once; changing the period only recounts
      [users, games, goatToken] = await Promise.all([loadUsers(token), loadGames(token, since), goatToken ?? loadVisitToken(token)]);
      state = 'idle';
      loadedFor = d.user()!.uid;
      if (goatToken) visits = await loadVisits(goatToken, since, Date.now()).catch(() => null);
    } catch (e) {
      state = e instanceof Forbidden ? 'forbidden' : 'error';
    }
    draw();
  }

  function draw() {
    if (!document.querySelector('.admin')) return;
    screen();
  }

  function screen() {
    const user = d.user();
    const top = h('div', { class: 'topbar' }, h('button', { type: 'button', class: 'icon', onclick: d.goHome }, '←'), h('h2', null, '📊 Admin'));
    const page = (...body: (Node | string | null | false)[]) => d.show(h('div', { class: 'screen admin' }, top, ...body.filter((x): x is Node | string => Boolean(x))));
    if (!user) {
      return page(d.expectsUser() ? h('p', { class: 'hint' }, '…') : h('div', { class: 'quote' }, 'Sign in with your admin account to see the statistics.'),
        !d.expectsUser() && h('button', { type: 'button', class: 'btn primary', onclick: d.signIn }, 'Sign in'));
    }
    if (loadedFor !== user.uid && state === 'idle') {
      void load();
      return page(h('p', { class: 'hint' }, 'Loading…'));
    }
    if (state === 'loading') return page(h('p', { class: 'hint' }, 'Loading…'));
    if (state === 'forbidden') {
      return page(h('div', { class: 'quote' }, h('p', null, `${user.name} is not an admin of this site.`),
        h('p', { class: 'hint' }, 'To make this account an admin, add its id to the isAdmin() list in the Firestore rules:'), h('code', { class: 'uid' }, user.uid)));
    }
    if (state === 'error' || !users || !games) return page(h('div', { class: 'quote' }, 'Could not load the statistics. Check the connection and try again.'),
      h('button', { type: 'button', class: 'btn primary', onclick: () => { state = 'idle'; loadedFor = ''; screen(); } }, 'Try again'));

    const now = Date.now();
    const s = summarize(users, games, days, now);
    const weekly = days > 45;
    const visitsBy = visits ? visitorsBy(s.empty, visits, days === 1, now) : null;
    const tokenInput = h('input', { type: 'password', placeholder: 'GoatCounter API token', autocomplete: 'off' });
    page(
      h('div', { class: 'seg' }, PERIODS.map((p) => h('button', { type: 'button', class: p === days ? 'on' : '', onclick: () => { days = p; screen(); } }, p === 1 ? 'Today' : p === 365 ? '1 year' : `${p} d`))),
      !visits && tokenCard(tokenInput, now),
      visitsBy && h('div', { class: 'stats hero' }, tile(visitsBy.reduce((n, b) => n + b.value, 0), 'visitors (everyone)')),
      h('div', { class: 'stats' },
        tile(s.signups, 'new sign-ups'), tile(s.active, 'active accounts'), tile(s.games, 'games created')),
      h('div', { class: 'stats' }, tile(s.totalUsers, 'accounts in all'), tile(s.started, 'games started'), tile(s.players, 'players in games')),
      visitsBy && barChart('Visitors (everyone, signed in or not)', visitsBy, weekly),
      barChart('New sign-ups', s.signupsBy, weekly),
      barChart('Active accounts (by last activity)', s.activeBy, weekly),
      barChart('Party games created', s.gamesBy, weekly),
      visits && h('section', { class: 'settings' }, h('b', null, '📲 Home screen app (last 12 months)'),
        h('table', null, installFunnel(visits.events).map((r) => h('tr', null, h('td', null, r.label, r.ways && h('small', null, ` (${r.ways})`)), h('td', null, String(r.count))))),
        h('p', { class: 'hint' }, 'iPhones do not report installs, so "first start from the home screen" is the best count of installs on all phones. Counting started on 27 Nov 2026.')),
      visits && visits.events.length > 0 && h('section', { class: 'settings' }, h('b', null, 'Actions (last 12 months)'),
        h('table', null, visits.events.slice(0, 15).map((e) => h('tr', null, h('td', null, e.name), h('td', null, String(e.count)))))),
      h('section', { class: 'settings' },
        h('b', null, 'Notes'),
        h('p', { class: 'hint' }, 'Accounts are players who signed in. "Active" counts an account on the day it last saved progress, so one account appears once. Sign-up dates are recorded from version 59 on; older accounts are only in the total. Visitors come from GoatCounter: everyone who opened SailLingo, counted once per day, signed in or not.'),
        h('button', { type: 'button', class: 'btn ghost small', onclick: () => { loadedFor = ''; screen(); } }, '↻ Refresh')));
  }

  function tokenCard(tokenInput: HTMLInputElement, now: number) {
    return h('section', { class: 'settings visitorsetup' },
        h('b', null, '👀 See all visitors'),
        h('p', { class: 'hint' }, goatToken
          ? 'GoatCounter did not answer with the saved token. Paste a new one:'
          : 'The numbers below only count players who signed in. To also see everyone who opens SailLingo, paste a GoatCounter API token (goatcounter.com → Settings → API → New token, with "Read statistics"):'),
        h('form', { class: 'joinrow', onsubmit: async (e: Event) => {
          e.preventDefault();
          const value = tokenInput.value.trim(), token = await d.token();
          if (!value || !token) return;
          try {
            await loadVisits(value, now - 86_400_000, now);
            await saveVisitToken(token, value);
            goatToken = value;
            loadedFor = '';
            screen();
          } catch {
            d.toast('GoatCounter did not accept this token.');
          }
        } }, tokenInput, h('button', { type: 'submit', class: 'btn primary small' }, 'Save')));
  }

  return { screen, draw };
}
