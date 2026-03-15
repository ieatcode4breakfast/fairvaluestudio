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
  const [copied, setCopied] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFilename, setDownloadFilename] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save scenarios to local storage whenever they change
  useEffect(() => {
    const cleaned = scenarios.map(sc => {
      const copy: any = { ...sc };
      TRANSIENT_KEYS.forEach(k => delete copy[k]);
      return copy;
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
  }, [scenarios]);

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
          setUploadError('Invalid file: not a valid DCF scenarios file.');
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

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900 p-4 md:p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-7xl mx-auto space-y-6">

        <header className="mb-6">
          <div className="flex items-center gap-4 mb-6">
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
                Load Sample Scenarios
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
            <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden pb-1 min-w-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {scenarios.map((sc, index) => {
                const isActive = sc.id === activeScenarioId;
                return (
                  <button
                    key={sc.id}
                    onClick={() => setActiveScenarioId(sc.id)}
                    className={`flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-xl text-sm font-medium transition-all border ${
                      isActive
                        ? 'bg-white text-indigo-600 border-indigo-200 shadow-sm'
                        : 'bg-slate-200/60 text-slate-500 border-transparent hover:bg-white hover:text-slate-700 hover:border-slate-200'
                    }`}
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
              <span className="hidden sm:inline">Download Scenarios</span>
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border shadow-sm transition-all bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200"
            >
              <UploadIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Upload Scenarios</span>
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
            <h3 className="text-lg font-medium text-slate-900 mb-2">Save Scenarios</h3>
            <p className="text-sm text-slate-500 mb-4">Enter a name for your scenarios file:</p>
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
            <h3 className="text-lg font-medium text-slate-900 mb-2">Upload Scenarios</h3>
            <p className="text-sm text-slate-500 mb-6">
              Uploading scenarios will replace all your current scenarios. Any unsaved changes will be lost. Do you want to proceed?
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
            <h3 className="text-lg font-medium text-slate-900 mb-2">Load Sample Scenarios</h3>
            <p className="text-sm text-slate-500 mb-6">
              Loading sample scenarios will replace all your current scenarios. Any unsaved changes will be lost. Do you want to proceed?
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
    </div>
  );
}
