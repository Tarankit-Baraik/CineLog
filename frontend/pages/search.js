import { apiRequest } from '../api/client.js';
import { movieCard } from '../components/movieCard.js';

export default function renderSearch(root) {
  // Scoped inside renderSearch so navigating away and back doesn't fire
  // a stale timeout on a results container from a previous render.
  let debounceTimer;

  root.innerHTML = `
    <div class="search-page">
      <input id="search-input" type="search" placeholder="Search movies or TV…" autofocus />
      <div id="search-results" class="movie-grid"><p class="status">Start typing to search.</p></div>
    </div>
  `;

  const input = root.querySelector('#search-input');
  const results = root.querySelector('#search-results');

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runSearch(input.value.trim(), results), 300);
  });
}

async function runSearch(query, resultsEl) {
  if (!query) {
    resultsEl.innerHTML = '<p class="status">Start typing to search.</p>';
    return;
  }

  resultsEl.innerHTML = '<p class="status">Searching…</p>';

  try {
    const data = await apiRequest(`/search?q=${encodeURIComponent(query)}`, { auth: false });
    resultsEl.innerHTML = '';

    if (data.results.length === 0) {
      resultsEl.innerHTML = '<p class="status">No results.</p>';
      return;
    }

    for (const movie of data.results) {
      resultsEl.appendChild(
        movieCard(movie, {
          onSelect: ({ tmdbId, mediaType }) => {
            location.hash = `#/movie/${tmdbId}?type=${mediaType}`;
          }
        })
      );
    }
  } catch (err) {
    resultsEl.innerHTML = `<p class="status error">${err.message}</p>`;
  }
}
