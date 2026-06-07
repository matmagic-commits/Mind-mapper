import { Search, X } from 'lucide-react';
import { useMindMap } from '../../context/MindMapContext';
import styles from './SearchBar.module.css';

export default function SearchBar() {
  const { state, dispatch, searchMatches } = useMindMap();
  const { searchQuery } = state;

  return (
    <div className={styles.bar}>
      <Search size={15} className={styles.icon} />
      <input
        className={styles.input}
        type="text"
        placeholder="Search nodes…"
        value={searchQuery}
        onChange={(e) =>
          dispatch({ type: 'SET_SEARCH_QUERY', query: e.target.value })
        }
      />
      {searchQuery && (
        <>
          <span className={styles.count}>
            {searchMatches.size} match{searchMatches.size !== 1 ? 'es' : ''}
          </span>
          <button
            className={styles.clearBtn}
            onClick={() => dispatch({ type: 'SET_SEARCH_QUERY', query: '' })}
          >
            <X size={13} />
          </button>
        </>
      )}
    </div>
  );
}
