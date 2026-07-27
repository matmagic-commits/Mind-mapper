import { PracticeEngine } from '../practice-engine.js';
import { getCurriculumStep } from '../curriculum.js';
import { getSong } from '../songs.js';
import { markCurriculumStepComplete, markSegmentPassed, markFullSongPassed } from '../storage.js';

export function mount(container, params, ctx) {
  const pctx = ctx.getPracticeContext();
  if (!pctx) {
    ctx.navigate('#/home');
    return () => {};
  }

  let engineConfig;
  let onPassed;
  let backHash;
  let nextAction = null;

  if (pctx.type === 'curriculum') {
    const step = getCurriculumStep(pctx.stepId);
    engineConfig = {
      title: step.title,
      events: step.song.events,
      range: { start: 0, end: step.song.events.length - 1 },
      bpm: step.song.bpm,
      forceMode: step.forceMode,
      hitWindowMs: step.hitWindowMs,
    };
    onPassed = () => markCurriculumStepComplete(step.id);
    backHash = '#/learn';
    nextAction = { label: 'Back to Learn', hash: '#/learn' };
  } else {
    const song = getSong(pctx.songId);
    const isFull = pctx.segmentIndex === null || pctx.segmentIndex === undefined;
    const range = isFull ? { start: 0, end: song.events.length - 1 } : song.segments[pctx.segmentIndex];
    engineConfig = {
      title: song.title,
      segmentName: isFull ? 'Full Song' : range.name,
      events: song.events,
      range,
      bpm: song.bpm,
    };
    onPassed = (accuracy) => {
      if (isFull) markFullSongPassed(song.id, accuracy);
      else markSegmentPassed(song.id, pctx.segmentIndex, accuracy);
    };
    backHash = `#/songs/${song.id}`;
    if (!isFull && pctx.segmentIndex + 1 < song.segments.length) {
      nextAction = { label: 'Next Segment →', run: () => { ctx.setPracticeContext({ type: 'song', songId: song.id, segmentIndex: pctx.segmentIndex + 1 }); ctx.navigate('#/practice'); } };
    } else {
      nextAction = { label: isFull ? 'Back to Song' : 'All Segments Done — Try Full Song', run: () => {
        if (isFull) { ctx.navigate(backHash); }
        else { ctx.setPracticeContext({ type: 'song', songId: song.id, segmentIndex: null }); ctx.navigate('#/practice'); }
      } };
    }
  }

  container.innerHTML = `<div class="practice-root"></div><div class="results-overlay" style="display:none"></div>`;
  const root = container.querySelector('.practice-root');
  const overlay = container.querySelector('.results-overlay');

  let engine = new PracticeEngine(root, {
    ...engineConfig,
    onExit: () => ctx.navigate(backHash),
    onFinish: (result) => showResults(result),
  });

  function showResults(result) {
    const { accuracy, passed, mode } = result;
    if (passed) onPassed(accuracy);
    const scoreText = mode === 'wait' ? '' : `<div class="results-score">${accuracy}%</div>`;
    overlay.innerHTML = `
      <div class="results-card">
        <div class="results-emoji">${passed ? (accuracy >= 90 ? '🌟' : '🎉') : '💪'}</div>
        <h2>${passed ? (mode === 'wait' ? 'Nice work!' : 'Segment Passed!') : 'Keep Practicing!'}</h2>
        ${scoreText}
        <p>${passed ? 'You\'ve got this down. Ready for what\'s next?' : `You need 60% accuracy to pass. Give it another go — you'll get it!`}</p>
        <div class="results-actions">
          <button class="btn btn-secondary" data-retry>↻ Retry</button>
          ${passed && nextAction ? `<button class="btn btn-primary" data-next>${nextAction.label}</button>` : ''}
          <button class="btn btn-ghost" data-leave>${backHash === '#/learn' ? 'Back to Learn' : 'Back to Song'}</button>
        </div>
      </div>
    `;
    overlay.style.display = 'flex';
    overlay.querySelector('[data-retry]').addEventListener('click', () => {
      overlay.style.display = 'none';
      engine._setupSession();
    });
    const nextBtn = overlay.querySelector('[data-next]');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (nextAction.run) nextAction.run();
        else ctx.navigate(nextAction.hash);
      });
    }
    overlay.querySelector('[data-leave]').addEventListener('click', () => ctx.navigate(backHash));
  }

  return () => {
    if (engine) engine.destroy();
  };
}
