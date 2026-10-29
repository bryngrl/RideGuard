const listeners = new Set<() => void>();
const lockListeners = new Set<() => void>();

/** Signal activity only; never collect input text, coordinates, codes or PINs. */
export function recordMpinActivity() { listeners.forEach((listener) => listener()); }
export function subscribeMpinActivity(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function notifyMpinLock() { lockListeners.forEach((listener) => listener()); }
export function subscribeMpinLock(listener: () => void) {
  lockListeners.add(listener);
  return () => { lockListeners.delete(listener); };
}
