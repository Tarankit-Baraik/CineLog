# CineLog — Movie Discovery Platform
### Project Blueprint (Architecture, Roadmap, Data Flow, File Structure)

**Stack:** Node.js + Express (backend) · Vanilla JavaScript + Fetch API (frontend) · MongoDB (Mongoose) · TMDB API · OMDb API · Anthropic Claude API (Gen-AI features)

---

## 1. Project Summary

CineLog is a movie discovery platform where users search a full external catalog (TMDB + OMDb), build custom watchlists, log viewing history, and get three AI-generated layers of context on top of raw metadata: instant "vibe check" breakdowns, AI-aggregated review consensus, and friend-compatibility watch pitches.

The core engineering idea driving every decision below: **MongoDB never stores the movie catalog.** TMDB/OMDb are the system of record for movie data; MongoDB is the system of record for *user activity* (watchlists, history, cached AI output). This keeps the database small, keeps movie data always fresh, and avoids ever needing to sync a local copy of a catalog that already has a maintained API.

---

## 2. Engineering Principles Applied to This Project

These aren't abstract — each one maps to a concrete decision in this blueprint:

| Principle | Applied as |
|---|---|
| No overengineering | No Redis, no microservices, no GraphQL layer, no ORM beyond Mongoose. One Express app, one Mongo cluster. |
| No fallbacks, one path | TMDB and OMDb are both *required* inputs merged by a single normalizer — not a fallback pair. If TMDB is down, the endpoint throws; it does not silently degrade to OMDb-only data. |
| One canonical approach | Exactly one function normalizes external API responses into the app's internal movie shape (`normalizeMedia.js`). No route hand-parses API responses itself. |
| Throw errors, fail fast | Every service throws a typed error (`AppError` subclasses) on bad preconditions (missing API key, 4xx/5xx from TMDB, malformed LLM JSON). One central error middleware converts these to HTTP responses. Nothing is caught and swallowed. |
| No backups / no "just in case" paths | No duplicate caching layers (no memory cache *and* Mongo cache *and* Redis) — Mongo TTL collections are the single cache mechanism, for both external-API responses and LLM output. |
| Separation of concerns | routes → controllers → services → models. Controllers never call `fetch()` or touch Mongoose directly; services never read `req`/`res`. |

---

## 3. High-Level Architecture

```
┌─────────────────┐        ┌──────────────────────────────────────────┐
│                  │  HTTP  │                BACKEND (Express)          │
│   FRONTEND       │◄──────►│                                            │
│  (vanilla JS)    │  JSON  │  routes → controllers → services → models │
│                  │        │                                            │
└─────────────────┘        └───────┬───────────────┬──────────┬────────┘
                                    │               │          │
                         ┌──────────▼───┐  ┌────────▼──┐  ┌────▼─────────┐
                         │  TMDB API     │  │ OMDb API  │  │ Claude API   │
                         │  (search,     │  │ (ratings, │  │ (vibe check, │
                         │   details,    │  │  extra    │  │  summaries,  │
                         │   reviews)    │  │  metadata)│  │  pitches)    │
                         └───────────────┘  └───────────┘  └──────────────┘
                                    │
                         ┌──────────▼──────────────────────────┐
                         │  MongoDB (Atlas)                     │
                         │  users · watchlist · history ·       │
                         │  aiCache (TTL) · friendships          │
                         │  — NO movie catalog stored here —    │
                         └───────────────────────────────────────┘
```

**Why the backend proxies every external call instead of the frontend calling TMDB/OMDb/Claude directly:** API keys (TMDB, OMDb, Anthropic) must never reach the browser. This is non-negotiable, not a style choice — it's a security boundary.

---

## 4. Data Model (MongoDB — Minimal, User-Centric)

Five collections. No `movies` collection.

### 4.1 `users`
```js
{
  _id: ObjectId,
  username: String,      // unique, indexed
  email: String,         // unique, indexed
  passwordHash: String,
  createdAt: Date
}
```

### 4.2 `watchlist`
Lightweight pointer to an external movie, not a movie record.
```js
{
  _id: ObjectId,
  userId: ObjectId,      // indexed
  tmdbId: Number,        // indexed
  mediaType: "movie" | "tv",
  title: String,         // denormalized, for list rendering without a refetch
  posterPath: String,    // denormalized, same reason
  status: "want_to_watch" | "watching" | "watched",
  addedAt: Date,
  updatedAt: Date
}
```
Compound unique index: `{ userId: 1, tmdbId: 1 }` — prevents duplicate watchlist entries and doubles as the lookup index for "is this already on my list."

