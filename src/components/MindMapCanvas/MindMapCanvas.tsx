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
  const { state, dispatch, currentMap, searchMatches, lastAddedNodeId } = useMindMap();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  // Capture selected node at the FIRST mousedown of a potential double-click.
  // mousedown fires before any click handler, so selectedNodeId is still intact.
  // A 300ms guard stops the second mousedown of the double-click from overwriting it.
  const dblClickTargetId = useRef<string | null>(null);
  const lastBgMouseDownTime = useRef(0);

  // Edit state — owned here so we can position the input correctly
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editInputStyle, setEditInputStyle] = useState<React.CSSProperties>({ display: 'none' });

  // Centre map on load
  useEffect(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    setTransform({ x: width / 2, y: height / 2, scale: 1 });
  }, [currentMap?.id]);

  // Auto-edit newly added nodes
  useEffect(() => {
    if (lastAddedNodeId.current) {
      const id = lastAddedNodeId.current;
      lastAddedNodeId.current = null;
      // Defer so the layout has been computed with the new node
      requestAnimationFrame(() => requestAnimationFrame(() => {
        startEdit(id);
      }));
    }
  });

  // Reposition the input whenever transform or editingNodeId changes
  useEffect(() => {
    if (!editingNodeId || !svgRef.current || !containerRef.current) {
      setEditInputStyle({ display: 'none' });
      return;
    }
    const pos = computeRadialLayout(currentMap!.root).get(editingNodeId);
    if (!pos) { setEditInputStyle({ display: 'none' }); return; }

    const svgRect = svgRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Convert node SVG coords → absolute position within the container
    const left = (svgRect.left - containerRect.left) + pos.x * transform.scale + transform.x;
    const top  = (svgRect.top  - containerRect.top)  + pos.y * transform.scale + transform.y;

    setEditInputStyle({
      position: 'absolute',
      left: left - 72,
      top:  top  - 16,
      display: 'block',
      width: 144,
      zIndex: 1000,
    });
  }, [editingNodeId, transform, currentMap]);

  // Focus input after it becomes visible
  useEffect(() => {
    if (editingNodeId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingNodeId, editInputStyle]);

  function startEdit(nodeId: string) {
    if (!currentMap) return;
    // Find the label for this node
    function findLabel(node: MindMapNode): string | null {
      if (node.id === nodeId) return node.label;
      for (const c of node.children) {
        const l = findLabel(c);
        if (l !== null) return l;
      }
      return null;
    }
    const label = findLabel(currentMap.root) ?? '';
    setEditingValue(label);
    setEditingNodeId(nodeId);
  }

  function commitEdit() {
    if (editingNodeId) {
      const val = editingValue.trim();
      if (val) dispatch({ type: 'UPDATE_NODE_LABEL', nodeId: editingNodeId, label: val });
    }
    setEditingNodeId(null);
  }

  function cancelEdit() {
    setEditingNodeId(null);
  }

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
    const now = Date.now();
    // Only capture on the first mousedown; ignore the second (within 300ms) of a double-click
    if (now - lastBgMouseDownTime.current > 300) {
      dblClickTargetId.current = state.selectedNodeId;
    }
    lastBgMouseDownTime.current = now;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
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
    const targetId = dblClickTargetId.current ?? currentMap?.root.id;
    dblClickTargetId.current = null;
    if (!targetId) return;
    e.stopPropagation();
    dispatch({ type: 'ADD_NODE', parentId: targetId });
  }

  function handleBackgroundClick(e: React.MouseEvent<SVGRectElement>) {
    e.stopPropagation();
    if (editingNodeId) { commitEdit(); return; }
    dispatch({ type: 'SET_SELECTED_NODE', nodeId: null });
  }

  if (!currentMap) return null;

  const positions = computeRadialLayout(currentMap.root);

  const allNodes: Array<{ node: MindMapNode; x: number; y: number; depth: number }> = [];
  collectAllNodes(currentMap.root, positions, 0, allNodes);

  const allEdges: Array<{ id: string; x1: number; y1: number; x2: number; y2: number; color: string }> = [];
  collectAllEdges(currentMap.root, positions, 0, allEdges);

  // Find colour of the node being edited for the input border
  const editingNode = editingNodeId
    ? allNodes.find((n) => n.node.id === editingNodeId)
    : null;
  const editBorderColor = editingNode
    ? resolveNodeColor(editingNode.node, editingNode.depth)
    : '#6366f1';

  return (
    <div ref={containerRef} className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.toolbarBtn} onClick={() => dispatch({ type: 'CLOSE_MAP' })} title="Back to home">
          <ArrowLeft size={16} />
          <span>Home</span>
        </button>
        <span className={styles.mapTitle}>{currentMap.name}</span>
        <div className={styles.toolbarRight}>
          <button className={styles.toolbarBtn} onClick={() => setTransform((p) => ({ ...p, scale: Math.max(0.2, p.scale * 0.8) }))} title="Zoom out">
            <ZoomOut size={16} />
          </button>
          <button className={styles.toolbarBtn} onClick={() => setTransform((p) => ({ ...p, scale: Math.min(4, p.scale * 1.25) }))} title="Zoom in">
            <ZoomIn size={16} />
          </button>
          <button className={styles.toolbarBtn} onClick={() => {
            if (!containerRef.current) return;
            const { width, height } = containerRef.current.getBoundingClientRect();
            setTransform({ x: width / 2, y: height / 2, scale: 1 });
          }} title="Reset view">
            <Maximize2 size={16} />
          </button>
          <button className={styles.toolbarBtn} onClick={() => exportMapAsJSON(currentMap)} title="Export JSON">
            <Download size={16} />
          </button>
        </div>
      </div>

      <div className={styles.hint}>
        Double-click canvas to add a node · Tap to select · Tap again to edit · Long-press / right-click for options
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className={styles.svg}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <rect
          x="-50000" y="-50000" width="100000" height="100000"
          fill="transparent"
          onMouseDown={handleMouseDown}
          onDoubleClick={handleBackgroundDoubleClick}
          onClick={handleBackgroundClick}
          style={{ cursor: 'grab' }}
        />
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          {allEdges.map((e) => (
            <MindMapEdge key={e.id} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} color={e.color} />
          ))}
          {allNodes.map(({ node, x, y, depth }) => (
            <MindMapNodeComponent
              key={node.id}
              node={node}
              x={x}
              y={y}
              depth={depth}
              isSelected={state.selectedNodeId === node.id}
              isSearchMatch={searchMatches.has(node.id)}
              onRequestEdit={() => startEdit(node.id)}
            />
          ))}
        </g>
      </svg>

      {/* Edit input — plain HTML, positioned via transform math, no SVG coordinate tricks */}
      <input
        ref={editInputRef}
        style={{
          ...editInputStyle,
          padding: '5px 10px',
          border: `2px solid ${editBorderColor}`,
          borderRadius: 8,
          fontSize: 14,
          fontFamily: 'inherit',
          textAlign: 'center',
          outline: 'none',
          boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
          background: 'white',
          color: '#1a1a1a',
        }}
        value={editingValue}
        onChange={(e) => setEditingValue(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitEdit();
          if (e.key === 'Escape') cancelEdit();
        }}
      />

      {/* HTML overlays */}
      <SearchBar />
      <NotePanel />
    </div>
  );
}
