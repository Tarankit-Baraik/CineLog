const Watchlist = require('../models/Watchlist');
const { ValidationError, NotFoundError } = require('../utils/AppError');

const VALID_STATUS = ['want_to_watch', 'watching', 'watched'];

async function list(req, res) {
  const items = await Watchlist.find({ userId: req.user.id }).sort({ addedAt: -1 });
  res.json(items);
}

async function create(req, res) {
  const { tmdbId, mediaType, title, posterPath, status } = req.body;
  if (!tmdbId || !mediaType || !title) throw new ValidationError('tmdbId, mediaType, title required');
  if (status && !VALID_STATUS.includes(status)) throw new ValidationError(`status must be one of: ${VALID_STATUS.join(', ')}`);

  try {
    const item = await Watchlist.create({ userId: req.user.id, tmdbId, mediaType, title, posterPath, status });
    res.status(201).json(item);
  } catch (err) {
    // Compound unique index {userId, tmdbId} - duplicate add is a 400, not a 500.
    if (err.code === 11000) throw new ValidationError('Already on watchlist');
    throw err;
  }
}

async function update(req, res) {
  const { status } = req.body;
  if (!status || !VALID_STATUS.includes(status)) throw new ValidationError(`status must be one of: ${VALID_STATUS.join(', ')}`);

  const item = await Watchlist.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { status, updatedAt: new Date() },
    { new: true }
  );
  if (!item) throw new NotFoundError('Watchlist entry not found');
  res.json(item);
}

async function remove(req, res) {
  const item = await Watchlist.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!item) throw new NotFoundError('Watchlist entry not found');
  res.status(204).send();
}

module.exports = { list, create, update, remove };
