import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Scenario } from '../types';
import { login as apiLogin, logout as apiLogout, signup as apiSignup, getCurrentUser } from '../api';

export function useAuth(
  currentUser: User | null,
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>,
  scenarios: Scenario[],
  setScenarios: React.Dispatch<React.SetStateAction<Scenario[]>>,
  setActiveScenarioId: React.Dispatch<React.SetStateAction<number>>,
  setLastSavedState: React.Dispatch<React.SetStateAction<string>>,
  setLoadedValuationId: React.Dispatch<React.SetStateAction<string | null>>,
  handleLoadValuation: (valuationId: string) => Promise<void>,
  loadInitialScenarios: () => Scenario[]
) {
  const [pendingLoginUser, setPendingLoginUser] = useState<User | null>(null);
  
  // Snapshot of scenarios at login time — used to restore on logout
  const guestScenariosBeforeLoginRef = useRef<Scenario[]>([]);

  // Restore persistent login 
  useEffect(() => {
    getCurrentUser().then(user => {
      if (user) {
        setCurrentUser(user);
        // If they had a last active valuation, load it
        if (user.lastActiveValuationId) {
          handleLoadValuation(user.lastActiveValuationId);
        }
      }
    }).catch(err => console.error("Failed to load session", err));
  }, [handleLoadValuation, setCurrentUser]);

  const handleLogin = useCallback(async (email: string, pass: string, onRequiresRetainPrompt: () => void) => {
    const user = await apiLogin(email, pass);
    if (user) {
      guestScenariosBeforeLoginRef.current = scenarios;
      setCurrentUser(user);

      // Check if they had guest data worth offering to save
      const guestData = localStorage.getItem('fairvalue_scenarios');
      if (guestData) {
        setPendingLoginUser(user);
        onRequiresRetainPrompt();
      } else {
        if (user.lastActiveValuationId) {
          handleLoadValuation(user.lastActiveValuationId);
        }
      }
      return user;
    }
    return null;
  }, [handleLoadValuation, scenarios, setCurrentUser]);

  const handleSignup = useCallback(async (email: string, pass: string, username: string, onRequiresRetainPrompt: () => void) => {
    const user = await apiSignup(email, pass, username);
    guestScenariosBeforeLoginRef.current = scenarios;
    setCurrentUser(user);

    const guestData = localStorage.getItem('fairvalue_scenarios');
    if (guestData) {
      setPendingLoginUser(user);
      onRequiresRetainPrompt();
    }
    return user;
  }, [scenarios, setCurrentUser]);

  const handleLogout = useCallback(async () => {
    await apiLogout();
    const snapshot = guestScenariosBeforeLoginRef.current;
    const restoredScenarios = snapshot.length > 0 ? snapshot : loadInitialScenarios();
    setScenarios(restoredScenarios);
    setActiveScenarioId(restoredScenarios[0]?.id || 0);
    setLastSavedState(JSON.stringify(restoredScenarios));
    setLoadedValuationId(null);
    setCurrentUser(null);
    guestScenariosBeforeLoginRef.current = []; // reset for next login
  }, [loadInitialScenarios, setScenarios, setActiveScenarioId, setLastSavedState, setLoadedValuationId, setCurrentUser]);

  return {
    pendingLoginUser,
    setPendingLoginUser,
    handleLogin,
    handleSignup,
    handleLogout
  };
}
