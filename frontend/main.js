import renderSearch from './pages/search.js';
import renderMovieDetail from './pages/movieDetail.js';
import renderWatchlist from './pages/watchlist.js';
import renderFriends from './pages/friends.js';
import renderAuth from './pages/auth.js';
import renderHome from './pages/home.js';
import renderDashboard from './pages/dashboard.js';
import renderHistory from './pages/history.js';
import { getToken, clearToken } from './api/client.js';

const root = document.getElementById('app');
const nav = document.getElementById('nav');

const PUBLIC_ROUTES = new Set(['/login', '/home']);

// Track the cleanup function returned by the current page so it's called
// when the user navigates away (e.g. home.js registers a global event listener).
let currentPageCleanup = null;

function parseHash() {
  const raw = location.hash.slice(1) || (getToken() ? '/dashboard' : '/home');
  const [path, queryString = ''] = raw.split('?');
  return { path, query: Object.fromEntries(new URLSearchParams(queryString)) };
}

function renderNav() {
  const loggedIn = Boolean(getToken());
  nav.innerHTML = loggedIn
    ? `<a href="#/dashboard">Dashboard</a><a href="#/search">Search</a><a href="#/watchlist">Watchlist</a><a href="#/history">History</a><a href="#/friends">Friends</a><button id="logout" type="button">Log out</button>`
    : `<a href="#/login">Login</a>`;
  if (loggedIn) {
    nav.querySelector('#logout').addEventListener('click', () => {
      clearToken();
      location.hash = '#/home';
    });
  }
}

function router() {
  // Call previous page's cleanup before rendering the next page.
  if (typeof currentPageCleanup === 'function') {
    currentPageCleanup();
    currentPageCleanup = null;
  }

  const { path, query } = parseHash();
  const loggedIn = Boolean(getToken());

  if (!loggedIn && !PUBLIC_ROUTES.has(path)) {
    location.hash = '#/home';
    return;
  }
  if (loggedIn && (path === '/login' || path === '/home')) {
    location.hash = '#/dashboard';
    return;
  }

  renderNav();

  if (path === '/home') { currentPageCleanup = renderHome(root); return; }
  if (path === '/dashboard') { renderDashboard(root); return; }
  if (path === '/login') { renderAuth(root); return; }
  if (path === '/search') { renderSearch(root); return; }
  if (path === '/watchlist') { renderWatchlist(root); return; }
  if (path === '/history') { renderHistory(root); return; }
  if (path === '/friends') { renderFriends(root); return; }

  const movieMatch = path.match(/^\/movie\/(\d+)$/);
  if (movieMatch) { renderMovieDetail(root, { tmdbId: movieMatch[1], type: query.type }); return; }

  root.innerHTML = '<p class="status">Not found.</p>';
}

window.addEventListener('hashchange', router);
router();
