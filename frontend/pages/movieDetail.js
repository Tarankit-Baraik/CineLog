import { apiRequest } from '../api/client.js';
import { watchlistButton } from '../components/watchlistButton.js';
import { vibeCheckPanel } from '../components/vibeCheckPanel.js';
import { reviewSummaryPanel } from '../components/reviewSummaryPanel.js';

export default function renderMovieDetail(root, { tmdbId, type = 'movie' }) {
  root.innerHTML = '<p class="status">Loading…</p>';
  load();

  async function load() {
    try {
      const [movie, watchlist] = await Promise.all([
        apiRequest(`/movies/${tmdbId}?type=${type}`),
        apiRequest('/watchlist')
      ]);
      const existingEntry = watchlist.find((w) => w.tmdbId === movie.tmdbId) ?? null;
      renderDetail(movie, existingEntry);
    } catch (err) {
      root.innerHTML = `<p class="status error">${err.message}</p>`;
    }
  }

  function renderDetail(movie, existingEntry) {
    root.innerHTML = `
      <div class="movie-detail">
        ${movie.posterPath
            ? `<img src="https://image.tmdb.org/t/p/w300${movie.posterPath}" alt="${movie.title} poster" />`
            : `<div class="movie-card-noposter">No Poster</div>`
          }
        <div class="movie-detail-body">
          <h1>${movie.title}${movie.year ? ` (${movie.year})` : ''}</h1>
          <p class="genres">${movie.genres.join(', ')}</p>
          <p class="ratings">TMDB ${movie.ratings.tmdb ?? '–'} · IMDb ${movie.ratings.imdb ?? '–'} · RT ${movie.ratings.rottenTomatoes ?? '–'}% · Metascore ${movie.ratings.metascore ?? '–'}</p>
          <p class="plot">${movie.plot ?? ''}</p>
          <p class="cast"><strong>Cast:</strong> ${movie.cast.join(', ')}</p>
          <div id="watchlist-slot"></div>
        </div>
      </div>
      <div id="vibe-check-slot"></div>
      <div id="review-summary-slot"></div>
    `;

    root.querySelector('#watchlist-slot').appendChild(
      watchlistButton(
        { tmdbId: movie.tmdbId, mediaType: type, title: movie.title, posterPath: movie.posterPath },
        existingEntry
      )
    );

    root.querySelector('#vibe-check-slot').appendChild(vibeCheckPanel(movie.tmdbId, type));
    root.querySelector('#review-summary-slot').appendChild(reviewSummaryPanel(movie.tmdbId, type));
  }
}
