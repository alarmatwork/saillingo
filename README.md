<img src="assets/logo.svg" width="64" height="64" alt="">

# SailLingo

## ⛵ Play now: **[alarmatwork.github.io/saillingo](https://alarmatwork.github.io/saillingo/)**

Free, no sign-up, works on any phone or computer. On a phone, open the link and
choose **Add to Home Screen** to install it as an app that also works offline.

---

A free game for learning the language of sailing (boat parts, gear, wind and manoeuvres), in the
style of a language-learning app. It teaches a few terms at a time on a
picture and keeps drilling until you know them.

- Languages: **Estonian** and **English** (more can be added, see below).
  You choose the language you speak and the language whose terms you want to
  learn separately, so it works for learning the vocabulary in your own
  language as well as in a foreign one.
- 159 terms in sixteen topics. Basics: hull & rig, sails & lines, deck & gear,
  wind & points of sail, who gives way. Advanced: anchoring & harbour, spinnaker & rig details,
  fittings, safety equipment, navigation lights, lights at night, day shapes,
  night and day together, light characters, buoys (IALA A), signal flags. Topics can be switched on and off.
- Exercises: name the highlighted part, tap the part on the picture, pick the
  term for a description or translation, tick all that apply, type the term.
- Stars per lesson, XP, day streak, and a practice mode that brings terms
  back at growing intervals (spaced repetition).
- No server and no account: plain static files, progress is stored in the
  browser. Can be installed on a phone and used offline.
- Visits and lesson starts/completions are counted anonymously with
  [GoatCounter](https://www.goatcounter.com) (no cookies, no personal data).
  Set `GOATCOUNTER_CODE` in `src/analytics.ts` to your own code, or to `''`
  to switch counting off.

## Run it

```sh
npm install
npm run dev      # http://localhost:5173, rebuilds on change
npm run build    # writes the finished site to dist/
npm run check    # type-check + tests + build
```

`dist/` is the whole game. Upload it to any static host (GitHub Pages,
Netlify, Cloudflare Pages, your own web space). Opening `dist/index.html`
straight from disk also works; only the offline install needs a real
`https://` address.

## Version and "What's new"

The version shown at the bottom of the game is the number of commits, and the
"What's new" page lists the commit subjects, newest first. So write commit
subjects as plain sentences a player would understand. To keep a commit out of
the list, start its subject with `Internal:` or put `[skip changelog]` in the
message.

## Messages to the developer

"Become a partner" and "Suggest adding it" (in the search) send a message that
is stored in Firestore (`messages`, see the rules below) and copied to a Google
Form, which emails a notification. The form and its field numbers are set in
`src/cloud/messages.ts`; the form must accept responses without a Google
sign-in (no file-upload questions, not restricted to an organisation).

## Optional sign-in (Firebase)

Without configuration the game has no accounts. To let players sign in (with
Google, Apple or a link sent by email) and keep their progress across devices:

1. Create a project at https://console.firebase.google.com (the free plan is enough).
2. Build -> Authentication -> Sign-in method: enable **Google**, **Apple**
   and **Email/Password** with **Email link (passwordless sign-in)**; the
   game offers these three. Under
   Settings -> Authorized domains add the domain the game is served from
   (for example `alarmatwork.github.io`).
3. Build -> Firestore Database: create a database, then set these rules so
   every player can only read and write their own progress:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // the accounts that may open the statistics page (#admin); the page shows an account's id
       function isAdmin() {
         return request.auth != null && request.auth.uid in ['PUT-YOUR-USER-ID-HERE'];
       }

       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
         allow read: if isAdmin();
       }

       // settings of the statistics page (the GoatCounter API token)
       match /admin/{doc} {
         allow read, write: if isAdmin();
       }
       // partner enquiries and suggested terms: anyone may send one, nobody can read them from the app
       match /messages/{id} {
         allow read, update, delete: if false;
         allow create: if request.resource.data.keys().hasOnly(['kind', 'text', 'name', 'contact', 'lang', 'at'])
           && request.resource.data.kind in ['partner', 'term']
           && request.resource.data.text is string && request.resource.data.text.size() > 0 && request.resource.data.text.size() <= 1000
           && request.resource.data.get('name', '') is string && request.resource.data.get('name', '').size() <= 1000
           && request.resource.data.get('contact', '') is string && request.resource.data.get('contact', '').size() <= 1000
           && request.resource.data.lang is string && request.resource.data.lang.size() <= 5
           && request.resource.data.at is int;
       }

       // anonymous scores for "TOP x %": readable by everyone, each player writes only their own XP
       match /scores/{uid} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == uid
           && request.auth.token.firebase.sign_in_provider != 'anonymous'
           && request.resource.data.keys().hasOnly(['xp', 'updated'])
           && request.resource.data.xp is int
           && request.resource.data.xp >= 0 && request.resource.data.xp < 1000000;
       }

       // party quiz: anyone can watch a game; only its host changes it, and every
       // player writes only their own name and score (see "Party quiz" below)
       match /games/{code} {
         allow read: if true;
         allow create: if request.auth != null && request.resource.data.host == request.auth.uid
           && request.resource.data.questions.size() <= 40;
         allow update: if request.auth != null && resource.data.host == request.auth.uid
           && request.resource.data.host == request.auth.uid;
         match /players/{uid} {
           allow read: if true;
           allow write: if request.auth != null && request.auth.uid == uid
             && request.resource.data.name is string && request.resource.data.name.size() <= 16
             && request.resource.data.score is int
             && request.resource.data.score >= 0 && request.resource.data.score <= 40000;
         }
       }
     }
   }
   ```
4. Project settings -> Your apps -> add a Web app and paste its
   `firebaseConfig` object into `src/cloud/config.ts`.

### Statistics page

`#admin` shows sign-ups, active accounts, party games and (with a GoatCounter
API token) visits for a chosen period. Sign in, open the page, and it shows the
id of your account; put that id into `isAdmin()` in the rules above. Nobody
else can read the figures: the rules refuse the requests.

