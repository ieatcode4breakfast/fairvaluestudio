import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Scenario } from './types';
import { createDefaultScenario, cloneScenario } from './utils/scenario';
import { getSampleScenarios } from './utils/sampleScenarios';
import { computeSimple } from './utils/computeSimple';
import { computeAdvanced } from './utils/computeAdvanced';
import { buildSummaryText } from './utils/summary';
import { ScenarioPanel } from './components/ScenarioPanel';
import { ScenarioComparisonTable } from './components/ScenarioComparisonTable';
import { Calculator, PlusIcon, DownloadIcon, UploadIcon, InfoIcon, Check, Copy, RotateCcw } from './components/Icons';
import { MAX_SCENARIOS, TRANSIENT_KEYS } from './utils/constants';
import { genId } from './utils/genId';
import { login, logout, getCurrentUser, signup, getUserValuations, getScenarios, createValuation, updateValuation, deleteValuation, renameValuation, updateLastActiveValuation, updateUsername, updateEmail, updatePassword, supabase } from './api';
import { User, ValuationMetadata } from './types';

const LOCAL_STORAGE_KEY = 'fairvalue_scenarios';

function loadInitialScenarios(): Scenario[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const capped = parsed.slice(0, MAX_SCENARIOS);
        return capped.map(item => {
          const base = createDefaultScenario();
          return {
            ...base,
            ...item,
            // Ensure arrays are copied if they exist in item
            splitYears: Array.isArray(item.splitYears) ? [...item.splitYears] : base.splitYears,
            metricGrowthRates: Array.isArray(item.metricGrowthRates) ? [...item.metricGrowthRates] : base.metricGrowthRates,
            metricGrowthRatesTotal: Array.isArray(item.metricGrowthRatesTotal) ? [...item.metricGrowthRatesTotal] : base.metricGrowthRatesTotal,
            revenueGrowthRates: Array.isArray(item.revenueGrowthRates) ? [...item.revenueGrowthRates] : base.revenueGrowthRates,
            finalMargins: Array.isArray(item.finalMargins) ? [...item.finalMargins] : base.finalMargins,
            sharesGrowthRates: Array.isArray(item.sharesGrowthRates) ? [...item.sharesGrowthRates] : base.sharesGrowthRates,
            // Reset transient UI state
            hoverYear: null,
            draggingIndex: null,
            showResetConfirm: false,
            showYearlyBreakdown: false,
          };
        }) as Scenario[];
      }
    }
  } catch (err) {
    console.error('Failed to load scenarios from local storage:', err);
  }
  return [createDefaultScenario()];
}