### 4.3 `viewingHistory`
```js
{
  _id: ObjectId,
  userId: ObjectId,      // indexed
  tmdbId: Number,
  title: String,         // denormalized
  posterPath: String,    // denormalized
  watchedAt: Date,
  userRating: Number,    // optional, 1-10
  reviewText: String     // optional, user's own review
}
```

### 4.4 `aiCache`
The single cache mechanism in the whole system — used for LLM output. TTL index means expired documents self-delete; no cron job, no manual invalidation logic.
```js
{
  _id: ObjectId,
  tmdbId: Number,
  type: "vibe_check" | "review_summary",
  sourceHash: String,    // sha256 of the exact plot+reviews text sent to the LLM
  content: Object,        // the structured LLM response (see §6)
  model: String,          // e.g. "claude-haiku-4-5-20251001"
  createdAt: Date,
  expiresAt: Date         // TTL index field
}
```
Compound index: `{ tmdbId: 1, type: 1 }`. `sourceHash` is what makes the cache *correct*, not just fast — if TMDB reviews change, the hash changes, and the old cache entry is simply irrelevant (still expires naturally via TTL, no eviction logic needed).

### 4.5 `friendships`
```js
{
  _id: ObjectId,
  userA: ObjectId,
  userB: ObjectId,
  status: "pending" | "accepted",
  createdAt: Date
}
```
Compound index: `{ userA: 1, userB: 1 }`.

**Total collections: 5. No collection stores plot summaries, cast lists, genres, or posters as a source of truth — those always come live from TMDB/OMDb.**

---

## 5. REST API Surface

All routes under `/api`. All except `/auth/*` and `/search` require a valid JWT (via `Authorization: Bearer`).

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/register` | Create user, hash password (bcrypt) |
| POST | `/auth/login` | Verify credentials, issue JWT |
| GET | `/auth/me` | Return current user from token |
| GET | `/search?q=&type=&page=` | Live search against TMDB, normalized results |
| GET | `/movies/:tmdbId` | Merged TMDB + OMDb detail for one title |
| GET | `/movies/:tmdbId/vibe-check` | AI breakdown (cached in `aiCache`) — feature 1 |
| GET | `/movies/:tmdbId/review-summary` | AI review consensus (cached) — feature 3 |
| GET | `/watchlist` | Current user's watchlist |
| POST | `/watchlist` | Add `{ tmdbId, mediaType, title, posterPath, status }` |
| PATCH | `/watchlist/:id` | Update status |
| DELETE | `/watchlist/:id` | Remove entry |
| GET | `/history` | Current user's viewing history |
| POST | `/history` | Log a watched title, optional rating/review |
| GET | `/friends` | Accepted friends list |
| POST | `/friends/request` | Send friend request `{ toUsername }` |
| POST | `/friends/:id/accept` | Accept a pending request |
| POST | `/compatibility/:friendId/:tmdbId` | AI compatibility pitch — feature 2 (not cached; see §6.2) |

---

## 6. Gen-AI Feature Design

All three features go through one `llmService.js` with one function signature: `callLLM(systemPrompt, userPrompt, { maxTokens })` → returns parsed JSON. Every prompt below explicitly instructs the model to return JSON only, so the app never regex-scrapes prose out of a response.

### 6.1 Vibe Check (`GET /movies/:tmdbId/vibe-check`)
1. Fetch plot + up to 5 reviews (TMDB `reviews` endpoint) via `tmdbService`.
2. Compute `sourceHash = sha256(plot + reviews.join())`.
3. Look up `aiCache` by `{ tmdbId, type: "vibe_check", sourceHash }`.
4. Cache hit → return `content` immediately, no LLM call.
5. Cache miss → call Claude with:
   - System: *"You summarize a movie's plot and reviews into three short bulleted sections. Return only valid JSON matching: { good: string[], slow: string[], whoItsFor: string[] }."*
   - User: plot text + concatenated review excerpts.
6. Store result in `aiCache` with `expiresAt = now + 30 days` (movie plot/reviews rarely change; long TTL keeps LLM cost near zero after first request per title).

### 6.2 Friend Compatibility Pitch (`POST /compatibility/:friendId/:tmdbId`)
1. Verify friendship exists and is `accepted`.
2. Load both users' `watchlist` + `viewingHistory` titles (denormalized `title` fields only — no extra API calls needed).
3. Call Claude with:
   - System: *"Given two users' watched/watchlisted movies and a target movie, write one short, specific, friendly pitch (2-3 sentences) for why they should watch the target together. Reference at least one real title from each list. Return only JSON: { pitch: string }."*
   - User: `{ me: [...titles], friend: [...titles], target: title }`.
4. **Not cached** — it's a personalized, low-volume, on-demand action (a user triggers it by choosing to share), not a per-title hot path. Adding a cache here would be a cache with no reuse, i.e. the exact "just in case" complexity the no-backups principle rules out.

### 6.3 Review Summarizer (`GET /movies/:tmdbId/review-summary`)
Same shape as 6.1: fetch raw reviews → hash → check `aiCache` (`type: "review_summary"`) → on miss, call Claude with:
- System: *"Read these user reviews and write a 3-4 sentence consensus summary of what people generally agree and disagree on. Return only JSON: { consensus: string, agreement: string, disagreement: string }."*
- Cache TTL: 7 days (shorter than vibe-check, since new reviews arrive continuously and the summary should refresh more often).

---

## 7. Data Flow — Unified Metadata Pipeline

This is the piece the resume bullet calls out directly: "constructing a unified data pipeline for retrieving, standardizing, and aggregating multimedia metadata."

```
Request for tmdbId
        │
        ▼
