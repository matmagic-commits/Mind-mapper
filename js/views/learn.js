import { CURRICULUM } from '../curriculum.js';
import { isCurriculumStepComplete } from '../storage.js';

export function mount(container, params, ctx) {
  container.innerHTML = `
    <section class="page-header">
      <h1>Learn</h1>
      <p>A suggested path from "what is a piano key" to your first full songs. Steps aren't locked — jump anywhere — but going in order gives the smoothest ride.</p>
    </section>
    <section class="learn-list">
      ${CURRICULUM.map((step, i) => {
        const done = isCurriculumStepComplete(step.id);
        return `
        <div class="learn-step ${done ? 'is-done' : ''}">
          <div class="learn-step-index">${done ? '✔' : i + 1}</div>
          <div class="learn-step-icon">${step.icon}</div>
          <div class="learn-step-body">
            <h3>${step.title}</h3>
            <p>${step.blurb}</p>
          </div>
          <button class="btn btn-primary" data-step="${step.id}">${done ? 'Practice Again' : 'Start'}</button>
        </div>`;
      }).join('')}
    </section>
  `;

  container.querySelectorAll('[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx.setPracticeContext({ type: 'curriculum', stepId: btn.dataset.step });
      ctx.navigate('#/practice');
    });
  });
}
