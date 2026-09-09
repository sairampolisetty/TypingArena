// Standard WPM formula: (correct characters / 5) / elapsed minutes
// • "5" is the universal word-length standard used by Monkeytype, TypeRacer, 10FastFingers, etc.
// • Timer starts on first keypress — idle wait time is excluded
// • Min 1-second guard prevents absurd values on the very first character
export function calculateWPM(correctChars: number, elapsedMs: number): number {
  if (correctChars <= 0) return 0;
  const ms = Math.max(elapsedMs, 1000); // enforce minimum 1 second to avoid huge spikes
  const minutes = ms / 60000;
  return Math.round(correctChars / 5 / minutes);
}

export function calculateAccuracy(correctChars: number, totalTyped: number): number {
  if (totalTyped === 0) return 100;
  return Math.round((correctChars / totalTyped) * 1000) / 10;
}

export function calculateProgress(position: number, totalLength: number): number {
  if (totalLength === 0) return 0;
  return Math.min(100, Math.round((position / totalLength) * 100));
}

export function formatTime(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatTimeSeconds(seconds: number): string {
  return formatTime(seconds * 1000);
}

export function getInitials(nickname: string): string {
  return nickname
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function getRankEmoji(rank: number | null): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  if (rank === null) return '—';
  return `#${rank}`;
}

export function getAvatarColor(nickname: string): string {
  const colors = [
    'linear-gradient(135deg, #7c3aed, #4f46e5)',
    'linear-gradient(135deg, #06b6d4, #4f46e5)',
    'linear-gradient(135deg, #10b981, #06b6d4)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #ec4899, #7c3aed)',
    'linear-gradient(135deg, #3b82f6, #06b6d4)',
    'linear-gradient(135deg, #8b5cf6, #ec4899)',
    'linear-gradient(135deg, #059669, #3b82f6)',
  ];
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  // Fallback
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const success = document.execCommand('copy');
  document.body.removeChild(textarea);
  return Promise.resolve(success);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function difficultyLabel(d: string): string {
  const map: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
  return map[d] || d;
}
