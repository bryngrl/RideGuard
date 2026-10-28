type Attempt = { generation: number; uid: string | null };

/** A late claim may finish on the server, but must never move a different screen/account. */
export function createDeviceClaimLifecycle(getOwner: () => string | null) {
  let generation = 0;
  let active = false;
  let busy = false;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const isCurrent = (attempt: Attempt) => active && attempt.generation === generation && attempt.uid === getOwner();
  return {
    activate: () => { active = true; },
    cancel: () => {
      active = false; generation++; busy = false;
      timers.forEach(clearTimeout); timers.clear();
    },
    begin: (uid: string | null): Attempt | null => {
      if (!active || busy || uid !== getOwner()) return null;
      busy = true;
      return { generation: ++generation, uid };
    },
    isCurrent,
    finish: (attempt: Attempt) => { if (isCurrent(attempt)) busy = false; },
    schedule: (attempt: Attempt, work: () => void, delay: number) => {
      if (!isCurrent(attempt)) return;
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (isCurrent(attempt)) work();
      }, delay);
      timers.add(timer);
    },
  };
}
