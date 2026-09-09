import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Home, RotateCcw, Plus, Loader2 } from 'lucide-react';
import { connectSocket, getSocket } from '../lib/socket';
import type { RoomPublic, PlayerPublic } from '../types';
import Leaderboard from '../components/Leaderboard';
import { useToast } from '../contexts/ToastContext';
import { playFinishFanfare } from '../lib/sounds';

export default function ResultsPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [room, setRoom] = useState<RoomPublic | null>(null);
  const [players, setPlayers] = useState<PlayerPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [restartLoading, setRestartLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const code = roomCode?.toUpperCase() || '';
  const playerId = sessionStorage.getItem(`playerId:${code}`);
  const hostToken = sessionStorage.getItem(`hostToken:${code}`);
  const isHost = Boolean(hostToken);

  // Results passed directly from GamePage via navigation state (most reliable source)
  const location = useLocation();
  const navResults: PlayerPublic[] | undefined = (location.state as { results?: PlayerPublic[] })?.results;

  const setupListeners = useCallback((socket: ReturnType<typeof getSocket>) => {
    socket.on('room:state', (r: RoomPublic) => {
      setRoom(r);
      setPlayers(r.players);
    });

    socket.on('game:restarted', () => {
      addToast('success', 'Arena reset! Ready to play again.');
      navigate(`/arena/${code}${isHost ? '/host' : ''}`);
    });

    socket.on('room:ended', (data: { reason: string }) => {
      addToast('info', data.reason || 'Arena ended.');
      navigate('/');
    });
  }, [code, isHost, navigate, addToast]);

  useEffect(() => {
    if (!code) return;

    // If we already have results from navigation state, show them immediately
    if (navResults && navResults.length > 0) {
      setPlayers(navResults);
      setLoading(false);
      setTimeout(() => {
        setRevealed(true);
        playFinishFanfare();
      }, 150);
    }

    const socket = connectSocket();

    const doConnect = () => {
      const reconnectEvent = isHost ? 'reconnect:host' : 'reconnect:player';
      const reconnectData = isHost
        ? { roomCode: code, hostToken }
        : { roomCode: code, playerId };

      socket.emit(reconnectEvent, reconnectData, (res: { success: boolean; room?: RoomPublic; error?: string }) => {
        setLoading(false);
        if (res.success && res.room) {
          setRoom(res.room);
          // Only overwrite players from reconnect if nav state didn't bring results
          if (!navResults || navResults.length === 0) {
            setPlayers(res.room.players);
          }
          setTimeout(() => setRevealed(true), 300);
        } else {
          setRevealed(true);
        }
      });
    };

    if (socket.connected) {
      doConnect();
    } else {
      socket.once('connect', doConnect);
      socket.once('connect_error', () => {
        setLoading(false);
        setRevealed(true);
      });
    }

    setupListeners(socket);

    return () => {
      socket.off('room:state');
      socket.off('game:restarted');
      socket.off('room:ended');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  function handlePlayAgain() {
    if (!isHost) return;
    setRestartLoading(true);
    getSocket().emit('host:restart', { roomCode: code, hostToken }, (res: { success: boolean; error?: string }) => {
      setRestartLoading(false);
      if (!res.success) {
        addToast('error', res.error || 'Failed to restart.');
      }
    });
  }

  function handleEndArena() {
    if (!isHost) return;
    getSocket().emit('host:end', { roomCode: code, hostToken }, () => {
      navigate('/');
    });
  }

  const sortedPlayers = [...players]
    .filter(p => p.status !== 'disconnected')
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

  const currentPlayer = sortedPlayers.find(p => p.id === playerId);
  const winner = sortedPlayers[0];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)', marginBottom: 16 }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '0 0 80px' }}>
      <div className="bg-grid" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ background: 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(124,58,237,0.2) 0%, transparent 70%)', position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          padding: 'clamp(40px, 6vw, 80px) 24px 32px',
          animation: revealed ? 'fade-in 0.6s ease' : 'none',
          opacity: revealed ? 1 : 0,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 8vw, 72px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, var(--gold) 0%, var(--accent-primary-light) 50%, var(--accent-cyan) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8,
          }}>
            ARENA COMPLETE
          </h1>
          {room?.name && (
            <p style={{ color: 'var(--text-muted)', fontSize: 16, marginBottom: 8, letterSpacing: '0.04em' }}>
              {room.name} ({code})
            </p>
          )}

          {isHost && (
            <div style={{ marginTop: 8 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                padding: '4px 12px', borderRadius: 'var(--radius-full)',
                background: 'var(--accent-primary-subtle)',
                color: 'var(--accent-primary-light)',
                border: '1px solid var(--border-accent)',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                👑 YOU HOSTED THIS ARENA
              </span>
            </div>
          )}

          {winner && (winner.progress > 0 || winner.wpm > 0) ? (
            <div style={{ marginTop: 20 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', marginBottom: 6 }}>ARENA CHAMPION</p>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 32, fontWeight: 700,
                color: 'var(--gold)',
              }}>
                {winner.nickname}
              </p>
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent-cyan-light)' }}>
                  {winner.wpm} WPM
                </span>
                <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-success)' }}>
                  {winner.accuracy.toFixed(1)}% ACC
                </span>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 14 }}>
              {sortedPlayers.length === 0 ? 'No players joined this arena.' : 'Race ended.'}
            </div>
          )}
        </div>

        {/* Your Result */}
        {currentPlayer && (
          <div style={{
            maxWidth: 500, margin: '0 auto 32px', padding: '0 24px',
            animation: revealed ? 'slide-up 0.5s ease 0.3s both' : 'none',
          }}>
            <div className="glass-card" style={{ padding: 24 }}>
              <p className="section-title">YOUR RESULT</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div className="stat-box">
                  <div className="stat-value" style={{ background: 'linear-gradient(135deg, var(--accent-cyan-light), var(--accent-primary-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {currentPlayer.wpm}
                  </div>
                  <div className="stat-label">WPM</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value" style={{ background: 'linear-gradient(135deg, var(--color-success), var(--accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {currentPlayer.accuracy.toFixed(1)}%
                  </div>
                  <div className="stat-label">ACCURACY</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">
                    {currentPlayer.correctChars}
                  </div>
                  <div className="stat-label">CORRECT</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value" style={{ color: currentPlayer.incorrectChars > 0 ? 'var(--color-error)' : undefined }}>
                    {currentPlayer.incorrectChars}
                  </div>
                  <div className="stat-label">ERRORS</div>
                </div>
              </div>
              {currentPlayer.rank && (
                <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 700 }}>
                  Final Rank: #{currentPlayer.rank} of {sortedPlayers.length}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div style={{
          padding: '0 24px',
          animation: revealed ? 'slide-up 0.5s ease 0.5s both' : 'none',
        }}>
          <p className="section-title" style={{ maxWidth: 760, margin: '0 auto 16px', justifyContent: 'center' }}>
            FINAL STANDINGS
          </p>
          <Leaderboard players={sortedPlayers} currentPlayerId={playerId || undefined} />
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          padding: '32px 24px 0',
          flexWrap: 'wrap',
          animation: revealed ? 'slide-up 0.5s ease 0.7s both' : 'none',
        }}>
          {isHost ? (
            <>
              <button
                className="btn btn-primary btn-lg"
                onClick={handlePlayAgain}
                disabled={restartLoading}
                style={{ minWidth: 160, justifyContent: 'center' }}
              >
                {restartLoading ? (
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <RotateCcw size={18} />
                )}
                PLAY AGAIN
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => navigate('/create')} style={{ minWidth: 180, justifyContent: 'center' }}>
                <Plus size={18} />
                NEW ARENA
              </button>
              <button className="btn btn-danger btn-lg" onClick={handleEndArena} style={{ justifyContent: 'center' }}>
                END ARENA
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => navigate('/')} style={{ justifyContent: 'center' }}>
                <Home size={18} />
                HOME
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary btn-lg" onClick={() => navigate('/create')} style={{ minWidth: 180, justifyContent: 'center' }}>
                <Plus size={18} />
                CREATE ARENA
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => navigate('/')} style={{ justifyContent: 'center' }}>
                <Home size={18} />
                HOME
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
