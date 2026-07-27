import { nameToMidi } from './notes.js';

// A simplified right-hand fingering guide. Real fingering depends on
// context a teacher would judge by eye (finger substitutions, crossings),
// but for a beginner-friendly visual aid we rank the distinct pitches used
// in a passage low-to-high and cycle through fingers 1 (thumb) to 5
// (pinky) — which lines up exactly with "five-finger position" for the
// short, mostly 5-note-span songs in this app, and degrades gracefully
// (finger crossings) for wider-ranged pieces.
export function assignFingering(events) {
  const midis = [];
  for (const e of events) {
    if (e.notes.length > 0) midis.push(nameToMidi(e.notes[0]));
  }
  const unique = Array.from(new Set(midis)).sort((a, b) => a - b);
  const rank = new Map(unique.map((m, i) => [m, i]));

  return events.map((e) => {
    if (e.notes.length === 0) return null;
    const midi = nameToMidi(e.notes[0]);
    const finger = (rank.get(midi) % 5) + 1;
    return { hand: 'R', finger };
  });
}

export const FINGER_NAMES = { 1: 'Thumb', 2: 'Index', 3: 'Middle', 4: 'Ring', 5: 'Pinky' };
