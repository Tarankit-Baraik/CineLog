const tmdbService = require('../services/tmdbService');
const omdbService = require('../services/omdbService');
const normalizeMedia = require('../services/normalizeMedia');
const { ValidationError } = require('../utils/AppError');

const VALID_TYPES = ['movie', 'tv'];

async function getMovie(req, res) {
  const { tmdbId } = req.params;
  const { type = 'movie' } = req.query;

  if (!/^\d+$/.test(tmdbId)) throw new ValidationError('tmdbId must be numeric');
  if (!VALID_TYPES.includes(type)) throw new ValidationError(`"type" must be one of: ${VALID_TYPES.join(', ')}`);

  const tmdbData = await tmdbService.getDetails(tmdbId, type);
  const title = tmdbData.title ?? tmdbData.name;
  const year = (tmdbData.release_date ?? tmdbData.first_air_date ?? '').slice(0, 4) || undefined;

  // Sequential, not Promise.all: OMDb lookup needs the title TMDB just returned.
  const omdbData = await omdbService.getByTitle(title, year);

  res.json(normalizeMedia(tmdbData, omdbData));
}

async function getTrending(req, res) {
  const { type = 'movie', page = 1 } = req.query;
  if (!VALID_TYPES.includes(type)) throw new ValidationError(`"type" must be one of: ${VALID_TYPES.join(', ')}`);
  const data = await tmdbService.getTrending(type, 'day', page);
  // We won't fetch full OMDb data for every trending movie to avoid heavy load, just return TMDB basic fields
  res.json({ results: data.results, totalPages: data.total_pages });
}

async function getTopRated(req, res) {
  const { type = 'movie', page = 1 } = req.query;
  if (!VALID_TYPES.includes(type)) throw new ValidationError(`"type" must be one of: ${VALID_TYPES.join(', ')}`);
  const data = await tmdbService.getTopRated(type, page);
  res.json({ results: data.results, totalPages: data.total_pages });
}

module.exports = { getMovie, getTrending, getTopRated };
