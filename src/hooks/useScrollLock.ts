import { useEffect } from 'react';

/**
 * Global counter to handle nested or simultaneous modals.
 * Only unlocks scroll when the last modal is closed.
 */
let lockCount = 0;

/**
 * Hook to lock the body scroll when a component (like a modal) is mounted.
 * @param lock - Boolean to trigger the lock (e.g., the 'show' state)
 */
export function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (!lock) return;

    lockCount++;
    if (lockCount === 1) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.style.overflow = '';
      }
    };
  }, [lock]);
}
