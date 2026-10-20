# Kaki Outdoors 🌳

A free, offline-friendly web app that helps low-income parents in Singapore find **safe, free outdoor places nearby** and **simple, zero-equipment activities** to do there with their children (ages 2–12).

Prototype for SIT USI2001 (Social Innovation Project).

> **How might we** empower low-income parents with cost-free, community-based resources to engage their children in outdoor learning, mitigating the developmental impacts of living in compact rental housing?

- Works without an account. Optional accounts back up progress across phones.
- Parents can suggest new places and leave tips and ratings. Your team approves new places.
- Everything (accounts, feedback, usage, pins, tips) is stored in a free **Supabase** (PostgreSQL) database.
- Works on a 360px screen and slow 3G. Installs to the home screen, and works offline after the first visit. Changes made offline are sent when the phone reconnects.
- English and 简体中文. Malay and Tamil can be added without coding (see [Adding a language](#adding-a-language)).

---

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173). To try it on your phone, connect it to the same Wi-Fi and run `npm run dev -- --host`, then open the "Network" address on your phone.

> Note: location ("Use my location") only works on `localhost` or an `https://` address. On a Wi-Fi IP address the app falls back to "Choose your area".

Other commands:

| Command | What it does |
|---|---|
| `npm run build` | Type-checks and builds the app into `dist/` |
| `npm run preview` | Serves the built app (test offline mode here) |

### Connect the database

Without a database the app still runs, but everything stays on the phone and the account and "suggest a place" features are hidden. To turn them on, follow [Database & accounts](#database--accounts), then:

```bash
cp .env.example .env.local    # then paste your Supabase URL and anon key into .env.local
npm run dev
```

---

## Database & accounts

The app uses [Supabase](https://supabase.com), a free hosted **PostgreSQL** database with built-in logins.

### One-time setup (about 10 minutes)
1. Sign up at [supabase.com](https://supabase.com) and click **New project**. Pick region **Singapore**, and save the database password somewhere safe.
2. Open **SQL Editor → New query**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. This creates all the tables and security rules.
3. Open **Project Settings → API** and copy the **Project URL** and the **anon / publishable key**. The anon key is safe to put in the app, because the security rules protect the data. **Never** put the `service_role` / secret key in the app.
4. Paste both into `.env.local` (see `.env.example`), and into your hosting settings:
   - **Vercel:** Project → Settings → Environment Variables → add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then redeploy.
   - **GitHub Pages:** repo Settings → Secrets and variables → Actions → **Variables** tab → add the same two.
5. In Supabase, open **Authentication → URL Configuration**:
   - **Site URL:** your live app address, e.g. `https://kaki-outdoors.vercel.app`
   - **Redirect URLs:** add your live address and `http://localhost:5173`

   These make the "confirm email" and "reset password" links open your app.
6. Optional, for user testing: under **Authentication → Sign In / Providers → Email**, turn off **Confirm email** so parents can sign in straight away. Supabase's built-in email sender only sends a few emails per hour, so for real use, set up your own email sender (custom SMTP).

### What's stored where

| Table | What | Who can see it |
|---|---|---|
| `profiles` | Name (optional), child age group, area, language, consent time | Only that parent (and your team) |
| `saved_items` | ♡ saved places and activities | Only that parent |
| `activity_log` | "We did this!" with date | Only that parent |
| `place_suggestions` | Pins parents add (name, type, features, location, status) | Everyone once **approved**; the parent who sent it sees it while pending |
| `place_reviews` | Star rating and short tip per place | Everyone (unless hidden) |
| `feedback` | Smiley rating and comment from Help (guests too) | Only your team |
| `usage_events` | Anonymous app opens, places viewed, "Go there" taps, activities done | Only your team |

Your team sees and edits everything in the Supabase dashboard (**Table Editor**). Parents' phones can only reach their own rows. The rules are in `supabase/schema.sql` and were tested with 45 checks.

### Day-to-day team tasks
- **Approve a suggested place:** Table Editor → `place_suggestions` → change `status` from `pending` to `approved` (or `rejected`). Approved places appear on everyone's map next time they open the app, marked "Added by parents".
- **Hide an unkind tip:** Table Editor → `place_reviews` → tick `hidden`.
- **Export data for the report:** open any table and click **Export → CSV**.
- **Ready-made reports:** in the SQL Editor, run any of:
  ```sql
  select * from reports.weekly_summary;      -- active phones/accounts, views, Go there taps, activities per week
  select * from reports.return_visits;       -- days used per phone
  select * from reports.popular_activities;
  select * from reports.popular_spots;
  select * from reports.feedback_summary;
  select * from reports.pending_places;      -- suggestions waiting for approval
  ```

### Privacy (PDPA)
- **Guests:** only anonymous counts and feedback are sent, linked to a random phone code. No name and no location are sent.
- **Accounts:** created only after the parent ticks a consent box. The time they agreed is saved in `profiles.consent_at`.
- **Deleting:** parents can delete their account in the app (**Help → Account → Delete my account**). This removes their profile, saved items, log, pins and tips. Their feedback and usage counts stay, but become anonymous.
- **GPS:** the phone's location is never sent. Only the chosen area name is stored.
- **Ethics:** check with your module supervisor about ethics approval before collecting data from real parents.

---

## Deploy for free

### Option A: Vercel (easiest)
1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, and click **Add New → Project**.
3. Pick this repo. Vercel detects Vite; keep the defaults and click **Deploy**.

You get an `https://…vercel.app` link. Every push to `main` redeploys.

### Option B: GitHub Pages
1. Push this repo to GitHub.
2. In the repo, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Go to the **Actions** tab → **Deploy to GitHub Pages** → **Run workflow**. It builds and publishes the app to `https://<user>.github.io/<repo-name>/`. It's manual-only because the team hosts on Vercel. To deploy on every push instead, add `push: branches: [main]` under `on:` in `.github/workflows/deploy-pages.yml`.

Separately, the **Build check** workflow runs on every push and shows a ❌ on GitHub if a change breaks the build.

The app uses `#/` URLs, so page refreshes work on GitHub Pages with no extra setup.

---

## Editing the data (no coding needed)

All content lives in `src/data/`. Edit the JSON files in any text editor (or on github.com with the ✏️ button). Keep the commas and quotes exactly as they are. If the app stops building, paste the file into [jsonlint.com](https://jsonlint.com) to find the mistake.

Every text field is written like this: `{ "en": "English text", "zh": "中文" }`. Only `en` is required. If a language is missing, the app shows English.

### `spots.json`: places

```json
{
  "id": "toa-payoh-town-park",
  "name": { "en": "Toa Payoh Town Park", "zh": "大巴窑市镇公园" },
  "category": "park",
  "neighbourhood": "toa-payoh",
  "lat": 1.3320,
  "lng": 103.8473,
  "hours": "24h",
  "features": ["toilet", "lit", "awayFromRoad", "wheelchair"],
  "verified": false
}
```

| Field | Meaning |
|---|---|
| `id` | Unique, lowercase, dashes, no spaces. Never change it after launch, because saved items use it. |
| `category` | One of: `playground`, `park`, `garden`, `library`, `cc` (Community Club), `event` |
| `neighbourhood` | An `id` from `neighbourhoods.json` |
| `lat`, `lng` | Coordinates. In Google Maps, right-click the place and click the numbers to copy them. |
| `hours` | `"24h"`, `"check"` (shows "Check on site"), or your own text, e.g. `{ "en": "10am–9pm", "zh": "上午10点–晚上9点" }` |
| `features` | Any of: `sheltered`, `toilet`, `lit` (lit at night), `awayFromRoad`, `fenced` (fenced play area), `water` (water point), `wheelchair` |
| `verified` | Set to `true` once a team member has checked the place in person |

### `activities.json`: activity library

```json
{
  "id": "leaf-colour-hunt",
  "icon": "🍃",
  "title": { "en": "Leaf colour hunt", "zh": "找树叶颜色" },
  "ages": ["2-4", "5-8"],
  "minutes": 15,
  "skills": ["nature", "thinking"],
  "needs": null,
  "places": ["park", "garden", "playground"],
  "steps": [
    { "icon": "🔍", "text": { "en": "Find leaves on the ground", "zh": "在地上找树叶" } }
  ]
}
```

| Field | Meaning |
|---|---|
| `icon` | One emoji. Avoid very new emoji, which may not show on older phones. |
| `ages` | Any of `"2-4"`, `"5-8"`, `"9-12"` |
| `minutes` | How long it takes. Used by the "I have 15 / 30 / 60 min" selector. |
| `skills` | Any of `motor`, `thinking`, `nature`, `social`, `language` |
| `needs` | `null` means "Nothing!". Otherwise use text, e.g. `{ "en": "Chalk", "zh": "粉笔" }` |
| `places` | Spot categories where it works, or `"any"` |
| `steps` | 3–4 steps, each with one emoji and one short line |

### `neighbourhoods.json` and `resources.json`
- **Neighbourhoods** are the areas people can pick when they don't share their location. `lat`/`lng` is the town centre, and walking times are measured from there.
- **Resources** are the outbound links on the Help screen.

---

## Adding a language

1. Copy `src/i18n/en.ts` to `src/i18n/ms.ts` (Malay) or `ta.ts` (Tamil), and translate the text on the right of each line. Keep the `{n}` placeholders.
2. In `src/types.ts`, change `export type Lang = 'en' | 'zh';` to include the new code, e.g. `'en' | 'zh' | 'ms'`.
3. In `src/i18n/index.ts`, import the file and add it to `languages` and `languageOrder`.
4. Optionally add `"ms": "…"` to the text fields in the data files.

`npm run build` reports any strings you missed.

---

## Impact measurement (for the project report)

With the database connected, all of this lands in Supabase, and the `reports.*` queries above summarise it across every phone. The phone also keeps its own counts, so you can still check a single phone on the hidden Team stats page:

- places viewed, "Go there" taps, activities completed ("We did this!")
- app opens, days opened, return visits (days opened − 1)
- feedback ratings and comments from the Help screen

**To see the counts:** go to **Help** and tap the **version number 5 times quickly**. This opens **Team stats**, which has buttons to export:

- `kaki-stats-<id>-<date>.csv`: one row per phone. Combine the rows from all test phones in Excel or Google Sheets.
- `kaki-feedback-<id>-<date>.csv` / `.json`: all feedback entries.

`<id>` is a random code made on each phone. It lets you tell test phones apart without collecting anything personal. Team stats also shows how many changes are still waiting to be sent to the database. The same page has a **Reset** button to clear a phone between test sessions.

---

## How it works

| Topic | Approach |
|---|---|
| Walking time | Straight-line distance × 1.3 (paths aren't straight) ÷ 70 m/min (walking with kids). Shown as an estimate ("~8 min walk"). Places over 45 min away show their area name instead. |
| "I have X minutes" | Shows places within about a third of X as walking time, so there's time to walk there, play and come back. Also suggests activities that fit in X minutes for the child's age. |
| Directions | "Go there" opens Google Maps walking directions with a plain link. No API key is needed. |
| Weather tip | Uses the free NEA 2-hour forecast from data.gov.sg, which needs no key. If rain is expected near the user, it suggests sheltered places. When offline, it uses a time-of-day rule instead (hot afternoon, dusk and so on). |
| Map | Leaflet with OpenStreetMap tiles. It only downloads when someone taps **Map**. Tiles already viewed are cached for offline use (max 400). |
| Offline | A service worker (vite-plugin-pwa) caches the app and all data on the first visit. |
| Sync | Every change is saved on the phone first and added to a queue (the "outbox"). The queue is sent to Supabase when there's internet. When a guest signs in, their progress is merged into their account. Signing out removes personal data from the phone, for shared family phones. |

### Project structure
```
src/
  App.tsx, main.tsx, router.ts   app shell, bottom nav, #/ routes
  types.ts                       data types
  data/*.json                    places, activities, areas, links  ← edit these
  i18n/en.ts, zh.ts, index.ts    all UI text
  lib/                           store (localStorage), geo, weather, progress, CSV
  lib/backend.ts, sync.ts, auth.ts   database connection, offline sync queue, accounts
  hooks/useOrigin.ts             location / chosen area
  components/                    cards, nav, map, banners
  screens/                       one file per screen
public/                          icons
supabase/schema.sql              database tables + security rules  ← run once in Supabase
```

---

## Limitations and before user testing

- **Sample data.** Places are real and well-known, but coordinates are approximate and features (toilets, shelter and so on) are unverified (`"verified": false`). Please check them before testing with parents. The app shows a "Sample data" note.
- **Translations.** The Chinese text needs a check by a native speaker.
- **Map tiles.** These come from the public OpenStreetMap server, which is fine for a prototype and user testing. For a real launch with many users, switch to a tile provider that allows that level of use.
