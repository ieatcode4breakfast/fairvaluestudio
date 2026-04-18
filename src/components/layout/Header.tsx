import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calculator, DownloadIcon, UploadIcon, ChevronDown, ChevronUp } from '../Icons';
import { ThemeToggle } from '../ThemeToggle';
import { User, ValuationMetadata } from '../../types';
import { SELECT_CLS } from '../../utils/constants';

interface HeaderProps {
  currentUser: User | null;
  userValuations: ValuationMetadata[];
  isSaving: boolean;
  loadedValuationId: string | null;

  onLoginClick: () => void;
  onLogoutClick: () => void;
  onAccountClick: () => void;
  onSampleClick: () => void;

  setNewValuationName: (name: string) => void;
  setShowNewValuationModal: (s: boolean) => void;
  handleLoadValuation: (id: string) => void;

  setEditValuationName: (name: string) => void;
  setIsRenaming: (s: boolean) => void;

  setShowSaveAsModal: (s: boolean) => void;
  setShowDeleteModal: (s: boolean) => void;

  setShowDownloadModal: (s: boolean) => void;
  setShowUploadModal: (s: boolean) => void;
  setDownloadFilename: (name: string) => void;
  defaultDownloadName: string;
}

export function Header(props: HeaderProps) {
  const [isHowToUseExpanded, setIsHowToUseExpanded] = useState(false);
  const [isIconOnly, setIsIconOnly] = useState(false);
  const [isValuationOpen, setIsValuationOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsIconOnly(window.innerWidth < 1280); // xl breakpoint
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return (
    <>
      <div className="px-4 md:px-0">
        <header className="mb-6">
          {/* User / Auth Bar */}
          <div className="flex justify-end mb-2">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
              {props.currentUser ? (
                <div className="flex items-center">
                  <button
                    onClick={props.onAccountClick}
                    className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    Hi, {props.currentUser.username}!
                  </button>
                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                  <button
                    onClick={props.onLogoutClick}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <button
                  onClick={props.onLoginClick}
                  className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Log in
                </button>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4 mb-6">
            <Calculator className="w-14 h-14 text-indigo-600 dark:text-indigo-400 shrink-0 mt-1" />
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl font-light tracking-tight mb-1 dark:text-white">
                FairValue Studio
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
                Welcome to FairValue Studio, a multi-scenario valuation tool featuring basic DCF calculation and advanced, multi-phase growth forecasting.
              </p>
            </div>
          </div>
        </header>
      </div>

      <div className="px-4 md:px-0">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden mb-6">
          <button
            onClick={() => setIsHowToUseExpanded(!isHowToUseExpanded)}
            className="w-full p-4 flex items-center justify-between bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">How to Use</h2>
            {isHowToUseExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            )}
          </button>

          {isHowToUseExpanded && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              <ul className="list-disc pl-5 space-y-4 text-slate-600 dark:text-slate-400 mb-4">
                <li><strong>Guest vs. Account:</strong> Use the app as a guest and save or load your data by manually downloading/uploading your valuations. Creating an account unlocks automatic cloud saves, real-time cross-device syncing, the ability to store and manage multiple valuations at once, and load current financial data (powered by AI search).</li>
                <li><strong>Choose a Method:</strong> Select "Basic DCF" for a quick estimate or "Advanced DCF" for detailed, multi-phase growth projections.</li>
                <li><strong>Configure Phases (Advanced):</strong> Click the timeline track to add growth phases. Drag the dots to adjust the years, or double-click/tap to remove them.</li>
                <li><strong>Enter Assumptions:</strong> Fill in your estimates for cash flows, growth rates, margins, and discount rates.</li>
                <li><strong>Load Stock Data:</strong> Use the search icon to fetch live stock prices (or AI-driven TTM financials when logged in) directly into your assumptions.</li>
                <li><strong>Multiple Scenarios:</strong> Add up to 10 different scenarios by clicking the (+) button to the right of the scenarios dropdown.</li>
                <li><strong>Save & Load:</strong> Guest users can use the Download Valuation and Upload Valuation buttons to manually manage valuation files. Logged-in users have all their valuations and scenarios saved automatically to the cloud.</li>
                <li><strong>Text Summary Pro Tip:</strong> After finishing your inputs, copy the text summary at the bottom and paste into an AI chatbot for deeper analysis, sanity checks, or qualitative insights.</li>
              </ul>
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={props.onSampleClick}
                  disabled={props.isSaving}
                  className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-sm font-medium transition-colors border border-indigo-200 dark:border-indigo-800 disabled:opacity-50 cursor-pointer disabled:cursor-default"
                >
                  {props.isSaving ? 'Saving...' : 'Load Sample Valuation'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 md:px-0">
        {/* Load Valuation Dropdown */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          {props.currentUser && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end w-full sm:w-auto gap-4 sm:gap-2">
              <div className="flex flex-col gap-2 w-full max-w-[400px] sm:max-w-none sm:min-w-[400px]">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Valuations
                  {props.loadedValuationId && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full font-medium">
                      {props.isSaving ? 'Saving...' : 'Saved'}
                    </span>
                  )}
                </label>
                <div className="flex items-center w-full gap-2">
                  <div className="relative flex-1 max-w-[400px] sm:max-w-[315px] min-h-[38px]">
                    {/* Custom Trigger */}
                    <div
                      onClick={() => setIsValuationOpen(!isValuationOpen)}
                      className={`${SELECT_CLS} !bg-white dark:!bg-slate-800 shadow-sm flex items-center justify-start cursor-pointer transition-colors ${isValuationOpen ? 'open' : ''}`}
                    >
                      <span className="truncate text-slate-700 dark:text-slate-300">
                        {props.userValuations.find(v => v.id === props.loadedValuationId)?.valuationName || (
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">✨ New valuation...</span>
                        )}
                      </span>
                    </div>

                    <AnimatePresence>
                      {isValuationOpen && (
                        <>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsValuationOpen(false)}
                            className="fixed inset-0 z-10 bg-transparent"
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute top-full mt-1.5 left-0 w-full z-20 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                          >
                            <div className="p-1 max-h-[300px] overflow-y-auto">
                              <div
                                onClick={() => {
                                  props.setNewValuationName('New Valuation');
                                  props.setShowNewValuationModal(true);
                                  setIsValuationOpen(false);
                                }}
                                className="flex items-center px-3 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors border border-transparent"
                              >
                                ✨ New valuation...
                              </div>
                              {[...props.userValuations]
                                .sort((a, b) => a.valuationName.localeCompare(b.valuationName))
                                .map((val) => (
                                  <div
                                    key={val.id}
                                    onClick={() => {
                                      props.handleLoadValuation(val.id);
                                      setIsValuationOpen(false);
                                    }}
                                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors border ${val.id === props.loadedValuationId
                                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800'
                                      : 'text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                      }`}
                                  >
                                    {val.valuationName}
                                  </div>
                                ))}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  {props.loadedValuationId && (
                    <button
                      onClick={() => {
                        props.setEditValuationName(props.userValuations.find(v => v.id === props.loadedValuationId)?.valuationName || '');
                        props.setIsRenaming(true);
                      }}
                      className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-600 transition-colors shadow-sm whitespace-nowrap cursor-pointer"
                      title="Rename Valuation"
                    >
                      Rename
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => props.setShowSaveAsModal(true)}
                  className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors shadow-sm whitespace-nowrap cursor-pointer"
                >
                  Save As New
                </button>
                {props.loadedValuationId && (
                  <button
                    onClick={() => props.setShowDeleteModal(true)}
                    className="flex-1 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors border border-red-200 dark:border-red-800 cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => {
                props.setDownloadFilename(props.defaultDownloadName);
                props.setShowDownloadModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-600 shadow-sm transition-all cursor-pointer"
              title={isIconOnly ? "Download Valuation" : undefined}
            >
              <DownloadIcon className="w-4 h-4" />
              <span className="hidden xl:inline">Download Valuation</span>
            </button>
            <button
              onClick={() => props.setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border shadow-sm transition-all bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-600 cursor-pointer"
              title={isIconOnly ? "Upload Valuation" : undefined}
            >
              <UploadIcon className="w-4 h-4" />
              <span className="hidden xl:inline">Upload Valuation</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
