import React, { useRef, useState } from 'react';
import { PlusCircle, Map, Trash2, Download, Upload, Edit2, Check, X } from 'lucide-react';
import { useMindMap } from '../../context/MindMapContext';
import { exportMapAsJSON, importMapFromJSON } from '../../utils/storage';
import type { MindMap } from '../../types/mindmap';
import styles from './HomeScreen.module.css';

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

  function handleOpen(mapId: string) {
    dispatch({ type: 'OPEN_MAP', mapId });
  }

  function handleDelete(mapId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm('Delete this map? This cannot be undone.')) {
      dispatch({ type: 'DELETE_MAP', mapId });
    }
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

  function cancelRename() {
    setRenamingId(null);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImportError(null);
      const map = await importMapFromJSON(file);
      // Give it a new ID to avoid collisions
      const imported = { ...map, id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() };
      dispatch({ type: 'LOAD_MAPS', maps: [...state.maps, imported] });
    } catch {
      setImportError('Invalid file. Please select a valid mind map JSON file.');
    }
    e.target.value = '';
  }

  const sorted = [...state.maps].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>🧠</span>
            Mind Mapper
          </h1>
          <p className={styles.subtitle}>Organise your knowledge visually</p>
        </div>
      </header>

      <main className={styles.main}>
        <form className={styles.createForm} onSubmit={handleCreate}>
          <input
            className={styles.createInput}
            type="text"
            placeholder="New map name…"
            value={newMapName}
            onChange={(e) => setNewMapName(e.target.value)}
          />
          <button className={styles.createButton} type="submit">
            <PlusCircle size={18} />
            Create map
          </button>
        </form>

        <div className={styles.importRow}>
          <button
            className={styles.importButton}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} />
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          {importError && <span className={styles.importError}>{importError}</span>}
        </div>

        {sorted.length === 0 ? (
          <div className={styles.empty}>
            <Map size={48} strokeWidth={1} />
            <p>No maps yet. Create your first one above!</p>
          </div>
        ) : (
          <ul className={styles.mapList}>
            {sorted.map((map) => (
              <li
                key={map.id}
                className={styles.mapCard}
                onClick={() => handleOpen(map.id)}
              >
                <div className={styles.mapIcon}>
                  <Map size={28} strokeWidth={1.5} />
                </div>
                <div className={styles.mapInfo}>
                  {renamingId === map.id ? (
                    <div
                      className={styles.renameRow}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        className={styles.renameInput}
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename(map.id);
                          if (e.key === 'Escape') cancelRename();
                        }}
                      />
                      <button
                        className={styles.iconBtn}
                        onClick={() => commitRename(map.id)}
                      >
                        <Check size={16} />
                      </button>
                      <button className={styles.iconBtn} onClick={cancelRename}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <span className={styles.mapName}>{map.name}</span>
                  )}
                  <span className={styles.mapDate}>
                    Updated {new Date(map.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.mapActions}>
                  <button
                    className={styles.iconBtn}
                    title="Rename"
                    onClick={(e) => startRename(map, e)}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    className={styles.iconBtn}
                    title="Export JSON"
                    onClick={(e) => handleExport(map, e)}
                  >
                    <Download size={15} />
                  </button>
                  <button
                    className={`${styles.iconBtn} ${styles.deleteBtn}`}
                    title="Delete"
                    onClick={(e) => handleDelete(map.id, e)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
