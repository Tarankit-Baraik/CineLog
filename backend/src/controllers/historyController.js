const ViewingHistory = require('../models/ViewingHistory');
const { ValidationError } = require('../utils/AppError');

async function list(req, res) {
  const items = await ViewingHistory.find({ userId: req.user.id }).sort({ watchedAt: -1 });
  res.json(items);
}

async function create(req, res) {
  const { tmdbId, title, posterPath, watchedAt, userRating, reviewText } = req.body;
  if (!tmdbId || !title) throw new ValidationError('tmdbId, title required');
  if (userRating !== undefined && (userRating < 1 || userRating > 10)) {
    throw new ValidationError('userRating must be between 1 and 10');
  }

  const item = await ViewingHistory.create({
    userId: req.user.id,
    tmdbId,
    title,
    posterPath,
    watchedAt: watchedAt ? new Date(watchedAt) : undefined,
    userRating,
    reviewText
  });
  res.status(201).json(item);
}

module.exports = { list, create };
