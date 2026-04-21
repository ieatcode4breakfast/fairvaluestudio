import React from 'react';
import { Eye, EyeOff } from '../Icons';

interface AccountModalProps {
  showAccountModal: boolean;
  setShowAccountModal: (show: boolean) => void;
  currentUser: any;
  setCurrentUser: (user: any) => void;

  accountUsername: string;
  setAccountUsername: (val: string) => void;
  accountEmail: string;
  setAccountEmail: (val: string) => void;
  accountNewPassword: string;
  setAccountNewPassword: (val: string) => void;
  accountConfirmPassword: string;
  setAccountConfirmPassword: (val: string) => void;
  accountError: string;
  setAccountError: (val: string) => void;
  accountSuccess: string;
  setAccountSuccess: (val: string) => void;
  accountSaving: boolean;
  setAccountSaving: (val: boolean) => void;
  showAccountNewPassword: boolean;
  setShowAccountNewPassword: (val: boolean) => void;
  showAccountConfirmPassword: boolean;
  setShowAccountConfirmPassword: (val: boolean) => void;
}

export function AccountModal(props: AccountModalProps) {
  if (!props.showAccountModal) return null;

  const handleSave = async () => {
    // Placeholder for actual update logic
    props.setAccountSaving(true);
    setTimeout(() => {
      props.setAccountSuccess('Account updated successfully');
      props.setAccountSaving(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) props.setShowAccountModal(false); }}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200">Account Settings</h3>
          <button
            onClick={() => props.setShowAccountModal(false)}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors text-xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={props.accountUsername}
              onChange={(e) => { props.setAccountUsername(e.target.value); props.setAccountError(''); props.setAccountSuccess(''); }}
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
            <button
              onClick={handleSave}
              disabled={props.accountSaving}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50 cursor-pointer disabled:cursor-default"
            >
              {props.accountSaving ? 'Saving...' : 'Update'}
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-700 my-4"></div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={props.accountEmail}
              onChange={(e) => { props.setAccountEmail(e.target.value); props.setAccountError(''); props.setAccountSuccess(''); }}
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
            <button
              onClick={handleSave}
              disabled={props.accountSaving}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50 cursor-pointer disabled:cursor-default"
            >
              {props.accountSaving ? 'Saving...' : 'Update'}
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-700 my-4"></div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Change Password</label>
          <div className="space-y-2">
            <div className="relative">
              <input
                type={props.showAccountNewPassword ? "text" : "password"}
                placeholder="New Password"
                value={props.accountNewPassword}
                onChange={(e) => { props.setAccountNewPassword(e.target.value); props.setAccountError(''); props.setAccountSuccess(''); }}
                className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
              />
              <button
                type="button"
                onClick={() => props.setShowAccountNewPassword(!props.showAccountNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 focus:outline-none cursor-pointer"
              >
                {props.showAccountNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="relative">
              <input
                type={props.showAccountConfirmPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={props.accountConfirmPassword}
                onChange={(e) => { props.setAccountConfirmPassword(e.target.value); props.setAccountError(''); props.setAccountSuccess(''); }}
                className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
              <button
                type="button"
                onClick={() => props.setShowAccountConfirmPassword(!props.showAccountConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 focus:outline-none cursor-pointer"
              >
                {props.showAccountConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={props.accountSaving}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50 cursor-pointer disabled:cursor-default"
            >
              {props.accountSaving ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </div>

        {props.accountError && (
          <div className="text-sm text-red-600 dark:text-red-400 mb-4 text-center">{props.accountError}</div>
        )}
        {props.accountSuccess && (
          <div className="text-sm text-emerald-600 dark:text-emerald-400 mb-4 text-center">{props.accountSuccess}</div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => props.setShowAccountModal(false)}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
