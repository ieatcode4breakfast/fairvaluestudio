import React, { useState, useRef, useMemo } from 'react';
import { User, Scenario } from './types';
import { getSampleScenarios } from './utils/sampleScenarios';
import { computeSimple } from './utils/computeSimple';
import { computeAdvanced } from './utils/computeAdvanced';
import { buildSummaryText } from './utils/summary';
import { MAX_SCENARIOS, TRANSIENT_KEYS } from './utils/constants';
import { genId } from './utils/genId';

// Custom Hooks
import { loadInitialScenarios, useScenarios } from './hooks/useScenarios';
import { useAuth } from './hooks/useAuth';
import { useValuations } from './hooks/useValuations';
import { useAutoSaveSync } from './hooks/useAutoSaveSync';

// Components
import { ScenarioPanel } from './components/ScenarioPanel';
import { ScenarioComparisonTable } from './components/ScenarioComparisonTable';
import { Header } from './components/layout/Header';
import { ScenarioTabs } from './components/layout/ScenarioTabs';
import { AuthModal } from './components/modals/AuthModal';
import { AccountModal } from './components/modals/AccountModal';
import { Copy, PlusIcon } from './components/Icons'; // Ensure imported if needed locally, else remove
import {
  DownloadModal,
  UploadModal,
  SaveAsModal,
  NewValuationModal,
  DeleteModal,
  RenameModal,
  GenericConfirmModal,
  SaveSuccessModal,
  SignupSuccessModal,
  RetainGuestModal
} from './components/modals/WorkspaceModals';

