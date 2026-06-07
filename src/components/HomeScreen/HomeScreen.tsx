import React, { useRef, useState } from 'react';
import { PlusCircle, Trash2, Download, Upload, Edit2, Check, X, Brain } from 'lucide-react';
import { useMindMap } from '../../context/MindMapContext';
import { exportMapAsJSON, importMapFromJSON } from '../../utils/storage';
import { DEPTH_PALETTE } from '../../utils/colors';
import type { MindMap } from '../../types/mindmap';
import styles from './HomeScreen.module.css';

// Neural network nodes & edges for the hero background
const NODES = [
  { x: 38,  y: 68,  r: 5,  d: 0.0 }, { x: 115, y: 175, r: 3.5, d: 0.6 },
  { x: 195, y: 52,  r: 6,  d: 1.3 }, { x: 268, y: 148, r: 3.5, d: 0.9 },
  { x: 352, y: 82,  r: 5,  d: 1.9 }, { x: 425, y: 188, r: 4,   d: 0.4 },
  { x: 498, y: 58,  r: 6,  d: 1.6 }, { x: 578, y: 152, r: 4,   d: 0.8 },
  { x: 655, y: 72,  r: 3.5,d: 2.1 }, { x: 735, y: 168, r: 5,   d: 1.0 },
  { x: 808, y: 52,  r: 3.5,d: 1.4 }, { x: 862, y: 198, r: 4.5, d: 0.5 },
  { x: 118, y: 252, r: 3,  d: 1.7 }, { x: 385, y: 244, r: 3.5, d: 0.3 },
  { x: 688, y: 238, r: 4,  d: 1.2 },
];
const EDGES = [
  [0,1],[0,2],[1,3],[2,3],[2,4],[3,5],[4,5],[4,6],
  [5,7],[6,7],[6,8],[7,9],[8,10],[9,11],[1,12],[3,12],[5,13],[9,14],[10,11],
];

function countNodes(map: MindMap): number {
  let n = 0;
  function walk(node: typeof map.root) { n++; node.children.forEach(walk); }
  walk(map.root);
  return n;
}

export default function HomeScreen() {
  const { state, dispatch } = useMindMap();
  const [newMapName, setNewMapName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newMapName.trim() || 'Untitled Map';
    dispatch({ type: 'CREATE_MAP', name });
    setNewMapName('');
  }

  function handleOpen(mapId: string) { dispatch({ type: 'OPEN_MAP', mapId }); }

  function handleDelete(mapId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm('Delete this map? This cannot be undone.')) dispatch({ type: 'DELETE_MAP', mapId });
  }

  function handleExport(map: MindMap, e: React.MouseEvent) {
    e.stopPropagation();
    exportMapAsJSON(map);
  }

  function startRename(map: MindMap, e: React.MouseEvent) {
    e.stopPropagation();
    setRenamingId(map.id);
    setRenameValue(map.name);
  }

  function commitRename(mapId: string) {
    const name = renameValue.trim();
    if (name) dispatch({ type: 'RENAME_MAP', mapId, name });
    setRenamingId(null);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImportError(null);
      const map = await importMapFromJSON(file);
      const imported = { ...map, id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() };
      dispatch({ type: 'LOAD_MAPS', maps: [...state.maps, imported] });
    } catch { setImportError('Invalid file. Please select a valid mind map JSON file.'); }
    e.target.value = '';
  }

  const sorted = [...state.maps].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className={styles.container}>

      {/* ── Hero header ───────────────────────────────────────────────── */}
      <header className={styles.header}>
        {/* Animated neural network background */}
        <svg className={styles.heroBg} viewBox="0 0 900 290" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="1" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
            </radialGradient>
          </defs>
          {EDGES.map(([a, b], i) => (
            <line key={i}
              x1={NODES[a].x} y1={NODES[a].y}
              x2={NODES[b].x} y2={NODES[b].y}
              stroke="url(#glow)" strokeOpacity="0.22" strokeWidth="1.2"
            />
          ))}
          {NODES.map((n, i) => (
            <circle key={i} cx={n.x} cy={n.y} r={n.r}
              fill="#a78bfa"
              className={styles.heroNode}
              style={{ animationDelay: `${n.d}s` }}
            />
          ))}
        </svg>

        <div className={styles.headerInner}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}><Brain size={32} strokeWidth={1.5} /></div>
            <span className={styles.logoLabel}>MindMapper</span>
          </div>
          <h1 className={styles.heroTitle}>
            Map your thinking.<br />
            <span className={styles.heroTitleAccent}>Unlock connections.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Visual knowledge maps that grow with your ideas — colour-coded, infinite, always in sync.
          </p>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main className={styles.main}>

        <section className={styles.createSection}>
          <h2 className={styles.sectionLabel}>New map</h2>
          <form className={styles.createForm} onSubmit={handleCreate}>
            <input
              className={styles.createInput}
              type="text"
              placeholder="Name your map…"
              value={newMapName}
              onChange={(e) => setNewMapName(e.target.value)}
            />
            <button className={styles.createButton} type="submit">
              <PlusCircle size={17} />
              Create
            </button>
          </form>
          <div className={styles.importRow}>
            <button className={styles.importButton} onClick={() => fileInputRef.current?.click()}>
              <Upload size={14} /> Import JSON
            </button>
            <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
            {importError && <span className={styles.importError}>{importError}</span>}
          </div>
        </section>

        {sorted.length > 0 && (
          <section>
            <h2 className={styles.sectionLabel}>Your maps</h2>
            <ul className={styles.mapList}>
              {sorted.map((map, idx) => {
                const accent = DEPTH_PALETTE[idx % DEPTH_PALETTE.length];
                const nodeCount = countNodes(map);
                return (
                  <li key={map.id} className={styles.mapCard} onClick={() => handleOpen(map.id)}
                      style={{ '--card-accent': accent } as React.CSSProperties}>
                    <div className={styles.cardAccentBar} />
                    <div className={styles.cardIcon} style={{ background: `${accent}22`, color: accent }}>
                      <Brain size={22} strokeWidth={1.5} />
                    </div>
                    <div className={styles.mapInfo}>
                      {renamingId === map.id ? (
                        <div className={styles.renameRow} onClick={(e) => e.stopPropagation()}>
                          <input className={styles.renameInput} autoFocus value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(map.id); if (e.key === 'Escape') setRenamingId(null); }}
                          />
                          <button className={styles.iconBtn} onClick={() => commitRename(map.id)}><Check size={15} /></button>
                          <button className={styles.iconBtn} onClick={() => setRenamingId(null)}><X size={15} /></button>
                        </div>
                      ) : (
                        <span className={styles.mapName}>{map.name}</span>
                      )}
                      <span className={styles.mapMeta}>
                        {nodeCount} node{nodeCount !== 1 ? 's' : ''} · Updated {new Date(map.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={styles.mapActions} onClick={(e) => e.stopPropagation()}>
                      <button className={styles.iconBtn} title="Rename" onClick={(e) => startRename(map, e)}><Edit2 size={14} /></button>
                      <button className={styles.iconBtn} title="Export" onClick={(e) => handleExport(map, e)}><Download size={14} /></button>
                      <button className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Delete" onClick={(e) => handleDelete(map.id, e)}><Trash2 size={14} /></button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {sorted.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><Brain size={44} strokeWidth={1} /></div>
            <p className={styles.emptyTitle}>No maps yet</p>
            <p className={styles.emptyHint}>Create your first map above to start connecting ideas.</p>
          </div>
        )}
      </main>
    </div>
  );
}
