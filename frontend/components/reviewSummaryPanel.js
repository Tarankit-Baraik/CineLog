import { apiRequest } from '../api/client.js';

export function reviewSummaryPanel(tmdbId, mediaType = 'movie') {
  const el = document.createElement('div');
  el.className = 'review-summary-panel';
  el.innerHTML = '<p class="status">Loading review consensus…</p>';

  load();

  async function load() {
    try {
      const data = await apiRequest(`/movies/${tmdbId}/review-summary?type=${mediaType}`);
      el.innerHTML = `
        <h2>Review Consensus</h2>
        <p class="consensus">${data.consensus}</p>
        <div class="review-summary-grid">
          <div><h3>Agree on</h3><p>${data.agreement}</p></div>
          <div><h3>Disagree on</h3><p>${data.disagreement}</p></div>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<p class="status error">Review consensus unavailable: ${err.message}</p>`;
    }
  }

  return el;
}
