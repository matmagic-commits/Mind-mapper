// The guided "Learn" path: a suggested order of short, focused steps that
// build up real keyboard skills before diving into full songs. Nothing here
// is hard-locked — motivated learners can jump straight to the Songs tab —
// but completing steps in order gives the smoothest ramp for a first-timer.

function n(names, beats) {
  return { notes: names ? (Array.isArray(names) ? names : [names]) : [], beats };
}
function seg(name, events) {
  return { name, events };
}
function drill(bpm, segmentDefs) {
  let events = [];
  const segments = [];
  for (const s of segmentDefs) {
    const start = events.length;
    events = events.concat(s.events);
    segments.push({ name: s.name, start, end: events.length - 1 });
  }
  return { bpm, events, segments };
}

export const CURRICULUM = [
  {
    id: 'meet-keyboard',
    title: 'Meet the Keyboard',
    blurb: 'Every piano is built from a repeating pattern of 12 keys. Find the white keys in order, then spot the black key groups of two and three.',
    icon: '🎹',
    kind: 'drill',
    forceMode: 'wait',
    song: {
      title: 'Meet the Keyboard',
      ...drill(60, [
        seg('Find the White Keys', [n('C4', 2), n('D4', 2), n('E4', 2), n('F4', 2), n('G4', 2), n('A4', 2), n('B4', 2), n('C5', 2)]),
        seg('Find the Black Key Pair', [n('C#4', 2), n('D#4', 2)]),
        seg('Find the Black Key Trio', [n('F#4', 2), n('G#4', 2), n('A#4', 2)]),
      ]),
    },
  },
  {
    id: 'five-finger',
    title: 'Five-Finger Position',
    blurb: 'Rest your right hand thumb on Middle C. Your five fingers now cover C-D-E-F-G — the foundation for almost every beginner piece.',
    icon: '✋',
    kind: 'drill',
    forceMode: 'wait',
    song: {
      title: 'Five-Finger Position',
      ...drill(80, [
        seg('Climbing Up', [n('C4', 1), n('D4', 1), n('E4', 1), n('F4', 1), n('G4', 2)]),
        seg('Climbing Down', [n('G4', 1), n('F4', 1), n('E4', 1), n('D4', 1), n('C4', 2)]),
      ]),
    },
  },
  {
    id: 'rhythm-basics',
    title: 'Rhythm Basics',
    blurb: 'Notes are not just about pitch — timing matters too. Practice quarter notes and half notes falling in time with the beat.',
    icon: '⏱️',
    kind: 'drill',
    forceMode: 'timed',
    hitWindowMs: 350,
    song: {
      title: 'Rhythm Basics',
      ...drill(70, [
        seg('Quarter Notes', [n('C4', 1), n('C4', 1), n('C4', 1), n('C4', 1)]),
        seg('Half Notes', [n('C4', 2), n('C4', 2)]),
        seg('Mixed Rhythm', [n('C4', 1), n('C4', 1), n('C4', 2), n('C4', 1), n('C4', 1), n('C4', 2)]),
      ]),
    },
  },
  {
    id: 'steps-and-skips',
    title: 'Steps and Skips',
    blurb: 'A "step" moves to the very next key. A "skip" hops over one. Feel the difference between the two motions.',
    icon: '🪜',
    kind: 'drill',
    forceMode: 'wait',
    song: {
      title: 'Steps and Skips',
      ...drill(80, [
        seg('Steps', [n('C4', 1), n('D4', 1), n('E4', 1), n('F4', 1), n('G4', 2)]),
        seg('Skips', [n('C4', 1), n('E4', 1), n('G4', 1), n('E4', 1), n('C4', 2)]),
      ]),
    },
  },
  {
    id: 'first-song',
    title: 'Your First Song',
    blurb: 'Time to play something real! "Hot Cross Buns" uses just three notes — a perfect first song.',
    icon: '🎵',
    kind: 'song',
    songId: 'hotcross',
    segmentIndex: 0,
  },
  {
    id: 'timed-play-intro',
    title: 'Playing in Time',
    blurb: 'Now try Rhythm Mode: notes fall from the top and you play them as they cross the line — just like the pros practice.',
    icon: '⬇️',
    kind: 'drill',
    forceMode: 'timed',
    hitWindowMs: 300,
    song: {
      title: 'Playing in Time',
      ...drill(80, [
        seg('Falling Notes', [n('C4', 1), n('D4', 1), n('E4', 1), n('F4', 1), n('G4', 2)]),
      ]),
    },
  },
  {
    id: 'full-song',
    title: 'Full Song: Twinkle Twinkle',
    blurb: 'Put it all together and play the whole song, start to finish.',
    icon: '⭐',
    kind: 'song',
    songId: 'twinkle',
    segmentIndex: null,
  },
  {
    id: 'bonus-longer-piece',
    title: 'Bonus: A Longer Piece',
    blurb: 'Ready for a challenge? Work through "Ode to Joy" one short segment at a time.',
    icon: '🏆',
    kind: 'song',
    songId: 'odetojoy',
    segmentIndex: null,
  },
];

export function getCurriculumStep(id) {
  return CURRICULUM.find((s) => s.id === id);
}
