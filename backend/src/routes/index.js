const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');
const authRoutes = require('./authRoutes');
const searchRoutes = require('./searchRoutes');
const movieRoutes = require('./movieRoutes');
const aiRoutes = require('./aiRoutes');
const watchlistRoutes = require('./watchlistRoutes');
const historyRoutes = require('./historyRoutes');
const friendRoutes = require('./friendRoutes');

const router = Router();
const searchLimiter = rateLimiter({ windowMs: 60_000, max: 30 });

// Public per blueprint §5: /auth/* and /search only. Everything else needs a valid JWT.
router.use('/auth', authRoutes);
router.use('/search', searchLimiter, searchRoutes);
router.use('/movies', authMiddleware, movieRoutes);
router.use('/watchlist', authMiddleware, watchlistRoutes);
router.use('/history', authMiddleware, historyRoutes);
router.use('/friends', authMiddleware, friendRoutes);

// aiRoutes defines its own full paths (/movies/:id/vibe-check, /movies/:id/review-summary,
// /compatibility/:friendId/:tmdbId) since /compatibility doesn't share the /movies prefix.
// Mounted last so it only ever catches what nothing above already matched.
router.use(authMiddleware, aiRoutes);

module.exports = router;
