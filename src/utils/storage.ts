import type { MindMap } from '../types/mindmap';

const STORAGE_KEY = 'mind-mapper-maps';

export function loadMaps(): MindMap[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MindMap[];
  } catch {
    return [];
  }
}

export function saveMaps(maps: MindMap[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
}

export function exportMapAsJSON(map: MindMap): void {
  const blob = new Blob([JSON.stringify(map, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${map.name.replace(/\s+/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importMapFromJSON(file: File): Promise<MindMap> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target!.result as string));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
