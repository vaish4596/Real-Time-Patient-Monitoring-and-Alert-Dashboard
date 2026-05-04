/** Alert clip: `public/audio.mp3` (multi-tone pattern, ~1.4s). */
const ALERT_MP3_PATH = '/audio.mp3';

let audioEl;

function getAlertAudio() {
  if (typeof window === 'undefined') return null;
  if (!audioEl) {
    audioEl = new Audio(ALERT_MP3_PATH);
    audioEl.preload = 'auto';
  }
  return audioEl;
}

/** Fallback ~1.3s three-step tone if MP3 blocked or missing. */
function playOscillatorFallback() {
  try {
    const ctx = new AudioContext();
    const playTone = (freq, startMs, durationMs, vol) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = vol;
      const t0 = ctx.currentTime + startMs / 1000;
      osc.start(t0);
      osc.stop(t0 + durationMs / 1000);
    };
    playTone(880, 30, 400, 0.09);
    playTone(1040, 470, 400, 0.09);
    playTone(880, 930, 520, 0.095);
    setTimeout(() => {
      ctx.close();
    }, 1600);
  } catch {
    /* autoplay or AudioContext blocked */
  }
}

let lastAlertSoundAt = 0;
const ALERT_SOUND_GAP_MS = 450;

export function playRiskAlertSoundDebounced(opts) {
  const now = Date.now();
  if (now - lastAlertSoundAt < ALERT_SOUND_GAP_MS) return;
  lastAlertSoundAt = now;
  playRiskAlertSound(opts);
}

export function playRiskAlertSound({ severity = 'MEDIUM' } = {}) {
  const volume =
    severity === 'CRITICAL' ? 1 : severity === 'HIGH' ? 0.9 : severity === 'MEDIUM' ? 0.72 : 0.5;

  const audio = getAlertAudio();
  if (!audio) {
    playOscillatorFallback();
    return;
  }

  audio.volume = Math.min(1, volume);
  audio.currentTime = 0;
  const p = audio.play();
  if (p && typeof p.catch === 'function') {
    p.catch(() => playOscillatorFallback());
  }
}
