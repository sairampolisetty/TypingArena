import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { connectSocket, getSocket } from '../lib/socket';
import type { RoomPublic, PlayerPublic } from '../types';
import Countdown from '../components/Countdown';
import Timer from '../components/Timer';
import TypingEngine from '../components/TypingEngine';
import LiveLeaderboard from '../components/LiveLeaderboard';
import { useToast } from '../contexts/ToastContext';
import { playPersonalFinish, playFinishFanfare, unlockAudio } from '../lib/sounds';

export default function GamePage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [room, setRoom] = useState<RoomPublic | null>(null);
  const [players, setPlayers] = useState<PlayerPublic[]>([]);
  const [showCountdown, setShowCountdown] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const code = roomCode?.toUpperCase() || '';
  const playerId = sessionStorage.getItem(`playerId:${code}`);
  const hostToken = sessionStorage.getItem(`hostToken:${code}`);
  const isHost = Boolean(hostToken);

  const setupListeners = useCallback((socket: ReturnType<typeof getSocket>) => {
    socket.on('room:state', (r: RoomPublic) => {
      setRoom(r);
      setPlayers(r.players);
      if (r.status === 'countdown' && r.countdownTarget) {
        setShowCountdown(true);
        setGameStarted(false);
      }
      if (r.status === 'running') {
        setShowCountdown(false);
        setGameStarted(true);
      }
    });

    socket.on('room:players', (pl: PlayerPublic[]) => setPlayers(pl));

    socket.on('player:updated', (player: PlayerPublic) => {
      setPlayers(prev => prev.map(p => p.id === player.id ? player : p));
    });

    socket.on('game:countdown', (data: { countdownTarget: number }) => {
      setRoom(prev => prev ? { ...prev, status: 'countdown', countdownTarget: data.countdownTarget } : prev);
      setShowCountdown(true);
      setGameStarted(false);
    });

    socket.on('game:start', (data: { startTime: number; endTime: number; text: string }) => {
      setShowCountdown(false);
      setGameStarted(true);
      setRoom(prev => prev ? {
        ...prev,
        status: 'running',
        startTime: data.startTime,
        endTime: data.endTime,
        currentText: data.text,
        countdownTarget: null,
      } : prev);
    });

    socket.on('game:paused', (data: { pausedAt: number; remainingTime: number }) => {
      setRoom(prev => prev ? { ...prev, status: 'paused', pausedAt: data.pausedAt, remainingTime: data.remainingTime } : prev);
      addToast('info', 'Game paused by host.');
    });

    socket.on('game:resumed', (data: { endTime: number }) => {
      setRoom(prev => prev ? { ...prev, status: 'running', endTime: data.endTime, pausedAt: null, remainingTime: null } : prev);
      addToast('info', 'Game resumed!');
    });

    socket.on('game:stopped', () => {
      addToast('error', 'Game stopped by host.');
      navigate(`/arena/${code}${isHost ? '/host' : ''}`);
    });

    socket.on('game:finished', (data: { results?: import('../types').PlayerPublic[] }) => {
      playFinishFanfare();
      navigate(`/arena/${code}/results`, { state: { results: data?.results ?? [] } });
    });

    socket.on('game:restarted', () => {
      navigate(`/arena/${code}${isHost ? '/host' : ''}`);
    });

    socket.on('room:ended', (data: { reason: string }) => {
      addToast('info', data.reason || 'Arena ended.');
      navigate('/');
    });
  }, [code, isHost, navigate, addToast]);

  useEffect(() => {
    if (!code) return;

    const socket = connectSocket();

    const doConnect = () => {
      // Reconnect
      const reconnectEvent = isHost ? 'reconnect:host' : 'reconnect:player';
      const reconnectData = isHost
        ? { roomCode: code, hostToken }
        : { roomCode: code, playerId };

      socket.emit(reconnectEvent, reconnectData, (res: { success: boolean; room?: RoomPublic; error?: string }) => {
        if (res.success && res.room) {
          setRoom(res.room);
          setPlayers(res.room.players);
          if (res.room.status === 'countdown' && res.room.countdownTarget) {
            setShowCountdown(true);
          }
          if (res.room.status === 'running') {
            setGameStarted(true);
          }
          if (res.room.status === 'finished') {
            navigate(`/arena/${code}/results`);
          }
        } else {
          navigate(`/arena/${code}${isHost ? '/host' : ''}`);
        }
      });
    };

    if (socket.connected) {
      doConnect();
    } else {
      socket.once('connect', doConnect);
    }

    setupListeners(socket);

    return () => {
      socket.off('room:state');
      socket.off('room:players');
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
  }, [code, isHost, hostToken, playerId, setupListeners, navigate]);

  function handleProgress(data: {
    progress: number;
    wpm: number;
    accuracy: number;
    correctChars: number;
    incorrectChars: number;
  }) {
    if (!playerId || !room) return;
    getSocket().emit('player:progress', {
      roomCode: code,
      playerId,
      ...data,
    });
  }

  function handleFinish(data: {
    wpm: number;
    accuracy: number;
    correctChars: number;
    incorrectChars: number;
  }) {
    if (!playerId || !room || finished) return;
    setFinished(true);
    playPersonalFinish();
    getSocket().emit('player:finish', {
      roomCode: code,
      playerId,
      ...data,
    }, (res: { success: boolean; rank?: number | null }) => {
      if (res.success && res.rank) {
        addToast('success', `You finished! Rank: #${res.rank} 🎉`);
      }
    });
  }

  // isHost who is also racing gets typing engine; pure spectator host does not
  const isRacingHost = isHost && Boolean(playerId);
  const isDisabled = !gameStarted || room?.status === 'paused' || finished;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <div className="bg-grid" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Countdown overlay */}
      {showCountdown && room?.countdownTarget && (
        <Countdown
          countdownTarget={room.countdownTarget}
          onComplete={() => {
            setShowCountdown(false);
            setGameStarted(true);
          }}
        />
      )}

      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Game Header */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(20px)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
              {room?.name || 'ARENA'}
            </h1>
            {room?.status === 'running' && (
              <span className="badge badge-live">
                <span className="live-dot" />
                LIVE
              </span>
            )}
            {room?.status === 'paused' && (
              <span className="badge badge-paused">PAUSED</span>
            )}
            {room?.status === 'countdown' && (
              <span className="badge badge-countdown">STARTING</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {room && (
              <Timer
                endTime={room.endTime}
                pausedAt={room.pausedAt}
                remainingTime={room.remainingTime}
              />
            )}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>
              {code}
            </span>
          </div>
        </div>

        {/* Game Area */}
        <div style={{
          flex: 1,
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: '1fr 260px',
          gap: 20,
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          alignItems: 'start',
        }}>
          {/* Typing Area */}
          <div onClick={() => unlockAudio()}>
            {room?.status === 'paused' && (
              <div style={{
                marginBottom: 16,
                padding: '12px 16px',
                background: 'rgba(217, 119, 6, 0.08)',
                border: '1px solid rgba(217, 119, 6, 0.25)',
                borderRadius: 'var(--radius-md)',
                fontSize: 14,
                color: 'var(--color-warning)',
                fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                ⏸ Game paused by host. Waiting to resume...
              </div>
            )}

            {room && (
              <TypingEngine
                text={room.currentText}
                disabled={isDisabled}
                onProgress={(!isHost || isRacingHost) ? handleProgress : undefined}
                onFinish={(!isHost || isRacingHost) ? handleFinish : undefined}
                gameStartTime={room.startTime}
              />
            )}

            {/* Host control strip — only shown to host */}
            {isHost && (
              <div style={{
                marginTop: 16,
                padding: '12px 16px',
                background: 'var(--accent-primary-subtle)',
                border: '1.5px solid var(--border-accent)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {isRacingHost ? '👑 You are host & racer' : '👑 Spectating — host controls'}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {room?.status === 'running' && (
                    <button className="btn btn-secondary btn-sm" onClick={() =>
                      getSocket().emit('host:pause', { roomCode: code, hostToken })
                    }>⏸ Pause</button>
                  )}
                  {room?.status === 'paused' && (
                    <button className="btn btn-primary btn-sm" onClick={() =>
                      getSocket().emit('host:resume', { roomCode: code, hostToken })
                    }>▶ Resume</button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() =>
                    getSocket().emit('host:stop', { roomCode: code, hostToken })
                  }>■ Stop</button>
                </div>
              </div>
            )}
          </div>

          {/* Live Leaderboard Sidebar */}
          <div>
            <LiveLeaderboard players={players} currentPlayerId={playerId || undefined} />
          </div>
        </div>
      </div>
    </div>
  );
}
