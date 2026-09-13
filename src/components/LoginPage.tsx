import React, { useState } from 'react';
import {
  ShieldCheck,
  Cloud,
  CheckCircle2,
  FolderKanban,
  CheckSquare,
  Lightbulb,
  Users,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, continueAsGuest, error, clearError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3b1a5b] via-[#48216e] to-[#250d3d] flex flex-col justify-center items-center px-4 py-12 selection:bg-purple-300">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 text-stone-900 border border-white/20">
          
          {/* Logo & Header */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#48216e] text-white flex items-center justify-center font-black text-2xl shadow-md tracking-wider">
              PW
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 mb-2">
              Productivity Workspace
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Sign in with your Google account to automatically link and sync your Trello-style boards, ideas, tasks, and clients with Firestore.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-900">Sign In Issue</p>
                <p className="mt-0.5">{error}</p>
                <div className="mt-2.5 flex items-center gap-3">
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-900 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-lg transition"
                  >
                    Open in new tab ↗
                  </a>
                  {error.includes('Authorized Domains') && (
                    <a
                      href="https://console.firebase.google.com/project/gen-lang-client-0738073213/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-900 bg-purple-100 hover:bg-purple-200 px-2.5 py-1 rounded-lg transition"
                    >
                      Open Firebase Console ↗
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={clearError}
                    className="text-rose-700 underline font-medium hover:text-rose-900 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Google Sign In Button */}
          <div className="space-y-3">
            <button
              id="google-login-button"
              type="button"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full relative flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-sm border border-stone-300 hover:border-stone-400 rounded-xl shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {isSigningIn ? (
                <RefreshCw className="w-5 h-5 text-stone-500 animate-spin" />
              ) : (
                <span className="w-6 h-6 flex items-center justify-center font-bold text-base bg-stone-100 text-stone-800 rounded-full border border-stone-200 group-hover:bg-stone-200 transition-colors">
                  G
                </span>
              )}
              <span>
                {isSigningIn ? 'Connecting with Google...' : 'Continue with Google'}
              </span>
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-stone-400">or</span>
            </div>

            <button
              id="continue-as-guest-button"
              type="button"
              onClick={continueAsGuest}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-900 text-xs font-medium rounded-xl border border-stone-200 transition-colors cursor-pointer"
            >
              <span>Explore as Guest (Local Offline Preview)</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>

          {/* Benefits / Features List */}
          <div className="mt-8 pt-6 border-t border-stone-100">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
              Included with your Google Account
            </p>
            <ul className="space-y-2.5 text-xs text-stone-600">
              <li className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Real-time Firebase Firestore database persistence</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant sync across all your browsers and tabs</span>
              </li>
              <li className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Project milestones and client request conversions</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Secured by Firebase Auth & account-level rules</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-stone-400 mt-6">
          Your workspace data is encrypted and accessible only through your authenticated Google identity.
        </p>
      </div>
    </div>
  );
};
