import { CURRICULUM } from '../curriculum.js';
import { SONGS } from '../songs.js';
import { isCurriculumStepComplete, getProgressSummary } from '../storage.js';

export function mount(container, params, ctx) {
  const nextStep = CURRICULUM.find((s) => !isCurriculumStepComplete(s.id)) || CURRICULUM[0];
  const summary = getProgressSummary(CURRICULUM, SONGS);

  container.innerHTML = `
    <section class="hero">
      <div class="hero-text">
        <h1>Learn Piano, One Small Step at a Time</h1>
        <p class="hero-tagline">A friendly, self-paced piano course for ages 10 to adult. No subscriptions, no accounts, no ads — just you, your keyboard, and some music.</p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-large" data-go="learn">▶ Continue Learning</button>
          <button class="btn btn-secondary btn-large" data-go="songs">🎵 Browse Songs</button>
        </div>
        <div class="hero-badges">
          <span class="badge">✔ 100% Free Forever</span>
          <span class="badge">✔ Works with Mouse, Keyboard or MIDI Piano</span>
          <span class="badge">✔ Runs Entirely in Your Browser</span>
        </div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="hero-key-row">
          ${Array.from({ length: 14 }).map((_, i) => `<div class="hero-key ${[1, 4, 6, 9, 11].includes(i % 12) ? 'hero-key-black' : ''}"></div>`).join('')}
        </div>
      </div>
    </section>

    <section class="home-grid">
      <div class="card next-step-card">
        <h3>Pick Up Where You Left Off</h3>
        <div class="next-step-row">
          <span class="step-icon">${nextStep.icon}</span>
          <div>
            <div class="next-step-title">${nextStep.title}</div>
            <div class="next-step-blurb">${nextStep.blurb}</div>
          </div>
        </div>
        <button class="btn btn-primary" data-start-step="${nextStep.id}">Start This Step</button>
      </div>

      <div class="card progress-glance-card">
        <h3>Your Progress</h3>
        <div class="glance-row"><span>Lessons</span><strong>${summary.stepsDone}/${summary.stepsTotal}</strong></div>
        <div class="glance-row"><span>Song Segments</span><strong>${summary.segmentsPassed}/${summary.totalSegments}</strong></div>
        <div class="glance-row"><span>Songs Completed</span><strong>${summary.songsCompleted}/${summary.songsTotal}</strong></div>
        <button class="btn btn-ghost" data-go="progress">View Full Progress →</button>
      </div>
    </section>

    <section class="home-categories">
      <div class="card category-card">
        <h3>🧒 Kids' Favorites</h3>
        <p>Twinkle Twinkle, Hot Cross Buns, Mary Had a Little Lamb and more — short, singable songs perfect for a first recital.</p>
        <button class="btn btn-secondary" data-go="songs">Explore Kids Songs</button>
      </div>
      <div class="card category-card">
        <h3>🎼 Classics &amp; Covers</h3>
        <p>Ode to Joy, Für Elise, Canon in D — simplified arrangements of the pieces everyone recognizes.</p>
        <button class="btn btn-secondary" data-go="songs">Explore Classics</button>
      </div>
    </section>
  `;

  container.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => ctx.navigate(`#/${btn.dataset.go}`));
  });
  const startBtn = container.querySelector('[data-start-step]');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      ctx.setPracticeContext({ type: 'curriculum', stepId: nextStep.id });
      ctx.navigate('#/practice');
    });
  }
}
