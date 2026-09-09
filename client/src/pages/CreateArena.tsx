import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import Nav from '../components/Nav';
import { connectSocket } from '../lib/socket';
import { useToast } from '../contexts/ToastContext';
import type { Settings } from '../types';

const DURATIONS = [15, 30, 60, 90, 120];
const COUNTDOWNS = [3, 5, 10];
const MAX_PLAYERS_OPTIONS = [10, 20, 30, 40, 50, 60];
const MIN_PLAYERS_OPTIONS = [1, 2, 3, 5, 10];

export default function CreateArena() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    roomName: 'Friday Typing Battle',
    hostNickname: 'Host',
    maxPlayers: 60,
    minPlayers: 1,
    duration: 60,
    difficulty: 'medium' as Settings['difficulty'],
    textMode: 'random' as Settings['textMode'],
    customText: '',
    countdown: 5,
    allowLateJoin: false,
    hostPlays: false,
  });

  function update<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
    setError('');
  }

  async function handleCreate() {
    if (!form.hostNickname.trim()) {
      setError('Please enter your host nickname.');
      return;
    }
    if (form.textMode === 'custom' && form.customText.trim().length < 50) {
      setError('Custom text must be at least 50 characters.');
      return;
    }

    setLoading(true);
    setError('');

    const socket = connectSocket();

    const settings: Settings = {
      minPlayers: form.minPlayers,
      maxPlayers: form.maxPlayers,
      duration: form.duration,
      difficulty: form.difficulty,
      mode: 'classic',
      textMode: form.textMode,
      customText: form.customText,
      countdown: form.countdown,
      allowLateJoin: form.allowLateJoin,
      hostPlays: form.hostPlays,
    };

    // Wait for connection then emit
    const doCreate = () => {
      socket.emit('create:room', {
        settings,
        hostNickname: form.hostNickname.trim(),
        roomName: form.roomName.trim() || 'Friday Typing Battle',
      }, (res: { success: boolean; room?: { code: string }; hostToken?: string; hostPlayerId?: string | null; error?: string }) => {
        setLoading(false);
        if (!res.success) {
          setError(res.error || 'Failed to create arena. Try again.');
          return;
        }
        const code = res.room!.code;
        sessionStorage.setItem(`hostToken:${code}`, res.hostToken!);
        // If host is racing, also store their playerId
        if (res.hostPlayerId) {
          sessionStorage.setItem(`playerId:${code}`, res.hostPlayerId);
        } else {
          sessionStorage.removeItem(`playerId:${code}`);
        }
        sessionStorage.setItem(`nickname:${code}`, form.hostNickname.trim());
        addToast('success', `Arena ${code} created!`);
        navigate(`/arena/${code}/host`);
      });
    };

    if (socket.connected) {
      doCreate();
    } else {
      socket.once('connect', doCreate);
      socket.once('connect_error', () => {
        setLoading(false);
        setError('Cannot connect to server. Make sure the server is running on port 3001.');
      });
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div className="bg-grid" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
      <div className="bg-radial-purple" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Nav />
        <main style={{ padding: '40px 24px 80px', maxWidth: 700, margin: '0 auto' }}>

          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                background: 'var(--accent-primary-subtle)',
                border: '1px solid var(--border-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={20} style={{ color: 'var(--accent-primary-light)' }} />
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
                  Create your arena
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                  Configure and launch your typing battle
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Arena Details */}
            <section>
              <p className="section-title">ARENA DETAILS</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label" htmlFor="arena-name">Arena Name</label>
                  <input
                    id="arena-name"
                    className="form-input"
                    value={form.roomName}
                    onChange={e => update('roomName', e.target.value)}
                    placeholder="Friday Typing Battle"
                    maxLength={60}
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="host-nickname">Your Nickname (Host)</label>
                  <input
                    id="host-nickname"
                    className="form-input"
                    value={form.hostNickname}
                    onChange={e => update('hostNickname', e.target.value)}
                    placeholder="Host"
                    maxLength={30}
                  />
                </div>
              </div>
            </section>

            {/* Players */}
            <section>
              <p className="section-title">PLAYER LIMITS</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label" htmlFor="max-players">Maximum Players</label>
                  <select
                    id="max-players"
                    className="form-input form-select"
                    value={form.maxPlayers}
                    onChange={e => update('maxPlayers', Number(e.target.value))}
                  >
                    {MAX_PLAYERS_OPTIONS.map(n => (
                      <option key={n} value={n}>{n} players</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label" htmlFor="min-players">Minimum Players</label>
                  <select
                    id="min-players"
                    className="form-input form-select"
                    value={form.minPlayers}
                    onChange={e => update('minPlayers', Number(e.target.value))}
                  >
                    {MIN_PLAYERS_OPTIONS.map(n => (
                      <option key={n} value={n}>{n} players</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Game Settings */}
            <section>
              <p className="section-title">GAME SETTINGS</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label" htmlFor="duration">Game Duration</label>
                  <select
                    id="duration"
                    className="form-input form-select"
                    value={form.duration}
                    onChange={e => update('duration', Number(e.target.value))}
                  >
                    {DURATIONS.map(d => (
                      <option key={d} value={d}>{d} seconds</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label" htmlFor="difficulty">Difficulty</label>
                  <select
                    id="difficulty"
                    className="form-input form-select"
                    value={form.difficulty}
                    onChange={e => update('difficulty', e.target.value as Settings['difficulty'])}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" htmlFor="countdown">Countdown</label>
                  <select
                    id="countdown"
                    className="form-input form-select"
                    value={form.countdown}
                    onChange={e => update('countdown', Number(e.target.value))}
                  >
                    {COUNTDOWNS.map(c => (
                      <option key={c} value={c}>{c} seconds</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Game Mode */}
            <section>
              <p className="section-title">GAME MODE</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {[
                  { id: 'classic', label: 'CLASSIC RACE', active: true },
                  { id: 'time-attack', label: 'TIME ATTACK', active: false },
                  { id: 'survival', label: 'SURVIVAL', active: false },
                  { id: 'elimination', label: 'ELIMINATION', active: false },
                ].map(mode => (
                  <div
                    key={mode.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: mode.id === 'classic' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      background: mode.id === 'classic' ? 'var(--accent-primary-subtle)' : 'transparent',
                      cursor: mode.active ? 'pointer' : 'not-allowed',
                      opacity: mode.active ? 1 : 0.4,
                      textAlign: 'center' as const,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: mode.id === 'classic' ? 'var(--accent-primary-light)' : 'var(--text-secondary)' }}>
                      {mode.label}
                    </div>
                    {!mode.active && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        Coming soon
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Text Mode */}
            <section>
              <p className="section-title">TEXT MODE</p>
              <div style={{ display: 'flex', gap: 10, marginBottom: form.textMode === 'custom' ? 14 : 0 }}>
                {(['random', 'custom'] as const).map(mode => (
                  <button
                    key={mode}
                    className={`btn ${form.textMode === mode ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => update('textMode', mode)}
                  >
                    {mode === 'random' ? 'Random Text' : 'Custom Text'}
                  </button>
                ))}
              </div>
              {form.textMode === 'custom' && (
                <div>
                  <label className="form-label" htmlFor="custom-text">
                    Custom Text (min 50 characters)
                  </label>
                  <textarea
                    id="custom-text"
                    className="form-input"
                    value={form.customText}
                    onChange={e => update('customText', e.target.value)}
                    placeholder="Enter your custom typing text here... (minimum 50 characters recommended)"
                    maxLength={2000}
                  />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {form.customText.length} / 2000 characters
                  </div>
                </div>
              )}
            </section>

            {/* Options */}
            <section>
              <p className="section-title">OPTIONS</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Allow Late Join */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Allow Late Join</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                      Players can join after the game starts
                    </div>
                  </div>
                  <button
                    className={`toggle ${form.allowLateJoin ? 'active' : ''}`}
                    onClick={() => update('allowLateJoin', !form.allowLateJoin)}
                    aria-label="Toggle late join"
                    role="switch"
                    aria-checked={form.allowLateJoin}
                  />
                </div>

                {/* Host Participates */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: form.hostPlays ? 'var(--accent-primary-subtle)' : 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: form.hostPlays ? '1.5px solid var(--border-accent)' : '1px solid var(--border-subtle)',
                  transition: 'all 0.2s',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: form.hostPlays ? 'var(--accent-primary)' : undefined }}>
                      🎮 Join the race yourself
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                      {form.hostPlays
                        ? `You'll race as "${form.hostNickname || 'Host'}" — your WPM counts!`
                        : 'You watch and control the game only'}
                    </div>
                  </div>
                  <button
                    className={`toggle ${form.hostPlays ? 'active' : ''}`}
                    onClick={() => update('hostPlays', !form.hostPlays)}
                    aria-label="Toggle host participation"
                    role="switch"
                    aria-checked={form.hostPlays}
                  />
                </div>
              </div>
            </section>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
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

            {/* Submit */}
            <button
              id="create-arena-btn"
              className="btn btn-primary btn-lg"
              onClick={handleCreate}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Creating Arena...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  CREATE ARENA
                </>
              )}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
