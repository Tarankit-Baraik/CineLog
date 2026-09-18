import { apiRequest } from '../api/client.js';

export default async function renderHistory(root) {
  root.innerHTML = `
    <h2>My Viewing History</h2>
    <div id="history-content"><p class="status">Loading...</p></div>
  `;

  const content = document.getElementById('history-content');

  try {
    const history = await apiRequest('/history');

    if (history.length === 0) {
      content.innerHTML = '<p class="status">You haven\'t logged any movies yet.</p>';
      return;
    }

    content.innerHTML = `
      <div class="movie-grid">
        ${history.map(item => `
          <div class="movie-card clickable" data-id="${item.tmdbId}">
            ${item.posterPath 
              ? `<img src="https://image.tmdb.org/t/p/w342${item.posterPath}" alt="${item.title}" />`
              : `<div class="movie-card-noposter">No Poster</div>`
            }
            <div class="movie-card-body">
              <h3>${item.title}</h3>
              <p>Watched: ${new Date(item.watchedAt).toLocaleDateString()}</p>
              ${item.userRating ? `<p>Rating: ${item.userRating}/10</p>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    root.querySelectorAll('.movie-card.clickable').forEach(card => {
      card.addEventListener('click', () => {
        location.hash = `#/movie/${card.dataset.id}?type=movie`;
      });
    });

  } catch (err) {
    console.error(err);
    content.innerHTML = '<p class="status error">Failed to load history.</p>';
  }
}
