import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { calculateWPM, calculateAccuracy, calculateProgress, throttle } from '../lib/utils';

interface TypingState {
  input: string;
  position: number;
  correctChars: number;
  incorrectChars: number;
  errors: Set<number>;
  startedAt: number | null;
  wpm: number;
  accuracy: number;
  progress: number;
  finished: boolean;
}

interface TypingEngineProps {
  text: string;
  disabled?: boolean;
  onProgress?: (data: {
    progress: number;
    wpm: number;
    accuracy: number;
    correctChars: number;
    incorrectChars: number;
  }) => void;
  onFinish?: (data: {
    wpm: number;
    accuracy: number;
    correctChars: number;
    incorrectChars: number;
  }) => void;
  gameStartTime?: number | null;
}

// Memoized text display component for performance
const TypingText = memo(({ text, position, errors }: {
  text: string;
  position: number;
  errors: Set<number>;
}) => {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(18px, 2.5vw, 24px)',
        lineHeight: 1.85,
        userSelect: 'none',
        wordBreak: 'break-word',
        letterSpacing: '0.02em',
      }}
      aria-label="Typing text"
    >
      {text.split('').map((char, idx) => {
        let className = 'typing-char ';
        if (idx < position) {
          className += errors.has(idx) ? 'typing-char-incorrect' : 'typing-char-correct';
        } else if (idx === position) {
          className += 'typing-char-current';
        } else {
          className += 'typing-char-pending';
        }
        return (
          <span key={idx} className={className}>
            {char === ' ' && idx === position ? '\u00A0' : char}
          </span>
        );
      })}
    </div>
  );
});
TypingText.displayName = 'TypingText';

