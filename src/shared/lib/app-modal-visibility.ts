const modals = new Set<symbol>();
const listeners = new Set<() => void>();

export function hasVisibleAppModal() { return modals.size > 0; }

/** A native app-owned dialog can take window focus without backgrounding the app. */
export function registerAppModal() {
  const id = Symbol();
  modals.add(id);
  listeners.forEach((listener) => listener());
  return () => {
    modals.delete(id);
    listeners.forEach((listener) => listener());
  };
}

export function subscribeAppModals(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
