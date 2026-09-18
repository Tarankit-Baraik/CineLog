const tmdbService = require('../services/tmdbService');
const { ValidationError } = require('../utils/AppError');

const VALID_TYPES = ['movie', 'tv'];

async function search(req, res) {
  const { q, type = 'movie', page = '1' } = req.query;

  if (!q || !q.trim()) throw new ValidationError('Query param "q" is required');
  if (!VALID_TYPES.includes(type)) throw new ValidationError(`"type" must be one of: ${VALID_TYPES.join(', ')}`);

  const raw = await tmdbService.searchMedia(q.trim(), type, Number(page) || 1);

  const results = raw.results.map((r) => ({
    tmdbId: r.id,
    mediaType: type,
    title: r.title ?? r.name,
    year: (r.release_date ?? r.first_air_date ?? '').slice(0, 4) || null,
    posterPath: r.poster_path,
    tmdbRating: r.vote_average ?? null
  }));

  res.json({ page: raw.page, totalPages: raw.total_pages, results });
}

module.exports = { search };
