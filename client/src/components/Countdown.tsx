import { useEffect, useState, useRef } from 'react';
import { Zap } from 'lucide-react';
import { playCountdownBeep } from '../lib/sounds';

interface CountdownProps {
  countdownTarget: number;
  onComplete?: () => void;
}

export default function Countdown({ countdownTarget, onComplete }: CountdownProps) {
  const [count, setCount] = useState<number | null>(null);
  const [phase, setPhase] = useState<'counting' | 'go' | 'done'>('counting');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const lastBeepRef = useRef<number | null>(null);

  useEffect(() => {
    let raf: number;
    let calledDone = false;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.ceil((countdownTarget - now) / 1000);

      if (remaining > 0) {
        setCount(prev => {
          if (prev !== remaining && remaining !== lastBeepRef.current) {
            lastBeepRef.current = remaining;
            playCountdownBeep(remaining);
          }
          return remaining;
        });
        setPhase('counting');
        raf = requestAnimationFrame(tick);
      } else if (!calledDone) {
        calledDone = true;
        if (lastBeepRef.current !== 0) {
          lastBeepRef.current = 0;
          playCountdownBeep(0); // "GO!" sound
        }
        setPhase('go');
        setTimeout(() => {
          setPhase('done');
          onCompleteRef.current?.();
        }, 800);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [countdownTarget]);

  if (phase === 'done') return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(245, 244, 255, 0.92)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 90,
        gap: 24,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        {phase === 'counting' ? (
          <>
            <p style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 24,
            }}>
              ARE YOU READY?
            </p>
            <div key={count} className="countdown-number">
              {count}
            </div>
          </>
        ) : (
          <div
            className="countdown-number"
            style={{
              fontSize: 'clamp(60px, 15vw, 140px)',
              background: 'linear-gradient(135deg, var(--color-success), var(--accent-cyan))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            GO!
          </div>
        )}
      </div>
      {phase === 'counting' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
          <Zap size={14} />
          Get ready to type
        </div>
      )}
    </div>
  );
}
