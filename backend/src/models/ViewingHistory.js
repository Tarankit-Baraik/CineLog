const { Schema, model } = require('mongoose');

const viewingHistorySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tmdbId: { type: Number, required: true },
  title: { type: String, required: true },
  posterPath: String,
  watchedAt: { type: Date, default: Date.now },
  userRating: { type: Number, min: 1, max: 10 },
  reviewText: String
});

module.exports = model('ViewingHistory', viewingHistorySchema);
