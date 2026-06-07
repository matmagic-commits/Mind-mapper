import { hierarchy, tree } from 'd3-hierarchy';
import type { MindMapNode } from '../types/mindmap';

export interface NodePosition {
  x: number;
  y: number;
  depth: number;
}

export function computeRadialLayout(
  root: MindMapNode,
  radiusStep: number = 180
): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();

  const hier = hierarchy<MindMapNode>(root, (node) =>
    node.collapsed ? [] : node.children
  );

  const maxDepth = hier.height || 1;
  const totalRadius = maxDepth * radiusStep;

  const treeLayout = tree<MindMapNode>().size([2 * Math.PI, totalRadius]);
  const laid = treeLayout(hier);

  laid.each((node) => {
    // d3 tree with size([2π, r]) puts angle in .x and radius in .y
    const angle = node.x - Math.PI / 2;
    const radius = node.y;
    positions.set(node.data.id, {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      depth: node.depth,
    });
  });

  return positions;
}

export function radialEdgePath(
  x1: number, y1: number,
  x2: number, y2: number
): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
}
