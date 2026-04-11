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
import { login, signup, validateUsername, getUserValuations } from './mocks/api';
import { User } from './mocks/db';

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
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showSignupSuccessModal, setShowSignupSuccessModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null); // <-- Add this line

  // Auto-close signup success modal after 2 seconds
  useEffect(() => {
    if (showSignupSuccessModal) {
      const timer = setTimeout(() => setShowSignupSuccessModal(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showSignupSuccessModal]);

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
      filename = `dcf-scenarios-${new Date().toISOString().slice(0,10)}`;
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
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
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
    reader.onload = (evt) => {
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
        setScenarios(loaded);
        setActiveScenarioId(loaded[0].id);
        setUploadError('');
      } catch (err) {
        setUploadError('Could not read file. Make sure it is a valid JSON file.');
        setTimeout(() => setUploadError(''), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const allResults = useMemo(() =>
    scenarios.map(sc => sc.dcfMethod === 'Basic DCF' ? computeSimple(sc) : computeAdvanced(sc)),
    [scenarios]
  );

  const combinedSummary = useMemo(() =>
    scenarios.map((sc, i) => buildSummaryText(sc, allResults[i], i)).join('\n'),
    [scenarios, allResults]
  );

  const activeScenario = scenarios.find(sc => sc.id === activeScenarioId) || scenarios[0];
  const activeIndex    = scenarios.findIndex(sc => sc.id === activeScenarioId);
  const activeResults  = allResults[activeIndex] || allResults[0];

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

  const handleLogin = useCallback(() => {
    const user = login(loginUsername, loginPassword);
    if (user) {
      setCurrentUser(user);
      setShowLoginModal(false);
      setLoginUsername('');
      setLoginPassword('');
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
    }
  }, [loginUsername, loginPassword]);

  const handleSignup = useCallback(() => {
    try {
      const user = signup(signupUsername, signupPassword, signupConfirmPassword);
      setCurrentUser(user);
      setShowLoginModal(false);
      setSignupUsername('');
      setSignupPassword('');
      setSignupConfirmPassword('');
      setSignupError('');
      setActiveTab('login');
      setShowSignupSuccessModal(true);
    } catch (error) {
      setSignupError((error as Error).message);
    }
  }, [signupUsername, signupPassword, signupConfirmPassword]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  return (
    <div 
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="min-h-screen bg-[#f5f5f5] text-slate-900 p-4 md:p-8" 
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto space-y-6">

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
                  <div className="text-sm font-medium text-slate-700">Hi, {currentUser.username}!</div>
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
              <li><strong>Compare Scenarios:</strong> Use the tabs to create and compare up to 5 different scenarios.</li>
              <li><strong>Save & Load:</strong> Use the Download and Upload buttons to save your scenarios to a file and load them later.</li>
              <li><strong>Text Summary Pro Tip:</strong> After finishing your inputs, copy the text summary at the bottom and paste into an AI chatbot for deeper analysis, sanity checks, or qualitative insights.</li>
            </ul>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setShowSampleModal(true)}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors border border-indigo-200"
              >
                Load Sample Valuation
              </button>
              <button
                onClick={() => setShowResetAllModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors border border-red-200"
              >
                <RotateCcw className="w-4 h-4" />
                Reset All Scenarios
              </button>
            </div>
          </div>
        </header>

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
                    className={`flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-xl text-sm font-medium transition-all duration-200 border cursor-grab active:cursor-grabbing ${shiftClass} ${
                      isActive
                        ? 'bg-white text-indigo-600 border-indigo-200 shadow-sm'
                        : 'bg-slate-200/60 text-slate-500 border-transparent hover:bg-white hover:text-slate-700 hover:border-slate-200'
                    } ${isDragged ? 'opacity-20 scale-75 border-dashed border-indigo-300' : 'opacity-100'} ${isDropSuccess ? 'bg-green-100 border-green-300 text-green-700 shadow-md scale-110' : ''}`}
                  >
                    {index + 1}
                  </button>
                );
              })}

              {scenarios.length < MAX_SCENARIOS && (
                <div className="relative tab-add-btn flex-shrink-0">
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
              )}
            </div>
          </div>

          {/* Right: download + upload */}
          <div className="flex items-center gap-2 flex-shrink-0 mb-1">
            <button
              onClick={() => {
                setDownloadFilename(`dcf-scenarios-${new Date().toISOString().slice(0,10)}`);
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
              Uploading a valuation will replace all your current scenarios. Any unsaved changes will be lost. Do you want to proceed?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button 
                onClick={() => {
                  setShowUploadModal(false);
                  fileInputRef.current?.click();
                }} 
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Proceed
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
              Are you sure you want to delete all current scenarios and start over with a blank slate? This action cannot be undone.
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

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <div className="flex border-b border-slate-200 mb-4">
              <button
                onClick={() => { setActiveTab('login'); setLoginError(''); setSignupError(''); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'login' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Log in
              </button>
              <button
                onClick={() => { setActiveTab('signup'); setLoginError(''); setSignupError(''); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'signup' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'
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
                    type="text"
                    placeholder="Username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
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
                  <button onClick={() => { setShowLoginModal(false); setLoginError(''); setLoginUsername(''); setLoginPassword(''); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                  <button onClick={handleLogin} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Log In</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Sign Up</h3>
                <p className="text-sm text-slate-500 mb-4">Create a new account to get started.</p>
                <div className="space-y-4 mb-6">
                  <input
                    type="text"
                    placeholder="Username"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                    autoFocus
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
                  <button onClick={() => { setShowLoginModal(false); setSignupError(''); setSignupUsername(''); setSignupPassword(''); setSignupConfirmPassword(''); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
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

    </div>
  );
}
