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

interface Transform { x: number; y: number; scale: number; }

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
    for (const child of node.children) collectAllNodes(child, positions, depth + 1, result);
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
    result.push({ id: `${node.id}-${child.id}`, x1: parentPos.x, y1: parentPos.y, x2: childPos.x, y2: childPos.y, color: resolveNodeColor(child, depth + 1) });
    collectAllEdges(child, positions, depth + 1, result);
  }
}

export default function MindMapCanvas() {
  const { state, dispatch, currentMap, searchMatches, lastAddedNodeId } = useMindMap();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });

  // ── Pointer tracking for pan + pinch-zoom ─────────────────────────────────
  const pointerPos   = useRef(new Map<number, { x: number; y: number }>());
  const panStart     = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const panPointerId = useRef<number | null>(null);
  const pinchIds     = useRef<[number, number] | null>(null);
  const lastPinchDist= useRef<number | null>(null);
  const didDrag      = useRef(false);

  // ── Edit state ────────────────────────────────────────────────────────────
  const [editingNodeId, setEditingNodeId]     = useState<string | null>(null);
  const [editingValue,  setEditingValue]      = useState('');
  const [editInputStyle, setEditInputStyle]   = useState<React.CSSProperties>({ display: 'none' });

  // Centre on load
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
      requestAnimationFrame(() => requestAnimationFrame(() => startEdit(id)));
    }
  });

  // Reposition edit input
  useEffect(() => {
    if (!editingNodeId || !svgRef.current || !containerRef.current) { setEditInputStyle({ display: 'none' }); return; }
    const pos = computeRadialLayout(currentMap!.root).get(editingNodeId);
    if (!pos) { setEditInputStyle({ display: 'none' }); return; }
    const svgRect = svgRef.current.getBoundingClientRect();
    const conRect  = containerRef.current.getBoundingClientRect();
    const left = (svgRect.left - conRect.left) + pos.x * transform.scale + transform.x;
    const top  = (svgRect.top  - conRect.top)  + pos.y * transform.scale + transform.y;
    setEditInputStyle({ position: 'absolute', left: left - 72, top: top - 16, display: 'block', width: 144, zIndex: 1000 });
  }, [editingNodeId, transform, currentMap]);

  useEffect(() => {
    if (editingNodeId && editInputRef.current) { editInputRef.current.focus(); editInputRef.current.select(); }
  }, [editingNodeId, editInputStyle]);

  function startEdit(nodeId: string) {
    if (!currentMap) return;
    function findLabel(node: MindMapNode): string | null {
      if (node.id === nodeId) return node.label;
      for (const c of node.children) { const l = findLabel(c); if (l !== null) return l; }
      return null;
    }
    setEditingValue(findLabel(currentMap.root) ?? '');
    setEditingNodeId(nodeId);
  }
  function commitEdit() {
    if (editingNodeId) { const v = editingValue.trim(); if (v) dispatch({ type: 'UPDATE_NODE_LABEL', nodeId: editingNodeId, label: v }); }
    setEditingNodeId(null);
  }
  function cancelEdit() { setEditingNodeId(null); }

  // ── Wheel zoom ────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setTransform((prev) => {
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.max(0.2, Math.min(4, prev.scale * factor));
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
      return { scale: newScale, x: cx - (cx - prev.x) * (newScale / prev.scale), y: cy - (cy - prev.y) * (newScale / prev.scale) };
    });
  }, []);
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Background pointer handlers (pan + pinch) ─────────────────────────────
  // setPointerCapture means we keep receiving pointermove/up even over child nodes.
  function onBgPointerDown(e: React.PointerEvent<SVGRectElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerPos.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    didDrag.current = false;

    const ids = Array.from(pointerPos.current.keys());
    if (ids.length === 1) {
      panPointerId.current = e.pointerId;
      panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
      pinchIds.current = null;
      lastPinchDist.current = null;
    } else if (ids.length === 2) {
      pinchIds.current = [ids[0], ids[1]];
      panPointerId.current = null;
      const p1 = pointerPos.current.get(ids[0])!;
      const p2 = pointerPos.current.get(ids[1])!;
      lastPinchDist.current = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    }
  }

  function onBgPointerMove(e: React.PointerEvent<SVGRectElement>) {
    if (!pointerPos.current.has(e.pointerId)) return;
    const prev = pointerPos.current.get(e.pointerId)!;
    if (Math.hypot(e.clientX - prev.x, e.clientY - prev.y) > 4) didDrag.current = true;
    pointerPos.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointerPos.current.size === 1 && e.pointerId === panPointerId.current) {
      setTransform((t) => ({
        ...t,
        x: panStart.current.tx + (e.clientX - panStart.current.x),
        y: panStart.current.ty + (e.clientY - panStart.current.y),
      }));
    } else if (pointerPos.current.size >= 2 && pinchIds.current && lastPinchDist.current !== null) {
      const [id1, id2] = pinchIds.current;
      const p1 = pointerPos.current.get(id1), p2 = pointerPos.current.get(id2);
      if (!p1 || !p2) return;
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const factor = dist / lastPinchDist.current;
      const cx = (p1.x + p2.x) / 2, cy = (p1.y + p2.y) / 2;
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const scx = cx - rect.left, scy = cy - rect.top;
        setTransform((t) => {
          const newScale = Math.max(0.2, Math.min(4, t.scale * factor));
          return { scale: newScale, x: scx - (scx - t.x) * (newScale / t.scale), y: scy - (scy - t.y) * (newScale / t.scale) };
        });
      }
      lastPinchDist.current = dist;
    }
  }

  function onBgPointerUp(e: React.PointerEvent<SVGRectElement>) {
    pointerPos.current.delete(e.pointerId);
    if (e.pointerId === panPointerId.current) panPointerId.current = null;
    if (pointerPos.current.size < 2) { pinchIds.current = null; lastPinchDist.current = null; }
  }

  function onBgClick(e: React.MouseEvent<SVGRectElement>) {
    if (didDrag.current) return; // was a drag, suppress deselect
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

  const editingNode = editingNodeId ? allNodes.find((n) => n.node.id === editingNodeId) : null;
  const editBorderColor = editingNode ? resolveNodeColor(editingNode.node, editingNode.depth) : '#6366f1';

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.toolbar}>
        <button className={styles.toolbarBtn} onClick={() => dispatch({ type: 'CLOSE_MAP' })} title="Back to home">
          <ArrowLeft size={16} /><span>Home</span>
        </button>
        <span className={styles.mapTitle}>{currentMap.name}</span>
        <div className={styles.toolbarRight}>
          <button className={styles.toolbarBtn} onClick={() => setTransform((p) => ({ ...p, scale: Math.max(0.2, p.scale * 0.8) }))} title="Zoom out"><ZoomOut size={16} /></button>
          <button className={styles.toolbarBtn} onClick={() => setTransform((p) => ({ ...p, scale: Math.min(4, p.scale * 1.25) }))} title="Zoom in"><ZoomIn size={16} /></button>
          <button className={styles.toolbarBtn} onClick={() => {
            if (!containerRef.current) return;
            const { width, height } = containerRef.current.getBoundingClientRect();
            setTransform({ x: width / 2, y: height / 2, scale: 1 });
          }} title="Reset view"><Maximize2 size={16} /></button>
          <button className={styles.toolbarBtn} onClick={() => exportMapAsJSON(currentMap)} title="Export JSON"><Download size={16} /></button>
        </div>
      </div>

      <div className={styles.hint}>
        Drag to pan · Pinch to zoom · Tap + to add child · Tap node to select · Tap again to edit
      </div>

      <svg ref={svgRef} className={styles.svg}>
        <defs>
          <pattern id="dot-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="16" cy="16" r="1.2" fill="currentColor" opacity="0.18" />
          </pattern>
        </defs>

        {/* Background — captures all pointer events for pan/pinch */}
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="url(#dot-grid)"
          onPointerDown={onBgPointerDown}
          onPointerMove={onBgPointerMove}
          onPointerUp={onBgPointerUp}
          onPointerCancel={onBgPointerUp}
          onClick={onBgClick}
          style={{ cursor: 'grab', touchAction: 'none' }}
        />

        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          {allEdges.map((e) => (
            <MindMapEdge key={e.id} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} color={e.color} />
          ))}
          {allNodes.map(({ node, x, y, depth }) => (
            <MindMapNodeComponent
              key={node.id} node={node} x={x} y={y} depth={depth}
              isSelected={state.selectedNodeId === node.id}
              isSearchMatch={searchMatches.has(node.id)}
              onRequestEdit={() => startEdit(node.id)}
            />
          ))}
        </g>
      </svg>

      <input
        ref={editInputRef}
        style={{ ...editInputStyle, padding: '5px 10px', border: `2px solid ${editBorderColor}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit', textAlign: 'center', outline: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.18)', background: 'white', color: '#1a1a1a' }}
        value={editingValue}
        onChange={(e) => setEditingValue(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); }}
      />

      <SearchBar />
      <NotePanel />
    </div>
  );
}
