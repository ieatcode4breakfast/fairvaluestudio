import React from 'react';
import { Eye, EyeOff } from '../Icons';

interface AuthModalProps {
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  activeTab: 'login' | 'signup';
  setActiveTab: (tab: 'login' | 'signup') => void;
  
  // Login props
  loginEmail: string;
  setLoginEmail: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  showLoginPassword: boolean;
  setShowLoginPassword: (val: boolean) => void;
  loginError: string;
  setLoginError: (val: string) => void;
  handleLogin: () => void;

  // Signup props
  signupEmail: string;
  setSignupEmail: (val: string) => void;
  signupUsername: string;
  setSignupUsername: (val: string) => void;
  signupPassword: string;
  setSignupPassword: (val: string) => void;
  showSignupPassword: boolean;
  setShowSignupPassword: (val: boolean) => void;
  signupConfirmPassword: string;
  setSignupConfirmPassword: (val: string) => void;
  showSignupConfirmPassword: boolean;
  setShowSignupConfirmPassword: (val: boolean) => void;
  signupError: string;
  setSignupError: (val: string) => void;
  handleSignup: () => void;
}

export function AuthModal(props: AuthModalProps) {
  if (!props.showLoginModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95">
        <div className="flex border-b border-slate-200 mb-4">
          <button
            onClick={() => { props.setActiveTab('login'); props.setLoginError(''); props.setSignupError(''); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${props.activeTab === 'login' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Log in
          </button>
          <button
            onClick={() => { props.setActiveTab('signup'); props.setLoginError(''); props.setSignupError(''); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${props.activeTab === 'signup' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Sign up
          </button>
        </div>

        {props.activeTab === 'login' ? (
          <>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Log In</h3>
            <p className="text-sm text-slate-500 mb-4">Enter your credentials to access your valuations.</p>
            <div className="space-y-4 mb-6">
              <input
                type="email"
                placeholder="Email"
                value={props.loginEmail}
                onChange={(e) => props.setLoginEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') props.handleLogin();
                }}
              />
              <div className="relative">
                <input
                  type={props.showLoginPassword ? "text" : "password"}
                  placeholder="Password"
                  value={props.loginPassword}
                  onChange={(e) => props.setLoginPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') props.handleLogin();
                  }}
                />
                <button
                  type="button"
                  onClick={() => props.setShowLoginPassword(!props.showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {props.showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {props.loginError && (
              <div className="text-sm text-red-600 mb-4 text-center">{props.loginError}</div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => { props.setShowLoginModal(false); props.setLoginError(''); props.setLoginEmail(''); props.setLoginPassword(''); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button onClick={props.handleLogin} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Log In</button>
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
                value={props.signupEmail}
                onChange={(e) => props.setSignupEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') props.handleSignup();
                }}
              />
              <input
                type="text"
                placeholder="Username"
                value={props.signupUsername}
                onChange={(e) => props.setSignupUsername(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') props.handleSignup();
                }}
              />
              <div className="relative">
                <input
                  type={props.showSignupPassword ? "text" : "password"}
                  placeholder="Password (min 6 characters)"
                  value={props.signupPassword}
                  onChange={(e) => props.setSignupPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') props.handleSignup();
                  }}
                />
                <button
                  type="button"
                  onClick={() => props.setShowSignupPassword(!props.showSignupPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {props.showSignupPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={props.showSignupConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={props.signupConfirmPassword}
                  onChange={(e) => props.setSignupConfirmPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') props.handleSignup();
                  }}
                />
                <button
                  type="button"
                  onClick={() => props.setShowSignupConfirmPassword(!props.showSignupConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {props.showSignupConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {props.signupError && (
              <div className="text-sm text-red-600 mb-4 text-center">{props.signupError}</div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => { props.setShowLoginModal(false); props.setSignupError(''); props.setSignupEmail(''); props.setSignupUsername(''); props.setSignupPassword(''); props.setSignupConfirmPassword(''); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button onClick={props.handleSignup} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Sign Up</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
