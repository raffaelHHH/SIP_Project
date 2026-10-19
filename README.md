# Kaki Outdoors 🌳

A free, offline-friendly web app that helps low-income parents in Singapore find **safe, free outdoor places nearby** and **simple, zero-equipment activities** to do there with their children (ages 2–12).

Prototype for SIT USI2001 (Social Innovation Project).

> **How might we** empower low-income parents with cost-free, community-based resources to engage their children in outdoor learning, mitigating the developmental impacts of living in compact rental housing?

- No login, no accounts, no backend, no API keys.
- Works on a 360px screen and slow 3G. Installs to the home screen, and works offline after the first visit.
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
3. Push to `main`. The workflow in `.github/workflows/deploy-pages.yml` builds and publishes the app to `https://<user>.github.io/<repo-name>/`.

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

The app counts the following **anonymously, on the phone only** (`localStorage`). Nothing is sent anywhere.

- places viewed, "Go there" taps, activities completed ("We did this!")
- app opens, days opened, return visits (days opened − 1)
- feedback ratings and comments from the Help screen

**To see the counts:** go to **Help** and tap the **version number 5 times quickly**. This opens **Team stats**, which has buttons to export:

- `kaki-stats-<id>-<date>.csv`: one row per phone. Combine the rows from all test phones in Excel or Google Sheets.
- `kaki-feedback-<id>-<date>.csv` / `.json`: all feedback entries.

`<id>` is a random code made on each phone. It lets you tell test phones apart without collecting anything personal. The same page has a **Reset** button to clear a phone between test sessions.

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

### Project structure
```
src/
  App.tsx, main.tsx, router.ts   app shell, bottom nav, #/ routes
  types.ts                       data types
  data/*.json                    places, activities, areas, links  ← edit these
  i18n/en.ts, zh.ts, index.ts    all UI text
  lib/                           store (localStorage), geo, weather, progress, CSV
  hooks/useOrigin.ts             location / chosen area
  components/                    cards, nav, map, banners
  screens/                       one file per screen
public/                          icons
```

---

## Limitations and before user testing

- **Sample data.** Places are real and well-known, but coordinates are approximate and features (toilets, shelter and so on) are unverified (`"verified": false`). Please check them before testing with parents. The app shows a "Sample data" note.
- **Translations.** The Chinese text needs a check by a native speaker.
- **Map tiles.** These come from the public OpenStreetMap server, which is fine for a prototype and user testing. For a real launch with many users, switch to a tile provider that allows that level of use.
