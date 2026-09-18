export function movieCard(movie, { onSelect } = {}) {
  const { title, year, posterPath, rating } = movie;
  const el = document.createElement('article');
  el.className = 'movie-card';

  const media = posterPath
    ? `<img src="https://image.tmdb.org/t/p/w200${posterPath}" alt="${title} poster" loading="lazy" />`
    : `<div class="movie-card-noposter">No image</div>`;

  el.innerHTML = `
    ${media}
    <div class="movie-card-body">
      <h3>${title}</h3>
      <p>${year ?? ''}${rating != null ? ` · ★ ${rating}` : ''}</p>
    </div>
  `;

  if (onSelect) {
    el.classList.add('clickable');
    el.addEventListener('click', () => onSelect(movie));
  }

  return el;
}
