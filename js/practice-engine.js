import { nameToMidi, midiToName, isBlackKey, beatsToMs } from './notes.js';
import { PianoKeyboard } from './keyboard.js';
import { InputManager } from './input.js';
import { pianoAudio } from './audio.js';
import { getSettings, updateSettings } from './storage.js';

const LEAD_TIME_MS = 1650;
const DEFAULT_HIT_WINDOW_MS = 220;

function computeAbsoluteTimes(events, bpm) {
  let t = 0;
  return events.map((e) => {
    const start = t;
    const durMs = beatsToMs(e.beats, bpm);
    t += durMs;
    return { ...e, startMs: start, durMs };
  });
}

function noteRange(events) {
  let min = Infinity, max = -Infinity;
  for (const e of events) {
    for (const name of e.notes) {
      const m = nameToMidi(name);
      if (m < min) min = m;
      if (m > max) max = m;
    }
  }
  if (min === Infinity) { min = 60; max = 72; }
  return { min, max };
}

function paddedWhiteRange(min, max) {
  let start = min - 2;
  let end = max + 2;
  while (isBlackKey(start)) start--;
  while (isBlackKey(end)) end++;
  return { start: Math.max(start, 21), end: Math.min(end, 108) };
}

// Runs one practice "session": a slice of events (a segment or a full song),
// in either Wait Mode (untimed, key-by-key) or Timed Mode (falling notes +
// rhythm scoring). Reports the outcome via onFinish so the caller decides
// what happens next (unlock a segment, show a retry button, navigate on).
export class PracticeEngine {
  constructor(root, opts) {
    this.root = root;
    this.title = opts.title;
    this.segmentName = opts.segmentName || null;
    this.allEvents = opts.events;
    this.range = opts.range || { start: 0, end: opts.events.length - 1 };
    this.baseBpm = opts.bpm;
    this.forceMode = opts.forceMode || null;
    this.hitWindowMs = opts.hitWindowMs || DEFAULT_HIT_WINDOW_MS;
    this.onFinish = opts.onFinish || (() => {});
    this.onExit = opts.onExit || (() => {});

    const settings = getSettings();
    this.mode = this.forceMode || (settings.waitMode ? 'wait' : 'timed');
    this.tempoPct = settings.tempoPct || 100;
    this.showLabels = settings.showLabels !== false;
    this.metronomeOn = !!settings.metronome;

    this.sliceEvents = this.allEvents.slice(this.range.start, this.range.end + 1);
    this.rafId = null;
    this.destroyed = false;

    this._buildDom();
    this._setupSession();
  }

