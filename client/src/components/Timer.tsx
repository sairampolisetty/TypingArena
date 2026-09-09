import { useEffect, useState, useRef } from 'react';
import { Clock } from 'lucide-react';
import { formatTime } from '../lib/utils';

interface TimerProps {
  endTime: number | null;
  pausedAt: number | null;
  remainingTime: number | null;
  onExpire?: () => void;
}

export default function Timer({ endTime, pausedAt, remainingTime, onExpire }: TimerProps) {
  const [display, setDisplay] = useState('');
  const [isLow, setIsLow] = useState(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    let raf: number;

    const tick = () => {
      let msLeft: number;

      if (pausedAt && remainingTime !== null) {
        msLeft = remainingTime;
      } else if (endTime) {
        msLeft = Math.max(0, endTime - Date.now());
      } else {
        msLeft = 0;
      }

      setDisplay(formatTime(msLeft));
      setIsLow(msLeft <= 10000 && msLeft > 0);

      if (msLeft <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
        return;
      }

      if (msLeft > 0) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [endTime, pausedAt, remainingTime]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Clock
        size={18}
        style={{ color: isLow ? 'var(--color-error)' : 'var(--text-muted)' }}
      />
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 28,
        fontWeight: 700,
        color: isLow ? 'var(--color-error)' : 'var(--text-primary)',
        transition: 'color 0.3s',
        animation: isLow ? 'pulse-live 1s infinite' : 'none',
      }}>
        {display || '00:00'}
      </span>
    </div>
  );
}