export default function TypingEngine({
  text,
  disabled,
  onProgress,
  onFinish,
  gameStartTime,
}: TypingEngineProps) {
  const [state, setState] = useState<TypingState>({
    input: '',
    position: 0,
    correctChars: 0,
    incorrectChars: 0,
    errors: new Set(),
    startedAt: null,
    wpm: 0,
    accuracy: 100,
    progress: 0,
    finished: false,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const onProgressRef = useRef(onProgress);
  const onFinishRef = useRef(onFinish);
  onProgressRef.current = onProgress;
  onFinishRef.current = onFinish;

  // Throttled progress sender
  const throttledProgress = useRef(
    throttle((data: {
      progress: number;
      wpm: number;
      accuracy: number;
      correctChars: number;
      incorrectChars: number;
    }) => {
      onProgressRef.current?.(data);
    }, 120)
  );

  // Focus input automatically
  const focusInput = useCallback(() => {
    if (!disabled && !stateRef.current.finished && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  useEffect(() => {
    focusInput();
  }, [focusInput, disabled]);

  // Reset when text changes
  useEffect(() => {
    setState({
      input: '',
      position: 0,
      correctChars: 0,
      incorrectChars: 0,
      errors: new Set(),
      startedAt: null,
      wpm: 0,
      accuracy: 100,
      progress: 0,
      finished: false,
    });
    if (inputRef.current) inputRef.current.value = '';
  }, [text]);

  const processKey = useCallback((key: string) => {
    const curr = stateRef.current;
    if (disabled || curr.finished) return;

    if (key === 'Backspace') {
      if (curr.position === 0) return;

      const newPos = curr.position - 1;
      const newErrors = new Set(curr.errors);
      const wasError = newErrors.has(newPos);
      if (wasError) newErrors.delete(newPos);

      const newCorrect = wasError ? curr.correctChars : Math.max(0, curr.correctChars - 1);
      const totalTyped = newPos;
      const newAccuracy = calculateAccuracy(newCorrect, totalTyped);
      const elapsed = curr.startedAt ? Date.now() - curr.startedAt : 0;
      const newWpm = calculateWPM(newCorrect, elapsed);
      const newProgress = calculateProgress(newPos, text.length);

      const nextState: TypingState = {
        ...curr,
        position: newPos,
        input: curr.input.slice(0, -1),
        correctChars: newCorrect,
        errors: newErrors,
        accuracy: newAccuracy,
        wpm: newWpm,
        progress: newProgress,
      };
      setState(nextState);

      throttledProgress.current({
        progress: newProgress,
        wpm: newWpm,
        accuracy: newAccuracy,
        correctChars: newCorrect,
        incorrectChars: curr.incorrectChars,
      });
      return;
    }

    if (key.length !== 1) return;

    const expected = text[curr.position];
    if (expected === undefined) return;

    const isCorrect = key === expected;
    const now = Date.now();
    // Timer starts on FIRST keypress — never count idle time before typing began
    const startedAt = curr.startedAt ?? now;
    const elapsed = now - startedAt;
    const newPos = curr.position + 1;
    const newErrors = new Set(curr.errors);
    if (!isCorrect) newErrors.add(curr.position);

    const newCorrect = isCorrect ? curr.correctChars + 1 : curr.correctChars;
    const newIncorrect = curr.incorrectChars + (isCorrect ? 0 : 1);
    const totalTyped = newPos;
    const newAccuracy = calculateAccuracy(newCorrect, totalTyped);
    const newWpm = calculateWPM(newCorrect, elapsed);
    const newProgress = calculateProgress(newPos, text.length);
    const finished = newPos >= text.length;

    const nextState: TypingState = {
      input: curr.input + key,
      position: newPos,
      correctChars: newCorrect,
      incorrectChars: newIncorrect,
      errors: newErrors,
      startedAt,
      wpm: newWpm,
      accuracy: newAccuracy,
      progress: newProgress,
      finished,
    };

    setState(nextState);

    const updateData = {
      progress: newProgress,
      wpm: newWpm,
      accuracy: newAccuracy,
      correctChars: newCorrect,
      incorrectChars: newIncorrect,
    };

    if (finished) {
      onProgressRef.current?.(updateData);
      setTimeout(() => {
        onFinishRef.current?.({
          wpm: newWpm,
          accuracy: newAccuracy,
          correctChars: newCorrect,
          incorrectChars: newIncorrect,
        });
      }, 50);
    } else {
      // First character sends immediately; subsequent are throttled
      if (newPos === 1) {
        onProgressRef.current?.(updateData);
      } else {
        throttledProgress.current(updateData);
      }
    }
  }, [disabled, text, gameStartTime]);

  // Global window listener so typing works seamlessly even if focus is lost
  useEffect(() => {
    if (disabled || state.finished) return;

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in another input element or pressing shortcuts
      if (e.target instanceof HTMLInputElement || (e.target instanceof HTMLTextAreaElement && e.target !== inputRef.current)) return;
      if (e.target instanceof HTMLButtonElement) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        return;
      }

      if (e.key === 'Backspace' || e.key.length === 1) {
        e.preventDefault();
        processKey(e.key);
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [disabled, state.finished, processKey]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Hidden textarea for mobile and accessibility */}
      <textarea
        ref={inputRef}
        disabled={disabled || state.finished}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: 1,
          height: 1,
          top: 0,
          left: 0,
          zIndex: -1,
        }}
        aria-label="Typing input"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* Clickable text area */}
      <div
        onClick={focusInput}
        style={{
          cursor: disabled || state.finished ? 'default' : 'text',
          padding: '28px',
          background: 'var(--bg-elevated)',
          border: `1px solid ${disabled ? 'var(--border-subtle)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-lg)',
          minHeight: 160,
          position: 'relative',
          boxShadow: disabled ? 'none' : '0 0 20px rgba(124, 58, 237, 0.08)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        <TypingText text={text} position={state.position} errors={state.errors} />

        {disabled && !state.finished && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(245, 244, 255, 0.80)',
            backdropFilter: 'blur(4px)',
            borderRadius: 'var(--radius-lg)',
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--text-muted)',
          }}>
            Waiting for game to start...
          </div>
        )}

        {state.finished && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(245, 244, 255, 0.90)',
            backdropFilter: 'blur(6px)',
            borderRadius: 'var(--radius-lg)',
            animation: 'fade-in 0.3s ease',
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-success)' }}>FINISHED!</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
              {state.wpm} WPM · {state.accuracy.toFixed(1)}% accuracy
            </div>
          </div>
        )}
      </div>

      {/* Live stats bar */}
      <div style={{
        display: 'flex',
        gap: 24,
        padding: '12px 16px',
        background: 'var(--bg-surface)',
        borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
        borderTop: '1px solid var(--border-subtle)',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--accent-cyan-light)' }}>
            {state.wpm}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>WPM</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--color-success)' }}>
            {state.accuracy.toFixed(1)}%
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>ACCURACY</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="progress-bar-track" style={{ flex: 1 }}>
            <div className="progress-bar-fill" style={{ width: `${state.progress}%` }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', minWidth: 36, textAlign: 'right' }}>
            {state.progress}%
          </span>
        </div>
      </div>
    </div>
  );
}
