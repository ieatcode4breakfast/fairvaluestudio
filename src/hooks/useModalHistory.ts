import { useEffect, useRef } from 'react';

/**
 * Hook to handle mobile back button closing modals.
 * It pushes a state to history when the modal opens and closes it on popstate.
 * 
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Function to call to close the modal
 * @param modalName - Unique identifier for this modal in history state
 */
export function useModalHistory(isOpen: boolean, onClose: () => void, modalName: string) {
  const isPopStateRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    // Push a new state when the modal opens
    window.history.pushState({ modal: modalName }, '');

    const handlePopState = () => {
      // If the current state is no longer this modal, close it
      if (window.history.state?.modal !== modalName) {
        isPopStateRef.current = true;
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      
      // If closed by something other than back button (e.g. Cancel button),
      // we should remove the state we pushed to keep history clean
      if (!isPopStateRef.current) {
        if (window.history.state?.modal === modalName) {
          window.history.back();
        }
      }
      isPopStateRef.current = false;
    };
  }, [isOpen, onClose, modalName]);
}
