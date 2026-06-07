import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type { MindMapNode, MindMap, AppState, Action } from '../types/mindmap';
import { loadMaps, saveMaps } from '../utils/storage';
import { newId } from '../utils/idgen';

function makeRootNode(): MindMapNode {
  return {
    id: newId(),
    label: 'Central Idea',
    note: '',
    children: [],
    collapsed: false,
    parentId: null,
  };
}

function makeMap(name: string): MindMap {
  const now = Date.now();
  return {
    id: newId(),
    name,
    createdAt: now,
    updatedAt: now,
    root: makeRootNode(),
  };
}

function updateNode(
  node: MindMapNode,
  id: string,
  updater: (n: MindMapNode) => MindMapNode
): MindMapNode {
  if (node.id === id) return updater(node);
  const updatedChildren = node.children.map((child) =>
    updateNode(child, id, updater)
  );
  if (updatedChildren === node.children) return node;
  return { ...node, children: updatedChildren };
}

function addChildNode(root: MindMapNode, parentId: string): [MindMapNode, string] {
  const newNode: MindMapNode = {
    id: newId(),
    label: 'New node',
    note: '',
    children: [],
    collapsed: false,
    parentId,
  };
  const updated = updateNode(root, parentId, (parent) => ({
    ...parent,
    collapsed: false,
    children: [...parent.children, newNode],
  }));
  return [updated, newNode.id];
}

function deleteNodeFromTree(
  node: MindMapNode,
  id: string
): MindMapNode {
  return {
    ...node,
    children: node.children
      .filter((c) => c.id !== id)
      .map((c) => deleteNodeFromTree(c, id)),
  };
}

function touchMap(map: MindMap): MindMap {
  return { ...map, updatedAt: Date.now() };
}

const initialState: AppState = {
  maps: [],
  currentMapId: null,
  selectedNodeId: null,
  searchQuery: '',
};

// Separate ref for newly added node ID so we can pass it out of the reducer
let _lastAddedNodeId: string | null = null;

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_MAPS':
      return { ...state, maps: action.maps };

    case 'CREATE_MAP': {
      const map = makeMap(action.name);
      return {
        ...state,
        maps: [...state.maps, map],
        currentMapId: map.id,
        selectedNodeId: null,
        searchQuery: '',
      };
    }

    case 'DELETE_MAP':
      return {
        ...state,
        maps: state.maps.filter((m) => m.id !== action.mapId),
        currentMapId:
          state.currentMapId === action.mapId ? null : state.currentMapId,
      };

    case 'RENAME_MAP':
      return {
        ...state,
        maps: state.maps.map((m) =>
          m.id === action.mapId
            ? touchMap({ ...m, name: action.name })
            : m
        ),
      };

    case 'OPEN_MAP':
      return {
        ...state,
        currentMapId: action.mapId,
        selectedNodeId: null,
        searchQuery: '',
      };

    case 'CLOSE_MAP':
      return {
        ...state,
        currentMapId: null,
        selectedNodeId: null,
        searchQuery: '',
      };

    case 'UPDATE_NODE_LABEL':
      return {
        ...state,
        maps: state.maps.map((m) =>
          m.id === state.currentMapId
            ? touchMap({
                ...m,
                root: updateNode(m.root, action.nodeId, (n) => ({
                  ...n,
                  label: action.label,
                })),
              })
            : m
        ),
      };

    case 'UPDATE_NODE_NOTE':
      return {
        ...state,
        maps: state.maps.map((m) =>
          m.id === state.currentMapId
            ? touchMap({
                ...m,
                root: updateNode(m.root, action.nodeId, (n) => ({
                  ...n,
                  note: action.note,
                })),
              })
            : m
        ),
      };

    case 'UPDATE_NODE_COLOR':
      return {
        ...state,
        maps: state.maps.map((m) =>
          m.id === state.currentMapId
            ? touchMap({
                ...m,
                root: updateNode(m.root, action.nodeId, (n) => ({
                  ...n,
                  color: action.color,
                })),
              })
            : m
        ),
      };

    case 'ADD_NODE': {
      const currentMap = state.maps.find((m) => m.id === state.currentMapId);
      if (!currentMap) return state;
      const [newRoot, newNodeId] = addChildNode(currentMap.root, action.parentId);
      _lastAddedNodeId = newNodeId;
      return {
        ...state,
        selectedNodeId: newNodeId,
        maps: state.maps.map((m) =>
          m.id === state.currentMapId
            ? touchMap({ ...m, root: newRoot })
            : m
        ),
      };
    }

    case 'DELETE_NODE': {
      const currentMap = state.maps.find((m) => m.id === state.currentMapId);
      if (!currentMap || action.nodeId === currentMap.root.id) return state;
      return {
        ...state,
        selectedNodeId:
          state.selectedNodeId === action.nodeId ? null : state.selectedNodeId,
        maps: state.maps.map((m) =>
          m.id === state.currentMapId
            ? touchMap({
                ...m,
                root: deleteNodeFromTree(m.root, action.nodeId),
              })
            : m
        ),
      };
    }

    case 'TOGGLE_COLLAPSE':
      return {
        ...state,
        maps: state.maps.map((m) =>
          m.id === state.currentMapId
            ? touchMap({
                ...m,
                root: updateNode(m.root, action.nodeId, (n) => ({
                  ...n,
                  collapsed: !n.collapsed,
                })),
              })
            : m
        ),
      };

    case 'SET_SELECTED_NODE':
      return { ...state, selectedNodeId: action.nodeId };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query };

    default:
      return state;
  }
}

function collectSearchMatches(
  node: MindMapNode,
  query: string,
  result: Set<string>
): void {
  if (node.label.toLowerCase().includes(query.toLowerCase())) {
    result.add(node.id);
  }
  for (const child of node.children) {
    collectSearchMatches(child, query, result);
  }
}

interface MindMapContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  currentMap: MindMap | null;
  searchMatches: Set<string>;
  lastAddedNodeId: React.MutableRefObject<string | null>;
}

const MindMapContext = createContext<MindMapContextValue | null>(null);

export function MindMapProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const lastAddedNodeId = useRef<string | null>(null);

  useEffect(() => {
    const maps = loadMaps();
    if (maps.length > 0) {
      dispatch({ type: 'LOAD_MAPS', maps });
    }
  }, []);

  useEffect(() => {
    if (_lastAddedNodeId !== null) {
      lastAddedNodeId.current = _lastAddedNodeId;
      _lastAddedNodeId = null;
    }
  });

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveMaps(state.maps);
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state.maps]);

  const currentMap = useMemo(
    () => state.maps.find((m) => m.id === state.currentMapId) ?? null,
    [state.maps, state.currentMapId]
  );

  const searchMatches = useMemo<Set<string>>(() => {
    const result = new Set<string>();
    if (!currentMap || !state.searchQuery.trim()) return result;
    collectSearchMatches(currentMap.root, state.searchQuery, result);
    return result;
  }, [currentMap, state.searchQuery]);

  const value = useMemo(
    () => ({ state, dispatch, currentMap, searchMatches, lastAddedNodeId }),
    [state, currentMap, searchMatches]
  );

  return (
    <MindMapContext.Provider value={value}>{children}</MindMapContext.Provider>
  );
}

export function useMindMap(): MindMapContextValue {
  const ctx = useContext(MindMapContext);
  if (!ctx) throw new Error('useMindMap must be used within MindMapProvider');
  return ctx;
}
