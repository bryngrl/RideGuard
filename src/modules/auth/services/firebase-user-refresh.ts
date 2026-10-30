import type { User } from "firebase/auth";

const refreshes = new WeakMap<User, Promise<void>>();

/** Share a concurrent server refresh, without caching verification afterward. */
export function refreshFirebaseUser(user: User): Promise<void> {
  const existing = refreshes.get(user);
  if (existing) return existing;
  const pending = user.reload();
  refreshes.set(user, pending);
  void pending.finally(() => refreshes.delete(user)).catch(() => undefined);
  return pending;
}
