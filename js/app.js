import * as Home from './views/home.js';
import * as Learn from './views/learn.js';
import * as SongsList from './views/songs-list.js';
import * as SongDetail from './views/song-detail.js';
import * as Practice from './views/practice-view.js';
import * as Progress from './views/progress-view.js';
import * as Help from './views/help.js';

const appEl = document.getElementById('app');
const navLinks = document.querySelectorAll('.nav-link');

let currentUnmount = null;
let practiceContext = null;

export function setPracticeContext(ctx) {
  practiceContext = ctx;
}
export function getPracticeContext() {
  return practiceContext;
}

const ctx = { navigate, setPracticeContext, getPracticeContext };

export function navigate(hash) {
  if (location.hash === hash) {
    renderRoute();
  } else {
    location.hash = hash;
  }
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function parseHash() {
  const raw = (location.hash || '#/home').replace(/^#\/?/, '');
  const segments = raw.split('/').filter(Boolean);
  return segments.length ? segments : ['home'];
}

function renderRoute() {
  if (currentUnmount) {
    try { currentUnmount(); } catch (e) { /* ignore */ }
    currentUnmount = null;
  }
  const segments = parseHash();
  const [root, param] = segments;

  navLinks.forEach((a) => a.classList.toggle('active', a.dataset.route === root));

  let mod, params = {};
  switch (root) {
    case 'learn': mod = Learn; break;
    case 'songs': mod = param ? SongDetail : SongsList; params = { id: param }; break;
    case 'practice': mod = Practice; break;
    case 'progress': mod = Progress; break;
    case 'help': mod = Help; break;
    default: mod = Home; break;
  }
  const result = mod.mount(appEl, params, ctx);
  currentUnmount = typeof result === 'function' ? result : (result && result.unmount) || null;
}

window.addEventListener('hashchange', renderRoute);
// Module scripts execute after the DOM is parsed, so it's safe to render now.
renderRoute();
