import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';
import { useMindMap } from '../../context/MindMapContext';
import { computeRadialLayout } from '../../utils/layout';
import { resolveNodeColor } from '../../utils/colors';
import { exportMapAsJSON } from '../../utils/storage';
import MindMapEdge from '../Edge/MindMapEdge';
import MindMapNodeComponent from '../Node/MindMapNode';
import NotePanel from '../NotePanel/NotePanel';
import SearchBar from '../SearchBar/SearchBar';
import type { MindMapNode } from '../../types/mindmap';
import styles from './MindMapCanvas.module.css';

interface Transform {
  x: number;
  y: number;
  scale: number;
}

function collectAllNodes(
  node: MindMapNode,
  positions: ReturnType<typeof computeRadialLayout>,
  depth: number,
  result: Array<{ node: MindMapNode; x: number; y: number; depth: number }>
) {
  const pos = positions.get(node.id);
  if (!pos) return;
  result.push({ node, x: pos.x, y: pos.y, depth });
  if (!node.collapsed) {
    for (const child of node.children) {
      collectAllNodes(child, positions, depth + 1, result);
    }
  }
}

function collectAllEdges(
  node: MindMapNode,
  positions: ReturnType<typeof computeRadialLayout>,
  depth: number,
  result: Array<{ id: string; x1: number; y1: number; x2: number; y2: number; color: string }>
) {
  const parentPos = positions.get(node.id);
  if (!parentPos || node.collapsed) return;
  for (const child of node.children) {
    const childPos = positions.get(child.id);
    if (!childPos) continue;
    result.push({
      id: `${node.id}-${child.id}`,
      x1: parentPos.x,
      y1: parentPos.y,
      x2: childPos.x,
      y2: childPos.y,
      color: resolveNodeColor(child, depth + 1),
    });
    collectAllEdges(child, positions, depth + 1, result);
  }
}

export default function MindMapCanvas() {
  const { state, dispatch, currentMap, searchMatches, lastAddedNodeId } =
    useMindMap();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const [autoEditNodeId, setAutoEditNodeId] = useState<string | null>(null);

  // Centre the map on first load
  useEffect(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    setTransform({ x: width / 2, y: height / 2, scale: 1 });
  }, [currentMap?.id]);

  // When a new node is added, trigger auto-edit
  useEffect(() => {
    if (lastAddedNodeId.current) {
      setAutoEditNodeId(lastAddedNodeId.current);
      lastAddedNodeId.current = null;
    }
  });

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setTransform((prev) => {
      const delta = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.max(0.2, Math.min(4, prev.scale * delta));
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      return {
        scale: newScale,
        x: cursorX - (cursorX - prev.x) * (newScale / prev.scale),
        y: cursorY - (cursorY - prev.y) * (newScale / prev.scale),
      };
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  function handleMouseDown(e: React.MouseEvent<SVGRectElement>) {
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      tx: transform.x,
      ty: transform.y,
    };
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!isPanning.current) return;
    setTransform((prev) => ({
      ...prev,
      x: panStart.current.tx + (e.clientX - panStart.current.x),
      y: panStart.current.ty + (e.clientY - panStart.current.y),
    }));
  }

  function handleMouseUp() {
    isPanning.current = false;
  }

  function handleBackgroundDoubleClick(e: React.MouseEvent<SVGRectElement>) {
    const targetId = state.selectedNodeId ?? currentMap?.root.id;
    if (!targetId) return;
    e.stopPropagation();
    dispatch({ type: 'ADD_NODE', parentId: targetId });
  }

  function handleBackgroundClick(e: React.MouseEvent<SVGRectElement>) {
    e.stopPropagation();
    dispatch({ type: 'SET_SELECTED_NODE', nodeId: null });
  }

  function handleZoomIn() {
    setTransform((prev) => ({ ...prev, scale: Math.min(4, prev.scale * 1.25) }));
  }

  function handleZoomOut() {
    setTransform((prev) => ({ ...prev, scale: Math.max(0.2, prev.scale * 0.8) }));
  }

  function handleResetView() {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    setTransform({ x: width / 2, y: height / 2, scale: 1 });
  }

  if (!currentMap) return null;

  const positions = computeRadialLayout(currentMap.root);

  const allNodes: Array<{ node: MindMapNode; x: number; y: number; depth: number }> = [];
  collectAllNodes(currentMap.root, positions, 0, allNodes);

  const allEdges: Array<{ id: string; x1: number; y1: number; x2: number; y2: number; color: string }> = [];
  collectAllEdges(currentMap.root, positions, 0, allEdges);

  return (
    <div ref={containerRef} className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button
          className={styles.toolbarBtn}
          onClick={() => dispatch({ type: 'CLOSE_MAP' })}
          title="Back to home"
        >
          <ArrowLeft size={16} />
          <span>Home</span>
        </button>
        <span className={styles.mapTitle}>{currentMap.name}</span>
        <div className={styles.toolbarRight}>
          <button className={styles.toolbarBtn} onClick={handleZoomOut} title="Zoom out">
            <ZoomOut size={16} />
          </button>
          <button className={styles.toolbarBtn} onClick={handleZoomIn} title="Zoom in">
            <ZoomIn size={16} />
          </button>
          <button className={styles.toolbarBtn} onClick={handleResetView} title="Reset view">
            <Maximize2 size={16} />
          </button>
          <button
            className={styles.toolbarBtn}
            onClick={() => exportMapAsJSON(currentMap)}
            title="Export JSON"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Hint bar */}
      <div className={styles.hint}>
        Double-click canvas to add a node · Click node to select · Click again to edit · Right-click for options
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className={styles.svg}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background rect — captures pan and click-to-deselect */}
        <rect
          x="-50000"
          y="-50000"
          width="100000"
          height="100000"
          fill="transparent"
          onMouseDown={handleMouseDown}
          onDoubleClick={handleBackgroundDoubleClick}
          onClick={handleBackgroundClick}
          style={{ cursor: 'grab' }}
        />

        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          {/* Edges behind nodes */}
          {allEdges.map((e) => (
            <MindMapEdge
              key={e.id}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              color={e.color}
            />
          ))}

          {/* Nodes */}
          {allNodes.map(({ node, x, y, depth }) => (
            <MindMapNodeComponent
              key={node.id}
              node={node}
              x={x}
              y={y}
              depth={depth}
              isSelected={state.selectedNodeId === node.id}
              isSearchMatch={searchMatches.has(node.id)}
              svgRef={svgRef}
              autoEdit={autoEditNodeId === node.id}
              onAutoEditDone={() => setAutoEditNodeId(null)}
            />
          ))}
        </g>
      </svg>

      {/* HTML overlays */}
      <SearchBar />
      <NotePanel />
    </div>
  );
}
