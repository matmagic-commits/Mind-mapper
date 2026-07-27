import { KEY_MAP, nameToMidi } from './notes.js';

// Unifies computer-keyboard and Web MIDI input into the same
// onNoteOn/onNoteOff callback pair used by the on-screen PianoKeyboard,
// so any input device lights up the same key at the same board position.
export class InputManager {
  constructor({ onNoteOn, onNoteOff }) {
    this.onNoteOn = onNoteOn;
    this.onNoteOff = onNoteOff;
    this.heldKeys = new Set();
    this.midiAccess = null;
    this.midiAvailable = false;

    this._keydown = (e) => {
      if (e.repeat) return;
      if (this._isTyping(e.target)) return;
      const key = e.key.toLowerCase();
      const noteName = KEY_MAP[key];
      if (!noteName || this.heldKeys.has(key)) return;
      this.heldKeys.add(key);
      this.onNoteOn(nameToMidi(noteName), 'keyboard');
    };
    this._keyup = (e) => {
      const key = e.key.toLowerCase();
      const noteName = KEY_MAP[key];
      if (!noteName) return;
      this.heldKeys.delete(key);
      this.onNoteOff(nameToMidi(noteName), 'keyboard');
    };
    document.addEventListener('keydown', this._keydown);
    document.addEventListener('keyup', this._keyup);

    this._initMidi();
  }

  _isTyping(target) {
    const tag = target?.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable;
  }

  async _initMidi() {
    if (!navigator.requestMIDIAccess) return;
    try {
      this.midiAccess = await navigator.requestMIDIAccess();
      this.midiAvailable = true;
      const attach = (input) => {
        input.onmidimessage = (msg) => this._handleMidiMessage(msg);
      };
      for (const input of this.midiAccess.inputs.values()) attach(input);
      this.midiAccess.onstatechange = (e) => {
        if (e.port.type === 'input' && e.port.state === 'connected') attach(e.port);
      };
    } catch (e) {
      this.midiAvailable = false;
    }
  }

  _handleMidiMessage(msg) {
    const [status, midi, velocity] = msg.data;
    const type = status & 0xf0;
    if (type === 0x90 && velocity > 0) {
      this.onNoteOn(midi, 'midi', velocity / 127);
    } else if (type === 0x80 || (type === 0x90 && velocity === 0)) {
      this.onNoteOff(midi, 'midi');
    }
  }

  destroy() {
    document.removeEventListener('keydown', this._keydown);
    document.removeEventListener('keyup', this._keyup);
    if (this.midiAccess) {
      for (const input of this.midiAccess.inputs.values()) input.onmidimessage = null;
      this.midiAccess.onstatechange = null;
    }
  }
}
