export interface MindMapNode {
  id: string;
  label: string;
  note: string;
  children: MindMapNode[];
  collapsed: boolean;
  color?: string;
  parentId: string | null;
}

export interface MindMap {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  root: MindMapNode;
}

export interface AppState {
  maps: MindMap[];
  currentMapId: string | null;
  selectedNodeId: string | null;
  searchQuery: string;
}

export type Action =
  | { type: 'LOAD_MAPS'; maps: MindMap[] }
  | { type: 'CREATE_MAP'; name: string }
  | { type: 'DELETE_MAP'; mapId: string }
  | { type: 'RENAME_MAP'; mapId: string; name: string }
  | { type: 'OPEN_MAP'; mapId: string }
  | { type: 'CLOSE_MAP' }
  | { type: 'UPDATE_NODE_LABEL'; nodeId: string; label: string }
  | { type: 'UPDATE_NODE_NOTE'; nodeId: string; note: string }
  | { type: 'UPDATE_NODE_COLOR'; nodeId: string; color: string | undefined }
  | { type: 'ADD_NODE'; parentId: string }
  | { type: 'DELETE_NODE'; nodeId: string }
  | { type: 'TOGGLE_COLLAPSE'; nodeId: string }
  | { type: 'SET_SELECTED_NODE'; nodeId: string | null }
  | { type: 'SET_SEARCH_QUERY'; query: string };
