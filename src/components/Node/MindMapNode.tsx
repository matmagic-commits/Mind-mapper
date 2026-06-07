import React, { useEffect, useRef, useState } from 'react';
import type { MindMapNode as MindMapNodeType } from '../../types/mindmap';
import { resolveNodeColor, darkenColor, contrastText } from '../../utils/colors';
import CollapseToggle from '../CollapseToggle/CollapseToggle';
import { useMindMap } from '../../context/MindMapContext';

interface ContextMenu {
  x: number;
  y: number;
}

interface Props {
  node: MindMapNodeType;
  x: number;
  y: number;
  depth: number;
  isSelected: boolean;
  isSearchMatch: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  autoEdit: boolean;
  onAutoEditDone: () => void;
}

const NODE_RADIUS = 32;
const ROOT_RADIUS = 42;

export default function MindMapNode({
  node,
  x,
  y,
  depth,
  isSelected,
  isSearchMatch,
  svgRef,
  autoEdit,
  onAutoEditDone,
}: Props) {
  const { dispatch } = useMindMap();
  const [editing, setEditing] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);

  const isRoot = node.parentId === null;
  const radius = isRoot ? ROOT_RADIUS : NODE_RADIUS;
  const fill = resolveNodeColor(node, depth);
  const stroke = darkenColor(fill, 20);
  const textColor = contrastText(fill);
  const displayLabel =
    node.label.length > 18 ? node.label.slice(0, 16) + '…' : node.label;

  // When a new node is created, auto-enter edit mode
  useEffect(() => {
    if (autoEdit) {
      setEditing(true);
      onAutoEditDone();
    }
  }, [autoEdit, onAutoEditDone]);

  useEffect(() => {
    if (editing) {
      positionAndFocusInput();
    }
  }, [editing]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu]);

  function positionAndFocusInput() {
    if (!svgRef.current || !inputRef.current) return;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = x;
    pt.y = y;
    const screen = pt.matrixTransform(ctm);
    const el = inputRef.current;
    el.style.left = `${screen.x - 60}px`;
    el.style.top = `${screen.y - 14}px`;
    el.style.display = 'block';
    el.value = node.label;
    el.focus();
    el.select();
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (isSelected) {
      setEditing(true);
    } else {
      dispatch({ type: 'SET_SELECTED_NODE', nodeId: node.id });
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: 'SET_SELECTED_NODE', nodeId: node.id });
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  function commitEdit() {
    const val = inputRef.current?.value.trim() ?? '';
    if (val) {
      dispatch({ type: 'UPDATE_NODE_LABEL', nodeId: node.id, label: val });
    }
    setEditing(false);
    if (inputRef.current) inputRef.current.style.display = 'none';
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') {
      setEditing(false);
      if (inputRef.current) inputRef.current.style.display = 'none';
    }
  }

  function handleToggleCollapse(e: React.MouseEvent) {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_COLLAPSE', nodeId: node.id });
  }

  function handleDeleteNode(e: React.MouseEvent) {
    e.stopPropagation();
    setContextMenu(null);
    if (isRoot) return;
    dispatch({ type: 'DELETE_NODE', nodeId: node.id });
  }

  function handleColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    dispatch({ type: 'UPDATE_NODE_COLOR', nodeId: node.id, color: e.target.value });
  }

  function handleResetColor(ev: React.MouseEvent) {
    ev.stopPropagation();
    setContextMenu(null);
    dispatch({ type: 'UPDATE_NODE_COLOR', nodeId: node.id, color: undefined });
  }

  const hasChildren = node.children.length > 0;
  const toggleX = radius + 8;
  const toggleY = 0;

  return (
    <>
      {/* Floating input rendered into document body via portal-like positioning */}
      <foreignObject x={0} y={0} width={0} height={0} overflow="visible">
        <input
          ref={inputRef}
          style={{
            position: 'fixed',
            display: 'none',
            width: 120,
            padding: '4px 8px',
            border: `2px solid ${fill}`,
            borderRadius: 8,
            fontSize: 13,
            fontFamily: 'inherit',
            textAlign: 'center',
            outline: 'none',
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            zIndex: 1000,
            background: 'white',
            color: '#1a1a1a',
          }}
          onBlur={commitEdit}
          onKeyDown={handleInputKeyDown}
        />
      </foreignObject>

      {/* Context menu */}
      {contextMenu && (
        <foreignObject
          x={0} y={0} width={0} height={0} overflow="visible"
          style={{ zIndex: 2000 }}
        >
          <div
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: 10,
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
              padding: '6px 0',
              minWidth: 160,
              zIndex: 2000,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={menuItemStyle}
              onClick={(e) => {
                e.stopPropagation();
                setContextMenu(null);
                dispatch({ type: 'ADD_NODE', parentId: node.id });
              }}
            >
              ➕ Add child node
            </button>
            <button
              style={menuItemStyle}
              onClick={(e) => {
                e.stopPropagation();
                colorPickerRef.current?.click();
              }}
            >
              🎨 Change colour
            </button>
            {node.color !== undefined && (
              <button style={menuItemStyle} onClick={handleResetColor}>
                🔄 Reset to depth colour
              </button>
            )}
            {!isRoot && (
              <button
                style={{ ...menuItemStyle, color: '#e53935' }}
                onClick={handleDeleteNode}
              >
                🗑️ Delete node
              </button>
            )}
            <input
              ref={colorPickerRef}
              type="color"
              style={{ display: 'none' }}
              value={node.color ?? fill}
              onChange={handleColorChange}
            />
          </div>
        </foreignObject>
      )}

      <g
        transform={`translate(${x},${y})`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{ cursor: 'pointer' }}
      >
        {/* Search highlight ring */}
        {isSearchMatch && (
          <circle
            r={radius + 7}
            fill="none"
            stroke="#FFD600"
            strokeWidth={3}
            opacity={0.85}
          />
        )}

        {/* Selection ring */}
        {isSelected && (
          <circle
            r={radius + 4}
            fill="none"
            stroke={fill}
            strokeWidth={2.5}
            strokeDasharray="6 3"
            opacity={0.8}
          />
        )}

        {/* Main circle */}
        <circle
          r={radius}
          fill={fill}
          stroke={stroke}
          strokeWidth={isSelected ? 2.5 : 1.5}
        />

        {/* Node title tooltip */}
        <title>{node.label}</title>

        {/* Label text */}
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={isRoot ? 13 : 12}
          fontWeight={isRoot ? 700 : 500}
          fill={textColor}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {displayLabel}
        </text>

        {/* Note indicator dot */}
        {node.note.trim() && (
          <circle
            cx={radius - 6}
            cy={-(radius - 6)}
            r={5}
            fill="#FFD600"
            stroke="white"
            strokeWidth={1.5}
          />
        )}
      </g>

      {/* Collapse toggle — outside the main <g> to not inherit its transform for hit area */}
      {hasChildren && (
        <CollapseToggle
          x={x + toggleX}
          y={y + toggleY}
          collapsed={node.collapsed}
          onToggle={handleToggleCollapse}
        />
      )}
    </>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '8px 16px',
  border: 'none',
  background: 'transparent',
  textAlign: 'left',
  fontSize: 13,
  cursor: 'pointer',
  color: '#333',
};
