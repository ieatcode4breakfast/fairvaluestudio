import React, { useState } from 'react';
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
            className="w-full p-4 flex items-center justify-between bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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
                <li><strong>Guest vs. Account:</strong> Use the app as a guest and save or load your data by manually downloading/uploading your valuations. Creating an account unlocks automatic cloud saves, real-time cross-device syncing, and the ability to store and manage multiple valuations at once.</li>
                <li><strong>Choose a Method:</strong> Select "Basic DCF" for a quick estimate or "Advanced DCF" for detailed, multi-phase growth projections.</li>
                <li><strong>Configure Phases (Advanced):</strong> Click the timeline track to add growth phases. Drag the dots to adjust the years, or double-click/tap to remove them.</li>
                <li><strong>Enter Assumptions:</strong> Fill in your estimates for cash flows, growth rates, margins, and discount rates.</li>
                <li><strong>Compare Scenarios:</strong> Use the tabs to create and compare up to 10 different scenarios.</li>
                <li><strong>Save & Load:</strong> Use the Download and Upload buttons to save your scenarios to a file and load them later.</li>
                <li><strong>Text Summary Pro Tip:</strong> After finishing your inputs, copy the text summary at the bottom and paste into an AI chatbot for deeper analysis, sanity checks, or qualitative insights.</li>
              </ul>
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={props.onSampleClick}
                  disabled={props.isSaving}
                  className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-sm font-medium transition-colors border border-indigo-200 dark:border-indigo-800 disabled:opacity-50"
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
                  <select
                    value={props.loadedValuationId ?? 'NEW'}
                    onChange={(e) => {
                      if (e.target.value === 'NEW') {
                        props.setNewValuationName('New Valuation');
                        props.setShowNewValuationModal(true);
                      } else if (e.target.value) {
                        props.handleLoadValuation(e.target.value);
                      }
                    }}
                    className={`${SELECT_CLS} flex-1 !bg-white dark:!bg-slate-800 shadow-sm`}
                  >
                    <option value="NEW" className="font-semibold text-indigo-600 dark:text-indigo-400">✨ New valuation...</option>
                    {[...props.userValuations]
                      .sort((a, b) => a.valuationName.localeCompare(b.valuationName))
                      .map((val) => (
                        <option key={val.id} value={val.id}>
                          {val.valuationName}
                        </option>
                      ))}
                  </select>
                  {props.loadedValuationId && (
                    <button
                      onClick={() => {
                        props.setEditValuationName(props.userValuations.find(v => v.id === props.loadedValuationId)?.valuationName || '');
                        props.setIsRenaming(true);
                      }}
                      className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-600 transition-colors shadow-sm whitespace-nowrap"
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
                  className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors shadow-sm whitespace-nowrap"
                >
                  Save As New
                </button>
                {props.loadedValuationId && (
                  <button
                    onClick={() => props.setShowDeleteModal(true)}
                    className="flex-1 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors border border-red-200 dark:border-red-800"
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-600 shadow-sm transition-all"
            >
              <DownloadIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Download Valuation (.json)</span>
            </button>
            <button
              onClick={() => props.setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border shadow-sm transition-all bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-600"
            >
              <UploadIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Upload Valuation (.json)</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
