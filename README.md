# Kaki Outdoors 🌳

A free, offline-friendly web app that helps low-income parents in Singapore find **safe, free outdoor places nearby** and **simple, zero-equipment activities** to do there with their children (ages 2–12).

Prototype for SIT USI2001 (Social Innovation Project).

> **How might we** empower low-income parents with cost-free, community-based resources to engage their children in outdoor learning, mitigating the developmental impacts of living in compact rental housing?

- Works without an account. Optional accounts back up progress across phones.
- Parents can suggest new places and leave tips and ratings. The team approves new places.
- Accounts, feedback, usage, pins and tips are stored in **Supabase** (PostgreSQL).
- Works on a 360px screen and slow 3G. Installs to the home screen, and works offline after the first visit. Changes made offline are sent when the phone reconnects.
- English and 简体中文. Malay and Tamil can be added without coding (see [Adding a language](#adding-a-language)).

---

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

1. Create a file called `.env.local` in the project folder with:
   ```
   VITE_SUPABASE_URL=https://psoqlaelbbkcanaxlcea.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_a46RCN2Av_NduOUjc346rw_ZeRNWa7Q
   ```
   This is the public key, which is safe to share. Never use the **secret** / `service_role` key in the app. Without this file the app still runs, but accounts and "Suggest a place" are hidden.
2. Install and start:
   ```bash
   npm install
   npm run dev
   ```
3. Open http://localhost:5173.

**On your phone:** connect to the same Wi-Fi, run `npm run dev -- --host`, and open the "Network" address. "Use my location" only works on `localhost` or `https://`, so on Wi-Fi the app asks you to choose an area.

| Command | What it does |
|---|---|
| `npm run dev` | Runs the app locally. It reloads as you edit. |
| `npm run build` | Type-checks and builds the app into `dist/` |
| `npm run preview` | Serves the built app. Use it to test offline mode. |

---

## Deploying

The live site is on **Vercel**, connected to this GitHub repo.

- **Pushing to `main`** updates the live site automatically within a minute or two.
- **Pushing other branches** creates a preview link (see the Vercel dashboard → Deployments).
- The **Build check** on GitHub runs on every push. A ❌ means the change breaks the build.
- **Changing an environment variable** in Vercel (Settings → Environment Variables) does nothing until you **redeploy** (Deployments → ⋯ → Redeploy).
- **After an update,** phones may show the old version once, because the app keeps an offline copy. Reopening the app (or using an incognito window) shows the new one.

---

## Team tasks (Supabase dashboard)

Everything is in the Supabase project dashboard. Parents' phones can only reach their own data, but the dashboard shows everything.

- **Approve a suggested place:** Table Editor → `place_suggestions` → change `status` from `pending` to `approved` (or `rejected`). Approved places appear on everyone's map next time they open the app, marked "Added by parents".
- **Hide an unkind tip:** Table Editor → `place_reviews` → tick `hidden`.
- **Export data for the report:** open any table → **Export → CSV**.
- **Ready-made reports:** in the SQL Editor, run any of:
  ```sql
  select * from reports.weekly_summary;      -- active phones/accounts, views, Go there taps, activities per week
  select * from reports.return_visits;       -- days used per phone
  select * from reports.popular_activities;
  select * from reports.popular_spots;
  select * from reports.feedback_summary;
  select * from reports.pending_places;      -- suggestions waiting for approval
  ```
- **Clear test data** before a new round of user testing:
  ```sql
  truncate public.usage_events, public.feedback;
  ```

### What's stored where

| Table | What | Who can see it |
|---|---|---|
| `profiles` | Name (optional), child age group, area, language, consent time | Only that parent (and the team) |
| `saved_items` | ♡ saved places and activities | Only that parent |
| `activity_log` | "We did this!" with date | Only that parent |
| `place_suggestions` | Pins parents add (name, type, features, location, status) | Everyone once **approved**; the parent who sent it sees it while pending |
| `place_reviews` | Star rating and short tip per place | Everyone (unless hidden) |
| `feedback` | Smiley rating and comment from Help (guests too) | Only the team |
| `usage_events` | Anonymous app opens, places viewed, "Go there" taps, activities done | Only the team |

**Changing the database:** [`supabase/schema.sql`](supabase/schema.sql) is the full definition of the tables, the security rules and the permissions. If you change the database, update this file too, and run only the change (not the whole file) in the SQL Editor.

### Privacy (PDPA)
- **Guests:** only anonymous counts and feedback are sent, linked to a random phone code. No name and no location are sent.
- **Accounts:** created only after the parent ticks a consent box. The time they agreed is saved in `profiles.consent_at`.
- **Deleting:** parents can delete their account in the app (**Help → Account → Delete my account**). This removes their profile, saved items, log, pins and tips. Their feedback and usage counts stay, but become anonymous.
- **GPS:** the phone's location is never sent. Only the chosen area name is stored.
- **Ethics:** make sure data collection from real parents is covered by your ethics approval.

---

## Editing the data (no coding needed)

The team's places and activities live in `src/data/`. Edit the JSON files in any text editor (or on github.com with the ✏️ button), then push to `main`. Keep the commas and quotes exactly as they are. If the app stops building, paste the file into [jsonlint.com](https://jsonlint.com) to find the mistake.

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
| `id` | Unique, lowercase, dashes, no spaces. Never change it once in use, because saved items and tips refer to it. |
| `category` | One of: `playground`, `park`, `garden`, `library`, `cc` (Community Club), `event` |
| `neighbourhood` | An `id` from `neighbourhoods.json` |
| `lat`, `lng` | Coordinates. In Google Maps, right-click the place and click the numbers to copy them. |
| `hours` | `"24h"`, `"check"` (shows "Check on site"), or your own text, e.g. `{ "en": "10am–9pm", "zh": "上午10点–晚上9点" }` |
| `features` | Any of: `sheltered`, `toilet`, `lit` (lit at night), `awayFromRoad`, `fenced` (fenced play area), `water` (water point), `wheelchair` |
| `verified` | Set to `true` once a team member has checked the place in person |

Places that parents suggest don't go in this file. They're approved in Supabase (see [Team tasks](#team-tasks-supabase-dashboard)).

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
| `needs` | `null` means no equipment. Otherwise use text, e.g. `{ "en": "Chalk", "zh": "粉笔" }` |
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

Usage across all phones is in Supabase (see the `reports.*` queries above). Each phone also keeps its own counts, which you can check without the dashboard:

- places viewed, "Go there" taps, activities completed ("We did this!")
- app opens, days opened, return visits (days opened − 1)
- feedback ratings and comments from the Help screen

**To see the counts:** go to **Help** and tap the **version number 5 times quickly**. This opens **Team stats**, which can export:

- `kaki-stats-<id>-<date>.csv`: one row per phone
- `kaki-feedback-<id>-<date>.csv` / `.json`: all feedback entries

`<id>` is a random code made on each phone. It lets you tell test phones apart without collecting anything personal. Team stats also shows how many changes are still waiting to be sent to the database. The **Reset** button clears a phone between test sessions.

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
  App.tsx, main.tsx, router.ts       app shell, bottom nav, #/ routes
  types.ts                           data types
  data/*.json                        places, activities, areas, links  ← edit these
  i18n/en.ts, zh.ts, index.ts        all UI text
  lib/                               store (localStorage), geo, weather, progress, CSV
  lib/backend.ts, sync.ts, auth.ts   database connection, offline sync queue, accounts
  hooks/useOrigin.ts                 location / chosen area
  components/                        cards, nav, map, banners
  screens/                           one file per screen
public/                              icons
supabase/schema.sql                  database tables, security rules, permissions, reports
```

---

## Before testing with parents

- **Places:** coordinates and features in `spots.json` are approximate and unverified. Check each place, then set `"verified": true`. The app shows a "Sample data" note until then.
- **Translations:** have a native speaker check the Chinese text.

## Before a public launch

- **Email:** turn **Confirm email** back on (Supabase → Authentication → Sign In / Providers → Email), and set up your own email sender (Authentication → Emails → SMTP Settings). The built-in sender only sends a few emails per hour.
- **Map tiles:** the public OpenStreetMap server is fine for a prototype and testing. For many users, switch to a tile provider that allows that level of use.
