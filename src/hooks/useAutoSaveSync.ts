import { useEffect } from 'react';
import { updateValuation } from '../api';
import { User, ValuationMetadata } from '../types';

export function useAutoSaveSync(
  loadedValuationId: string | null,
  currentUser: User | null,
  userValuations: ValuationMetadata[],
  currentCleaned: string,
  isDirty: boolean,
  setLastSavedState: React.Dispatch<React.SetStateAction<string>>,
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>,
  onSaveSuccess?: () => void,
  onSaveError?: () => void
) {
  useEffect(() => {
    if (!isDirty || !loadedValuationId || !currentUser) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        const valName = userValuations.find(v => v.id === loadedValuationId)?.valuationName || 'valuation';
        const cleaned = JSON.parse(currentCleaned);
        await updateValuation(loadedValuationId, valName, cleaned);
        setLastSavedState(currentCleaned);
        onSaveSuccess?.();
      } catch (e) {
        console.error("Auto-save failed:", e);
        onSaveError?.();
      } finally {
        setIsSaving(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isDirty, currentCleaned, loadedValuationId, currentUser, userValuations, setLastSavedState, setIsSaving]);
}
