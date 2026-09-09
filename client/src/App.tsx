import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import Toast from './components/Toast';
import LandingPage from './pages/LandingPage';
import CreateArena from './pages/CreateArena';
import JoinArena from './pages/JoinArena';
import PlayerLobby from './pages/PlayerLobby';
import HostLobby from './pages/HostLobby';
import GamePage from './pages/GamePage';
import ResultsPage from './pages/ResultsPage';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/create" element={<CreateArena />} />
          <Route path="/join" element={<JoinArena />} />

          {/* Arena routes */}
          <Route path="/arena/:roomCode" element={<PlayerLobby />} />
          <Route path="/arena/:roomCode/host" element={<HostLobby />} />
          <Route path="/arena/:roomCode/game" element={<GamePage />} />
          <Route path="/arena/:roomCode/host/game" element={<GamePage />} />
          <Route path="/arena/:roomCode/results" element={<ResultsPage />} />

          {/* Fallback */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
      <Toast />
    </ToastProvider>
  );
}
