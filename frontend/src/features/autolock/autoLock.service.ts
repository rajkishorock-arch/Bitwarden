import { useCryptoStore } from '../../crypto/key-store';
import { lockVault } from '../../crypto/keyLifecycle';

let autoLockTimerId: number | null = null;
let lastActivityTime = Date.now();
let isListening = false;
let throttleTimer: number | null = null;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'keydown',
  'touchstart',
  'click',
  'scroll',
];

function handleUserActivity(): void {
  if (throttleTimer) return;

  throttleTimer = window.setTimeout(() => {
    throttleTimer = null;
  }, 1000);

  lastActivityTime = Date.now();
  resetAutoLockTimer();
}

export function startAutoLockListener(): void {
  if (isListening || typeof window === 'undefined') return;

  ACTIVITY_EVENTS.forEach((evt) => {
    window.addEventListener(evt, handleUserActivity, { passive: true });
  });

  isListening = true;
  resetAutoLockTimer();
}

export function stopAutoLockListener(): void {
  if (!isListening || typeof window === 'undefined') return;

  ACTIVITY_EVENTS.forEach((evt) => {
    window.removeEventListener(evt, handleUserActivity);
  });

  if (autoLockTimerId !== null) {
    window.clearTimeout(autoLockTimerId);
    autoLockTimerId = null;
  }

  isListening = false;
}

export function resetAutoLockTimer(): void {
  if (autoLockTimerId !== null) {
    window.clearTimeout(autoLockTimerId);
    autoLockTimerId = null;
  }

  const { isUnlocked, autoLockMinutes } = useCryptoStore.getState();

  if (!isUnlocked || autoLockMinutes <= 0) {
    return;
  }

  const timeoutMs = autoLockMinutes * 60 * 1000;

  autoLockTimerId = window.setTimeout(() => {
    const elapsed = Date.now() - lastActivityTime;
    if (elapsed >= timeoutMs) {
      lockVault();
      stopAutoLockListener();
    } else {
      resetAutoLockTimer();
    }
  }, timeoutMs);
}