  _buildDom() {
    this.root.innerHTML = '';
    this.root.className = 'practice-engine';

    const header = document.createElement('div');
    header.className = 'practice-header';
    header.innerHTML = `
      <div class="practice-titles">
        <h2>${this.title}</h2>
        ${this.segmentName ? `<div class="practice-segment-name">${this.segmentName}</div>` : ''}
      </div>
      <button class="btn btn-ghost practice-exit" aria-label="Exit practice">✕ Exit</button>
    `;
    header.querySelector('.practice-exit').addEventListener('click', () => this.onExit());

    const controls = document.createElement('div');
    controls.className = 'practice-controls';
    controls.innerHTML = `
      ${!this.forceMode ? `
      <div class="control-group">
        <label>Mode</label>
        <div class="segmented">
          <button class="seg-btn" data-mode="wait">Wait for Me</button>
          <button class="seg-btn" data-mode="timed">Rhythm Mode</button>
        </div>
      </div>` : `<div class="control-group"><span class="mode-badge">${this.mode === 'wait' ? '✋ Wait for Me' : '⬇️ Rhythm Mode'}</span></div>`}
      <div class="control-group">
        <label>Tempo <span class="tempo-val">${this.tempoPct}%</span></label>
        <input type="range" min="50" max="150" step="10" value="${this.tempoPct}" class="tempo-slider" />
      </div>
      <div class="control-group control-group-toggles">
        <label class="toggle"><input type="checkbox" class="metronome-toggle" ${this.metronomeOn ? 'checked' : ''}/> Metronome</label>
        <label class="toggle"><input type="checkbox" class="labels-toggle" ${this.showLabels ? 'checked' : ''}/> Key Names</label>
      </div>
      <button class="btn btn-secondary practice-restart">↻ Restart</button>
    `;

    const stageWrap = document.createElement('div');
    stageWrap.className = 'keyboard-scroll';
    const stageInner = document.createElement('div');
    stageInner.className = 'stage-inner';
    const fallingArea = document.createElement('div');
    fallingArea.className = 'falling-area';
    const hitLine = document.createElement('div');
    hitLine.className = 'hit-line';
    const keysContainer = document.createElement('div');
    keysContainer.className = 'piano-keys-container';
    stageInner.appendChild(fallingArea);
    stageInner.appendChild(hitLine);
    stageInner.appendChild(keysContainer);
    stageWrap.appendChild(stageInner);

    const waitPanel = document.createElement('div');
    waitPanel.className = 'wait-panel';

    const footer = document.createElement('div');
    footer.className = 'practice-footer';

    this.root.appendChild(header);
    this.root.appendChild(controls);
    this.root.appendChild(waitPanel);
    this.root.appendChild(stageWrap);
    this.root.appendChild(footer);

    this.el = {
      header, controls, stageWrap, stageInner, fallingArea, hitLine, keysContainer, waitPanel, footer,
      modeButtons: controls.querySelectorAll('.seg-btn'),
      tempoSlider: controls.querySelector('.tempo-slider'),
      tempoVal: controls.querySelector('.tempo-val'),
      metronomeToggle: controls.querySelector('.metronome-toggle'),
      labelsToggle: controls.querySelector('.labels-toggle'),
      restartBtn: controls.querySelector('.practice-restart'),
    };

    this.el.modeButtons.forEach((b) => {
      b.classList.toggle('active', b.dataset.mode === this.mode);
      b.addEventListener('click', () => {
        if (b.dataset.mode === this.mode) return;
        this.mode = b.dataset.mode;
        updateSettings({ waitMode: this.mode === 'wait' });
        this.el.modeButtons.forEach((x) => x.classList.toggle('active', x.dataset.mode === this.mode));
        this._setupSession();
      });
    });
    this.el.tempoSlider.addEventListener('input', (e) => {
      this.tempoPct = parseInt(e.target.value, 10);
      this.el.tempoVal.textContent = `${this.tempoPct}%`;
      updateSettings({ tempoPct: this.tempoPct });
      this._setupSession();
    });
    this.el.metronomeToggle.addEventListener('change', (e) => {
      this.metronomeOn = e.target.checked;
      updateSettings({ metronome: this.metronomeOn });
    });
    this.el.labelsToggle.addEventListener('change', (e) => {
      this.showLabels = e.target.checked;
      updateSettings({ showLabels: this.showLabels });
      this.keyboard.showLabels = this.showLabels;
      this.keyboard.render();
      this._layoutFallingBars(true);
    });
    this.el.restartBtn.addEventListener('click', () => this._setupSession());
  }

  _effectiveBpm() {
    return this.baseBpm * (this.tempoPct / 100);
  }

  _setupSession() {
    this._stopLoop();
    pianoAudio.allNotesOff();
    if (this.input) this.input.destroy();
    if (this.keyboard) this.keyboard.destroy();

    const bpm = this._effectiveBpm();
    this.timedEvents = computeAbsoluteTimes(this.sliceEvents, bpm);
    const { min, max } = noteRange(this.sliceEvents);
    const { start, end } = paddedWhiteRange(min, max);

    this.keyboard = new PianoKeyboard(this.el.keysContainer, {
      startMidi: start,
      endMidi: end,
      showLabels: this.showLabels,
      onNoteOn: (midi, src) => this._handleNoteOn(midi, src),
      onNoteOff: (midi, src) => this._handleNoteOff(midi, src),
    });

    this.input = new InputManager({
      onNoteOn: (midi, src) => { this.keyboard.setPressed(midi, true); this._handleNoteOn(midi, src); },
      onNoteOff: (midi, src) => { this.keyboard.setPressed(midi, false); this._handleNoteOff(midi, src); },
    });

    this.currentIndex = 0;
    this.results = this.timedEvents.map(() => ({ resolved: false, hit: false }));
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.finished = false;
    this.requiredRemaining = null;
    this.playbackStartCtxTime = null;
    this.countInDone = false;
    this.hiddenBars = new Set();
    this.barEls = null;

    requestAnimationFrame(() => {
      const scorable = this.timedEvents.filter((e) => e.notes.length > 0).length;
      this.totalScorable = scorable;
      if (this.mode === 'wait') {
        this.el.fallingArea.style.display = 'none';
        this.el.hitLine.style.display = 'none';
        this.el.waitPanel.style.display = '';
        this._advanceWaitTarget();
      } else {
        this.el.fallingArea.style.display = '';
        this.el.hitLine.style.display = '';
        this.el.waitPanel.style.display = 'none';
        this._startTimedSession();
      }
    });
  }

  // ---------- Wait Mode ----------