export default function App() {
  const [scenarios, setScenarios] = useState<Scenario[]>(loadInitialScenarios);
  const [activeScenarioId, setActiveScenarioId] = useState<number>(() => scenarios[0].id);
  const [draggedTabIndex, setDraggedTabIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropSuccessIndex, setDropSuccessIndex] = useState<number | null>(null);
  const [showReorderToast, setShowReorderToast] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFilename, setDownloadFilename] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showSignupSuccessModal, setShowSignupSuccessModal] = useState(false);
  const [userValuations, setUserValuations] = useState<ValuationMetadata[]>([]);
  const [loadedValuationId, setLoadedValuationId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const [saveSuccessName, setSaveSuccessName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // New features state
  const [lastSavedState, setLastSavedState] = useState<string>(() => JSON.stringify([createDefaultScenario()]));
  const [isRenaming, setIsRenaming] = useState(false);
  const [editValuationName, setEditValuationName] = useState('');
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [showNewValuationModal, setShowNewValuationModal] = useState(false);
  const [newValuationName, setNewValuationName] = useState('My First Valuation');
  const [hasFetchedValuations, setHasFetchedValuations] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showRetainGuestModal, setShowRetainGuestModal] = useState(false);
  const [retainGuestName, setRetainGuestName] = useState('');
  const [pendingLoginUser, setPendingLoginUser] = useState<User | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountUsername, setAccountUsername] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountNewPassword, setAccountNewPassword] = useState('');
  const [accountConfirmPassword, setAccountConfirmPassword] = useState('');
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');
  const [accountSaving, setAccountSaving] = useState(false);
  const ignoreNextSaveRef = useRef(false);
  const loadedValuationRef = useRef<string | null>(null);
  // Snapshot of scenarios at login time — used to restore on logout
  const guestScenariosBeforeLoginRef = useRef<Scenario[]>([]);
  // Flag: after the signup-success modal closes, show the retain-guest-data modal
  const showRetainAfterSuccessRef = useRef(false);

  const currentCleaned = useMemo(() => {
    return JSON.stringify(scenarios.map(sc => {
      const copy: any = { ...sc };
      TRANSIENT_KEYS.forEach(k => delete copy[k]);
      return copy;
    }));
  }, [scenarios]);

  const isDirty = currentCleaned !== lastSavedState;

  // Sync loadedValuationId to backend for user persistence
  useEffect(() => {
    if (loadedValuationRef.current !== loadedValuationId && currentUser) {
      updateLastActiveValuation(currentUser.id, loadedValuationId);
    }
    loadedValuationRef.current = loadedValuationId;
  }, [loadedValuationId, currentUser]);



  // Realtime subscription effect
  useEffect(() => {
    if (!loadedValuationId) return;

    const channel = supabase.channel(`public:valuations:id=eq.${loadedValuationId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'valuations', filter: `id=eq.${loadedValuationId}` },
        async () => {
          try {
            // We just received an update ping. Let's fetch the actual scenarios from the DB
            // to see if another device pushed new data.
            const loadedScenarios = await getScenarios(loadedValuationId);

            if (loadedScenarios && loadedScenarios.length > 0) {
              const capped = loadedScenarios.slice(0, MAX_SCENARIOS);
              const mappedOut = capped.map(item => {
                const base = createDefaultScenario();
                return {
                  ...base,
                  ...item,
                  splitYears: Array.isArray(item.splitYears) ? [...item.splitYears] : base.splitYears,
                  metricGrowthRates: Array.isArray(item.metricGrowthRates) ? [...item.metricGrowthRates] : base.metricGrowthRates,
                  metricGrowthRatesTotal: Array.isArray(item.metricGrowthRatesTotal) ? [...item.metricGrowthRatesTotal] : base.metricGrowthRatesTotal,
                  revenueGrowthRates: Array.isArray(item.revenueGrowthRates) ? [...item.revenueGrowthRates] : base.revenueGrowthRates,
                  finalMargins: Array.isArray(item.finalMargins) ? [...item.finalMargins] : base.finalMargins,
                  sharesGrowthRates: Array.isArray(item.sharesGrowthRates) ? [...item.sharesGrowthRates] : base.sharesGrowthRates,
                  hoverYear: null,
                  draggingIndex: null,
                  showResetConfirm: false,
                  showYearlyBreakdown: false,
                };
              }) as Scenario[];

              const incomingCleaned = JSON.stringify(mappedOut.map(sc => {
                const copy: any = { ...sc };
                TRANSIENT_KEYS.forEach(k => delete copy[k]);
                return copy;
              }));

              // Only apply if the incoming parsed data is structurally different
              if (incomingCleaned !== currentCleaned) {
                ignoreNextSaveRef.current = true;
                setScenarios(mappedOut);
                setLastSavedState(incomingCleaned);
              }
            }
          } catch (error) {
            console.error("Failed to sync realtime changes", error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadedValuationId, currentCleaned]);

  // Auto-save effect
  useEffect(() => {
    if (!isDirty || !loadedValuationId || !currentUser) return;
    if (ignoreNextSaveRef.current) {
      ignoreNextSaveRef.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        const valName = userValuations.find(v => v.id === loadedValuationId)?.valuationName || 'valuation';
        const cleaned = JSON.parse(currentCleaned);
        await updateValuation(loadedValuationId, valName, cleaned);
        setLastSavedState(currentCleaned);
      } catch (e) {
        console.error("Auto-save failed:", e);
      } finally {
        setIsSaving(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isDirty, currentCleaned, loadedValuationId, currentUser, userValuations]);

  // Guest localStorage persistence — write on every scenarios change when not logged in
  useEffect(() => {
    if (currentUser) return; // logged-in users persist via Supabase
    try {
      const cleaned = scenarios.map(sc => {
        const copy: any = { ...sc };
        TRANSIENT_KEYS.forEach(k => delete copy[k]);
        return copy;
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }, [scenarios, currentUser]);

  // Auto-close signup success modal after 3 seconds; then show retain-guest modal if applicable
  useEffect(() => {
    if (showSignupSuccessModal) {
      const timer = setTimeout(() => {
        setShowSignupSuccessModal(false);
        if (showRetainAfterSuccessRef.current) {
          showRetainAfterSuccessRef.current = false;
          setShowRetainGuestModal(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSignupSuccessModal]);

  // Load user valuations when user logs in
  useEffect(() => {
    if (currentUser) {
      getUserValuations(currentUser.id).then(vals => {
        setUserValuations(vals);
        setHasFetchedValuations(true);
      }).catch(err => {
        console.error(err);
        setHasFetchedValuations(true);
      });
    } else {
      setUserValuations([]);
      setHasFetchedValuations(false);
    }
  }, [currentUser]);

  // Force new valuation modal if empty (suppressed while retain-guest or signup-success prompt is active)
  useEffect(() => {
    if (currentUser && hasFetchedValuations && userValuations.length === 0 && !loadedValuationId && !showRetainGuestModal && !showSignupSuccessModal) {
      setNewValuationName('My First Valuation');
      setShowNewValuationModal(true);
    }
  }, [currentUser, hasFetchedValuations, userValuations.length, loadedValuationId, showRetainGuestModal, showSignupSuccessModal]);

  const updateScenario = useCallback((id: number, changes: Partial<Scenario>) => {
    setScenarios(prev => prev.map(sc => {
      if (sc.id !== id) return sc;
      const merged = { ...sc, ...changes } as Scenario;
      if ('years' in changes || 'dcfMethod' in changes) {
        const maxY = merged.dcfMethod === 'Basic DCF' ? 10 : 50;
        if (Number(merged.years) > maxY) merged.years = maxY;
      }
      if ('years' in changes) {
        const valYears = Number(merged.years) || 0;
        merged.splitYears = merged.splitYears.filter(y => y < valYears).sort((a, b) => a - b);
      }
      return merged;
    }));
  }, []);

  const deleteScenario = useCallback((id: number) => {
    const idx = scenarios.findIndex(sc => sc.id === id);
    if (idx === -1) return;
    const next = scenarios.filter(sc => sc.id !== id);
    setScenarios(next);
    if (id === activeScenarioId && next.length > 0) {
      setActiveScenarioId(next[Math.max(0, idx - 1)].id);
    }
  }, [scenarios, activeScenarioId]);

  const addScenario = useCallback(() => {
    if (scenarios.length >= MAX_SCENARIOS) return;
    const activeIndex = scenarios.findIndex(s => s.id === activeScenarioId);
    const src = activeIndex >= 0 ? scenarios[activeIndex] : scenarios[scenarios.length - 1];
    const newSc = cloneScenario(src);
    setScenarios([...scenarios, newSc]);
    setActiveScenarioId(newSc.id);
  }, [scenarios, activeScenarioId]);

  /* ── Download handler ── */
  const executeDownload = useCallback(() => {
    let filename = downloadFilename.trim();
    if (filename === '') {
      filename = `dcf-scenarios-${new Date().toISOString().slice(0, 10)}`;
    }
    if (!filename.toLowerCase().endsWith('.json')) {
      filename += '.json';
    }

    const cleaned = scenarios.map(sc => {
      const copy: any = { ...sc };
      TRANSIENT_KEYS.forEach(k => delete copy[k]);
      return copy;
    });
    const json = JSON.stringify(cleaned, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowDownloadModal(false);
  }, [scenarios, downloadFilename]);

  /* ── Upload handler ── */
  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          setUploadError('Invalid file: not a valid DCF valuation file.');
          setTimeout(() => setUploadError(''), 4000);
          return;
        }
        const capped = parsed.slice(0, MAX_SCENARIOS);
        const loaded = capped.map(item => {
          const base = createDefaultScenario();
          return {
            ...base,
            ...item,
            id: genId(),
            // Ensure arrays are copied if they exist in item
            splitYears: Array.isArray(item.splitYears) ? [...item.splitYears] : base.splitYears,
            metricGrowthRates: Array.isArray(item.metricGrowthRates) ? [...item.metricGrowthRates] : base.metricGrowthRates,
            metricGrowthRatesTotal: Array.isArray(item.metricGrowthRatesTotal) ? [...item.metricGrowthRatesTotal] : base.metricGrowthRatesTotal,
            revenueGrowthRates: Array.isArray(item.revenueGrowthRates) ? [...item.revenueGrowthRates] : base.revenueGrowthRates,
            finalMargins: Array.isArray(item.finalMargins) ? [...item.finalMargins] : base.finalMargins,
            sharesGrowthRates: Array.isArray(item.sharesGrowthRates) ? [...item.sharesGrowthRates] : base.sharesGrowthRates,
            // Reset transient UI state
            hoverYear: null,
            draggingIndex: null,
            showResetConfirm: false,
            showYearlyBreakdown: false,
          };
        }) as Scenario[];

        if (currentUser) {
          // Logged-in: create a brand-new valuation named after the file
          const valName = file.name.replace(/\.json$/i, '');
          try {
            setIsSaving(true);
            const newId = await createValuation(currentUser.id, valName, loaded);
            setUserValuations(prev => [...prev, { id: newId, valuationName: valName }]);
            setScenarios(loaded);
            setActiveScenarioId(loaded[0].id);
            setLoadedValuationId(newId);
            const cleaned = loaded.map(sc => {
              const copy: any = { ...sc };
              TRANSIENT_KEYS.forEach(k => delete copy[k]);
              return copy;
            });
            setLastSavedState(JSON.stringify(cleaned));
            setUploadError('');
          } catch (err) {
            setUploadError('Failed to create valuation from file.');
            setTimeout(() => setUploadError(''), 4000);
          } finally {
            setIsSaving(false);
          }
        } else {
          // Guest: replace scenarios in place
          setScenarios(loaded);
          setActiveScenarioId(loaded[0].id);
          setUploadError('');
        }
      } catch (err) {
        setUploadError('Could not read file. Make sure it is a valid JSON file.');
        setTimeout(() => setUploadError(''), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [currentUser]);

  const allResults = useMemo(() =>
    scenarios.map(sc => sc.dcfMethod === 'Basic DCF' ? computeSimple(sc) : computeAdvanced(sc)),
    [scenarios]
  );

  const combinedSummary = useMemo(() =>
    scenarios.map((sc, i) => buildSummaryText(sc, allResults[i], i)).join('\n'),
    [scenarios, allResults]
  );

  const activeScenario = scenarios.find(sc => sc.id === activeScenarioId) || scenarios[0];
  const activeIndex = scenarios.findIndex(sc => sc.id === activeScenarioId);
  const activeResults = allResults[activeIndex] || allResults[0];

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
    setDraggedTabIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }

    if (draggedTabIndex === null || !tabsContainerRef.current) return;

    const container = tabsContainerRef.current;
    const tabElements = Array.from(container.querySelectorAll('button[data-tab-index]')) as HTMLButtonElement[];

    let closestIndex = dragOverIndex;
    let minDistance = Number.POSITIVE_INFINITY;

    tabElements.forEach((tab) => {
      const indexAttr = tab.getAttribute('data-tab-index');
      if (!indexAttr) return;

      const index = parseInt(indexAttr, 10);
      const rect = tab.getBoundingClientRect();
      const tabCenter = rect.left + rect.width / 2;
      const distance = Math.abs(e.clientX - tabCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== null && closestIndex !== dragOverIndex) {
      setDragOverIndex(closestIndex);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedTabIndex === null || dragOverIndex === null || draggedTabIndex === dragOverIndex) {
      setDragOverIndex(null);
      setDraggedTabIndex(null);
      return;
    }

    const newScenarios = [...scenarios];
    const draggedItem = newScenarios[draggedTabIndex];
    newScenarios.splice(draggedTabIndex, 1);
    newScenarios.splice(dragOverIndex, 0, draggedItem);

    setScenarios(newScenarios);
    setDraggedTabIndex(null);
    setDragOverIndex(null);

    // Show success feedback on the moved tab
    setDropSuccessIndex(dragOverIndex);
    setTimeout(() => setDropSuccessIndex(null), 800);

    // Show reorder confirmation toast
    setShowReorderToast(true);
    setTimeout(() => setShowReorderToast(false), 2000);
  };

  const handleDragEnd = () => {
    setDraggedTabIndex(null);
    setDragOverIndex(null);
    setDropSuccessIndex(null);
    setShowReorderToast(false);
  };

  const handleLoadValuation = useCallback(async (valuationId: string) => {
    try {
      const loadedScenarios = await getScenarios(valuationId);

      const capped = loadedScenarios.slice(0, MAX_SCENARIOS);
      const loaded = capped.map(item => {
        const base = createDefaultScenario();
        return {
          ...base,
          ...item,
          id: genId(),
          splitYears: Array.isArray(item.splitYears) ? [...item.splitYears] : base.splitYears,
          metricGrowthRates: Array.isArray(item.metricGrowthRates) ? [...item.metricGrowthRates] : base.metricGrowthRates,
          metricGrowthRatesTotal: Array.isArray(item.metricGrowthRatesTotal) ? [...item.metricGrowthRatesTotal] : base.metricGrowthRatesTotal,
          revenueGrowthRates: Array.isArray(item.revenueGrowthRates) ? [...item.revenueGrowthRates] : base.revenueGrowthRates,
          finalMargins: Array.isArray(item.finalMargins) ? [...item.finalMargins] : base.finalMargins,
          sharesGrowthRates: Array.isArray(item.sharesGrowthRates) ? [...item.sharesGrowthRates] : base.sharesGrowthRates,
          hoverYear: null,
          draggingIndex: null,
          showResetConfirm: false,
          showYearlyBreakdown: false,
        };
      }) as Scenario[];
      setScenarios(loaded);
      setActiveScenarioId(loaded[0].id);
      setLoadedValuationId(valuationId);

      const cleaned = loaded.map(sc => {
        const copy: any = { ...sc };
        TRANSIENT_KEYS.forEach(k => delete copy[k]);
        return copy;
      });
      setLastSavedState(JSON.stringify(cleaned));
    } catch (error) {
      console.error('Failed to load valuation:', error);
    }
  }, []);

  const handleCreateNewValuation = async (useSample: boolean = false) => {
    if (!currentUser || !newValuationName.trim()) return;
    setIsSaving(true);
    try {
      const newScenarios = useSample ? getSampleScenarios() : [createDefaultScenario()];
      const newId = await createValuation(currentUser.id, newValuationName.trim(), newScenarios);

      setUserValuations(prev => [...prev, { id: newId, valuationName: newValuationName.trim() }]);
      setShowNewValuationModal(false);
      handleLoadValuation(newId);
    } catch (e) {
      console.error('Failed to create new valuation', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSampleValuation = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const newScenarios = getSampleScenarios();
      const newId = await createValuation(currentUser.id, "Sample Valuation", newScenarios);

      setUserValuations(prev => [...prev, { id: newId, valuationName: "Sample Valuation" }]);
      handleLoadValuation(newId);
    } catch (e) {
      console.error('Failed to create sample valuation', e);
    } finally {
      setIsSaving(false);
    }
  };

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
  }, [handleLoadValuation]);

  const handleLogin = useCallback(async () => {
    try {
      const user = await login(loginEmail, loginPassword);
      if (user) {
        // Snapshot guest scenarios BEFORE any auth state changes
        guestScenariosBeforeLoginRef.current = scenarios;

        setCurrentUser(user);
        setShowLoginModal(false);
        setLoginEmail('');
        setLoginPassword('');
        setLoginError('');

        // Check if they had guest data worth offering to save
        const guestData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (guestData) {
          // Hold off loading their last active valuation — show retain prompt first
          setPendingLoginUser(user);
          setRetainGuestName('My Valuation');
          setShowRetainGuestModal(true);
        } else {
          // No guest data — proceed normally
          if (user.lastActiveValuationId) {
            handleLoadValuation(user.lastActiveValuationId);
          }
        }
      } else {
        setLoginError('Invalid email or password');
      }
    } catch (error) {
      setLoginError('Login failed: ' + (error as Error).message);
    }
  }, [loginEmail, loginPassword, handleLoadValuation, scenarios]);

  const handleRetainGuestData = useCallback(async (retain: boolean) => {
    setShowRetainGuestModal(false);
    const user = pendingLoginUser || currentUser;
    setPendingLoginUser(null);
    if (!user) return;

    if (retain && retainGuestName.trim()) {
      setIsSaving(true);
      try {
        const cleaned = scenarios.map(sc => {
          const copy: any = { ...sc };
          TRANSIENT_KEYS.forEach(k => delete copy[k]);
          return copy;
        });
        const newId = await createValuation(user.id, retainGuestName.trim(), cleaned);
        setUserValuations(prev => [...prev, { id: newId, valuationName: retainGuestName.trim() }]);
        setLoadedValuationId(newId);
        setLastSavedState(JSON.stringify(cleaned));
        // Keep localStorage intact — it serves as the restore point on logout
      } catch (e) {
        console.error('Failed to save guest data as valuation:', e);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Discard = don't save to account. Guest data in ref + localStorage is left intact.
      if (user.lastActiveValuationId) {
        handleLoadValuation(user.lastActiveValuationId);
      } else if (hasFetchedValuations && userValuations.length === 0) {
        // Brand-new user with no valuations — explicitly open the new-valuation modal.
        // The force-new useEffect is also a safety net if the fetch hasn't resolved yet.
        setNewValuationName('My First Valuation');
        setShowNewValuationModal(true);
      }
    }
  }, [pendingLoginUser, currentUser, retainGuestName, scenarios, handleLoadValuation, hasFetchedValuations, userValuations]);

  const handleSignup = useCallback(async () => {
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }
    try {
      const user = await signup(signupEmail, signupPassword, signupUsername);
      // Snapshot guest scenarios before auth state changes (for logout restoration)
      guestScenariosBeforeLoginRef.current = scenarios;
      setCurrentUser(user);
      setShowLoginModal(false);
      setSignupEmail('');
      setSignupUsername('');
      setSignupPassword('');
      setSignupConfirmPassword('');
      setSignupError('');
      setActiveTab('login');

      // If they had pre-login guest data, queue the retain prompt for after the success modal
      const guestData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (guestData) {
        setPendingLoginUser(user);
        setRetainGuestName('My Valuation');
        showRetainAfterSuccessRef.current = true;
      }

      setShowSignupSuccessModal(true);
    } catch (error) {
      setSignupError('Signup failed: ' + (error as Error).message);
    }
  }, [signupEmail, signupUsername, signupPassword, signupConfirmPassword, scenarios]);

  const handleLogout = useCallback(async () => {
    await logout();
    // Restore the in-memory guest snapshot taken at login time.
    // Falling back to loadInitialScenarios() only if the snapshot was never set
    // (e.g. page was refreshed while logged in).
    const snapshot = guestScenariosBeforeLoginRef.current;
    const restoredScenarios = snapshot.length > 0 ? snapshot : loadInitialScenarios();
    setScenarios(restoredScenarios);
    setActiveScenarioId(restoredScenarios[0].id);
    setLastSavedState(JSON.stringify(restoredScenarios));
    setLoadedValuationId(null);
    setCurrentUser(null);
    guestScenariosBeforeLoginRef.current = []; // reset for next login
  }, []);



  const handleSaveAsNew = useCallback(async () => {
    if (!currentUser || !saveAsName.trim()) return;

    setIsSaving(true);
    setShowSaveAsModal(false);

    try {
      const cleaned = scenarios.map(sc => {
        const copy: any = { ...sc };
        TRANSIENT_KEYS.forEach(k => delete copy[k]);
        return copy;
      });
      const newId = await createValuation(currentUser.id, saveAsName.trim(), cleaned);

      setLastSavedState(JSON.stringify(cleaned));
      setLoadedValuationId(newId);

      const updatedValuations = await getUserValuations(currentUser.id);
      setUserValuations(updatedValuations);

      setSaveSuccessName(saveAsName.trim());
      setSaveAsName('');

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to save valuation as new:', error);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setIsSaving(false);
      setShowSaveSuccessModal(true);
      window.setTimeout(() => setShowSaveSuccessModal(false), 2000);
    }
  }, [scenarios, currentUser, saveAsName]);

  const handleRenameValuation = async () => {
    if (!loadedValuationId || !editValuationName.trim()) {
      setIsRenaming(false);
      return;
    }
    try {
      await renameValuation(loadedValuationId, editValuationName.trim());
      setUserValuations(prev => prev.map(v => v.id === loadedValuationId ? { ...v, valuationName: editValuationName.trim() } : v));
      setIsRenaming(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseValuation = () => {
    const defaultScenario = createDefaultScenario();
    setScenarios([defaultScenario]);
    setActiveScenarioId(defaultScenario.id);
    setLoadedValuationId(null);
    setLastSavedState(JSON.stringify([defaultScenario]));
  };

  const handleDeleteValuation = useCallback(async () => {
    if (!currentUser || !loadedValuationId) return;

    try {
      const deletedIndex = userValuations.findIndex(v => v.id === loadedValuationId);

      await deleteValuation(loadedValuationId);
      const remaining = userValuations.filter(val => val.id !== loadedValuationId);
      setUserValuations(remaining);
      setShowDeleteModal(false);

      if (remaining.length > 0) {
        // Load the one above, falling back to the new first if it was at the top
        const nextIndex = Math.max(0, deletedIndex - 1);
        handleLoadValuation(remaining[nextIndex].id);
      } else {
        // No valuations left — reset to blank (force-new modal will fire)
        handleCloseValuation();
      }
    } catch (error) {
      console.error('Failed to delete valuation:', error);
    }
  }, [currentUser, loadedValuationId, userValuations, handleLoadValuation]);

  const duplicateScenario = useCallback((id: number) => {
    const srcIndex = scenarios.findIndex(sc => sc.id === id);
    if (srcIndex === -1 || scenarios.length >= MAX_SCENARIOS) return;
    const newSc = cloneScenario(scenarios[srcIndex]);
    newSc.id = genId();
    newSc.scenarioName = `${newSc.scenarioName || 'Untitled'} (Copy)`;
    const copyScenarios = [...scenarios];
    copyScenarios.splice(srcIndex + 1, 0, newSc);
    setScenarios(copyScenarios);
    setActiveScenarioId(newSc.id);
  }, [scenarios]);

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="min-h-screen bg-[#f5f5f5] text-slate-900 p-4 md:p-8"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className={`max-w-7xl mx-auto space-y-6 ${showSaveSuccessModal ? 'pointer-events-none select-none' : ''}`}>

        <header className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Calculator className="w-14 h-14 text-indigo-600 shrink-0" />
              <div className="flex flex-col justify-center">
                <h1 className="text-3xl font-light tracking-tight mb-1">
                  FairValue Studio
                </h1>
                <p className="text-slate-500 text-sm">
                  A multi-scenario valuation tool featuring basic DCF calculation and advanced, multi-phase growth forecasting.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentUser ? (
                <div className="text-right">
                  <button
                    onClick={() => {
                      setAccountUsername(currentUser.username);
                      setAccountEmail(currentUser.email);
                      setAccountNewPassword('');
                      setAccountConfirmPassword('');
                      setAccountError('');
                      setAccountSuccess('');
                      setShowAccountModal(true);
                    }}
                    className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    Hi, {currentUser.username}!
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setShowLoginModal(true); setActiveTab('login'); }}
                  className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                >
                  Log in
                </button>
              )}
            </div>
          </div>
          <div className="text-slate-600 text-sm leading-relaxed bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <p className="font-semibold mb-2 text-slate-800">How to use:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 mb-4">
              <li><strong>Choose a Method:</strong> Select "Basic DCF" for a quick estimate or "Advanced DCF" for detailed, multi-phase growth projections.</li>
              <li><strong>Configure Phases (Advanced):</strong> Click the timeline track to add growth phases. Drag the dots to adjust the years, or double-click/tap to remove them.</li>
              <li><strong>Enter Assumptions:</strong> Fill in your estimates for cash flows, growth rates, margins, and discount rates.</li>
              <li><strong>Compare Scenarios:</strong> Use the tabs to create and compare up to 10 different scenarios.</li>
              <li><strong>Save & Load:</strong> Use the Download and Upload buttons to save your scenarios to a file and load them later.</li>
              <li><strong>Text Summary Pro Tip:</strong> After finishing your inputs, copy the text summary at the bottom and paste into an AI chatbot for deeper analysis, sanity checks, or qualitative insights.</li>
            </ul>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => {
                  if (currentUser) {
                    handleCreateSampleValuation();
                  } else {
                    setShowSampleModal(true);
                  }
                }}
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors border border-indigo-200 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Load Sample Valuation'}
              </button>
            </div>
          </div>
        </header>

        {/* Load Valuation Dropdown */}
        {currentUser && (
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div className="flex flex-col gap-2 px-1 min-w-[280px]">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                Load Valuation
                {loadedValuationId && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                    {isSaving ? 'Saving...' : 'Saved'}
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                <select
                  value={loadedValuationId ?? 'NEW'}
                  onChange={(e) => {
                    if (e.target.value === 'NEW') {
                      setNewValuationName('New Valuation');
                      setShowNewValuationModal(true);
                      // Explicitly reset the select value by not updating loadedValuationId
                    } else if (e.target.value) {
                      handleLoadValuation(e.target.value);
                    }
                  }}
                  className="flex-1 w-full min-w-[200px] px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-sm"
                >
                  <option value="NEW" className="font-semibold text-indigo-600">✨ New valuation...</option>
                  {userValuations.length > 0 && <option disabled>──────────</option>}
                  {userValuations.map((val) => (
                    <option key={val.id} value={val.id}>
                      {val.valuationName}
                    </option>
                  ))}
                </select>
                {loadedValuationId && (
                  <button
                    onClick={() => { setEditValuationName(userValuations.find(v => v.id === loadedValuationId)?.valuationName || ''); setIsRenaming(true); }}
                    className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"
                    title="Rename Valuation"
                  >
                    Rename
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSaveAsModal(true)}
                className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors shadow-sm"
              >
                Save As New
              </button>
              {loadedValuationId && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Tab Bar + Download/Upload ── */}
        <div className="flex items-end justify-between gap-3">

          {/* Left: scenario tabs + add button */}
          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold text-slate-700 px-1">Scenarios</div>
            <div
              ref={tabsContainerRef}
              className="flex items-center gap-2 overflow-x-auto overflow-y-hidden pb-1 min-w-0 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {scenarios.map((sc, index) => {
                const isActive = sc.id === activeScenarioId;
                const isDragged = draggedTabIndex === index;
                const isDropSuccess = dropSuccessIndex === index;
                const tooltipText = sc.scenarioName ? sc.scenarioName : "Untitled";

                // This logic calculates the shifting animation
                let shiftClass = "";
                if (draggedTabIndex !== null && dragOverIndex !== null && !isDragged) {
                  if (index >= dragOverIndex && index < draggedTabIndex) shiftClass = "translate-x-4";
                  if (index <= dragOverIndex && index > draggedTabIndex) shiftClass = "-translate-x-4";
                }

                return (
                  <button
                    key={sc.id}
                    data-tab-index={String(index)}
                    title={tooltipText}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setActiveScenarioId(sc.id)}
                    className={`flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-xl text-sm font-medium transition-all duration-200 border cursor-grab active:cursor-grabbing ${shiftClass} ${isActive
                      ? 'bg-white text-indigo-600 border-indigo-200 shadow-sm'
                      : 'bg-slate-200/60 text-slate-500 border-transparent hover:bg-white hover:text-slate-700 hover:border-slate-200'
                      } ${isDragged ? 'opacity-20 scale-75 border-dashed border-indigo-300' : 'opacity-100'} ${isDropSuccess ? 'bg-green-100 border-green-300 text-green-700 shadow-md scale-110' : ''}`}
                  >
                    {index + 1}
                  </button>
                );
              })}

              {scenarios.length < MAX_SCENARIOS && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="relative tab-add-btn">
                    <button
                      onClick={addScenario}
                      className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-200/60 hover:bg-white hover:border-slate-200 border border-transparent text-slate-400 hover:text-indigo-600 transition-all"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                    <div className="tab-tooltip absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                      Add Scenario
                    </div>
                  </div>
                  <div className="relative tab-add-btn">
                    <button
                      onClick={() => duplicateScenario(activeScenarioId)}
                      className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-200/60 hover:bg-white hover:border-slate-200 border border-transparent text-slate-400 hover:text-indigo-600 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <div className="tab-tooltip absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                      Duplicate Scenario
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: download + upload */}
          <div className="flex items-center gap-2 flex-shrink-0 mb-1">
            <button
              onClick={() => {
                const currentValName = currentUser && loadedValuationId
                  ? userValuations.find(v => v.id === loadedValuationId)?.valuationName || ''
                  : '';
                setDownloadFilename(currentValName || `dcf-scenarios-${new Date().toISOString().slice(0, 10)}`);
                setShowDownloadModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all"
            >
              <DownloadIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Download Valuation (.json)</span>
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border shadow-sm transition-all bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200"
            >
              <UploadIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Upload Valuation (.json)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        </div>

        {/* Upload error message */}
        {uploadError && (
          <div className="animate-in flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <InfoIcon className="w-4 h-4 flex-shrink-0" />
            {uploadError}
          </div>
        )}

        {/* Compare Scenarios Table */}
        <ScenarioComparisonTable scenarios={scenarios} allResults={allResults} />

        {/* Active Scenario Panel */}
        <ScenarioPanel
          sc={activeScenario}
          index={activeIndex}
          totalScenarios={scenarios.length}
          onUpdate={updateScenario}
          onDelete={deleteScenario}
          onResetAll={() => setShowResetAllModal(true)}
          results={activeResults}
        />

        {/* Combined Text Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-800">
              Text Summary
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({scenarios.length} scenario{scenarios.length > 1 ? 's' : ''})
              </span>
            </h2>
            <button
              onClick={() => { navigator.clipboard.writeText(combinedSummary); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy All'}
            </button>
          </div>
          <div className="p-6">
            <textarea
              readOnly
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-600 focus:outline-none resize-none"
              style={{ height: `${Math.max(256, scenarios.length * 320)}px` }}
              value={combinedSummary}
            />
          </div>
        </div>

      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Save Valuation</h3>
            <p className="text-sm text-slate-500 mb-4">Enter a name for your valuation file:</p>
            <input
              type="text"
              value={downloadFilename}
              onChange={(e) => setDownloadFilename(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm mb-6"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') executeDownload();
                if (e.key === 'Escape') setShowDownloadModal(false);
              }}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDownloadModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button onClick={executeDownload} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Upload Valuation</h3>
            <p className="text-sm text-slate-500 mb-6">
              {currentUser
                ? 'This will create a new valuation. Do you want to proceed?'
                : 'Uploading a valuation will replace all your current scenarios. Any unsaved changes will be lost. Do you want to proceed?'
              }
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  fileInputRef.current?.click();
                }}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${currentUser ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Retain Guest Data Modal */}
      {showRetainGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Save your current work?</h3>
            <p className="text-sm text-slate-500 mb-5">
              You have valuation data from your pre-login session. Give it a name to save it to your account, or discard and proceed with the login.
            </p>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Valuation name</label>
            <input
              type="text"
              value={retainGuestName}
              onChange={(e) => setRetainGuestName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && retainGuestName.trim()) handleRetainGuestData(true);
                if (e.key === 'Escape') handleRetainGuestData(false);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm mb-6"
              autoFocus
            />
            <div className="flex justify-between gap-3">
              <button
                onClick={() => handleRetainGuestData(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={() => handleRetainGuestData(true)}
                disabled={!retainGuestName.trim() || isSaving}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sample Scenarios Modal */}
      {showSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Load Sample Valuation</h3>
            <p className="text-sm text-slate-500 mb-6">
              Loading a sample valuation will replace all your current scenarios. Any unsaved changes will be lost. Do you want to proceed?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowSampleModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button
                onClick={() => {
                  setShowSampleModal(false);
                  const samples = getSampleScenarios();
                  const loaded = samples.map(item => {
                    const base = createDefaultScenario();
                    return {
                      ...base,
                      ...item,
                      id: genId(),
                      splitYears: Array.isArray(item.splitYears) ? [...item.splitYears] : base.splitYears,
                      metricGrowthRates: Array.isArray(item.metricGrowthRates) ? [...item.metricGrowthRates] : base.metricGrowthRates,
                      metricGrowthRatesTotal: Array.isArray(item.metricGrowthRatesTotal) ? [...item.metricGrowthRatesTotal] : base.metricGrowthRatesTotal,
                      revenueGrowthRates: Array.isArray(item.revenueGrowthRates) ? [...item.revenueGrowthRates] : base.revenueGrowthRates,
                      finalMargins: Array.isArray(item.finalMargins) ? [...item.finalMargins] : base.finalMargins,
                      sharesGrowthRates: Array.isArray(item.sharesGrowthRates) ? [...item.sharesGrowthRates] : base.sharesGrowthRates,
                      hoverYear: null,
                      draggingIndex: null,
                      showResetConfirm: false,
                      showYearlyBreakdown: false,
                    };
                  }) as Scenario[];
                  setScenarios(loaded);
                  setActiveScenarioId(loaded[0].id);
                }}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Reset All Modal */}
      {showResetAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Reset All Scenarios?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete all current scenarios for this valuation and start over with a blank slate? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowResetAllModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button
                onClick={() => {
                  setShowResetAllModal(false);
                  const newSc = createDefaultScenario();
                  setScenarios([newSc]);
                  setActiveScenarioId(newSc.id);
                }}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reorder Success Toast */}
      {showReorderToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium">
            <Check className="w-4 h-4" />
            Scenario reordered
          </div>
        </div>
      )}



      {/* Save Success Modal */}
      {showSaveSuccessModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 text-center mx-auto pointer-events-auto">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Saved!</h3>
            <p className="text-sm text-slate-500">Successfully saved {saveSuccessName}.</p>
          </div>
        </div>
      )}

      {/* Delete Valuation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Delete Valuation?</h3>
            <p className="text-sm text-slate-500 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteValuation}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <div className="flex border-b border-slate-200 mb-4">
              <button
                onClick={() => { setActiveTab('login'); setLoginError(''); setSignupError(''); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'login' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Log in
              </button>
              <button
                onClick={() => { setActiveTab('signup'); setLoginError(''); setSignupError(''); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'signup' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Sign up
              </button>
            </div>

            {activeTab === 'login' ? (
              <>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Log In</h3>
                <p className="text-sm text-slate-500 mb-4">Enter your credentials to access your valuations.</p>
                <div className="space-y-4 mb-6">
                  <input
                    type="email"
                    placeholder="Email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLogin();
                    }}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLogin();
                    }}
                  />
                </div>
                {loginError && (
                  <div className="text-sm text-red-600 mb-4">{loginError}</div>
                )}
                <div className="flex justify-end gap-3">
                  <button onClick={() => { setShowLoginModal(false); setLoginError(''); setLoginEmail(''); setLoginPassword(''); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                  <button onClick={handleLogin} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Log In</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Sign Up</h3>
                <p className="text-sm text-slate-500 mb-4">Create a new account to get started.</p>
                <div className="space-y-4 mb-6">
                  <input
                    type="email"
                    placeholder="Email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSignup();
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Username"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSignup();
                    }}
                  />
                  <input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSignup();
                    }}
                  />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSignup();
                    }}
                  />
                </div>
                {signupError && (
                  <div className="text-sm text-red-600 mb-4">{signupError}</div>
                )}
                <div className="flex justify-end gap-3">
                  <button onClick={() => { setShowLoginModal(false); setSignupError(''); setSignupEmail(''); setSignupUsername(''); setSignupPassword(''); setSignupConfirmPassword(''); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                  <button onClick={handleSignup} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Sign Up</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Signup Success Modal */}
      {showSignupSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Success!</h3>
              <p className="text-sm text-slate-600">Your account has been created.</p>
            </div>
          </div>
        </div>
      )}

      {/* Save As New Modal */}
      {showSaveAsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Save As New Valuation</h3>
            <p className="text-sm text-slate-500 mb-4">Enter a name for the new valuation:</p>
            <input
              type="text"
              value={saveAsName}
              onChange={(e) => setSaveAsName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm mb-6"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveAsNew();
                if (e.key === 'Escape') setShowSaveAsModal(false);
              }}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowSaveAsModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button onClick={handleSaveAsNew} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* New Valuation Modal */}
      {showNewValuationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Create New Valuation</h3>
            {userValuations.length === 0 && (
              <p className="text-sm text-slate-500 mb-4">You have no saved valuations, enter the name for your first valuation:</p>
            )}
            <input
              type="text"
              value={newValuationName}
              onChange={e => setNewValuationName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm mb-6"
              placeholder="e.g. My Next Pick"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && newValuationName.trim() && !isSaving) {
                  handleCreateNewValuation(false);
                }
              }}
            />
            <div className="flex flex-col gap-3">
              {userValuations.length === 0 ? (
                <>
                  <button
                    onClick={() => handleCreateNewValuation(true)}
                    disabled={!newValuationName.trim() || isSaving}
                    className="w-full px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSaving ? 'Creating...' : 'Load Sample Valuation'}
                  </button>
                  <button
                    onClick={() => handleCreateNewValuation(false)}
                    disabled={!newValuationName.trim() || isSaving}
                    className="w-full px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Create Blank
                  </button>
                </>
              ) : (
                <div className="flex justify-end gap-3 mt-2">
                  <button
                    onClick={() => setShowNewValuationModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleCreateNewValuation(false)}
                    disabled={!newValuationName.trim() || isSaving}
                    className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSaving ? 'Creating...' : 'Create'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {isRenaming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Rename Valuation</h3>
            <p className="text-sm text-slate-500 mb-4">Enter the new name for your valuation:</p>
            <input
              type="text"
              value={editValuationName}
              onChange={(e) => setEditValuationName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm mb-6"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameValuation();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsRenaming(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button onClick={handleRenameValuation} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Rename</button>
            </div>
          </div>
        </div>
      )}

      {/* Account Settings Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Account Settings</h3>
              <button
                onClick={() => setShowAccountModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Username Section */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={accountUsername}
                  onChange={(e) => { setAccountUsername(e.target.value); setAccountError(''); setAccountSuccess(''); }}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && accountUsername.trim() && accountUsername !== currentUser?.username) {
                      (async () => {
                        setAccountSaving(true); setAccountError(''); setAccountSuccess('');
                        try {
                          await updateUsername(currentUser!.id, accountUsername.trim());
                          setCurrentUser(prev => prev ? { ...prev, username: accountUsername.trim() } : prev);
                          setAccountSuccess('Username updated!');
                        } catch (err) { setAccountError((err as Error).message); }
                        finally { setAccountSaving(false); }
                      })();
                    }
                  }}
                />
                <button
                  onClick={async () => {
                    if (!accountUsername.trim() || accountUsername === currentUser?.username) return;
                    setAccountSaving(true); setAccountError(''); setAccountSuccess('');
                    try {
                      await updateUsername(currentUser!.id, accountUsername.trim());
                      setCurrentUser(prev => prev ? { ...prev, username: accountUsername.trim() } : prev);
                      setAccountSuccess('Username updated!');
                    } catch (err) { setAccountError((err as Error).message); }
                    finally { setAccountSaving(false); }
                  }}
                  disabled={accountSaving || !accountUsername.trim() || accountUsername === currentUser?.username}
                  className="px-3 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 my-4"></div>

            {/* Email Section */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={accountEmail}
                  onChange={(e) => { setAccountEmail(e.target.value); setAccountError(''); setAccountSuccess(''); }}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && accountEmail.trim() && accountEmail !== currentUser?.email) {
                      (async () => {
                        setAccountSaving(true); setAccountError(''); setAccountSuccess('');
                        try {
                          await updateEmail(accountEmail.trim());
                          setCurrentUser(prev => prev ? { ...prev, email: accountEmail.trim() } : prev);
                          setAccountSuccess('Email updated!');
                        } catch (err) { setAccountError((err as Error).message); }
                        finally { setAccountSaving(false); }
                      })();
                    }
                  }}
                />
                <button
                  onClick={async () => {
                    if (!accountEmail.trim() || accountEmail === currentUser?.email) return;
                    setAccountSaving(true); setAccountError(''); setAccountSuccess('');
                    try {
                      await updateEmail(accountEmail.trim());
                      setCurrentUser(prev => prev ? { ...prev, email: accountEmail.trim() } : prev);
                      setAccountSuccess('Email updated!');
                    } catch (err) { setAccountError((err as Error).message); }
                    finally { setAccountSaving(false); }
                  }}
                  disabled={accountSaving || !accountEmail.trim() || accountEmail === currentUser?.email}
                  className="px-3 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 my-4"></div>

            {/* Password Section */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Change Password</label>
              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="New password (min 6 characters)"
                  value={accountNewPassword}
                  onChange={(e) => { setAccountNewPassword(e.target.value); setAccountError(''); setAccountSuccess(''); }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={accountConfirmPassword}
                    onChange={(e) => { setAccountConfirmPassword(e.target.value); setAccountError(''); setAccountSuccess(''); }}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && accountNewPassword && accountConfirmPassword) {
                        (async () => {
                          if (accountNewPassword !== accountConfirmPassword) { setAccountError('Passwords do not match'); return; }
                          if (accountNewPassword.length < 6) { setAccountError('Password must be at least 6 characters'); return; }
                          setAccountSaving(true); setAccountError(''); setAccountSuccess('');
                          try {
                            await updatePassword(accountNewPassword);
                            setAccountNewPassword(''); setAccountConfirmPassword('');
                            setAccountSuccess('Password updated!');
                          } catch (err) { setAccountError((err as Error).message); }
                          finally { setAccountSaving(false); }
                        })();
                      }
                    }}
                  />
                  <button
                    onClick={async () => {
                      if (accountNewPassword !== accountConfirmPassword) { setAccountError('Passwords do not match'); return; }
                      if (accountNewPassword.length < 6) { setAccountError('Password must be at least 6 characters'); return; }
                      setAccountSaving(true); setAccountError(''); setAccountSuccess('');
                      try {
                        await updatePassword(accountNewPassword);
                        setAccountNewPassword(''); setAccountConfirmPassword('');
                        setAccountSuccess('Password updated!');
                      } catch (err) { setAccountError((err as Error).message); }
                      finally { setAccountSaving(false); }
                    }}
                    disabled={accountSaving || !accountNewPassword || !accountConfirmPassword}
                    className="px-3 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* Error / Success Messages */}
            {accountError && (
              <div className="text-sm text-red-600 mb-4 bg-red-50 p-2.5 rounded-lg border border-red-100">{accountError}</div>
            )}
            {accountSuccess && (
              <div className="text-sm text-green-600 mb-4 bg-green-50 p-2.5 rounded-lg border border-green-100">{accountSuccess}</div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setShowAccountModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
