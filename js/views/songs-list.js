import { SONGS } from '../songs.js';
import { getSongProgress, isSegmentPassed } from '../storage.js';

const CATEGORY_LABELS = { kids: "Kids' Favorites", classics: 'Classics & Covers', originals: 'Originals for Teens & Adults' };
const CATEGORY_NOTES = {
  originals: 'These are original pieces written for this app, inspired by the mood and riff style of 2000s rock and emo piano ballads. They are not covers of, and are not affiliated with, any specific song or band.',
};

function stars(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function songCompletion(song) {
  const passed = song.segments.filter((_, i) => isSegmentPassed(song.id, i)).length;
  return { passed, total: song.segments.length };
}

export function mount(container, params, ctx) {
  let filter = 'all';

  function render() {
    const filtered = filter === 'all' ? SONGS : SONGS.filter((s) => s.category === filter);
    container.innerHTML = `
      <section class="page-header">
        <h1>Song Library</h1>
        <p>Every song is broken into short segments so you always know exactly what to practice next.</p>
      </section>
      <div class="filter-tabs">
        <button class="filter-tab ${filter === 'all' ? 'active' : ''}" data-filter="all">All Songs</button>
        <button class="filter-tab ${filter === 'kids' ? 'active' : ''}" data-filter="kids">Kids' Favorites</button>
        <button class="filter-tab ${filter === 'classics' ? 'active' : ''}" data-filter="classics">Classics &amp; Covers</button>
        <button class="filter-tab ${filter === 'originals' ? 'active' : ''}" data-filter="originals">Originals for Teens &amp; Adults</button>
      </div>
      ${CATEGORY_NOTES[filter] ? `<p class="category-note">${CATEGORY_NOTES[filter]}</p>` : ''}
      <section class="song-grid">
        ${filtered.map((song) => {
          const { passed, total } = songCompletion(song);
          const complete = passed === total;
          return `
          <div class="card song-card ${complete ? 'is-complete' : ''}" data-song="${song.id}">
            <div class="song-card-top">
              <span class="category-pill">${CATEGORY_LABELS[song.category]}</span>
              ${complete ? '<span class="complete-pill">✔ Complete</span>' : ''}
            </div>
            <h3>${song.title}</h3>
            <div class="song-source">${song.source}</div>
            <div class="song-meta">
              <span class="difficulty">${stars(song.difficulty)}</span>
              <span class="segment-count">${passed}/${total} segments</span>
            </div>
            <div class="progress-bar"><div class="progress-bar-fill" style="width:${total ? (passed / total) * 100 : 0}%"></div></div>
          </div>`;
        }).join('')}
      </section>
    `;
    container.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => { filter = btn.dataset.filter; render(); });
    });
    container.querySelectorAll('[data-song]').forEach((card) => {
      card.addEventListener('click', () => ctx.navigate(`#/songs/${card.dataset.song}`));
    });
  }

  render();
}
