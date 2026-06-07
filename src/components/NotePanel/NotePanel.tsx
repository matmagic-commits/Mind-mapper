import React, { useRef, useEffect, useState } from 'react';
import { X, FileText } from 'lucide-react';
import { useMindMap } from '../../context/MindMapContext';
import type { MindMapNode } from '../../types/mindmap';
import { resolveNodeColor } from '../../utils/colors';
import styles from './NotePanel.module.css';

function findNode(root: MindMapNode, id: string): MindMapNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function getDepth(root: MindMapNode, id: string, depth = 0): number {
  if (root.id === id) return depth;
  for (const child of root.children) {
    const d = getDepth(child, id, depth + 1);
    if (d >= 0) return d;
  }
  return -1;
}

export default function NotePanel() {
  const { state, dispatch, currentMap } = useMindMap();
  const { selectedNodeId } = state;
  const [localNote, setLocalNote] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedNode = selectedNodeId && currentMap
    ? findNode(currentMap.root, selectedNodeId)
    : null;

  const depth = selectedNodeId && currentMap
    ? getDepth(currentMap.root, selectedNodeId)
    : 0;

  const nodeColor = selectedNode ? resolveNodeColor(selectedNode, depth) : '#6366f1';

  useEffect(() => {
    if (selectedNode) {
      setLocalNote(selectedNode.note);
    }
  }, [selectedNodeId, selectedNode]);

  function handleNoteChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setLocalNote(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (selectedNodeId) {
        dispatch({ type: 'UPDATE_NODE_NOTE', nodeId: selectedNodeId, note: val });
      }
    }, 300);
  }

  if (!selectedNode) return null;

  return (
    <aside className={styles.panel}>
      <div className={styles.header} style={{ borderLeft: `4px solid ${nodeColor}` }}>
        <div className={styles.headerLeft}>
          <FileText size={16} style={{ color: nodeColor }} />
          <span className={styles.nodeName}>{selectedNode.label}</span>
        </div>
        <button
          className={styles.closeBtn}
          onClick={() => dispatch({ type: 'SET_SELECTED_NODE', nodeId: null })}
        >
          <X size={16} />
        </button>
      </div>
      <textarea
        className={styles.noteArea}
        placeholder="Add notes for this node…"
        value={localNote}
        onChange={handleNoteChange}
      />
    </aside>
  );
}