tmdbService.getDetails(tmdbId)  ──►  TMDB /movie/:id  (title, plot, genres, cast, poster, TMDB rating)
        │
        ▼
omdbService.getByTitle(title, year) ──►  OMDb ?t=&y=  (IMDb rating, Rotten Tomatoes score, Metascore)
        │
        ▼
normalizeMedia(tmdbData, omdbData)   ──►  single canonical shape:
        │
        {
          tmdbId, title, year, posterPath, plot, genres[],
          ratings: { tmdb, imdb, rottenTomatoes, metascore },
          cast[], runtimeMinutes
        }
        ▼
Returned to controller → sent to client
```

`normalizeMedia.js` is the *only* place field-name and unit differences between the two APIs get resolved (e.g. TMDB's 0–10 scale vs OMDb's 0–100/percentage scales get converted to one consistent shape). Every route that needs movie detail — search results, detail page, AI feature inputs — calls through this same function. There is no second parser anywhere in the codebase.

---

## 8. Async & Search Design

- Search input is debounced client-side (300ms) before hitting `GET /search`.
- Filtering (genre, year range, min rating) is sent as query params and applied server-side against the TMDB discover endpoint — not fetched-then-filtered client-side, so large result sets never cross the wire unfiltered.
- All external calls in `tmdbService`/`omdbService` use `fetch` with `Promise.all` where two calls are independent (e.g. detail + reviews) and are always awaited inside `try/catch` that rethrows as a typed `ExternalAPIError` — never silently returns partial/empty data.

---

## 9. File Structure

```
cinelog/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # mongoose.connect
│   │   │   └── env.js                # validates required env vars at boot, throws if missing
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Watchlist.js
│   │   │   ├── ViewingHistory.js
│   │   │   ├── AiCache.js
│   │   │   └── Friendship.js
│   │   ├── services/
│   │   │   ├── tmdbService.js        # all TMDB HTTP calls
│   │   │   ├── omdbService.js        # all OMDb HTTP calls
│   │   │   ├── normalizeMedia.js     # the ONE canonical mapper (§7)
│   │   │   ├── llmService.js         # the ONE Claude API wrapper (§6)
│   │   │   └── cacheService.js       # aiCache read/write + sha256 hashing
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── searchController.js
│   │   │   ├── movieController.js
│   │   │   ├── watchlistController.js
│   │   │   ├── historyController.js
│   │   │   ├── friendController.js
│   │   │   └── aiController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── searchRoutes.js
│   │   │   ├── movieRoutes.js
│   │   │   ├── watchlistRoutes.js
│   │   │   ├── historyRoutes.js
│   │   │   ├── friendRoutes.js
│   │   │   ├── aiRoutes.js
│   │   │   └── index.js              # mounts all of the above
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verify
│   │   │   ├── errorHandler.js       # single error-to-HTTP mapper
│   │   │   └── rateLimiter.js        # protects /search and AI routes
│   │   ├── utils/
│   │   │   ├── AppError.js           # NotFoundError, ExternalAPIError, ValidationError
│   │   │   └── hash.js               # sha256 for sourceHash
│   │   ├── app.js                    # express app, middleware wiring
│   │   └── server.js                 # http listen
│   ├── tests/
│   │   ├── normalizeMedia.test.js
│   │   └── cacheService.test.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js             # one fetch wrapper, attaches JWT, throws on !res.ok
│   │   ├── pages/
│   │   │   ├── search.js
│   │   │   ├── movieDetail.js
│   │   │   ├── watchlist.js
│   │   │   ├── history.js
│   │   │   └── friends.js
│   │   ├── components/
│   │   │   ├── movieCard.js
│   │   │   ├── vibeCheckPanel.js
│   │   │   ├── reviewSummaryPanel.js
│   │   │   └── watchlistButton.js
│   │   ├── styles/
│   │   │   └── main.css
│   │   └── main.js                   # router + entry point
│   └── package.json
├── docs/
│   └── project-blueprint.md          # this file
├── .gitignore
└── README.md
```

**Why vanilla JS instead of a frontend framework:** the resume description is explicitly about the data pipeline and async workflows, not UI architecture. A framework here would be complexity that doesn't earn its keep for what's being demonstrated. If a framework is wanted later for the portfolio, `frontend/src` is already organized into pages/components — porting to React later touches only this folder, never the backend contract (`api/client.js` is the only integration seam).

---

## 10. Environment Variables (`backend/.env.example`)

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
`config/env.js` reads these at boot and throws immediately if any required key is missing — fail fast, not a runtime surprise on first request.

---

## 11. Security Notes

- Passwords hashed with bcrypt (never stored plain, never logged).
- JWT in `Authorization` header, short expiry + refresh not required for a student project scope — a single reasonably-short-lived token is enough; don't build a refresh-token system for a portfolio app (YAGNI).
- All three external API keys live only in backend `.env`, never sent to or readable from the browser.
- `/search` and the two AI GET routes are rate-limited per user to prevent LLM-cost or TMDB-quota abuse.

---

## 12. Testing Scope

Only non-trivial logic gets a test — CRUD routes are thin enough that a test would just restate the code:
- `normalizeMedia.test.js` — TMDB-only input, OMDb-only input, both, both missing a field → correct canonical shape and rating scale conversion every time.
- `cacheService.test.js` — same input text → same hash; changed review text → different hash → correct cache miss.

---

## 13. Deployment

- Backend → Render or Railway (free tier, env vars set in dashboard).
- Frontend → Vercel or Netlify (static hosting, `frontend/public` + built `src`).
- Database → MongoDB Atlas free tier (M0).
- No Docker, no CI/CD pipeline needed for project scope — a `README.md` with setup steps is the deployment story for a portfolio piece. Add CI later only if the project grows contributors.

---

## 14. Roadmap

| Phase | Scope | Deliverable |
|---|---|---|
| 0 — Setup | Repo, Atlas cluster, TMDB/OMDb/Anthropic keys, Express skeleton, `env.js` validation | App boots, connects to Mongo |
| 1 — Data pipeline | `tmdbService`, `omdbService`, `normalizeMedia`, `GET /search`, `GET /movies/:tmdbId` | Can search and view merged movie detail via Postman |
| 2 — Auth | `User` model, register/login/JWT middleware | Protected routes reject unauthenticated requests |
| 3 — User activity | `watchlist` + `viewingHistory` models, CRUD routes | Can add/update/remove watchlist items, log history |
| 4 — Frontend core | Search page, movie detail page, watchlist page wired to real API | Clickable end-to-end app, no AI yet |
| 5 — Gen-AI feature 1 | `llmService`, `aiCache`, vibe-check endpoint + panel | Opening a movie shows Good/Slow/Who-it's-for |
| 6 — Gen-AI feature 2 | Review-summary endpoint + panel (reuses `llmService`/`aiCache`) | Consensus summary shown before user writes own review |
| 7 — Friends + feature 3 | `Friendship` model, friend request flow, compatibility pitch endpoint | Can generate a pitch for a friend on a given title |
| 8 — Polish | Loading/error states, empty states, rate limiting, `README.md`, short demo recording | Portfolio-ready |

**Stretch (only after Phase 8, each independently optional):** infinite-scroll pagination on search results, genre/year/rating filter UI, "watched together" shared history view, export watchlist as JSON.

---

## 15. Non-Goals (explicit scope boundaries)

To keep this a finishable student project rather than an open-ended one:
- No recommendation engine beyond the three named Gen-AI features.
- No local copy of the movie catalog — TMDB/OMDb are always queried live (subject to the cache in §6).
- No social feed / comments system beyond the friend-pitch feature.
- No admin panel or content moderation tooling.
- No mobile app — responsive web only.
