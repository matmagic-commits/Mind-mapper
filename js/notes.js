// Core note/pitch utilities shared across the app.
// Convention: MIDI 60 = C4 ("middle C").

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

export function midiToName(midi) {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[pc]}${octave}`;
}

const NAME_RE = /^([A-Ga-g])(#|b)?(-?\d+)$/;

export function nameToMidi(name) {
  const m = NAME_RE.exec(name.trim());
  if (!m) throw new Error(`Invalid note name: ${name}`);
  const letter = m[1].toUpperCase();
  const accidental = m[2] || '';
  const octave = parseInt(m[3], 10);
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[letter];
  let pc = base;
  if (accidental === '#') pc += 1;
  if (accidental === 'b') pc -= 1;
  return (octave + 1) * 12 + pc;
}

export function isBlackKey(midi) {
  return BLACK_PITCH_CLASSES.has(((midi % 12) + 12) % 12);
}

export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Standard "computer keyboard as piano" mapping, two rows, DAW-style.
export const KEY_MAP = {
  // Lower octave (white keys)
  'z': 'C3', 'x': 'D3', 'c': 'E3', 'v': 'F3', 'b': 'G3', 'n': 'A3', 'm': 'B3',
  ',': 'C4', '.': 'D4', '/': 'E4',
  // Lower octave (black keys)
  's': 'C#3', 'd': 'D#3', 'g': 'F#3', 'h': 'G#3', 'j': 'A#3', 'l': 'C#4', ';': 'D#4',
  // Upper octave (white keys)
  'q': 'C4', 'w': 'D4', 'e': 'E4', 'r': 'F4', 't': 'G4', 'y': 'A4', 'u': 'B4',
  'i': 'C5', 'o': 'D5', 'p': 'E5',
  // Upper octave (black keys)
  '2': 'C#4', '3': 'D#4', '5': 'F#4', '6': 'G#4', '7': 'A#4', '9': 'C#5', '0': 'D#5',
};

export function beatsToMs(beats, bpm) {
  return (beats * 60000) / bpm;
}
