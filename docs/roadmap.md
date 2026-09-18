Roadmap already phased in blueprint §14. Full breakdown, phase by phase, each with concrete build order:

**Phase 0 — Setup**
- Init repo, `.gitignore`, `.env.example`
- Create MongoDB Atlas cluster (M0)
- Get TMDB, OMDb, Anthropic API keys
- `backend/src/config/env.js` — validate required vars at boot, throw if missing
- `backend/src/config/db.js` — mongoose.connect
- `app.js` + `server.js` — express skeleton
- Verify: app boots, connects to Mongo

**Phase 1 — Data pipeline**
- `utils/AppError.js` — NotFoundError, ExternalAPIError, ValidationError
- `services/tmdbService.js` — search, details, reviews calls
- `services/omdbService.js` — getByTitle call
- `services/normalizeMedia.js` — single canonical mapper (§7 shape)
- `controllers/searchController.js` + `routes/searchRoutes.js` → `GET /search`
- `controllers/movieController.js` + `routes/movieRoutes.js` → `GET /movies/:tmdbId`
- `tests/normalizeMedia.test.js`
- Verify via Postman: search + merged detail work

**Phase 2 — Auth**
- `models/User.js`
- `controllers/authController.js` — register (bcrypt hash), login (JWT issue), me
- `middleware/auth.js` — JWT verify
- `routes/authRoutes.js`
- Verify: protected route rejects missing/bad token

**Phase 3 — User activity**
- `models/Watchlist.js` (compound unique index `{userId,tmdbId}`)
- `models/ViewingHistory.js`
- `controllers/watchlistController.js` + `routes/watchlistRoutes.js` — GET/POST/PATCH/DELETE
- `controllers/historyController.js` + `routes/historyRoutes.js` — GET/POST
- Verify: add/update/remove watchlist, log history

**Phase 4 — Frontend core**
- `frontend/src/api/client.js` — one fetch wrapper, attaches JWT, throws on !res.ok
- `pages/search.js`, `pages/movieDetail.js`, `pages/watchlist.js`
- `components/movieCard.js`, `components/watchlistButton.js`
- `main.js` — router + entry
- Debounce search input (300ms client-side)
- Verify: clickable end-to-end app, no AI yet

**Phase 5 — Gen-AI feature 1 (vibe check)**
- `utils/hash.js` — sha256
- `models/AiCache.js` (TTL index, compound `{tmdbId,type}`)
- `services/cacheService.js` — read/write + hashing
- `services/llmService.js` — one `callLLM(systemPrompt, userPrompt, {maxTokens})` wrapper
- `controllers/aiController.js` — vibe-check handler (hash → cache lookup → miss → call Claude → store, 30-day TTL)
- `routes/aiRoutes.js` → `GET /movies/:tmdbId/vibe-check`
- `components/vibeCheckPanel.js`
- `tests/cacheService.test.js`
- Verify: opening movie shows Good/Slow/Who-it's-for

**Phase 6 — Gen-AI feature 2 (review summary)**
- Extend `aiController.js` — review-summary handler, reuse `llmService`/`cacheService`, 7-day TTL
- Extend `aiRoutes.js` → `GET /movies/:tmdbId/review-summary`
- `components/reviewSummaryPanel.js`
- Verify: consensus shown before user writes own review

**Phase 7 — Friends + feature 3**
- `models/Friendship.js`
- `controllers/friendController.js` — request/accept/list
- Extend `routes/friendRoutes.js`
- Extend `aiController.js` — compatibility pitch handler (not cached, §6.2)
- `pages/friends.js`
- Verify: pitch generates for friend + title

**Phase 8 — Polish**
- Loading/empty/error states across pages
- `middleware/rateLimiter.js` on `/search` + AI GET routes
- `README.md` — setup/run steps
- Short demo recording
- Deploy: backend → Render/Railway, frontend → Vercel/Netlify, DB → Atlas

**Stretch (optional, post-8):** infinite scroll, genre/year/rating filter UI, watched-together view, export watchlist as JSON.