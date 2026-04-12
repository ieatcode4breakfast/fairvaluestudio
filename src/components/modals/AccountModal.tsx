import React from 'react';
import { Eye, EyeOff } from '../Icons';
import { User } from '../../types';
import { updateUsername, updateEmail, updatePassword } from '../../api';

interface AccountModalProps {
  showAccountModal: boolean;
  setShowAccountModal: (show: boolean) => void;
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Account Settings</h3>
          <button
            onClick={() => props.setShowAccountModal(false)}
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
              value={props.accountUsername}
              onChange={(e) => { props.setAccountUsername(e.target.value); props.setAccountError(''); props.setAccountSuccess(''); }}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && props.accountUsername.trim() && props.accountUsername !== props.currentUser?.username) {
                  (async () => {
                    props.setAccountSaving(true); props.setAccountError(''); props.setAccountSuccess('');
                    try {
                      await updateUsername(props.currentUser!.id, props.accountUsername.trim());
                      props.setCurrentUser(prev => prev ? { ...prev, username: props.accountUsername.trim() } : prev);
                      props.setAccountSuccess('Username updated!');
                    } catch (err) { props.setAccountError((err as Error).message); }
                    finally { props.setAccountSaving(false); }
                  })();
                }
              }}
            />
            <button
              onClick={async () => {
                if (!props.accountUsername.trim() || props.accountUsername === props.currentUser?.username) return;
                props.setAccountSaving(true); props.setAccountError(''); props.setAccountSuccess('');
                try {
                  await updateUsername(props.currentUser!.id, props.accountUsername.trim());
                  props.setCurrentUser(prev => prev ? { ...prev, username: props.accountUsername.trim() } : prev);
                  props.setAccountSuccess('Username updated!');
                } catch (err) { props.setAccountError((err as Error).message); }
                finally { props.setAccountSaving(false); }
              }}
              disabled={props.accountSaving || !props.accountUsername.trim() || props.accountUsername === props.currentUser?.username}
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
              value={props.accountEmail}
              onChange={(e) => { props.setAccountEmail(e.target.value); props.setAccountError(''); props.setAccountSuccess(''); }}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && props.accountEmail.trim() && props.accountEmail !== props.currentUser?.email) {
                  (async () => {
                    props.setAccountSaving(true); props.setAccountError(''); props.setAccountSuccess('');
                    try {
                      await updateEmail(props.accountEmail.trim());
                      props.setCurrentUser(prev => prev ? { ...prev, email: props.accountEmail.trim() } : prev);
                      props.setAccountSuccess('Email updated!');
                    } catch (err) { props.setAccountError((err as Error).message); }
                    finally { props.setAccountSaving(false); }
                  })();
                }
              }}
            />
            <button
              onClick={async () => {
                if (!props.accountEmail.trim() || props.accountEmail === props.currentUser?.email) return;
                props.setAccountSaving(true); props.setAccountError(''); props.setAccountSuccess('');
                try {
                  await updateEmail(props.accountEmail.trim());
                  props.setCurrentUser(prev => prev ? { ...prev, email: props.accountEmail.trim() } : prev);
                  props.setAccountSuccess('Email updated!');
                } catch (err) { props.setAccountError((err as Error).message); }
                finally { props.setAccountSaving(false); }
              }}
              disabled={props.accountSaving || !props.accountEmail.trim() || props.accountEmail === props.currentUser?.email}
              className="px-3 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 my-4"></div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Change Password</label>
          <div className="space-y-2">
            <div className="relative">
              <input
                type={props.showAccountNewPassword ? "text" : "password"}
                placeholder="New password (min 6 characters)"
                value={props.accountNewPassword}
                onChange={(e) => { props.setAccountNewPassword(e.target.value); props.setAccountError(''); props.setAccountSuccess(''); }}
                className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
              />
              <button
                type="button"
                onClick={() => props.setShowAccountNewPassword(!props.showAccountNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {props.showAccountNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={props.showAccountConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={props.accountConfirmPassword}
                  onChange={(e) => { props.setAccountConfirmPassword(e.target.value); props.setAccountError(''); props.setAccountSuccess(''); }}
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && props.accountNewPassword && props.accountConfirmPassword) {
                      (async () => {
                        if (props.accountNewPassword !== props.accountConfirmPassword) { props.setAccountError('Passwords do not match'); return; }
                        if (props.accountNewPassword.length < 6) { props.setAccountError('Password must be at least 6 characters'); return; }
                        props.setAccountSaving(true); props.setAccountError(''); props.setAccountSuccess('');
                        try {
                          await updatePassword(props.accountNewPassword);
                          props.setAccountNewPassword(''); props.setAccountConfirmPassword('');
                          props.setAccountSuccess('Password updated!');
                        } catch (err) { props.setAccountError((err as Error).message); }
                        finally { props.setAccountSaving(false); }
                      })();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => props.setShowAccountConfirmPassword(!props.showAccountConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {props.showAccountConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button
                onClick={async () => {
                  if (props.accountNewPassword !== props.accountConfirmPassword) { props.setAccountError('Passwords do not match'); return; }
                  if (props.accountNewPassword.length < 6) { props.setAccountError('Password must be at least 6 characters'); return; }
                  props.setAccountSaving(true); props.setAccountError(''); props.setAccountSuccess('');
                  try {
                    await updatePassword(props.accountNewPassword);
                    props.setAccountNewPassword(''); props.setAccountConfirmPassword('');
                    props.setAccountSuccess('Password updated!');
                  } catch (err) { props.setAccountError((err as Error).message); }
                  finally { props.setAccountSaving(false); }
                }}
                disabled={props.accountSaving || !props.accountNewPassword || !props.accountConfirmPassword}
                className="px-3 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Error / Success Messages */}
        {props.accountError && (
          <div className="text-sm text-red-600 mb-4 bg-red-50 p-2.5 rounded-lg border border-red-100">{props.accountError}</div>
        )}
        {props.accountSuccess && (
          <div className="text-sm text-green-600 mb-4 bg-green-50 p-2.5 rounded-lg border border-green-100">{props.accountSuccess}</div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => props.setShowAccountModal(false)}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
