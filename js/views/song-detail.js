import { getSong } from '../songs.js';
import { isSegmentPassed, isSegmentUnlocked, getSongProgress } from '../storage.js';

export function mount(container, params, ctx) {
  const song = getSong(params.id);
  if (!song) {
    container.innerHTML = `<section class="page-header"><h1>Song not found</h1><button class="btn btn-primary" data-back>← Back to Songs</button></section>`;
    container.querySelector('[data-back]').addEventListener('click', () => ctx.navigate('#/songs'));
    return;
  }

  const progress = getSongProgress(song.id);
  const allPassed = song.segments.every((_, i) => isSegmentPassed(song.id, i));

  container.innerHTML = `
    <section class="page-header">
      <button class="btn btn-ghost" data-back>← All Songs</button>
      <h1>${song.title}</h1>
      <p>${song.source} &middot; ${song.bpm} BPM &middot; Difficulty ${song.difficulty}/5</p>
    </section>

    <section class="segment-list">
      ${song.segments.map((seg, i) => {
        const passed = isSegmentPassed(song.id, i);
        const unlocked = isSegmentUnlocked(song.id, i);
        const best = progress.segments?.[i]?.best;
        return `
        <div class="segment-row ${!unlocked ? 'is-locked' : ''} ${passed ? 'is-passed' : ''}">
          <div class="segment-number">${passed ? '✔' : unlocked ? i + 1 : '🔒'}</div>
          <div class="segment-info">
            <div class="segment-title">${seg.name}</div>
            ${best !== undefined ? `<div class="segment-best">Best: ${best}%</div>` : ''}
          </div>
          <button class="btn ${passed ? 'btn-secondary' : 'btn-primary'}" data-segment="${i}" ${unlocked ? '' : 'disabled'}>
            ${passed ? 'Practice Again' : 'Play'}
          </button>
        </div>`;
      }).join('')}
    </section>

    <section class="full-song-card card">
      <h3>🏁 Play the Full Song</h3>
      <p>${allPassed ? 'All segments passed — you\'re ready for the whole thing!' : 'Pass every segment above to unlock full playthrough (or just give it a try any time).'}</p>
      <button class="btn btn-primary btn-large" data-full-song>Play Full Song</button>
    </section>
  `;

  container.querySelector('[data-back]').addEventListener('click', () => ctx.navigate('#/songs'));
  container.querySelectorAll('[data-segment]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.segment, 10);
      ctx.setPracticeContext({ type: 'song', songId: song.id, segmentIndex: idx });
      ctx.navigate('#/practice');
    });
  });
  container.querySelector('[data-full-song]').addEventListener('click', () => {
    ctx.setPracticeContext({ type: 'song', songId: song.id, segmentIndex: null });
    ctx.navigate('#/practice');
  });
}
