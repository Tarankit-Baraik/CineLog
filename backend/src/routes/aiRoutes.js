const { Router } = require('express');
const rateLimiter = require('../middleware/rateLimiter');
const { vibeCheck, reviewSummary, compatibilityPitch } = require('../controllers/aiController');

const router = Router();

// Blueprint §11: "/search and the two AI GET routes are rate-limited" - compatibility is a
// POST, low-volume by nature (user-triggered share action, §6.2), not in scope here.
const aiLimiter = rateLimiter({ windowMs: 60_000, max: 10 });

router.get('/movies/:tmdbId/vibe-check', aiLimiter, vibeCheck);
router.get('/movies/:tmdbId/review-summary', aiLimiter, reviewSummary);
router.post('/compatibility/:friendId/:tmdbId', compatibilityPitch);

module.exports = router;
