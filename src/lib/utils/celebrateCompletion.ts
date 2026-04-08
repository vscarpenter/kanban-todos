import { toast } from 'sonner';
import type { CreateTypes } from 'canvas-confetti';
import { useSettingsStore } from '@/lib/stores/settingsStore';

/**
 * Fires a confetti burst + toast when a task is completed.
 *
 * Why: purely-visual reward lives at the UI layer so the store stays side-effect free.
 * canvas-confetti is loaded on-demand to keep it out of the initial bundle, matching
 * the project's lazy-loading pattern for non-critical UI deps.
 *
 * CSP note: the default `confetti()` export spawns a Web Worker from a blob: URL, which
 * is blocked by our production CSP (`script-src 'self' 'unsafe-inline'`, no `worker-src`).
 * We use `confetti.create(canvas, { useWorker: false })` against an overlay canvas we own,
 * so the animation runs on the main thread and never hits worker/blob policy.
 */
let confettiInstance: CreateTypes | null = null;

async function getConfetti(): Promise<CreateTypes | null> {
  if (confettiInstance) return confettiInstance;
  if (typeof document === 'undefined') return null;

  const { default: confetti } = await import('canvas-confetti');

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '9999',
  });
  document.body.appendChild(canvas);

  confettiInstance = confetti.create(canvas, { resize: true, useWorker: false });
  return confettiInstance;
}

export async function celebrateTaskCompletion(taskTitle: string): Promise<void> {
  toast.success('Task completed', {
    description: taskTitle,
  });

  if (shouldSkipMotion()) return;

  try {
    const fire = await getConfetti();
    if (!fire) return;
    fire({
      particleCount: 80,
      spread: 70,
      startVelocity: 35,
      origin: { y: 0.7 },
      disableForReducedMotion: true,
    });
  } catch {
    // Confetti is non-essential — swallow load/runtime failures silently.
  }
}

function shouldSkipMotion(): boolean {
  if (useSettingsStore.getState().settings.accessibility?.reduceMotion) return true;
  if (typeof window === 'undefined') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