### Party quiz

The party quiz (one big screen, everyone answers on their phone) uses the same
Firebase project. It needs two things:

1. Build -> Authentication -> Sign-in method: enable **Anonymous**. Every
   device in a game signs in without a name or an email, only to get an id, so
   the rules above can tell the host and the players apart.
2. The `games` rules above.

Then set `LIVE_ON_HOME` in `src/cloud/config.ts` to `true` to show its button
on the home page. To try the game without any server, open the page with
`?mocklive` in the address: games then work between tabs of one browser.

A game is one small document (`games/<6-digit code>`) plus one per player. The
game runs on a shared clock: the document says when a question started and
every device works out the rest, so very little is read or written.

Progress is always kept in the browser first; signing in adds a copy in
Firestore (`users/<id>`) that is merged with the device's progress, keeping
the better result for every term. The Firebase code is a separate file
(`sync.js`) that is only downloaded when a player signs in.

Signed-in players also get an anonymous score (`scores/<id>`, XP only) for
the "TOP x %" tile. `scripts/backfill-scores.mjs` creates these scores for
all existing accounts at once (needs a service-account key; see the script).

## Supporters and partners

Support links, partners, the thank-you list and partners' banners are set in
`src/support.ts`. A banner is shown on the home screen between its `from` and
`until` dates; put its image in `public/partners/`.

## Add a language

1. Copy `src/i18n/en.ts` to `src/i18n/<code>.ts` and translate the texts.
   For each term: `name` is what the learner should know, `alt` lists real synonyms (shown to the learner), `accept` lists other
   answers accepted when typing, `desc` is a one-sentence explanation that
   avoids using the name itself.
2. Register it in `src/i18n/index.ts`.

`npm run check` reports any text that is still missing.

## Add terms or pictures

- `src/data/model.ts` lists the terms, lessons, topics and the categories for
  "tick all that apply" questions.
- `src/scenes/*.ts` are the pictures (hand-written SVG). Every shape that
  belongs to a term carries the class `t-<termId>` so it can be highlighted,
  and `spots` gives the position of the term's tappable dot.
- `src/session.ts` is the drill engine, `src/store.ts` the saved progress,
  `src/main.ts` the screens.

## Sources for the Estonian terms

EKI Sõnaveeb purjetamise terminibaas, the Estonian translation of the Racing
Rules of Sailing 2025–2028 (Eesti Purjetamise Liit) and Tallinna Jahtklubi
teaching materials. The lights, day shapes and distress signals use the
wording of the COLREGs as published in Riigi Teataja (RT II 2005, 19, 64,
Estonian and English side by side); the pictures follow the Transport
Administration handbook "Abiks paadimehele". Corrections from
sailors are welcome.
