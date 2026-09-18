import { apiRequest } from '../api/client.js';

const STATUS_CYCLE = ['want_to_watch', 'watching', 'watched'];
const STATUS_LABEL = { want_to_watch: 'Want to watch', watching: 'Watching', watched: 'Watched' };

export function watchlistButton(movie, existingEntry, { onChange } = {}) {
  const el = document.createElement('div');
  el.className = 'watchlist-button';
  // Sits inside movieCard, which has its own click-to-navigate handler - stop that bubble.
  el.addEventListener('click', (e) => e.stopPropagation());

  render(existingEntry);

  function render(entry) {
    el.innerHTML = '';

    if (!entry) {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.textContent = '+ Watchlist';
      addBtn.addEventListener('click', async () => {
        addBtn.disabled = true;
        try {
          const created = await apiRequest('/watchlist', {
            method: 'POST',
            body: {
              tmdbId: movie.tmdbId,
              mediaType: movie.mediaType,
              title: movie.title,
              posterPath: movie.posterPath,
              status: 'want_to_watch'
            }
          });
          render(created);
          onChange?.(created);
        } catch (err) {
          addBtn.disabled = false;
          addBtn.textContent = err.message;
        }
      });
      el.appendChild(addBtn);
      return;
    }

    const statusBtn = document.createElement('button');
    statusBtn.type = 'button';
    statusBtn.textContent = STATUS_LABEL[entry.status];
    statusBtn.addEventListener('click', async () => {
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(entry.status) + 1) % STATUS_CYCLE.length];
      const updated = await apiRequest(`/watchlist/${entry._id}`, { method: 'PATCH', body: { status: next } });
      render(updated);
      onChange?.(updated);
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', async () => {
      await apiRequest(`/watchlist/${entry._id}`, { method: 'DELETE' });
      render(null);
      onChange?.(null);
    });

    el.append(statusBtn, removeBtn);
  }

  return el;
}