  _advanceWaitTarget() {
    this.keyboard.clearHighlights('key-target');
    if (this.currentIndex >= this.timedEvents.length) {
      this._finish(100, true);
      return;
    }
    const ev = this.timedEvents[this.currentIndex];
    if (ev.notes.length === 0) {
      this._renderWaitPanel(ev, true);
      setTimeout(() => {
        if (this.destroyed) return;
        this.currentIndex += 1;
        this._advanceWaitTarget();
      }, Math.max(300, ev.durMs * 0.6));
      return;
    }
    this.requiredRemaining = new Set(ev.notes.map((n) => nameToMidi(n)));
    for (const m of this.requiredRemaining) this.keyboard.setHighlight(m, 'key-target', true);
    this.keyboard.ensureVisible(ev.notes.map((n) => nameToMidi(n))[0]);
    this._renderWaitPanel(ev, false);
  }

  _renderWaitPanel(currentEvent, isRest) {
    const upcoming = this.timedEvents.slice(this.currentIndex + 1, this.currentIndex + 6);
    const currentLabel = isRest ? 'Rest' : currentEvent.notes.map((n) => n.replace('#', '♯')).join(' + ');
    this.el.waitPanel.innerHTML = `
      <div class="wait-progress">Note ${Math.min(this.currentIndex + 1, this.timedEvents.length)} of ${this.timedEvents.length}</div>
      <div class="wait-current ${isRest ? 'is-rest' : ''}">${isRest ? '𝘟 Rest — just wait a beat' : `Play: <strong>${currentLabel}</strong>`}</div>
      <div class="wait-queue">
        ${upcoming.map((e) => `<span class="queue-chip ${e.notes.length === 0 ? 'is-rest' : ''}">${e.notes.length ? e.notes.map((n) => n.replace('#', '♯')).join('+') : '—'}</span>`).join('')}
      </div>
    `;
  }

  _handleWaitInput(midi, isOn) {
    if (!isOn || !this.requiredRemaining) return;
    if (this.requiredRemaining.has(midi)) {
      this.requiredRemaining.delete(midi);
      this.keyboard.setHighlight(midi, 'key-correct', true);
      setTimeout(() => this.keyboard.setHighlight(midi, 'key-correct', false), 250);
      if (this.requiredRemaining.size === 0) {
        this.keyboard.clearHighlights('key-target');
        pianoAudio.chime(true);
        this.currentIndex += 1;
        setTimeout(() => {
          if (this.destroyed) return;
          this._advanceWaitTarget();
        }, 120);
      }
    } else {
      this.keyboard.setHighlight(midi, 'key-wrong', true);
      setTimeout(() => this.keyboard.setHighlight(midi, 'key-wrong', false), 250);
    }
  }

  // ---------- Timed Mode ----------

  _startTimedSession() {
    const ctx = pianoAudio.ensure();
    const bpm = this._effectiveBpm();
    const beatMs = 60000 / bpm;
    const countInBeats = 4;
    const now = ctx.currentTime;
    const countInStart = now + 0.15;
    for (let i = 0; i < countInBeats; i++) {
      pianoAudio.clickAt(countInStart + (i * beatMs) / 1000, i === 0);
    }
    this.playbackStartCtxTime = countInStart + (countInBeats * beatMs) / 1000;
    this.nextMetronomeBeat = 0;
    this.beatMs = beatMs;
    this._renderTimedFooter();
    this._loop();
  }

  _loop = () => {
    if (this.destroyed || this.finished) return;
    const ctx = pianoAudio.ensure();
    const elapsedMs = (ctx.currentTime - this.playbackStartCtxTime) * 1000;

    if (this.metronomeOn) {
      while (this.nextMetronomeBeat * this.beatMs <= elapsedMs + 200) {
        const beatTime = this.playbackStartCtxTime + (this.nextMetronomeBeat * this.beatMs) / 1000;
        if (beatTime > ctx.currentTime - 0.01) {
          pianoAudio.clickAt(beatTime, this.nextMetronomeBeat % 4 === 0);
        }
        this.nextMetronomeBeat += 1;
      }
    }

    this._layoutFallingBars(false, elapsedMs);
    this._checkMisses(elapsedMs);

    const last = this.timedEvents[this.timedEvents.length - 1];
    const endMs = last.startMs + last.durMs + this.hitWindowMs + 400;
    if (elapsedMs > endMs) {
      this._endTimedSession();
      return;
    }
    this.rafId = requestAnimationFrame(this._loop);
  };

  _checkMisses(elapsedMs) {
    this.timedEvents.forEach((ev, i) => {
      if (ev.notes.length === 0 || this.results[i].resolved) return;
      if (elapsedMs > ev.startMs + this.hitWindowMs) {
        this.results[i] = { resolved: true, hit: false };
        this.combo = 0;
        this._flashBar(i, 'miss');
        this._renderTimedFooter();
      }
    });
  }