export default function App() {
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const {
    scenarios, setScenarios, activeScenarioId, setActiveScenarioId, lastSavedState, setLastSavedState,
    currentCleaned, isDirty, updateScenario, addScenario, duplicateScenario, getCleanedScenariosString, deleteScenario,
    draggedTabIndex, dragOverIndex, dropSuccessIndex, showReorderToast, handleDragStart, handleDragOver, handleDrop, handleDragEnd
  } = useScenarios(currentUser);

  const {
    userValuations, setUserValuations, hasFetchedValuations, loadedValuationId, setLoadedValuationId, isSaving, setIsSaving,
    handleLoadValuation, handleCreateNewValuation, handleDeleteValuation, handleRenameValuation
  } = useValuations(currentUser, setScenarios, setActiveScenarioId, setLastSavedState);

  const { pendingLoginUser, setPendingLoginUser, handleLogin, handleSignup, handleLogout } = useAuth(
    currentUser, setCurrentUser, scenarios, setScenarios, setActiveScenarioId, setLastSavedState, setLoadedValuationId, handleLoadValuation, loadInitialScenarios
  );

  useAutoSaveSync(loadedValuationId, currentUser, userValuations, scenarios, setScenarios, currentCleaned, isDirty, setLastSavedState, setIsSaving);

  // Authentication UI State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [signupEmail, setSignupEmail] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);

  // Account Settings UI State
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountUsername, setAccountUsername] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountNewPassword, setAccountNewPassword] = useState('');
  const [accountConfirmPassword, setAccountConfirmPassword] = useState('');
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');
  const [accountSaving, setAccountSaving] = useState(false);
  const [showAccountNewPassword, setShowAccountNewPassword] = useState(false);
  const [showAccountConfirmPassword, setShowAccountConfirmPassword] = useState(false);

  // Workspace UI State
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [downloadFilename, setDownloadFilename] = useState('valuation');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewValuationModal, setShowNewValuationModal] = useState(false);
  const [newValuationName, setNewValuationName] = useState('New Valuation');
  const [showRetainGuestModal, setShowRetainGuestModal] = useState(false);
  const [retainValuationName, setRetainValuationName] = useState('My Scenarios');
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [editValuationName, setEditValuationName] = useState('');
  const [showResetAllConfirm, setShowResetAllConfirm] = useState(false);

  // Summary State
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Computed Values
  const allResults = useMemo(() =>
    scenarios.map(sc => sc.dcfMethod === 'Basic DCF' ? computeSimple(sc) : computeAdvanced(sc)),
    [scenarios]
  );
  const activeIndex = Math.max(0, scenarios.findIndex((s) => s.id === activeScenarioId));
  const activeScenario = scenarios[activeIndex] || scenarios[0];
  const activeResults = allResults[activeIndex] || allResults[0];

  const combinedSummary = useMemo(() =>
    scenarios.map((sc, i) => buildSummaryText(sc, allResults[i], i)).join('\n\n---\n\n'),
    [scenarios, allResults]
  );

  // Handlers wrapped with UI state updates
  const doLogin = async () => {
    setLoginError('');
    try {
      const user = await handleLogin(loginEmail, loginPassword, () => setShowRetainGuestModal(true));
      if (user) {
        setShowLoginModal(false);
        setLoginEmail(''); setLoginPassword('');
      } else {
        setLoginError('Invalid email or password');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    }
  };

  const doSignup = async () => {
    setSignupError('');
    if (signupPassword !== signupConfirmPassword) { setSignupError('Passwords do not match'); return; }
    if (signupPassword.length < 6) { setSignupError('Password must be at least 6 characters'); return; }
    if (!signupUsername.trim()) { setSignupError('Username is required'); return; }

    try {
      const user = await handleSignup(signupEmail, signupPassword, signupUsername, () => setShowRetainGuestModal(true));
      if (user) {
        setShowLoginModal(false);
        setShowSignupSuccess(true);
        setTimeout(() => setShowSignupSuccess(false), 3000);
        setSignupEmail(''); setSignupUsername(''); setSignupPassword(''); setSignupConfirmPassword('');
      }
    } catch (err: any) {
      setSignupError(err.message || 'Signup failed');
    }
  };

  const doRetainGuest = async (retain: boolean) => {
    if (!retain || !retainValuationName.trim() || !pendingLoginUser) {
      setPendingLoginUser(null);
      setShowRetainGuestModal(false);
      localStorage.removeItem('fairvalue_scenarios');
      if (pendingLoginUser?.lastActiveValuationId) {
        handleLoadValuation(pendingLoginUser.lastActiveValuationId);
      }
      return;
    }

    setIsSaving(true);
    const newId = await handleCreateNewValuation(retainValuationName, scenarios);
    if (newId) {
      localStorage.removeItem('fairvalue_scenarios');
      setPendingLoginUser(null);
      setShowRetainGuestModal(false);
    }
    setIsSaving(false);
  };

  const doCreateValuation = async (loadSample: boolean) => {
    if (!newValuationName.trim()) return;
    const initialScenarios = loadSample ? getSampleScenarios() : loadInitialScenarios();
    const newId = await handleCreateNewValuation(newValuationName, initialScenarios);
    if (newId) {
      setShowNewValuationModal(false);
    }
  };

  const doDeleteValuation = () => {
    handleDeleteValuation(() => {
      // on Empty
      setShowDeleteConfirm(false);
      setNewValuationName('New Valuation');
      setShowNewValuationModal(true);
    });
    setShowDeleteConfirm(false);
  };

  const doRenameValuation = async () => {
    if (!editValuationName.trim()) return;
    await handleRenameValuation(editValuationName);
    setIsRenaming(false);
  };

  const doSaveAsNew = async () => {
    if (!saveAsName.trim()) return;
    const newId = await handleCreateNewValuation(saveAsName, scenarios);
    if (newId) setShowSaveAsModal(false);
  };

  const doResetAll = () => {
    const defaultSc = loadInitialScenarios();
    setScenarios(defaultSc);
    setActiveScenarioId(defaultSc[0].id);
    if (!currentUser) setLastSavedState(getCleanedScenariosString(defaultSc));
  };

  const doDownload = () => {
    try {
      const cleaned = scenarios.map((sc) => {
        const copy: any = { ...sc };
        TRANSIENT_KEYS.forEach((k) => delete copy[k]);
        return copy;
      });
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleaned, null, 2));
      const anchor = document.createElement('a');
      anchor.setAttribute("href", dataStr);
      anchor.setAttribute("download", `${downloadFilename.trim() || 'valuation'}.json`);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setShowDownloadModal(false);
    } catch (err) {
      console.error('Failed to download file:', err);
      alert('Failed to construct the download file. See console for details.');
    }
  };

  const doUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const contents = evt.target?.result;
          if (typeof contents === 'string') {
            const parsed = JSON.parse(contents);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const baseName = file.name.replace(/\.json$/i, '');
              const capped = parsed.slice(0, MAX_SCENARIOS);

              if (currentUser) {
                const newId = await handleCreateNewValuation(baseName, capped);
                if (newId) {
                  // Success
                } else {
                  alert("Failed to upload the valuation to the cloud.");
                }
              } else {
                const loaded = capped.map((item) => {
                  const base = loadInitialScenarios()[0];
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
                setLastSavedState(getCleanedScenariosString(loaded));
              }
            } else {
              alert('Invalid file format. Ensure it contains an array of scenarios.');
            }
          }
        } catch (err) {
          console.error('Failed to parse file:', err);
          alert('Failed to parse the file. Ensure it is a valid JSON.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(combinedSummary);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-12 overflow-x-hidden">

      {/* Reorder Toast Notification */}
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none ${showReorderToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
      >
        <div className="bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2">
          <span>Scenarios reordered</span>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto px-4 md:px-6 pt-6 md:pt-10">
        <Header
          currentUser={currentUser}
          userValuations={userValuations}
          isSaving={isSaving}
          loadedValuationId={loadedValuationId}
          onLoginClick={() => setShowLoginModal(true)}
          onLogoutClick={handleLogout}
          onAccountClick={() => {
            if (currentUser) {
              setAccountUsername(currentUser.username || '');
              setAccountEmail(currentUser.email || '');
              setAccountNewPassword('');
              setAccountConfirmPassword('');
              setAccountError('');
              setAccountSuccess('');
              setShowAccountModal(true);
            }
          }}
          onSampleClick={async () => {
            if (currentUser) {
              const sampleScs = getSampleScenarios();
              await handleCreateNewValuation('Sample Valuation', sampleScs);
            } else {
              if (confirm('Loading the sample will replace your current scenarios. Are you sure?')) {
                const sampleCopies = getSampleScenarios().map((sc) => ({ ...sc, id: genId() }));
                setScenarios(sampleCopies);
                setActiveScenarioId(sampleCopies[0].id);
              }
            }
          }}
          setNewValuationName={setNewValuationName}
          setShowNewValuationModal={setShowNewValuationModal}
          handleLoadValuation={handleLoadValuation}
          setEditValuationName={setEditValuationName}
          setIsRenaming={setIsRenaming}
          setShowSaveAsModal={(s) => { setSaveAsName(`${userValuations.find(v => v.id === loadedValuationId)?.valuationName || 'Valuation'} (Copy)`); setShowSaveAsModal(s); }}
          setShowDeleteModal={setShowDeleteConfirm}
          setShowDownloadModal={setShowDownloadModal}
          setShowUploadModal={setShowUploadModal}
          setDownloadFilename={setDownloadFilename}
          defaultDownloadName={currentUser && loadedValuationId ? (userValuations.find(v => v.id === loadedValuationId)?.valuationName || 'valuation') : 'valuation'}
        />

        {(!currentUser || (currentUser && userValuations.length > 0)) && (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden" onDragOver={(e) => handleDragOver(e, tabsContainerRef.current)} onDrop={handleDrop}>
            <div className="bg-slate-50/80 px-4 md:px-6 py-4 border-b border-slate-200">
              <ScenarioTabs
                scenarios={scenarios}
                activeScenarioId={activeScenarioId}
                setActiveScenarioId={setActiveScenarioId}
                draggedTabIndex={draggedTabIndex}
                dragOverIndex={dragOverIndex}
                dropSuccessIndex={dropSuccessIndex}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                handleDragEnd={handleDragEnd}
                addScenario={addScenario}
                duplicateScenario={duplicateScenario}
                tabsContainerRef={tabsContainerRef}
              />
            </div>

            <ScenarioPanel
              key={activeScenario.id}
              sc={activeScenario}
              index={activeIndex}
              totalScenarios={scenarios.length}
              onUpdate={updateScenario}
              onDelete={deleteScenario}
              onResetAll={() => setShowResetAllConfirm(true)}
              results={activeResults}
            />
          </div>
        )}

        {/* Tabular Comparison */}
        {(!currentUser || (currentUser && userValuations.length > 0)) && (
          <ScenarioComparisonTable scenarios={scenarios} allResults={allResults} />
        )}

        {/* Combined Text Summary */}
        {(!currentUser || (currentUser && userValuations.length > 0)) && (
          <div className="mt-4 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Text Summary</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Copy this text and paste it into ChatGPT, Claude, or any LLM to ask for an analysis of your valuation scenarios.
                </p>
              </div>
              <button
                onClick={copySummary}
                className={`flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-semibold shadow-sm transition-all relative ${showCopySuccess ? 'bg-green-50 border-green-200 text-green-700' : 'hover:bg-indigo-100'
                  }`}
              >
                {showCopySuccess ? (
                  <>
                    <span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px]">✓</span> Copy Successful
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy All
                  </>
                )}
              </button>
            </div>
            <textarea
              readOnly
              value={combinedSummary}
              className="w-full h-48 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <AuthModal
        showLoginModal={showLoginModal} setShowLoginModal={setShowLoginModal}
        activeTab={activeTab} setActiveTab={setActiveTab}
        loginEmail={loginEmail} setLoginEmail={setLoginEmail}
        loginPassword={loginPassword} setLoginPassword={setLoginPassword}
        showLoginPassword={showLoginPassword} setShowLoginPassword={setShowLoginPassword}
        loginError={loginError} setLoginError={setLoginError}
        handleLogin={doLogin}
        signupEmail={signupEmail} setSignupEmail={setSignupEmail}
        signupUsername={signupUsername} setSignupUsername={setSignupUsername}
        signupPassword={signupPassword} setSignupPassword={setSignupPassword}
        showSignupPassword={showSignupPassword} setShowSignupPassword={setShowSignupPassword}
        signupConfirmPassword={signupConfirmPassword} setSignupConfirmPassword={setSignupConfirmPassword}
        showSignupConfirmPassword={showSignupConfirmPassword} setShowSignupConfirmPassword={setShowSignupConfirmPassword}
        signupError={signupError} setSignupError={setSignupError}
        handleSignup={doSignup}
      />

      <AccountModal
        showAccountModal={showAccountModal} setShowAccountModal={setShowAccountModal}
        currentUser={currentUser} setCurrentUser={setCurrentUser}
        accountUsername={accountUsername} setAccountUsername={setAccountUsername}
        accountEmail={accountEmail} setAccountEmail={setAccountEmail}
        accountNewPassword={accountNewPassword} setAccountNewPassword={setAccountNewPassword}
        accountConfirmPassword={accountConfirmPassword} setAccountConfirmPassword={setAccountConfirmPassword}
        accountError={accountError} setAccountError={setAccountError}
        accountSuccess={accountSuccess} setAccountSuccess={setAccountSuccess}
        accountSaving={accountSaving} setAccountSaving={setAccountSaving}
        showAccountNewPassword={showAccountNewPassword} setShowAccountNewPassword={setShowAccountNewPassword}
        showAccountConfirmPassword={showAccountConfirmPassword} setShowAccountConfirmPassword={setShowAccountConfirmPassword}
      />

      <DownloadModal show={showDownloadModal} setShow={setShowDownloadModal} filename={downloadFilename} setFilename={setDownloadFilename} onDownload={doDownload} />
      <UploadModal show={showUploadModal} setShow={setShowUploadModal} currentUser={currentUser} onProceed={doUpload} />
      <SaveAsModal show={showSaveAsModal} setShow={setShowSaveAsModal} name={saveAsName} setName={setSaveAsName} onSave={doSaveAsNew} />
      <NewValuationModal show={showNewValuationModal} setShow={setShowNewValuationModal} name={newValuationName} setName={setNewValuationName} isSaving={isSaving} userValuations={userValuations} onCreateClick={doCreateValuation} />
      <DeleteModal show={showDeleteConfirm} setShow={setShowDeleteConfirm} onDelete={doDeleteValuation} />
      <RenameModal show={isRenaming} setShow={setIsRenaming} name={editValuationName} setName={setEditValuationName} onRename={doRenameValuation} />
      <RetainGuestModal show={showRetainGuestModal} name={retainValuationName} setName={setRetainValuationName} isSaving={isSaving} onRetain={doRetainGuest} />

      <GenericConfirmModal
        show={showResetAllConfirm} setShow={setShowResetAllConfirm}
        title="Reset All Scenarios?" description="Are you sure you want to reset all scenarios to their default values? This action cannot be undone."
        confirmText="Reset All" confirmClass="bg-red-600 hover:bg-red-700 text-white" onConfirm={doResetAll}
      />

      <SaveSuccessModal show={false} name={""} />
      <SignupSuccessModal show={showSignupSuccess} />
    </div>
  );
}
