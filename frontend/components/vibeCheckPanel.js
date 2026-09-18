import { apiRequest } from '../api/client.js';

export function vibeCheckPanel(tmdbId, mediaType = 'movie') {
  const el = document.createElement('div');
  el.className = 'vibe-check-panel';
  el.innerHTML = '<p class="status">Loading vibe check…</p>';

  load();

  async function load() {
    try {
      const data = await apiRequest(`/movies/${tmdbId}/vibe-check?type=${mediaType}`);
      el.innerHTML = `
        <h2>Vibe Check</h2>
        <div class="vibe-section"><h3>Good</h3><ul>${listItems(data.good)}</ul></div>
        <div class="vibe-section"><h3>Slow</h3><ul>${listItems(data.slow)}</ul></div>
        <div class="vibe-section"><h3>Who it's for</h3><ul>${listItems(data.whoItsFor)}</ul></div>
      `;
    } catch (err) {
      el.innerHTML = `<p class="status error">Vibe check unavailable: ${err.message}</p>`;
    }
  }

  return el;
}

function listItems(items) {
  return (items ?? []).map((item) => `<li>${item}</li>`).join('');
}
