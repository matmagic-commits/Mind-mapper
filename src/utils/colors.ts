import type { MindMapNode } from '../types/mindmap';

// 50-colour palette in five bands of 10:
// Band 1 (0-9):  Vivid primaries
// Band 2 (10-19): Vivid secondaries & tertiaries
// Band 3 (20-29): Soft pastels
// Band 4 (30-39): Warm earth tones
// Band 5 (40-49): Cool jewel tones
export const DEPTH_PALETTE: string[] = [
  // Vivid primaries
  '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
  '#00ACC1', '#F4511E', '#039BE5', '#7CB342', '#E91E63',
  // Vivid secondaries & tertiaries
  '#FFD600', '#00897B', '#6D4C41', '#546E7A', '#D81B60',
  '#1DE9B6', '#FFAB00', '#304FFE', '#00C853', '#AA00FF',
  // Soft pastels
  '#EF9A9A', '#90CAF9', '#A5D6A7', '#FFCC80', '#CE93D8',
  '#80DEEA', '#FFAB91', '#81D4FA', '#C5E1A5', '#F48FB1',
  // Warm earth tones
  '#BF360C', '#E65100', '#FF6F00', '#F9A825', '#827717',
  '#558B2F', '#1B5E20', '#4E342E', '#37474F', '#AD1457',
  // Cool jewel tones
  '#1A237E', '#0D47A1', '#006064', '#1B5E20', '#4A148C',
  '#880E4F', '#B71C1C', '#E65100', '#33691E', '#0277BD',
];

export function resolveNodeColor(node: MindMapNode, depth: number): string {
  if (node.color !== undefined) return node.color;
  return DEPTH_PALETTE[depth % DEPTH_PALETTE.length];
}

// Darken a hex colour by the given percentage (0-100)
export function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(2.55 * percent));
  const b = Math.max(0, (num & 0xff) - Math.round(2.55 * percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Returns a contrasting text colour (black or white) for a given background
export function contrastText(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  // Perceived luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#1a1a1a' : '#ffffff';
}
