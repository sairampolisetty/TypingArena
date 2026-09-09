import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { connectSocket, getSocket } from '../lib/socket';
import type { RoomPublic, PlayerPublic } from '../types';
import { PlayerList } from '../components/PlayerList';
import RoomCode from '../components/RoomCode';
import { useToast } from '../contexts/ToastContext';

export default function PlayerLobby() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [room, setRoom] = useState<RoomPublic | null>(null);
  const [players, setPlayers] = useState<PlayerPublic[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(true);

  const code = roomCode?.toUpperCase() || '';

  const setupListeners = useCallback((socket: ReturnType<typeof getSocket>) => {
    socket.on('room:state', (r: RoomPublic) => {
      setRoom(r);
      setPlayers(r.players);

      // Navigate based on room state
      if (r.status === 'countdown' || r.status === 'running') {
        navigate(`/arena/${code}/game`);
      } else if (r.status === 'finished') {
        navigate(`/arena/${code}/results`);
      }
    });

    socket.on('room:players', (pl: PlayerPublic[]) => {
      setPlayers(pl);
    });

    socket.on('player:joined', () => {
      // Room players update will follow
    });

    socket.on('player:left', () => {
      // Room players update will follow
    });

    socket.on('player:updated', (player: PlayerPublic) => {
      setPlayers(prev => prev.map(p => p.id === player.id ? player : p));
    });

    socket.on('game:countdown', () => {
      navigate(`/arena/${code}/game`);
    });

    socket.on('game:start', () => {
      navigate(`/arena/${code}/game`);
    });

    socket.on('game:stopped', () => {
      setRoom(prev => prev ? { ...prev, status: 'stopped' } : prev);
    });

    socket.on('game:restarted', () => {
      // Room state will update
    });

    socket.on('room:ended', (data: { reason: string }) => {
      addToast('info', data.reason || 'Arena has ended.');
      navigate('/');
    });

    socket.on('host:disconnected', (data: { message: string }) => {
      addToast('error', data.message);
    });
  }, [code, navigate, addToast]);

  useEffect(() => {
    if (!code) return;

    const storedPlayerId = sessionStorage.getItem(`playerId:${code}`);

    setConnecting(true);
    const socket = connectSocket();

    const doConnect = () => {
      setConnecting(false);

      // Try reconnect first if we have a playerId
      if (storedPlayerId) {
        socket.emit('reconnect:player', { roomCode: code, playerId: storedPlayerId }, (res: {
          success: boolean;
          room?: RoomPublic;
          playerId?: string;
          error?: string;
        }) => {
          if (res.success && res.room) {
            setRoom(res.room);
            setPlayers(res.room.players);
            setPlayerId(res.playerId!);

            if (res.room.status === 'running' || res.room.status === 'countdown') {
              navigate(`/arena/${code}/game`);
            } else if (res.room.status === 'finished') {
              navigate(`/arena/${code}/results`);
            }
          } else {
            // Session expired, redirect to join
            setError('Session expired. Please rejoin the arena.');
          }
        });
      } else {
        setError('No session found. Please join from the Join page.');
      }
    };

    if (socket.connected) {
      doConnect();
    } else {
      socket.once('connect', doConnect);
      socket.once('connect_error', () => {
        setConnecting(false);
        setError('Cannot connect to server.');
      });
    }

    setupListeners(socket);

    return () => {
      socket.off('room:state');
      socket.off('room:players');
      socket.off('player:joined');
      socket.off('player:left');
      socket.off('player:updated');
      socket.off('game:countdown');
      socket.off('game:start');
      socket.off('game:stopped');
      socket.off('game:restarted');
      socket.off('room:ended');
      socket.off('host:disconnected');
    };
  }, [code, setupListeners, navigate]);

  if (connecting) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)', marginBottom: 16 }} />
          <p style={{ color: 'var(--text-muted)' }}>Connecting to arena...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="glass-card" style={{ padding: 32, maxWidth: 400, textAlign: 'center' }}>
          <AlertCircle size={40} style={{ color: 'var(--color-error)', marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Connection Error</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/join')}>
              Join Another
            </button>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activePlayers = players.filter(p => p.status !== 'disconnected');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div className="bg-grid" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
      <div className="bg-radial-purple" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(20px)',
          padding: '16px 24px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, lineHeight: 1 }}>
                {room?.name || 'LOADING...'}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Waiting for host to start...
              </p>
            </div>

            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div className="stat-box" style={{ padding: '10px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={16} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
                    {activePlayers.length}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    / {room?.settings.maxPlayers || '?'}
                  </span>
                </div>
                <div className="stat-label">PLAYERS</div>
              </div>
            </div>
          </div>
        </div>

        <main style={{ padding: '32px 24px', maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
            {/* Players */}
            <div>
              <p className="section-title">
                PLAYERS IN LOBBY ({activePlayers.length})
              </p>
              {players.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <Users size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p>No players yet</p>
                </div>
              ) : (
                <PlayerList
                  players={players}
                  currentPlayerId={playerId || undefined}
                />
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="glass-card" style={{ padding: 20 }}>
                <RoomCode code={code} />
              </div>

              {room && (
                <div className="card">
                  <p className="section-title">ARENA SETTINGS</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Duration', value: `${room.settings.duration}s` },
                      { label: 'Difficulty', value: room.settings.difficulty },
                      { label: 'Mode', value: 'Classic Race' },
                      { label: 'Countdown', value: `${room.settings.countdown}s` },
                      { label: 'Min Players', value: room.settings.minPlayers },
                      { label: 'Late Join', value: room.settings.allowLateJoin ? 'Enabled' : 'Disabled' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{
                padding: '14px 16px',
                background: 'rgba(217, 119, 6, 0.08)',
                border: '1px solid rgba(217, 119, 6, 0.25)',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                color: 'var(--color-warning)',
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <span style={{ fontSize: 16 }}>⚡</span>
                <span>Waiting for the host to start the game. Get ready!</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
