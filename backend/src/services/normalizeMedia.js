function parseOmdbNumber(value) {
  if (!value || value === 'N/A') return null;
  const n = parseFloat(value);
  return Number.isNaN(n) ? null : n;
}

function rottenTomatoesFromRatings(ratings) {
  const rt = (ratings || []).find((r) => r.Source === 'Rotten Tomatoes');
  return rt ? parseOmdbNumber(rt.Value.replace('%', '')) : null;
}

function yearFrom(dateStr) {
  return dateStr ? Number(dateStr.slice(0, 4)) || null : null;
}

// The only place TMDB's 0-10 scale and OMDb's 0-10/0-100/percentage scales
// get reconciled into one shape. Every route needing movie detail calls this.
function normalizeMedia(tmdbData, omdbData) {
  const t = tmdbData || {};
  const o = omdbData || {};

  return {
    tmdbId: t.id ?? null,
    title: t.title ?? t.name ?? o.Title ?? null,
    year: yearFrom(t.release_date ?? t.first_air_date) ?? parseOmdbNumber(o.Year),
    posterPath: t.poster_path ?? null,
    plot: t.overview || o.Plot || null,
    genres: (t.genres || []).map((g) => g.name),
    ratings: {
      tmdb: t.vote_average ?? null,
      imdb: parseOmdbNumber(o.imdbRating),
      rottenTomatoes: rottenTomatoesFromRatings(o.Ratings),
      metascore: parseOmdbNumber(o.Metascore)
    },
    cast: (t.credits?.cast || []).slice(0, 10).map((c) => c.name),
    runtimeMinutes: t.runtime ?? t.episode_run_time?.[0] ?? null
  };
}

module.exports = normalizeMedia;
