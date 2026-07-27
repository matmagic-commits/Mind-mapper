import { CURRICULUM } from '../curriculum.js';
import { SONGS } from '../songs.js';
import { isCurriculumStepComplete, isSegmentPassed, getSongProgress, getProgressSummary, getState } from '../storage.js';

function badge(label, achieved, icon) {
  return `<div class="achievement ${achieved ? 'is-earned' : ''}"><span class="achievement-icon">${icon}</span><span>${label}</span></div>`;
}

export function mount(container, params, ctx) {
  const summary = getProgressSummary(CURRICULUM, SONGS);
  const state = getState();
  const anyStep = summary.stepsDone > 0;
  const firstSong = SONGS.some((s) => s.segments.some((_, i) => isSegmentPassed(s.id, i)));
  const fiveSongs = summary.songsCompleted >= 5;
  const perfect = SONGS.some((s) => (getSongProgress(s.id).fullSongBest || 0) >= 95);

  container.innerHTML = `
    <section class="page-header">
      <h1>Your Progress</h1>
      <p>Every practice session is saved right in this browser — no account needed.</p>
    </section>

    <section class="progress-summary-grid">
      <div class="card stat-card"><div class="stat-big">${summary.stepsDone}/${summary.stepsTotal}</div><div>Lessons Completed</div></div>
      <div class="card stat-card"><div class="stat-big">${summary.segmentsPassed}/${summary.totalSegments}</div><div>Segments Passed</div></div>
      <div class="card stat-card"><div class="stat-big">${summary.songsCompleted}/${summary.songsTotal}</div><div>Songs Completed</div></div>
    </section>

    <section class="card">
      <h3>Achievements</h3>
      <div class="achievement-grid">
        ${badge('First Step Taken', anyStep, '🥇')}
        ${badge('First Segment Passed', firstSong, '🎶')}
        ${badge('Five Songs Completed', fiveSongs, '🏆')}
        ${badge('Perfect Performance (95%+)', perfect, '💯')}
      </div>
    </section>

    <section class="card">
      <h3>Song Breakdown</h3>
      <div class="progress-song-list">
        ${SONGS.map((song) => {
          const passed = song.segments.filter((_, i) => isSegmentPassed(song.id, i)).length;
          const full = getSongProgress(song.id).fullSongBest;
          return `<div class="progress-song-row">
            <span class="progress-song-title">${song.title}</span>
            <span class="progress-bar"><span class="progress-bar-fill" style="width:${(passed / song.segments.length) * 100}%"></span></span>
            <span class="progress-song-count">${passed}/${song.segments.length}${full !== undefined ? ` &middot; Best full run: ${full}%` : ''}</span>
          </div>`;
        }).join('')}
      </div>
    </section>

    <section class="card danger-zone">
      <h3>Reset Progress</h3>
      <p>This clears all saved lesson and song progress on this device. There's no undo.</p>
      <button class="btn btn-ghost" data-reset>Reset All Progress</button>
    </section>
  `;

  container.querySelector('[data-reset]').addEventListener('click', () => {
    if (confirm('Reset all saved progress on this device? This cannot be undone.')) {
      localStorage.removeItem('pianoAcademy:v1');
      location.reload();
    }
  });
}
