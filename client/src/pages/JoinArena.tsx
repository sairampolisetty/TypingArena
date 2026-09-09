import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Zap, AlertCircle, Loader2 } from 'lucide-react';
import Nav from '../components/Nav';
import { connectSocket } from '../lib/socket';
import { useToast } from '../contexts/ToastContext';

export default function JoinArena() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [code, setCode] = useState(searchParams.get('code') || '');
  const [nickname, setNickname] = useState('');

  // Auto-fill code from URL path if navigated from invite link
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) setCode(urlCode.toUpperCase());
  }, [searchParams]);

  function formatCode(val: string) {
    return val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  }

  async function handleJoin() {
    const trimCode = code.trim().toUpperCase();
    const trimNick = nickname.trim();

    if (!trimCode || trimCode.length < 4) {
      setError('Please enter a valid arena code.');
      return;
    }
    if (!trimNick) {
      setError('Please enter your nickname.');
      return;
    }
    if (trimNick.length < 2) {
      setError('Nickname must be at least 2 characters.');
      return;
    }

    setLoading(true);
    setError('');

    const socket = connectSocket();

    const doJoin = () => {
      socket.emit('join:room', {
        code: trimCode,
        nickname: trimNick,
      }, (res: { success: boolean; room?: { code: string }; playerId?: string; error?: string }) => {
        setLoading(false);
        if (!res.success) {
          setError(res.error || 'Failed to join. Try again.');
          return;
        }
        const roomCode = res.room!.code;
        sessionStorage.setItem(`playerId:${roomCode}`, res.playerId!);
        sessionStorage.setItem(`nickname:${roomCode}`, trimNick);
        addToast('success', `Joined arena ${roomCode}!`);
        navigate(`/arena/${roomCode}`);
      });
    };

    if (socket.connected) {
      doJoin();
    } else {
      socket.once('connect', doJoin);
      socket.once('connect_error', () => {
        setLoading(false);
        setError('Cannot connect to server. Make sure the server is running.');
      });
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div className="bg-grid" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
      <div className="bg-radial-purple" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Nav />
        <main style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          minHeight: 'calc(100vh - 64px)',
        }}>
          <div style={{ width: '100%', maxWidth: 440 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 60, height: 60,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--accent-cyan-subtle)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <Zap size={28} style={{ color: 'var(--accent-cyan)' }} />
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
                JOIN AN ARENA
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Enter the arena code and your nickname
              </p>
            </div>

            <div className="glass-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="form-label" htmlFor="arena-code">Arena Code</label>
                <input
                  id="arena-code"
                  className="form-input"
                  value={code}
                  onChange={e => {
                    setCode(formatCode(e.target.value));
                    setError('');
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="e.g. 7K4P9X"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 20,
                    letterSpacing: '0.2em',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                  }}
                  maxLength={6}
                  autoComplete="off"
                  autoFocus
                />
              </div>

              <div>
                <label className="form-label" htmlFor="player-nickname">Your Nickname</label>
                <input
                  id="player-nickname"
                  className="form-input"
                  value={nickname}
                  onChange={e => {
                    setNickname(e.target.value.slice(0, 30));
                    setError('');
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="Enter your nickname"
                  maxLength={30}
                />
              </div>

              {error && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  background: 'var(--color-error-subtle)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-error)',
                  fontSize: 14,
                }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button
                id="join-arena-btn"
                className="btn btn-cyan btn-lg"
                onClick={handleJoin}
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Joining...
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    JOIN ARENA
                  </>
                )}
              </button>

              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                Don't have a code?{' '}
                <a
                  href="/create"
                  style={{ color: 'var(--accent-primary-light)', textDecoration: 'none', fontWeight: 600 }}
                  onClick={e => { e.preventDefault(); navigate('/create'); }}
                >
                  Create your own arena
                </a>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
