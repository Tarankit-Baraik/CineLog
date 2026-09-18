const { Schema, model } = require('mongoose');

const aiCacheSchema = new Schema({
  tmdbId: { type: Number, required: true },
  type: { type: String, enum: ['vibe_check', 'review_summary'], required: true },
  sourceHash: { type: String, required: true },
  content: { type: Schema.Types.Mixed, required: true },
  model: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

aiCacheSchema.index({ tmdbId: 1, type: 1 });
// expireAfterSeconds:0 on a Date field means "delete once expiresAt is in the past", not
// "N seconds after insert" - this is what makes it a per-document variable TTL.
aiCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = model('AiCache', aiCacheSchema);
