const { Schema, model } = require('mongoose');

const watchlistSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tmdbId: { type: Number, required: true, index: true },
  mediaType: { type: String, enum: ['movie', 'tv'], required: true },
  title: { type: String, required: true },
  posterPath: String,
  status: { type: String, enum: ['want_to_watch', 'watching', 'watched'], default: 'want_to_watch' },
  addedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Prevents duplicate watchlist entries; doubles as "is this already on my list" lookup index.
watchlistSchema.index({ userId: 1, tmdbId: 1 }, { unique: true });

module.exports = model('Watchlist', watchlistSchema);
