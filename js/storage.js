const KEY = 'pianoAcademy:v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch (e) {
    return defaultState();
  }
}

function defaultState() {
  return {
    curriculum: {}, // stepId -> { completed: bool }
    songs: {}, // songId -> { segments: { idx: { passed: bool, best: number } }, fullSongBest: number, fullSongPassed: bool }
    settings: { waitMode: true, showLabels: true, showFingers: true, metronome: false, volume: 0.8, tempoPct: 100 },
    stats: { totalPasses: 0 },
  };
}

let state = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) { /* storage unavailable; progress just won't persist */ }
}

export function getState() {
  return state;
}

export function getSettings() {
  return state.settings;
}

export function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  save();
}

export function markCurriculumStepComplete(stepId) {
  const wasComplete = state.curriculum[stepId]?.completed;
  state.curriculum[stepId] = { completed: true };
  if (!wasComplete) state.stats.totalPasses += 1;
  save();
}

export function isCurriculumStepComplete(stepId) {
  return !!state.curriculum[stepId]?.completed;
}

export function markSegmentPassed(songId, segIdx, accuracy) {
  if (!state.songs[songId]) state.songs[songId] = { segments: {} };
  if (!state.songs[songId].segments) state.songs[songId].segments = {};
  const prev = state.songs[songId].segments[segIdx];
  const wasPassed = prev?.passed;
  state.songs[songId].segments[segIdx] = {
    passed: true,
    best: Math.max(accuracy ?? 100, prev?.best ?? 0),
  };
  if (!wasPassed) state.stats.totalPasses += 1;
  save();
}

export function isSegmentPassed(songId, segIdx) {
  return !!state.songs[songId]?.segments?.[segIdx]?.passed;
}

export function isSegmentUnlocked(songId, segIdx) {
  if (segIdx === 0) return true;
  return isSegmentPassed(songId, segIdx - 1);
}

export function markFullSongPassed(songId, accuracy) {
  if (!state.songs[songId]) state.songs[songId] = { segments: {} };
  const prev = state.songs[songId].fullSongBest || 0;
  state.songs[songId].fullSongPassed = true;
  state.songs[songId].fullSongBest = Math.max(accuracy ?? 100, prev);
  save();
}

export function getSongProgress(songId) {
  return state.songs[songId] || { segments: {} };
}

export function getProgressSummary(curriculumSteps, songs) {
  const stepsDone = curriculumSteps.filter((s) => isCurriculumStepComplete(s.id)).length;
  let songsCompleted = 0;
  let segmentsPassed = 0;
  let totalSegments = 0;
  for (const song of songs) {
    totalSegments += song.segments.length;
    let allPassed = true;
    for (let i = 0; i < song.segments.length; i++) {
      if (isSegmentPassed(song.id, i)) segmentsPassed += 1;
      else allPassed = false;
    }
    if (allPassed) songsCompleted += 1;
  }
  return {
    stepsDone, stepsTotal: curriculumSteps.length,
    songsCompleted, songsTotal: songs.length,
    segmentsPassed, totalSegments,
  };
}
