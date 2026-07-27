import { midiToFreq } from './notes.js';

// Lightweight additive-synthesis "piano-ish" voice using the Web Audio API.
// No samples needed, so there's nothing to license or host.
export class PianoAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.voices = new Map(); // midi -> {oscs, gain}
    this.volume = 0.8;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  setVolume(v) {
    this.volume = v;
    if (this.master) this.master.gain.value = this.muted ? 0 : v;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : this.volume;
  }

  noteOn(midi, velocity = 0.85) {
    const ctx = this.ensure();
    this.noteOff(midi, true);
    const freq = midiToFreq(midi);
    const now = ctx.currentTime;

    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(0, now);
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.5, now + 0.008);
    voiceGain.gain.exponentialRampToValueAtTime(Math.max(velocity * 0.22, 0.001), now + 0.35);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(7000, freq * 8 + 500);
    voiceGain.connect(filter);
    filter.connect(this.master);

    const partials = [
      { mult: 1, gain: 1.0, type: 'triangle' },
      { mult: 2, gain: 0.35, type: 'sine' },
      { mult: 3, gain: 0.12, type: 'sine' },
      { mult: 4, gain: 0.06, type: 'sine' },
    ];
    const oscs = partials.map((p) => {
      const osc = ctx.createOscillator();
      osc.type = p.type;
      osc.frequency.value = freq * p.mult;
      const g = ctx.createGain();
      g.gain.value = p.gain;
      osc.connect(g);
      g.connect(voiceGain);
      osc.start(now);
      return osc;
    });

    this.voices.set(midi, { oscs, voiceGain, startedAt: now });
  }

  noteOff(midi, immediate = false) {
    const v = this.voices.get(midi);
    if (!v) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const release = immediate ? 0.02 : 0.4;
    try {
      v.voiceGain.gain.cancelScheduledValues(now);
      v.voiceGain.gain.setValueAtTime(v.voiceGain.gain.value, now);
      v.voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + release);
    } catch (e) { /* ignore */ }
    v.oscs.forEach((o) => {
      try { o.stop(now + release + 0.05); } catch (e) { /* ignore */ }
    });
    this.voices.delete(midi);
  }

  allNotesOff() {
    Array.from(this.voices.keys()).forEach((m) => this.noteOff(m, true));
  }

  // Short percussive click for the metronome, scheduled at an exact AudioContext time.
  clickAt(time, accent = false) {
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = accent ? 1400 : 900;
    gain.gain.setValueAtTime(accent ? 0.35 : 0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  chime(success = true) {
    const ctx = this.ensure();
    const now = ctx.currentTime;
    const freqs = success ? [523.25, 659.25, 783.99] : [220, 196];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const t = now + i * 0.09;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.55);
    });
  }

  get currentTime() {
    return this.ctx ? this.ctx.currentTime : 0;
  }
}

export const pianoAudio = new PianoAudio();
