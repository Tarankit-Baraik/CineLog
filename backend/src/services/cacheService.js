const AiCache = require('../models/AiCache');
const { sha256 } = require('../utils/hash');

function computeSourceHash(text) {
  return sha256(text);
}

// sourceHash is what makes this cache correct, not just fast - if the source text
// changes, the hash changes, and the old entry is simply irrelevant (still expires via TTL).
async function getCached(tmdbId, type, sourceHash) {
  return AiCache.findOne({ tmdbId, type, sourceHash });
}

async function setCached({ tmdbId, type, sourceHash, content, model, ttlDays }) {
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  return AiCache.create({ tmdbId, type, sourceHash, content, model, expiresAt });
}

module.exports = { computeSourceHash, getCached, setCached };
