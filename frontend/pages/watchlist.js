import { apiRequest } from '../api/client.js';
import { movieCard } from '../components/movieCard.js';
import { watchlistButton } from '../components/watchlistButton.js';

export default function renderWatchlist(root) {
  root.innerHTML = '<p class="status">Loading…</p>';
  load();

  async function load() {
    try {
      const items = await apiRequest('/watchlist');

      if (items.length === 0) {
        root.innerHTML = '<p class="status">Your watchlist is empty.</p>';
        return;
      }

      const grid = document.createElement('div');
      grid.className = 'movie-grid';

      for (const entry of items) {
        const movie = { tmdbId: entry.tmdbId, mediaType: entry.mediaType, title: entry.title, posterPath: entry.posterPath };

        const card = movieCard(movie, {
          onSelect: ({ tmdbId, mediaType }) => {
            location.hash = `#/movie/${tmdbId}?type=${mediaType}`;
          }
        });

        card.appendChild(
          watchlistButton(movie, entry, {
            onChange: (updated) => {
              if (!updated) card.remove();
            }
          })
        );

        grid.appendChild(card);
      }

      root.innerHTML = '';
      root.appendChild(grid);
    } catch (err) {
      root.innerHTML = `<p class="status error">${err.message}</p>`;
    }
  }
}
