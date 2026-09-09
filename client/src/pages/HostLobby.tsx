import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, Pause, RotateCcw, Square, LogOut,
  Users, Trophy, Loader2, AlertCircle
} from 'lucide-react';
import { connectSocket, getSocket } from '../lib/socket';
import type { RoomPublic, PlayerPublic, GameStatus } from '../types';
import RoomCode from '../components/RoomCode';
import Modal from '../components/Modal';
import { useToast } from '../contexts/ToastContext';
import { difficultyLabel } from '../lib/utils';

type ModalType = 'stop' | 'end' | null;

export default function HostLobby() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [room, setRoom] = useState<RoomPublic | null>(null);
  const [players, setPlayers] = useState<PlayerPublic[]>([]);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalType>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [startError, setStartError] = useState('');

  const code = roomCode?.toUpperCase() || '';
  const hostToken = sessionStorage.getItem(`hostToken:${code}`);
  const playerId = sessionStorage.getItem(`playerId:${code}`);

  const emitHost = useCallback((event: string, cb?: (res: { success: boolean; error?: string }) => void) => {
    const socket = getSocket();
    if (!hostToken) return;
    setActionLoading(event);
    socket.emit(event, { roomCode: code, hostToken }, (res: { success: boolean; error?: string }) => {
      setActionLoading(null);
      if (!res.success) {
        addToast('error', res.error || `Failed: ${event}`);
      }
      cb?.(res);
    });
  }, [code, hostToken, addToast]);

  const handleStart = () => {
    setStartError('');
    const socket = getSocket();
    setActionLoading('host:start');
    socket.emit('host:start', { roomCode: code, hostToken }, (res: { success: boolean; error?: string }) => {
      setActionLoading(null);
      if (!res.success) {
        setStartError(res.error || 'Failed to start game.');
        addToast('error', res.error || 'Failed to start game.');
      }
    });
  };

  const setupListeners = useCallback((socket: ReturnType<typeof getSocket>) => {
    socket.on('room:state', (r: RoomPublic) => {
      setRoom(r);
      setPlayers(r.players);
    });

    socket.on('room:players', (pl: PlayerPublic[]) => {
      setPlayers(pl);
    });

    socket.on('player:joined', () => {});
    socket.on('player:left', () => {});

    socket.on('player:updated', (player: PlayerPublic) => {
      setPlayers(prev => prev.map(p => p.id === player.id ? player : p));
    });

    socket.on('game:countdown', () => {
      setRoom(prev => prev ? { ...prev, status: 'countdown' } : prev);
    });

    socket.on('game:start', () => {
      setRoom(prev => prev ? { ...prev, status: 'running' } : prev);
      navigate(`/arena/${code}/host/game`);
    });

    socket.on('game:paused', () => {
      setRoom(prev => prev ? { ...prev, status: 'paused' } : prev);
    });

    socket.on('game:resumed', () => {
      setRoom(prev => prev ? { ...prev, status: 'running' } : prev);
      navigate(`/arena/${code}/host/game`);
    });

    socket.on('game:stopped', () => {
      setRoom(prev => prev ? { ...prev, status: 'stopped' } : prev);
      addToast('info', 'Game stopped.');
    });

    socket.on('game:finished', (data: { results?: import('../types').PlayerPublic[] }) => {
      navigate(`/arena/${code}/results`, { state: { results: data?.results ?? [] } });
    });

    socket.on('game:restarted', () => {
      setRoom(prev => prev ? { ...prev, status: 'waiting' } : prev);
      addToast('success', 'Arena reset. Ready to start again!');
    });

    socket.on('room:ended', () => {
      navigate('/');
    });
  }, [code, navigate, addToast]);

  useEffect(() => {
    if (!code || !hostToken) {
      setError('No host session. Create an arena first.');
      setConnecting(false);
      return;
    }

    const socket = connectSocket();

    const doConnect = () => {
      setConnecting(false);

      socket.emit('reconnect:host', { roomCode: code, hostToken }, (res: {
        success: boolean;
        room?: RoomPublic;
        error?: string;
      }) => {
        if (res.success && res.room) {
          setRoom(res.room);
          setPlayers(res.room.players);
          // Redirect if game already running
          if (res.room.status === 'running' || res.room.status === 'countdown' || res.room.status === 'paused') {
            navigate(`/arena/${code}/host/game`);
          } else if (res.room.status === 'finished') {
            navigate(`/arena/${code}/results`);
          }
        } else {
          setError(res.error || 'Failed to reconnect to arena.');
        }
      });
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
      socket.off('game:paused');
      socket.off('game:resumed');
      socket.off('game:stopped');
      socket.off('game:finished');
      socket.off('game:restarted');
      socket.off('room:ended');
    };
  }, [code, hostToken, setupListeners, navigate]);

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
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Host Error</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/create')}>Create New Arena</button>
        </div>
      </div>
    );
  }

  const activePlayers = players.filter(p => p.status !== 'disconnected');
  const status = room?.status || 'waiting';

  const statusBadgeClass: Record<GameStatus, string> = {
    waiting: 'badge-waiting',
    countdown: 'badge-countdown',
    running: 'badge-running',
    paused: 'badge-paused',
    finished: 'badge-finished',
    stopped: 'badge-stopped',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div className="bg-grid" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
      <div className="bg-radial-purple" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Host Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '14px 24px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="logo">TYPING<span style={{ color: 'var(--accent-cyan)' }}>ARENA</span></span>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                  padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-primary-subtle)',
                  color: 'var(--accent-primary-light)',
                  border: '1px solid var(--border-accent)',
                }}>
                  HOST
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                HOST CONTROL CENTER
              </p>
            </div>

            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              {[
                { label: 'ROOM', value: code },
                { label: 'PLAYERS', value: `${activePlayers.length} / ${room?.settings.maxPlayers || '?'}` },
                { label: 'STATUS', value: status.toUpperCase(), badge: statusBadgeClass[status as GameStatus] },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div className="section-title" style={{ marginBottom: 2, fontSize: 10 }}>{item.label}</div>
                  {item.badge ? (
                    <span className={`badge ${item.badge}`} style={{ fontSize: 12 }}>{item.value}</span>
                  ) : (
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                      {item.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <main style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>

            {/* Control Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Room Code */}
              <div className="glass-card" style={{ padding: 20 }}>
                <RoomCode code={code} />
              </div>

              {/* Settings Summary */}
              {room && (
                <div className="card">
                  <p className="section-title">ARENA SETTINGS</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Mode', value: 'Classic Race' },
                      { label: 'Duration', value: `${room.settings.duration}s` },
                      { label: 'Difficulty', value: difficultyLabel(room.settings.difficulty) },
                      { label: 'Countdown', value: `${room.settings.countdown}s` },
                      { label: 'Text', value: room.settings.textMode === 'custom' ? 'Custom' : 'Random' },
                      { label: 'Late Join', value: room.settings.allowLateJoin ? 'On' : 'Off' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                        <span style={{ fontWeight: 600 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="card">
                <p className="section-title">HOST CONTROLS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {status === 'waiting' || status === 'stopped' ? (
                    <>
                      <button
                        id="host-start-btn"
                        className="btn btn-primary"
                        onClick={handleStart}
                        disabled={!!actionLoading}
                        style={{ justifyContent: 'center' }}
                      >
                        {actionLoading === 'host:start' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={16} />}
                        START GAME
                      </button>
                      {startError && (
                        <div style={{ fontSize: 12, color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertCircle size={12} />
                          {startError}
                        </div>
                      )}
                      <button
                        className="btn btn-danger"
                        onClick={() => setModal('end')}
                        disabled={!!actionLoading}
                        style={{ justifyContent: 'center' }}
                      >
                        <LogOut size={16} />
                        END ARENA
                      </button>
                    </>
                  ) : status === 'running' || status === 'countdown' ? (
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={() => emitHost('host:pause')}
                        disabled={!!actionLoading || status === 'countdown'}
                        style={{ justifyContent: 'center' }}
                      >
                        <Pause size={16} />
                        PAUSE
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => setModal('stop')}
                        disabled={!!actionLoading}
                        style={{ justifyContent: 'center' }}
                      >
                        <Square size={16} />
                        STOP GAME
                      </button>
                    </>
                  ) : status === 'paused' ? (
                    <>
                      <button
                        className="btn btn-success"
                        onClick={() => emitHost('host:resume')}
                        disabled={!!actionLoading}
                        style={{ justifyContent: 'center' }}
                      >
                        <Play size={16} />
                        RESUME
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => setModal('stop')}
                        disabled={!!actionLoading}
                        style={{ justifyContent: 'center' }}
                      >
                        <Square size={16} />
                        STOP GAME
                      </button>
                    </>
                  ) : status === 'finished' ? (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate(`/arena/${code}/results`)}
                        style={{ justifyContent: 'center' }}
                      >
                        <Trophy size={16} />
                        VIEW RESULTS
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => emitHost('host:restart')}
                        disabled={!!actionLoading}
                        style={{ justifyContent: 'center' }}
                      >
                        <RotateCcw size={16} />
                        PLAY AGAIN
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => setModal('end')}
                        disabled={!!actionLoading}
                        style={{ justifyContent: 'center' }}
                      >
                        <LogOut size={16} />
                        END ARENA
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Min players note */}
              {room && status === 'waiting' && (
                <div style={{
                  fontSize: 12,
                  color: activePlayers.length >= room.settings.minPlayers ? 'var(--color-success)' : 'var(--text-muted)',
                  display: 'flex', gap: 6, alignItems: 'center',
                  padding: '10px 14px',
                  background: activePlayers.length >= room.settings.minPlayers ? 'var(--color-success-subtle)' : 'var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <Users size={14} />
                  {activePlayers.length >= room.settings.minPlayers
                    ? `✓ Minimum players reached (${activePlayers.length}/${room.settings.minPlayers})`
                    : `Need ${room.settings.minPlayers - activePlayers.length} more player${room.settings.minPlayers - activePlayers.length === 1 ? '' : 's'} to start`
                  }
                </div>
              )}
            </div>

            {/* Player Dashboard */}
            <div>
              <p className="section-title">
                LIVE PLAYERS ({activePlayers.length})
              </p>

              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 80px 90px 140px',
                gap: 10,
                padding: '10px 16px',
                marginBottom: 4,
              }}>
                {['PLAYER', 'STATUS', 'WPM', 'ACCURACY', 'PROGRESS'].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                    {h}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {activePlayers.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '40px',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <Users size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <p>No players yet. Share the room code!</p>
                  </div>
                ) : activePlayers.map(player => (
                  <div
                    key={player.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 80px 90px 140px',
                      gap: 10,
                      padding: '10px 16px',
                      background: player.id === playerId ? 'var(--accent-primary-subtle)' : 'var(--bg-elevated)',
                      border: `1px solid ${player.id === playerId ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: `linear-gradient(135deg, var(--accent-primary), var(--accent-indigo))`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
                      }}>
                        {player.nickname.substring(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {player.nickname}
                        {player.id === playerId && (
                          <span style={{ fontSize: 10, color: 'var(--accent-primary-light)', marginLeft: 6 }}>HOST</span>
                        )}
                      </span>
                    </div>
                    <span className={`badge badge-${player.status}`} style={{ fontSize: 10 }}>
                      {player.status}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent-cyan-light)' }}>
                      {player.wpm > 0 ? player.wpm : '—'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)' }}>
                      {player.status !== 'waiting' ? `${player.accuracy.toFixed(1)}%` : '—'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar-track" style={{ flex: 1 }}>
                        <div className="progress-bar-fill" style={{ width: `${player.progress}%` }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 28, textAlign: 'right' }}>
                        {player.progress}%
                      </span>
                    </div>
                  </div>
                ))}

                {/* Disconnected players */}
                {players.filter(p => p.status === 'disconnected').map(player => (
                  <div
                    key={player.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 80px 90px 140px',
                      gap: 10,
                      padding: '10px 16px',
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      alignItems: 'center',
                      opacity: 0.4,
                    }}
                  >
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{player.nickname}</span>
                    <span className="badge badge-disconnected" style={{ fontSize: 10 }}>DISCONNECTED</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Stop Modal */}
      {modal === 'stop' && (
        <Modal
          title="STOP THIS ARENA?"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>CANCEL</button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setModal(null);
                  emitHost('host:stop');
                }}
              >
                STOP GAME
              </button>
            </>
          }
        >
          All current progress will be discarded. Players will be returned to the stopped screen.
        </Modal>
      )}

      {/* End Modal */}
      {modal === 'end' && (
        <Modal
          title="END ARENA?"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>CANCEL</button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setModal(null);
                  emitHost('host:end', () => navigate('/'));
                }}
              >
                END ARENA
              </button>
            </>
          }
        >
          All players will be disconnected from this arena permanently. This cannot be undone.
        </Modal>
      )}
    </div>
  );
}
