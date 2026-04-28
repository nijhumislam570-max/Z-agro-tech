import { prefetchRoute } from '@/lib/imageUtils';

type IdleCallback = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void;

const warmedGroups = new Set<string>();

const scheduleIdle = (callback: IdleCallback) => {
  if (typeof window === 'undefined') return;

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout: 1500 });
    return;
  }

  window.setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 0,
    });
  }, 180);
};

export function warmRouteGroup(groupId: string, paths: string[]) {
  if (typeof window === 'undefined') return;
  if (warmedGroups.has(groupId)) return;

  warmedGroups.add(groupId);

  const queue = [...paths];

  const pump = () => {
    const nextPath = queue.shift();
    if (!nextPath) return;

    prefetchRoute(nextPath);

    if (queue.length > 0) {
      scheduleIdle(() => pump());
    }
  };

  scheduleIdle(() => pump());
}
