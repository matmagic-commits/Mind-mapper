// Song library. All pieces are traditional / public-domain melodies,
// transcribed and arranged for this app (classical excerpts are marked
// "(simplified arrangement)") so the app can stay free with no licensing
// fees, forever.

function n(names, beats) {
  return { notes: names ? (Array.isArray(names) ? names : [names]) : [], beats };
}
function seg(name, events) {
  return { name, events };
}
function compile(id, title, meta, segmentDefs) {
  let events = [];
  const segments = [];
  for (const s of segmentDefs) {
    const start = events.length;
    events = events.concat(s.events);
    segments.push({ name: s.name, start, end: events.length - 1 });
  }
  return { id, title, ...meta, events, segments };
}

export const SONGS = [
  compile('twinkle', 'Twinkle Twinkle Little Star', {
    category: 'kids', source: 'Traditional', bpm: 90, difficulty: 1,
  }, [
    seg('Twinkle Twinkle', [n('C4', 1), n('C4', 1), n('G4', 1), n('G4', 1), n('A4', 1), n('A4', 1), n('G4', 2)]),
    seg('How I Wonder', [n('F4', 1), n('F4', 1), n('E4', 1), n('E4', 1), n('D4', 1), n('D4', 1), n('C4', 2)]),
    seg('Up Above the World', [n('G4', 1), n('G4', 1), n('F4', 1), n('F4', 1), n('E4', 1), n('E4', 1), n('D4', 2), n('G4', 1), n('G4', 1), n('F4', 1), n('F4', 1), n('E4', 1), n('E4', 1), n('D4', 2)]),
    seg('Twinkle Twinkle (Again)', [n('C4', 1), n('C4', 1), n('G4', 1), n('G4', 1), n('A4', 1), n('A4', 1), n('G4', 2), n('F4', 1), n('F4', 1), n('E4', 1), n('E4', 1), n('D4', 1), n('D4', 1), n('C4', 2)]),
  ]),

  compile('hotcross', 'Hot Cross Buns', {
    category: 'kids', source: 'Traditional', bpm: 84, difficulty: 1,
  }, [
    seg('Hot Cross Buns', [n('E4', 1), n('D4', 1), n('C4', 2)]),
    seg('Hot Cross Buns (Again)', [n('E4', 1), n('D4', 1), n('C4', 2)]),
    seg('One a Penny, Two a Penny', [n('C4', 0.5), n('C4', 0.5), n('C4', 0.5), n('C4', 0.5), n('D4', 0.5), n('D4', 0.5), n('D4', 0.5), n('D4', 0.5)]),
    seg('Hot Cross Buns (Ending)', [n('E4', 1), n('D4', 1), n('C4', 2)]),
  ]),

  compile('mary', 'Mary Had a Little Lamb', {
    category: 'kids', source: 'Traditional', bpm: 100, difficulty: 2,
  }, [
    seg('Mary Had a Little Lamb', [n('E4', 1), n('D4', 1), n('C4', 1), n('D4', 1), n('E4', 1), n('E4', 1), n('E4', 2)]),
    seg('Little Lamb, Little Lamb', [n('D4', 1), n('D4', 1), n('D4', 2), n('E4', 1), n('E4', 1), n('E4', 2)]),
    seg('Mary Had a Little Lamb (2)', [n('E4', 1), n('D4', 1), n('C4', 1), n('D4', 1), n('E4', 1), n('E4', 1), n('E4', 1), n('E4', 1)]),
    seg('Its Fleece Was White as Snow', [n('D4', 1), n('D4', 1), n('E4', 1), n('D4', 1), n('C4', 4)]),
  ]),

  compile('rowboat', 'Row, Row, Row Your Boat', {
    category: 'kids', source: 'Traditional', bpm: 92, difficulty: 2,
  }, [
    seg('Row Row Row Your Boat', [n('C4', 1), n('C4', 1), n('C4', 1), n('D4', 1), n('E4', 2)]),
    seg('Gently Down the Stream', [n('E4', 1), n('D4', 1), n('E4', 1), n('F4', 1), n('G4', 2)]),
    seg('Merrily Merrily', [n('C5', 0.5), n('C5', 0.5), n('C5', 1), n('G4', 0.5), n('G4', 0.5), n('G4', 1), n('E4', 0.5), n('E4', 0.5), n('E4', 1), n('C4', 0.5), n('C4', 0.5), n('C4', 1)]),
    seg('Life Is But a Dream', [n('G4', 1), n('F4', 1), n('E4', 1), n('D4', 1), n('C4', 2)]),
  ]),

  compile('oldmac', 'Old MacDonald Had a Farm', {
    category: 'kids', source: 'Traditional', bpm: 110, difficulty: 2,
  }, [
    seg('Old MacDonald Had a Farm', [n('C4', 1), n('C4', 1), n('C4', 1), n('G4', 1), n('A4', 1), n('A4', 1), n('G4', 2)]),
    seg('E-I-E-I-O', [n('E4', 1), n('E4', 1), n('D4', 1), n('D4', 1), n('C4', 2)]),
  ]),

  compile('happybday', 'Happy Birthday to You', {
    category: 'kids', source: 'Traditional', bpm: 100, difficulty: 3,
  }, [
    seg('Happy Birthday to You', [n('G4', 0.5), n('G4', 0.5), n('A4', 1), n('G4', 1), n('C5', 1), n('B4', 2)]),
    seg('Happy Birthday to You (2)', [n('G4', 0.5), n('G4', 0.5), n('A4', 1), n('G4', 1), n('D5', 1), n('C5', 2)]),
    seg('Happy Birthday Dear Friend', [n('G4', 0.5), n('G4', 0.5), n('G5', 1), n('E5', 1), n('C5', 1), n('B4', 1), n('A4', 2)]),
    seg('Happy Birthday to You (Ending)', [n('F5', 0.5), n('F5', 0.5), n('E5', 1), n('C5', 1), n('D5', 1), n('C5', 2)]),
  ]),

  compile('frere', 'Frère Jacques', {
    category: 'kids', source: 'Traditional (French round)', bpm: 100, difficulty: 2,
  }, [
    seg('Frère Jacques', [n('C4', 1), n('D4', 1), n('E4', 1), n('C4', 1)]),
    seg('Frère Jacques (Again)', [n('C4', 1), n('D4', 1), n('E4', 1), n('C4', 1)]),
    seg('Dormez-Vous?', [n('E4', 1), n('F4', 1), n('G4', 2)]),
    seg('Dormez-Vous? (Again)', [n('E4', 1), n('F4', 1), n('G4', 2)]),
    seg('Sonnez les Matines', [n('G4', 0.5), n('A4', 0.5), n('G4', 0.5), n('F4', 0.5), n('E4', 1), n('C4', 1)]),
    seg('Sonnez les Matines (Again)', [n('G4', 0.5), n('A4', 0.5), n('G4', 0.5), n('F4', 0.5), n('E4', 1), n('C4', 1)]),
    seg('Din Din Don', [n('C4', 1), n('G4', 1), n('C4', 2)]),
    seg('Din Din Don (Again)', [n('C4', 1), n('G4', 1), n('C4', 2)]),
  ]),

  compile('joytoworld', 'Joy to the World (opening)', {
    category: 'classics', source: 'Traditional carol, simplified arrangement', bpm: 100, difficulty: 3,
  }, [
    seg('Joy to the World', [n('C5', 1), n('B4', 1), n('A4', 1), n('G4', 1), n('F4', 1), n('E4', 1), n('D4', 1), n('C4', 2)]),
    seg('Let Earth Receive Her King', [n('D4', 1), n('G4', 1), n('G4', 1), n('G4', 1), n('A4', 1), n('B4', 1), n('C5', 2)]),
  ]),

  compile('odetojoy', 'Ode to Joy (simplified)', {
    category: 'classics', source: 'Beethoven, Symphony No. 9 — simplified arrangement', bpm: 108, difficulty: 3,
  }, [
    seg('Theme, Part 1', [n('E4', 1), n('E4', 1), n('F4', 1), n('G4', 1), n('G4', 1), n('F4', 1), n('E4', 1), n('D4', 1)]),
    seg('Theme, Part 2', [n('C4', 1), n('C4', 1), n('D4', 1), n('E4', 1), n('E4', 1.5), n('D4', 0.5), n('D4', 2)]),
    seg('Theme, Part 3 (Repeat)', [n('E4', 1), n('E4', 1), n('F4', 1), n('G4', 1), n('G4', 1), n('F4', 1), n('E4', 1), n('D4', 1)]),
    seg('Theme, Part 4 (Ending)', [n('C4', 1), n('C4', 1), n('D4', 1), n('E4', 1), n('D4', 1.5), n('C4', 0.5), n('C4', 2)]),
  ]),

  compile('furelise', 'Für Elise (opening, simplified)', {
    category: 'classics', source: 'Beethoven, Bagatelle No. 25 — simplified arrangement', bpm: 66, difficulty: 4,
  }, [
    seg('Famous Opening Motif', [n('E5', 0.5), n('D#5', 0.5), n('E5', 0.5), n('D#5', 0.5), n('E5', 0.5), n('B4', 0.5), n('D5', 0.5), n('C5', 0.5)]),
    seg('Falling Answer', [n('A4', 1.5), n([], 0.5), n('C4', 0.5), n('E4', 0.5), n('A4', 0.5), n('B4', 1.5), n([], 0.5)]),
    seg('Rising Bridge', [n('E4', 0.5), n('G#4', 0.5), n('B4', 0.5), n('C5', 1.5), n([], 0.5)]),
    seg('Motif (Again)', [n('E5', 0.5), n('D#5', 0.5), n('E5', 0.5), n('D#5', 0.5), n('E5', 0.5), n('B4', 0.5), n('D5', 0.5), n('C5', 0.5)]),
    seg('Closing Phrase', [n('A4', 1.5), n([], 0.5), n('C4', 0.5), n('E4', 0.5), n('A4', 0.5), n('B4', 1), n('D4', 0.5), n('C4', 0.5), n('B4', 0.5), n('A4', 2)]),
  ]),

  compile('canon', 'Canon in D (cover-style arrangement)', {
    category: 'classics', source: 'Inspired by Pachelbel — original simplified arpeggio arrangement', bpm: 96, difficulty: 4,
  }, [
    seg('Arpeggio, Part 1', [n('C4', 0.5), n('E4', 0.5), n('G4', 0.5), n('C5', 0.5), n('B4', 0.5), n('G4', 0.5), n('E4', 0.5), n('G4', 0.5)]),
    seg('Arpeggio, Part 2', [n('A4', 0.5), n('C5', 0.5), n('E5', 0.5), n('A5', 0.5), n('G5', 0.5), n('E5', 0.5), n('C5', 0.5), n('E5', 0.5)]),
    seg('Arpeggio, Part 3', [n('F4', 0.5), n('A4', 0.5), n('C5', 0.5), n('F5', 0.5), n('E5', 0.5), n('C5', 0.5), n('A4', 0.5), n('C5', 0.5)]),
    seg('Arpeggio, Part 4 (Resolve)', [n('G4', 0.5), n('B4', 0.5), n('D5', 0.5), n('G5', 0.5), n('F5', 0.5), n('D5', 0.5), n('B4', 0.5), n('G4', 2)]),
  ]),

  compile('greensleeves', 'Greensleeves', {
    category: 'classics', source: 'Traditional English (16th century) — simplified arrangement', bpm: 90, difficulty: 3,
  }, [
    seg('Alas, My Love', [n('A4', 1), n('C5', 0.5), n('D5', 0.5), n('E5', 1), n('F5', 0.5), n('E5', 0.5), n('D5', 1), n('B4', 0.5), n('C5', 0.5), n('A4', 2)]),
    seg('Delighting in Your Company', [n('A4', 1), n('C5', 0.5), n('D5', 0.5), n('E5', 1), n('F5', 0.5), n('E5', 0.5), n('D5', 1), n('C5', 0.5), n('B4', 0.5), n('A4', 2)]),
  ]),

  compile('risingsun', 'House of the Rising Sun', {
    category: 'classics', source: 'Traditional American folk — simplified arrangement', bpm: 76, difficulty: 3,
  }, [
    seg('There Is a House', [n('A4', 1), n('C5', 1), n('D5', 1), n('E5', 1), n('C5', 1), n('D5', 1), n('A4', 2)]),
    seg('The Rising Sun', [n('A4', 1), n('C5', 1), n('D5', 1), n('C5', 1), n('A4', 1), n('G4', 1), n('A4', 2)]),
  ]),

  compile('fadingechoes', 'Fading Echoes', {
    category: 'originals', source: 'Original piece, inspired by the moody piano-ballad style of bands like Evanescence — not a cover, no affiliation', bpm: 76, difficulty: 3,
  }, [
    seg('Falling Motif', [n('A4', 0.5), n('C5', 0.5), n('E5', 0.5), n('D5', 0.5), n('C5', 0.5), n('B4', 0.5), n('A4', 1)]),
    seg('Rising Answer', [n('A4', 0.5), n('C5', 0.5), n('D5', 0.5), n('E5', 0.5), n('F5', 1), n('E5', 1)]),
    seg('Return', [n('A4', 0.5), n('C5', 0.5), n('E5', 0.5), n('D5', 0.5), n('C5', 0.5), n('B4', 0.5), n('A4', 2)]),
  ]),

  compile('hollowlullaby', 'Hollow Lullaby', {
    category: 'originals', source: 'Original piece, inspired by the moody piano-ballad style of bands like Evanescence — not a cover, no affiliation', bpm: 70, difficulty: 3,
  }, [
    seg('Lullaby Motif', [n('D4', 1), n('F4', 0.5), n('A4', 0.5), n('G4', 1), n('F4', 1)]),
    seg('Drifting Higher', [n('D4', 0.5), n('F4', 0.5), n('A4', 0.5), n('D5', 1), n('C5', 1)]),
    seg('Fading Close', [n('A4', 0.5), n('G4', 0.5), n('F4', 1), n('D4', 2)]),
  ]),

  compile('shatteredglass', 'Shattered Glass', {
    category: 'originals', source: 'Original piece, inspired by the driving alt-rock piano riffs of bands like Linkin Park — not a cover, no affiliation', bpm: 92, difficulty: 3,
  }, [
    seg('The Riff', [n('D4', 0.5), n('F4', 0.5), n('D4', 0.5), n('F4', 0.5), n('A4', 0.5), n('F4', 0.5), n('D4', 0.5), n('F4', 0.5)]),
    seg('The Riff (Variation)', [n('D4', 0.5), n('F4', 0.5), n('D4', 0.5), n('F4', 0.5), n('C5', 0.5), n('A4', 0.5), n('F4', 0.5), n('D4', 1)]),
    seg('The Lift', [n('F4', 0.5), n('G4', 0.5), n('A4', 1), n('G4', 0.5), n('F4', 0.5), n('D4', 1)]),
  ]),

  compile('neonrain', 'Neon Rain', {
    category: 'originals', source: 'Original piece, inspired by upbeat 2000s pop-rock hooks (not affiliated with any band)', bpm: 100, difficulty: 2,
  }, [
    seg('The Hook', [n('E4', 0.5), n('G4', 0.5), n('A4', 0.5), n('G4', 0.5), n('E4', 0.5), n('D4', 0.5), n('C4', 1)]),
    seg('The Hook (Lift)', [n('E4', 0.5), n('G4', 0.5), n('A4', 0.5), n('C5', 0.5), n('A4', 0.5), n('G4', 0.5), n('E4', 1)]),
  ]),

  compile('wakingthestorm', 'Waking the Storm', {
    category: 'originals', source: 'Original piece, inspired by the dramatic nu-metal piano intros of bands like Linkin Park — not a cover, no affiliation', bpm: 84, difficulty: 4,
  }, [
    seg('Ominous Opening', [n('E4', 1), n('E4', 0.5), n('G4', 0.5), n('E4', 1), n('D4', 1)]),
    seg('The Build', [n('E4', 0.5), n('F#4', 0.5), n('G4', 0.5), n('A4', 0.5), n('B4', 1), n('A4', 0.5), n('G4', 0.5)]),
    seg('The Drop', [n('E5', 0.5), n('B4', 0.5), n('G4', 0.5), n('E4', 1.5)]),
  ]),

  compile('woundedserenade', 'Wounded Serenade', {
    category: 'originals', source: 'Original piece, inspired by the romantic gothic-rock ballad style of bands like HIM — not a cover, no affiliation', bpm: 72, difficulty: 3,
  }, [
    seg('Opening Ache', [n('E4', 1), n('G4', 0.5), n('B4', 0.5), n('A4', 1), n('G4', 1)]),
    seg('The Vow', [n('E4', 0.5), n('F#4', 0.5), n('G4', 1), n('B4', 1), n('A4', 1)]),
    seg('Resolve', [n('G4', 0.5), n('E4', 0.5), n('D4', 1), n('E4', 2)]),
  ]),

  compile('staticvalentine', 'Static Valentine', {
    category: 'originals', source: 'Original piece, inspired by the romantic gothic-rock ballad style of bands like HIM — not a cover, no affiliation', bpm: 88, difficulty: 3,
  }, [
    seg('Static Pulse', [n('A4', 0.5), n('C5', 0.5), n('A4', 0.5), n('C5', 0.5), n('E5', 0.5), n('C5', 0.5), n('A4', 1)]),
    seg('Valentine Turn', [n('B4', 0.5), n('C5', 0.5), n('D5', 0.5), n('E5', 1), n('C5', 1)]),
    seg('Fade', [n('A4', 0.5), n('G4', 0.5), n('F4', 0.5), n('E4', 1.5)]),
  ]),

  compile('bluesgroove', '12-Bar Blues Groove', {
    category: 'originals', source: 'Original piece — a classic blues-style riff pattern', bpm: 96, difficulty: 2,
  }, [
    seg('The Groove', [n('C4', 0.5), n('E4', 0.5), n('G4', 0.5), n('A4', 0.5), n('G4', 0.5), n('E4', 0.5), n('C4', 1)]),
    seg('The Turnaround', [n('C4', 0.5), n('D#4', 0.5), n('E4', 0.5), n('G4', 0.5), n('E4', 0.5), n('D4', 0.5), n('C4', 1)]),
  ]),
];

export function getSong(id) {
  return SONGS.find((s) => s.id === id);
}
