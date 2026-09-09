import { useNavigate } from 'react-router-dom';
import { Shield, Users, Zap, Trophy, ArrowRight, ChevronRight } from 'lucide-react';
import Nav from '../components/Nav';

const DEMO_PLAYERS = [
  { name: 'Alex', wpm: 92, progress: 84, rank: 1 },
  { name: 'Sarah', wpm: 87, progress: 76, rank: 2 },
  { name: 'Rahul', wpm: 81, progress: 68, rank: 3 },
  { name: 'You', wpm: 76, progress: 60, rank: 4, isYou: true },
];

const FEATURES = [
  {
    icon: <Shield size={24} style={{ color: 'var(--accent-primary-light)' }} />,
    title: 'HOST CONTROL',
    desc: 'Every rule is yours. Set duration, difficulty, text, player limits and manage every moment of the game.',
    glow: 'rgba(124, 58, 237, 0.15)',
  },
  {
    icon: <Zap size={24} style={{ color: 'var(--accent-cyan)' }} />,
    title: 'REAL-TIME',
    desc: 'Everyone types together. Live progress bars, synchronized countdown, instant leaderboard updates.',
    glow: 'rgba(6, 182, 212, 0.15)',
  },
  {
    icon: <Users size={24} style={{ color: 'var(--color-success)' }} />,
    title: 'UP TO 60 PLAYERS',
    desc: 'Turn a classroom, team, community or Discord server into a competitive typing arena.',
    glow: 'rgba(16, 185, 129, 0.15)',
  },
  {
    icon: <Trophy size={24} style={{ color: 'var(--gold)' }} />,
    title: 'LIVE LEADERBOARD',
    desc: 'Watch the battle unfold in real time. Podium reveal at the end makes every race dramatic.',
    glow: 'rgba(251, 191, 36, 0.15)',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div className="bg-grid" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
      <div className="bg-radial-purple" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
      <div className="bg-radial-cyan" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Nav />

        {/* Hero */}
        <section style={{
          padding: 'clamp(60px, 10vw, 120px) 24px clamp(40px, 8vw, 80px)',
          textAlign: 'center',
          maxWidth: 900,
          margin: '0 auto',
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <span className="badge badge-live">
              <span className="live-dot" />
              LIVE MULTIPLAYER
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(48px, 10vw, 100px)',
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            marginBottom: 12,
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, var(--accent-primary-light) 50%, var(--accent-cyan) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              TYPING
            </span>
            <span style={{
              background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-primary-light) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              ARENA
            </span>
          </h1>

          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(20px, 4vw, 36px)',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 16,
            letterSpacing: '0.02em',
          }}>
            Create the arena.&nbsp;
            <span style={{ color: 'var(--accent-primary-light)' }}>Set the rules.</span>&nbsp;
            Beat the clock.
          </p>

          <p style={{
            fontSize: 16,
            color: 'var(--text-muted)',
            marginBottom: 40,
            maxWidth: 480,
            margin: '0 auto 40px',
          }}>
            Host real-time typing battles for friends, classrooms, teams and communities.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              id="create-arena-cta"
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/create')}
              style={{ minWidth: 180 }}
            >
              <Shield size={20} />
              CREATE ARENA
              <ArrowRight size={18} />
            </button>
            <button
              id="join-arena-cta"
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/join')}
              style={{ minWidth: 160 }}
            >
              <Zap size={20} />
              JOIN ARENA
            </button>
          </div>
        </section>

        {/* Demo Arena Preview */}
        <section style={{ padding: '0 24px 80px', maxWidth: 800, margin: '0 auto' }}>
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            {/* Top bar */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-elevated)',
            }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-live">
                  <span className="live-dot" />
                  LIVE
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>
                  Arena: FRIDAY BATTLE
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent-cyan)' }}>
                00:42
              </span>
            </div>

            {/* Players */}
            <div style={{ padding: '20px' }}>
              {DEMO_PLAYERS.map((player, idx) => (
                <div
                  key={player.name}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 1fr 90px',
                    gap: 14,
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: player.isYou ? 'var(--accent-primary-subtle)' : 'transparent',
                    border: player.isYou ? '1px solid var(--border-accent)' : '1px solid transparent',
                    marginBottom: idx < DEMO_PLAYERS.length - 1 ? 6 : 0,
                    animation: `slide-in-left ${0.1 + idx * 0.1}s ease both`,
                  }}
                >
                  <span style={{ fontSize: 16 }}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </span>
                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}>
                      <span style={{
                        fontSize: 14, fontWeight: 600,
                        color: player.isYou ? 'var(--accent-primary-light)' : 'var(--text-primary)',
                      }}>
                        {player.name} {player.isYou && <span style={{ fontSize: 11, opacity: 0.7 }}>(You)</span>}
                      </span>
                    </div>
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${player.progress}%`,
                          transition: 'width 1s ease',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 20,
                      fontWeight: 700,
                      color: 'var(--accent-cyan-light)',
                    }}>
                      {player.wpm}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>WPM</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: '0 24px 100px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p className="section-title" style={{ justifyContent: 'center', fontSize: 12 }}>
              WHY TYPINGARENA
            </p>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              Built for the arena
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
          }}>
            {FEATURES.map(f => (
              <div key={f.title} className="card-feature">
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-md)',
                  background: f.glow,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8, color: 'var(--text-primary)' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA bottom */}
        <section style={{
          padding: '0 24px 100px',
          textAlign: 'center',
          maxWidth: 600,
          margin: '0 auto',
        }}>
          <div className="glass-card" style={{ padding: 40 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 700,
              marginBottom: 12,
            }}>
              Ready to compete?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 15 }}>
              Create an arena in under 30 seconds. Share a code. Race.
            </p>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/create')}
              style={{ width: '100%', maxWidth: 320, justifyContent: 'center' }}
            >
              <Shield size={20} />
              CREATE YOUR ARENA
              <ChevronRight size={18} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
