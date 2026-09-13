import { Monitor, Keyboard } from 'lucide-react';

export default function MobileBlock() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background effects */}
      <div className="bg-grid" style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }} />
      <div className="bg-radial-purple" style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }} />
      <div className="bg-radial-cyan" style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 380, width: '100%' }}>
        {/* Logo */}
        <div style={{ marginBottom: 40 }}>
          <span className="logo" style={{ fontSize: 28 }}>
            TYPING<span style={{ color: 'var(--accent-cyan)' }}>ARENA</span>
          </span>
        </div>

        {/* Animated icon cluster */}
        <div style={{
          position: 'relative',
          width: 140,
          height: 140,
          margin: '0 auto 36px',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, var(--accent-primary-glow), var(--accent-cyan-glow), var(--accent-primary-glow))',
            animation: 'spin-slow 4s linear infinite',
            opacity: 0.6,
          }} />
          <div style={{
            position: 'absolute',
            inset: 8,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(79,70,229,0.12), rgba(14,165,233,0.12))',
            border: '1.5px solid var(--border-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 4,
            backdropFilter: 'blur(8px)',
            animation: 'float 3s ease-in-out infinite',
          }}>
            <Monitor size={40} style={{ color: 'var(--accent-primary-light)' }} />
            <Keyboard size={22} style={{ color: 'var(--accent-cyan)', opacity: 0.8 }} />
          </div>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(26px, 8vw, 34px)',
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
          marginBottom: 14,
        }}>
          <span style={{
            background: 'linear-gradient(135deg, var(--accent-primary-light), var(--accent-cyan))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Desktop Only
          </span>
        </h1>

        <p style={{
          fontSize: 16,
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          marginBottom: 10,
          fontWeight: 500,
        }}>
          TypingArena is a competitive typing battle platform built for{' '}
          <strong style={{ color: 'var(--accent-primary-light)' }}>keyboard warriors</strong>.
        </p>
        <p style={{
          fontSize: 14,
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          marginBottom: 36,
        }}>
          Open this page on your laptop or desktop computer to join or host a race.
        </p>

        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, var(--border-default), transparent)',
          marginBottom: 28,
        }} />

        <div className="glass-card" style={{
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          textAlign: 'left',
          background: 'rgba(255,255,255,0.7)',
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary-subtle)',
            border: '1px solid var(--border-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Keyboard size={20} style={{ color: 'var(--accent-primary-light)' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
              Why desktop only?
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Live typing races require a physical keyboard to compete fairly.
            </div>
          </div>
        </div>

        <p style={{
          marginTop: 32,
          fontSize: 12,
          color: 'var(--text-disabled)',
          letterSpacing: '0.04em',
        }}>
          TYPINGARENA · DESKTOP REQUIRED
        </p>
      </div>
    </div>
  );
}
