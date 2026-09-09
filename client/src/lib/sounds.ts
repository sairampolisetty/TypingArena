/**
 * TypingArena Sound Effects — Web Audio API
 * Generates all sounds programmatically; no audio files required.
 * All functions are safe to call even if AudioContext is blocked.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx || ctx.state === 'closed') {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return ctx;
  } catch {
    return null;
  }
}

function resume(): Promise<void> {
  const c = getCtx();
  if (!c) return Promise.resolve();
  if (c.state === 'suspended') return c.resume();
  return Promise.resolve();
}

/** Play a short sine-wave beep */
function beep(freq: number, duration: number, volume = 0.35, type: OscillatorType = 'sine', delay = 0) {
  const c = getCtx();
  if (!c) return;
  resume().then(() => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + delay);

    gain.gain.setValueAtTime(0, c.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, c.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);

    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + duration + 0.05);
  });
}

/**
 * Countdown beep — different pitch per count.
 * 3 → low, 2 → mid, 1 → high, 0 → GO! fanfare
 */
export function playCountdownBeep(count: number) {
  const freqs: Record<number, number> = { 3: 440, 2: 523, 1: 659, 0: 880 };
  const freq = freqs[count] ?? 440;
  if (count === 0) {
    // GO! — ascending triplet
    beep(659, 0.12, 0.4, 'sine', 0);
    beep(784, 0.12, 0.4, 'sine', 0.12);
    beep(1047, 0.25, 0.5, 'sine', 0.24);
  } else {
    beep(freq, 0.18, 0.3, 'sine');
  }
}

/**
 * Played when the user personally finishes typing.
 * A rising two-note chime.
 */
export function playPersonalFinish() {
  beep(523, 0.15, 0.4, 'sine', 0);
  beep(784, 0.2, 0.5, 'sine', 0.14);
  beep(1047, 0.35, 0.55, 'sine', 0.28);
}

/**
 * Full finish fanfare — plays when the tournament ends.
 * A satisfying ascending arpeggio + sustain.
 */
export function playFinishFanfare() {
  // Chord notes over time
  const notes = [
    { freq: 523.25, delay: 0,    dur: 0.35 },   // C5
    { freq: 659.25, delay: 0.1,  dur: 0.35 },   // E5
    { freq: 783.99, delay: 0.2,  dur: 0.35 },   // G5
    { freq: 1046.5, delay: 0.32, dur: 0.55 },   // C6
    { freq: 1318.5, delay: 0.5,  dur: 0.7,  vol: 0.35 },  // E6
    { freq: 1046.5, delay: 0.65, dur: 0.5 },    // C6 echo
    { freq: 783.99, delay: 0.75, dur: 0.4 },    // G5 echo
  ];
  notes.forEach(n => beep(n.freq, n.dur, n.vol ?? 0.3, 'sine', n.delay));

  // Add a warm low note underneath
  beep(261.63, 0.8, 0.2, 'triangle', 0.1);  // C4
}

/**
 * Rank-up chime — short positive ding.
 */
export function playRankUp() {
  beep(880, 0.1, 0.3, 'sine', 0);
  beep(1047, 0.18, 0.35, 'sine', 0.08);
}

/** Ensure the AudioContext is unlocked (call on first user interaction). */
export function unlockAudio() {
  resume();
}