  _layoutFallingBars(forceRebuild, elapsedMsOverride) {
    const trackH = this.el.fallingArea.clientHeight || 260;
    const ctx = pianoAudio.ensure();
    const elapsedMs = elapsedMsOverride !== undefined
      ? elapsedMsOverride
      : (this.playbackStartCtxTime ? (ctx.currentTime - this.playbackStartCtxTime) * 1000 : -LEAD_TIME_MS);

    if (forceRebuild || !this.barEls) {
      this.el.fallingArea.innerHTML = '';
      this.barEls = this.timedEvents.map((ev, i) => {
        if (ev.notes.length === 0) return null;
        const bar = document.createElement('div');
        bar.className = 'note-bar';
        this.el.fallingArea.appendChild(bar);
        return bar;
      });
    }

    this.timedEvents.forEach((ev, i) => {
      const bar = this.barEls[i];
      if (!bar) return;
      if (this.hiddenBars.has(i)) { bar.style.display = 'none'; return; }
      const appearAt = ev.startMs - LEAD_TIME_MS;
      const f = (elapsedMs - appearAt) / LEAD_TIME_MS;
      if (f < -0.05 || f > 1.25) {
        bar.style.display = 'none';
        return;
      }
      bar.style.display = '';
      const midi = nameToMidi(ev.notes[0]);
      const rect = this.keyboard.getKeyRect(midi);
      if (!rect) { bar.style.display = 'none'; return; }
      const durFrac = ev.durMs / LEAD_TIME_MS;
      const heightPx = Math.max(14, durFrac * trackH);
      const bottom = Math.min(1, Math.max(0, f)) * trackH;
      const top = Math.min(trackH - 2, Math.max(0, bottom - heightPx));
      bar.style.left = `${rect.left + rect.width * 0.12}px`;
      bar.style.width = `${rect.width * 0.76}px`;
      bar.style.top = `${top}px`;
      bar.style.height = `${heightPx}px`;
      bar.classList.toggle('note-bar-black', isBlackKey(midi));
    });
  }

  _flashBar(index, kind) {
    const bar = this.barEls?.[index];
    if (!bar) return;
    bar.classList.add(kind === 'hit' ? 'note-bar-hit' : kind === 'good' ? 'note-bar-good' : 'note-bar-miss');
    setTimeout(() => {
      this.hiddenBars.add(index);
      if (bar) bar.style.display = 'none';
    }, 220);
  }

  _handleTimedInput(midi) {
    if (!this.playbackStartCtxTime) return;
    const ctx = pianoAudio.ensure();
    const elapsedMs = (ctx.currentTime - this.playbackStartCtxTime) * 1000;
    let bestIdx = -1, bestDiff = Infinity;
    this.timedEvents.forEach((ev, i) => {
      if (ev.notes.length === 0 || this.results[i].resolved) return;
      if (!ev.notes.some((n) => nameToMidi(n) === midi)) return;
      const diff = Math.abs(elapsedMs - ev.startMs);
      if (diff <= this.hitWindowMs && diff < bestDiff) {
        bestDiff = diff; bestIdx = i;
      }
    });
    if (bestIdx === -1) return;
    const quality = bestDiff <= this.hitWindowMs * 0.45 ? 'hit' : 'good';
    this.results[bestIdx] = { resolved: true, hit: true, quality };
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.score += quality === 'hit' ? 100 : 70;
    this._flashBar(bestIdx, quality);
    this._renderTimedFooter();
  }

  _renderTimedFooter() {
    const hits = this.results.filter((r) => r.hit).length;
    const acc = this.totalScorable ? Math.round((hits / this.totalScorable) * 100) : 0;
    this.el.footer.innerHTML = `
      <div class="footer-stat"><span class="stat-label">Accuracy</span><span class="stat-value">${acc}%</span></div>
      <div class="footer-stat"><span class="stat-label">Combo</span><span class="stat-value">${this.combo}x</span></div>
      <div class="footer-stat"><span class="stat-label">Best Combo</span><span class="stat-value">${this.maxCombo}x</span></div>
    `;
  }

  _endTimedSession() {
    const hits = this.results.filter((r) => r.hit).length;
    const acc = this.totalScorable ? Math.round((hits / this.totalScorable) * 100) : 100;
    this._finish(acc, acc >= 60);
  }

  // ---------- Shared ----------

  _handleNoteOn(midi, src) {
    pianoAudio.noteOn(midi);
    if (this.mode === 'wait') this._handleWaitInput(midi, true);
    else this._handleTimedInput(midi);
  }

  _handleNoteOff(midi) {
    pianoAudio.noteOff(midi);
  }

  _finish(accuracy, passed) {
    if (this.finished) return;
    this.finished = true;
    this._stopLoop();
    pianoAudio.allNotesOff();
    pianoAudio.chime(passed);
    this.onFinish({ accuracy, passed, mode: this.mode });
  }

  _stopLoop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  destroy() {
    this.destroyed = true;
    this._stopLoop();
    pianoAudio.allNotesOff();
    if (this.input) this.input.destroy();
    if (this.keyboard) this.keyboard.destroy();
  }
}
