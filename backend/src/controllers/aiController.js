const tmdbService = require('../services/tmdbService');
const cacheService = require('../services/cacheService');
const { callLLM, MODEL } = require('../services/llmService');
const env = require('../config/env');
const Friendship = require('../models/Friendship');
const Watchlist = require('../models/Watchlist');
const ViewingHistory = require('../models/ViewingHistory');
const { ValidationError, NotFoundError } = require('../utils/AppError');

const VALID_TYPES = ['movie', 'tv'];

const VIBE_CHECK_SYSTEM_PROMPT =
  "You summarize a movie's plot and reviews into three short bulleted sections. " +
  'Return only valid JSON matching: { good: string[], slow: string[], whoItsFor: string[] }.';

const REVIEW_SUMMARY_SYSTEM_PROMPT =
  'Read these user reviews and write a 3-4 sentence consensus summary of what people generally agree and disagree on. ' +
  'Return only JSON: { consensus: string, agreement: string, disagreement: string }.';

const COMPATIBILITY_SYSTEM_PROMPT =
  "Given two users' watched/watchlisted movies and a target movie, write one short, specific, friendly pitch " +
  '(2-3 sentences) for why they should watch the target together. Reference at least one real title from each list. ' +
  'Return only JSON: { pitch: string }.';

async function vibeCheck(req, res) {
  const { tmdbId } = req.params;
  const { type = 'movie' } = req.query;

  if (!/^\d+$/.test(tmdbId)) throw new ValidationError('tmdbId must be numeric');
  if (!VALID_TYPES.includes(type)) throw new ValidationError(`"type" must be one of: ${VALID_TYPES.join(', ')}`);

  const [details, reviews] = await Promise.all([
    tmdbService.getDetails(tmdbId, type),
    tmdbService.getReviews(tmdbId, type)
  ]);

  const reviewExcerpts = reviews.results.slice(0, 5).map((r) => r.content);
  const sourceText = (details.overview || '') + reviewExcerpts.join('');
  const sourceHash = cacheService.computeSourceHash(sourceText);

  const cached = await cacheService.getCached(Number(tmdbId), 'vibe_check', sourceHash);
  if (cached) return res.json(cached.content);

  const content = await callLLM(VIBE_CHECK_SYSTEM_PROMPT, sourceText, { maxTokens: 512 });

  await cacheService.setCached({
    tmdbId: Number(tmdbId),
    type: 'vibe_check',
    sourceHash,
    content,
    model: MODEL,
    ttlDays: env.aiCacheTtlVibeDays
  });

  res.json(content);
}

// No plot in the hash - review summary only ever depends on review text (§6.3).
async function reviewSummary(req, res) {
  const { tmdbId } = req.params;
  const { type = 'movie' } = req.query;

  if (!/^\d+$/.test(tmdbId)) throw new ValidationError('tmdbId must be numeric');
  if (!VALID_TYPES.includes(type)) throw new ValidationError(`"type" must be one of: ${VALID_TYPES.join(', ')}`);

  const reviews = await tmdbService.getReviews(tmdbId, type);
  const reviewExcerpts = reviews.results.slice(0, 5).map((r) => r.content);
  if (reviewExcerpts.length === 0) throw new NotFoundError('No reviews available to summarize');

  const sourceText = reviewExcerpts.join('');
  const sourceHash = cacheService.computeSourceHash(sourceText);

  const cached = await cacheService.getCached(Number(tmdbId), 'review_summary', sourceHash);
  if (cached) return res.json(cached.content);

  const content = await callLLM(REVIEW_SUMMARY_SYSTEM_PROMPT, sourceText, { maxTokens: 512 });

  await cacheService.setCached({
    tmdbId: Number(tmdbId),
    type: 'review_summary',
    sourceHash,
    content,
    model: MODEL,
    ttlDays: env.aiCacheTtlSummaryDays
  });

  res.json(content);
}

// Not cached (§6.2): personalized, low-volume, on-demand - a cache here would have no reuse.
async function compatibilityPitch(req, res) {
  const { friendId, tmdbId } = req.params;
  const { type = 'movie' } = req.query;

  if (!/^\d+$/.test(tmdbId)) throw new ValidationError('tmdbId must be numeric');

  const friendship = await Friendship.findOne({
    status: 'accepted',
    $or: [
      { userA: req.user.id, userB: friendId },
      { userA: friendId, userB: req.user.id }
    ]
  });
  if (!friendship) throw new NotFoundError('No accepted friendship with this user');

  const [myWatchlist, myHistory, friendWatchlist, friendHistory, targetDetails] = await Promise.all([
    Watchlist.find({ userId: req.user.id }).select('title'),
    ViewingHistory.find({ userId: req.user.id }).select('title'),
    Watchlist.find({ userId: friendId }).select('title'),
    ViewingHistory.find({ userId: friendId }).select('title'),
    tmdbService.getDetails(tmdbId, type)
  ]);

  const myTitles = [...myWatchlist, ...myHistory].map((d) => d.title);
  const friendTitles = [...friendWatchlist, ...friendHistory].map((d) => d.title);
  const targetTitle = targetDetails.title ?? targetDetails.name;

  if (myTitles.length === 0 || friendTitles.length === 0) {
    throw new ValidationError('Both users need at least one watchlist or history title to generate a pitch');
  }

  const userPrompt = JSON.stringify({ me: myTitles, friend: friendTitles, target: targetTitle });
  const content = await callLLM(COMPATIBILITY_SYSTEM_PROMPT, userPrompt, { maxTokens: 300 });

  res.json(content);
}

module.exports = { vibeCheck, reviewSummary, compatibilityPitch };
