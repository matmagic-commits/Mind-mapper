import { MindMapProvider, useMindMap } from './context/MindMapContext';
import HomeScreen from './components/HomeScreen/HomeScreen';
import MindMapCanvas from './components/MindMapCanvas/MindMapCanvas';

function AppContent() {
  const { state } = useMindMap();
  return state.currentMapId ? <MindMapCanvas /> : <HomeScreen />;
}

export default function App() {
  return (
    <MindMapProvider>
      <AppContent />
    </MindMapProvider>
  );
}
