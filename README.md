# CineLog

A movie discovery platform: search TMDB + OMDb, build watchlists, log viewing
history, and get three AI-generated layers on top of raw metadata — vibe
checks, review consensus summaries, and friend-compatibility watch pitches.

MongoDB never stores the movie catalog. TMDB/OMDb are the system of record
for movie data; MongoDB only stores user activity (watchlists, history,
cached AI output). See `docs/project-blueprint.md` for the full architecture
writeup and `docs/roadmap.md` for the phase-by-phase build order this repo
followed.

**Stack:** Node.js + Express · MongoDB (Mongoose) · vanilla JS + Fetch API ·
TMDB API · OMDb API · Anthropic Claude API.

## Repo layout

```
cinelog/
├── backend/    Express API - see backend/package.json for scripts
├── frontend/   Vanilla JS SPA, no build step, no framework
├── docs/       Blueprint, roadmap, and the guides below
├── .gitignore
└── README.md   this file
```

## Prerequisites

- Node.js 18 or newer (the backend uses the built-in global `fetch`, no
  `node-fetch` dependency)
- A MongoDB connection string - either a local MongoDB or a free
  [Atlas](https://www.mongodb.com/cloud/atlas) M0 cluster
- API keys: [TMDB](https://www.themoviedb.org/settings/api),
  [OMDb](https://www.omdbapi.com/apikey.aspx),
  [Anthropic](https://console.anthropic.com/)

Running on Windows? Use `docs/run-on-windows.md` instead of this section -
same steps, PowerShell-specific commands and the gotchas that only show up
on Windows.

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

```
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=
TMDB_API_KEY=
OMDB_API_KEY=
ANTHROPIC_API_KEY=
AI_CACHE_TTL_VIBE_DAYS=30
AI_CACHE_TTL_SUMMARY_DAYS=7
```

All five keys with no default (`MONGODB_URI`, `JWT_SECRET`, `TMDB_API_KEY`,
`OMDB_API_KEY`, `ANTHROPIC_API_KEY`) are required - `config/env.js` throws at
boot if any are missing, before the server starts listening.

```bash
npm start          # http://localhost:4000
npm test           # node's built-in test runner
```

## Frontend setup

No install, no build step - it's vanilla JS loaded as native ES modules.

```bash
npx serve frontend
```

Open the URL `serve` prints, with `/public/index.html` appended (e.g.
`http://localhost:3000/public/index.html`). The frontend defaults to talking
to `http://localhost:4000/api` - only change that (in
`frontend/public/index.html`, the `window.CINELOG_API_URL` line) when
deploying, see `docs/deploy-vercel.md`.

Run the backend and this at the same time, in two terminals.

## API surface

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | - | bcrypt hash, returns JWT |
| POST | `/api/auth/login` | - | returns JWT |
| GET | `/api/auth/me` | JWT | |
| GET | `/api/search?q=&type=&page=` | - | rate-limited, 30/min per IP |
| GET | `/api/movies/:tmdbId?type=` | JWT | merged TMDB+OMDb detail |
| GET | `/api/movies/:tmdbId/vibe-check?type=` | JWT | cached 30 days, rate-limited 10/min per user |
| GET | `/api/movies/:tmdbId/review-summary?type=` | JWT | cached 7 days, rate-limited 10/min per user |
| GET/POST/PATCH/DELETE | `/api/watchlist` | JWT | |
| GET/POST | `/api/history` | JWT | |
| GET | `/api/friends` | JWT | accepted friends only |
| POST | `/api/friends/request` | JWT | `{ toUsername }` |
| POST | `/api/friends/:id/accept` | JWT | |
| POST | `/api/compatibility/:friendId/:tmdbId` | JWT | not cached, on-demand |

## Known gaps

- **No `pages/history.js`.** The backend's `/api/history` routes work, but no
  phase of this build asked for a frontend page to log or browse viewing
  history, so none exists yet.
- **No endpoint to list pending friend requests.** `GET /friends` only
  returns accepted friendships (per the blueprint's route table). To accept
  a request, the recipient needs the friendship ID, which `pages/friends.js`
  surfaces in the sender's "request sent" confirmation. Fine for a demo,
  rough for real use - would need a new route not in the blueprint.
- **Live Mongo, live TMDB/OMDb, and live Claude API calls were not exercised
  end-to-end during this build.** Every route, middleware chain, and
  frontend interaction was verified against real source code (auth
  rejection, rate limiting, routing order, debounce timing, DOM updates via
  a headless jsdom harness with mocked responses shaped exactly like the
  real API), but nothing here has touched an actual Atlas cluster or spent
  a real Anthropic API call. Run through the demo script below against your
  own keys before considering this done.

## Demo script

A suggested click-through for a short screen recording - this repo can't
produce the recording itself, but this is the path that exercises every
built feature:

1. Register a new account, get redirected to Search.
2. Search for a movie (e.g. "Inception"), point out the 300ms debounce.
3. Click a result → merged TMDB+OMDb detail page loads.
4. Point out the Vibe Check panel loading in (Good / Slow / Who it's for).
5. Point out the Review Consensus panel loading in below it.
6. Click **+ Watchlist** → button flips to a status toggle + remove button.
7. Go to Watchlist → the title you just added is there.
8. Go to Friends → send a request to a second test account (register one in
   a private/incognito window first).
9. Accept the request from the second account using the friendship ID shown
   on the first account's screen.
10. Back on the first account, generate a compatibility pitch for a movie
    against that friend.
11. Log out, try to open Watchlist directly → redirected to login (proves
    the route is actually protected, not just hidden in the nav).

## Deployment

- **Database** → MongoDB Atlas, free M0 tier.
- **Backend** → Render or Railway. **Not Vercel** - it's a persistent
  Express server, not a serverless function. Set the root directory to
  `backend`, build command `npm install`, start command `npm start`, and
  add all six `.env` keys as dashboard environment variables.
- **Frontend** → Vercel. Full walkthrough in `docs/deploy-vercel.md`.

To get the code onto GitHub first, see `docs/github-upload.md`.

## Docs index

- `docs/project-blueprint.md` - architecture, schema, and route contract this repo was built against
- `docs/roadmap.md` - the phase-by-phase build order
- `docs/run-on-windows.md` - running this locally on Windows
- `docs/github-upload.md` - pushing this repo to GitHub
- `docs/deploy-vercel.md` - deploying the frontend to Vercel
