import { apiRequest } from '../api/client.js';

export default async function renderDashboard(root) {
  root.innerHTML = `
    <div class="dashboard-section">
      <h2>🔥 Trending Movies</h2>
      <p>What everyone is watching today.</p>
      <div id="trending-grid" class="movie-grid">Loading...</div>
    </div>
    
    <div class="dashboard-section">
      <h2>⭐ Highest Rated</h2>
      <p>Critically acclaimed movies.</p>
      <div id="top-rated-grid" class="movie-grid">Loading...</div>
    </div>
  `;

  const trendingGrid = document.getElementById('trending-grid');
  const topRatedGrid = document.getElementById('top-rated-grid');

  try {
    const [trending, topRated] = await Promise.all([
      apiRequest('/movies/trending'),
      apiRequest('/movies/top-rated')
    ]);

    const renderMovieCard = (movie) => `
      <div class="movie-card clickable" data-id="${movie.id}">
        ${movie.poster_path 
          ? `<img src="https://image.tmdb.org/t/p/w342${movie.poster_path}" alt="${movie.title || movie.name}" />`
          : `<div class="movie-card-noposter">No Poster</div>`
        }
        <div class="movie-card-body">
          <h3>${movie.title || movie.name}</h3>
          <p>${(movie.release_date || movie.first_air_date || '').slice(0, 4)}</p>
        </div>
      </div>
    `;

    trendingGrid.innerHTML = trending.results.slice(0, 10).map(renderMovieCard).join('');
    topRatedGrid.innerHTML = topRated.results.slice(0, 10).map(renderMovieCard).join('');

    // Add click listeners to navigate to movie details
    root.querySelectorAll('.movie-card.clickable').forEach(card => {
      card.addEventListener('click', () => {
        location.hash = `#/movie/${card.dataset.id}?type=movie`;
      });
    });

  } catch (err) {
    console.error(err);
    trendingGrid.innerHTML = '<p class="status error">Failed to load movies.</p>';
    topRatedGrid.innerHTML = '<p class="status error">Failed to load movies.</p>';
  }
}
