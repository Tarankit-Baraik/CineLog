const env = require('../config/env');
const { ExternalAPIError } = require('../utils/AppError');

const BASE_URL = 'https://api.themoviedb.org/3';

async function tmdbFetch(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('api_key', env.tmdbApiKey);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new ExternalAPIError(`TMDB request failed (${res.status}): ${path}`);
  }
  return res.json();
}

// mediaType is "movie" or "tv" - TMDB has separate endpoints for each, no unified one.
function searchMedia(query, mediaType = 'movie', page = 1) {
  return tmdbFetch(`/search/${mediaType}`, { query, page });
}

// append_to_response=credits pulls cast in the same call normalizeMedia needs.
function getDetails(tmdbId, mediaType = 'movie') {
  return tmdbFetch(`/${mediaType}/${tmdbId}`, { append_to_response: 'credits' });
}

function getReviews(tmdbId, mediaType = 'movie') {
  return tmdbFetch(`/${mediaType}/${tmdbId}/reviews`);
}

function getTrending(mediaType = 'movie', timeWindow = 'day', page = 1) {
  return tmdbFetch(`/trending/${mediaType}/${timeWindow}`, { page });
}

function getTopRated(mediaType = 'movie', page = 1) {
  return tmdbFetch(`/${mediaType}/top_rated`, { page });
}

module.exports = { searchMedia, getDetails, getReviews, getTrending, getTopRated };
