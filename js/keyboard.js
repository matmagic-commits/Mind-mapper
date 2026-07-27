import { isBlackKey, midiToName } from './notes.js';

// Renders an interactive piano keyboard for a MIDI note range and reports
// note on/off events regardless of input device (mouse, touch, computer
// keys, MIDI) so callers can light up the exact key + position on the board.
export class PianoKeyboard {
  constructor(container, opts) {
    this.container = container;
    this.startMidi = opts.startMidi ?? 60;
    this.endMidi = opts.endMidi ?? 72;
    this.showLabels = opts.showLabels ?? true;
    this.onNoteOn = opts.onNoteOn || (() => {});
    this.onNoteOff = opts.onNoteOff || (() => {});
    this.activePointers = new Map();
    this.keyEls = new Map();
    this.render();
  }

  setRange(startMidi, endMidi) {
    this.startMidi = startMidi;
    this.endMidi = endMidi;
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    this.container.classList.add('piano-keys');
    this.keyEls.clear();

    const whites = [];
    for (let m = this.startMidi; m <= this.endMidi; m++) {
      if (!isBlackKey(m)) whites.push(m);
    }
    const whiteCount = whites.length;
    const whiteW = 100 / whiteCount;
    const whiteIndexOf = new Map(whites.map((m, i) => [m, i]));

    const whiteLayer = document.createElement('div');
    whiteLayer.className = 'key-layer key-layer-white';
    const blackLayer = document.createElement('div');
    blackLayer.className = 'key-layer key-layer-black';

    for (let m = this.startMidi; m <= this.endMidi; m++) {
      const black = isBlackKey(m);
      const el = document.createElement('div');
      el.className = black ? 'key key-black' : 'key key-white';
      el.dataset.midi = String(m);
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', midiToName(m));

      if (!black) {
        const idx = whiteIndexOf.get(m);
        el.style.left = `${idx * whiteW}%`;
        el.style.width = `${whiteW}%`;
        if (this.showLabels) {
          const name = midiToName(m);
          const label = document.createElement('span');
          label.className = 'key-label';
          label.textContent = name.startsWith('C') ? name : name[0];
          if (name.startsWith('C')) label.classList.add('key-label-c');
          el.appendChild(label);
        }
        whiteLayer.appendChild(el);
      } else {
        // Find the preceding white key to anchor this black key at its right edge.
        let prevWhite = m - 1;
        while (isBlackKey(prevWhite) && prevWhite > this.startMidi) prevWhite--;
        const idx = whiteIndexOf.has(prevWhite) ? whiteIndexOf.get(prevWhite) : -1;
        const blackW = whiteW * 0.62;
        const centerLeft = (idx + 1) * whiteW;
        el.style.left = `${centerLeft - blackW / 2}%`;
        el.style.width = `${blackW}%`;
        blackLayer.appendChild(el);
      }
      this.keyEls.set(m, el);
    }

    this.container.appendChild(whiteLayer);
    this.container.appendChild(blackLayer);
    this._bindPointerEvents();
  }

  _bindPointerEvents() {
    const handleDown = (e) => {
      const keyEl = e.target.closest('.key');
      if (!keyEl) return;
      e.preventDefault();
      const midi = parseInt(keyEl.dataset.midi, 10);
      this.activePointers.set(e.pointerId, midi);
      this.setPressed(midi, true);
      this.onNoteOn(midi, 'pointer');
    };
    const handleUp = (e) => {
      const midi = this.activePointers.get(e.pointerId);
      if (midi === undefined) return;
      this.activePointers.delete(e.pointerId);
      this.setPressed(midi, false);
      this.onNoteOff(midi, 'pointer');
    };
    const handleMove = (e) => {
      if (!this.activePointers.has(e.pointerId)) return;
      const keyEl = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.key');
      const newMidi = keyEl ? parseInt(keyEl.dataset.midi, 10) : undefined;
      const oldMidi = this.activePointers.get(e.pointerId);
      if (newMidi !== undefined && newMidi !== oldMidi) {
        this.setPressed(oldMidi, false);
        this.onNoteOff(oldMidi, 'pointer');
        this.activePointers.set(e.pointerId, newMidi);
        this.setPressed(newMidi, true);
        this.onNoteOn(newMidi, 'pointer');
      }
    };
    this.container.addEventListener('pointerdown', handleDown);
    this.container.addEventListener('pointerup', handleUp);
    this.container.addEventListener('pointercancel', handleUp);
    this.container.addEventListener('pointerleave', handleUp);
    this.container.addEventListener('pointermove', handleMove);
    this._cleanupPointers = () => {
      this.container.removeEventListener('pointerdown', handleDown);
      this.container.removeEventListener('pointerup', handleUp);
      this.container.removeEventListener('pointercancel', handleUp);
      this.container.removeEventListener('pointerleave', handleUp);
      this.container.removeEventListener('pointermove', handleMove);
    };
  }

  setPressed(midi, pressed) {
    const el = this.keyEls.get(midi);
    if (el) el.classList.toggle('key-pressed', pressed);
  }

  setHighlight(midi, className, on) {
    const el = this.keyEls.get(midi);
    if (el) el.classList.toggle(className, on);
  }

  clearHighlights(className) {
    this.keyEls.forEach((el) => el.classList.remove(className));
  }

  setFingerBadge(midi, finger, hand) {
    const el = this.keyEls.get(midi);
    if (!el) return;
    this.clearFingerBadges();
    const badge = document.createElement('span');
    badge.className = `finger-badge finger-badge-${hand === 'L' ? 'left' : 'right'}`;
    badge.textContent = String(finger);
    el.appendChild(badge);
  }

  clearFingerBadges() {
    this.keyEls.forEach((el) => {
      el.querySelectorAll('.finger-badge').forEach((b) => b.remove());
    });
  }

  getKeyRect(midi) {
    const el = this.keyEls.get(midi);
    if (!el) return null;
    const kRect = el.getBoundingClientRect();
    const cRect = this.container.getBoundingClientRect();
    return {
      left: kRect.left - cRect.left,
      width: kRect.width,
      containerWidth: cRect.width,
    };
  }

  ensureVisible(midi) {
    const el = this.keyEls.get(midi);
    if (!el) return;
    const wrap = this.container.parentElement;
    if (!wrap) return;
    const kRect = el.getBoundingClientRect();
    const wRect = wrap.getBoundingClientRect();
    if (kRect.left < wRect.left || kRect.right > wRect.right) {
      el.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  }

  destroy() {
    if (this._cleanupPointers) this._cleanupPointers();
  }
}
