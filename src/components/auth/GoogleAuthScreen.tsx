import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { ShieldAlert, LogOut, CheckCircle2, ArrowRight, UserX, ShieldCheck, Mail, Sparkles } from 'lucide-react';

export const GoogleAuthScreen: React.FC = () => {
  const {
    user,
    isLoading,
    isAccessRestricted,
    restrictedEmail,
    authError,
    continueWithGoogle,
    signOut,
    clearRestrictedState,
  } = useAuth();

  const [showAccountChooser, setShowAccountChooser] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Quick Account selector for authorized users & testing unauthorized access
  const handleSelectAccount = async (email: string, name: string, photo?: string) => {
    setIsVerifying(true);
    await continueWithGoogle(email, name, photo);
    setIsVerifying(false);
    setShowAccountChooser(false);
  };

  const handleCustomAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    setIsVerifying(true);
    await continueWithGoogle(customEmail, customName || customEmail.split('@')[0]);
    setIsVerifying(false);
    setShowAccountChooser(false);
  };

  // 1. If Access Restricted
  if (isAccessRestricted) {
    return (
      <div className="min-h-screen bg-[#090a0d] text-[#e5e7eb] flex items-center justify-center p-4 antialiased">
        <div className="bg-[#12141a] border border-rose-900/50 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/40 border border-rose-800/50 flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-cinzel text-xl font-black text-rose-400 tracking-wide uppercase">
              Access Restricted
            </h2>
            <p className="text-sm text-gray-300 mt-2 font-medium">
              This Google account is not authorized to access RZ Laterite Stone Quarry.
            </p>
            {restrictedEmail && (
              <div className="mt-3 p-2 rounded-lg bg-[#0a0b0e] border border-rose-950 font-mono text-xs text-rose-300">
                {restrictedEmail}
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-[#090a0e] border border-[#1e2332] text-xs text-gray-400 text-left space-y-1">
            <span className="font-bold text-gray-300 block">Authorized Quarry Personnel:</span>
            <span>• Nafid (nafidkhan@racezoneventures.com)</span>
            <span className="block">• Aflah (aflah@racezoneventures.com)</span>
          </div>

          <button
            onClick={() => {
              signOut();
              clearRestrictedState();
            }}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#1e2332] hover:bg-[#282f42] text-gray-200 border border-[#2f364c] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Primary Google Login Screen
  return (
    <div className="min-h-screen bg-[#090a0d] text-[#e5e7eb] flex items-center justify-center p-4 antialiased relative overflow-hidden">
      {/* Subtle luxury gold gradient glow in background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-[#12141a] border border-[#232736] rounded-3xl p-6 sm:p-10 max-w-md w-full text-center space-y-8 shadow-2xl relative z-10">
        {/* Brand Identity */}
        <div className="space-y-3 flex flex-col items-center">
          <Logo size="xl" />
          <div className="pt-2">
            <span className="text-[11px] font-mono tracking-widest text-[#d4af37]/75 uppercase block">
              MINING & ENTERPRISE ERP
            </span>
          </div>
        </div>

        {/* Action Button: Continue with Google */}
        <div className="space-y-4 pt-2">
          <button
            onClick={() => setShowAccountChooser(true)}
            disabled={isVerifying || isLoading}
            className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-gray-100 text-[#1f1f1f] font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-white/5 cursor-pointer disabled:opacity-50"
          >
            {/* Official Google G Logo SVG */}
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isVerifying ? 'Verifying Google Account...' : 'Continue with Google'}</span>
          </button>

          <p className="text-xs text-gray-500 font-medium tracking-wide">
            Authorized quarry users only
          </p>
        </div>

        {/* Security Assurance Badge */}
        <div className="pt-2 border-t border-[#1e2332] flex items-center justify-center gap-2 text-[11px] text-gray-500">
          <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Google OAuth 2.0 Secure Access Control</span>
        </div>
      </div>

      {/* Google Account Selector Dialog */}
      {showAccountChooser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#12141a] border border-[#2b3144] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="text-center pb-2 border-b border-[#232736]">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-300">
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Choose a Google Account</span>
              </div>
              <span className="text-[11px] text-gray-500 mt-0.5 block">
                to continue to RZ MINETRIX
              </span>
            </div>

            {/* Authorized Accounts List */}
            <div className="space-y-2">
              {/* Account 1: Nafid */}
              <button
                onClick={() =>
                  handleSelectAccount(
                    'nafidkhan@racezoneventures.com',
                    'Nafid Khan',
                    'https://ui-avatars.com/api/?name=Nafid+Khan&background=d4af37&color=090a0d&bold=true'
                  )
                }
                disabled={isVerifying}
                className="w-full p-3 rounded-xl bg-[#171a25] hover:bg-[#202534] border border-[#272e42] flex items-center justify-between text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#d4af37] text-black font-black flex items-center justify-center text-sm shadow">
                    N
                  </div>
                  <div>
                    <span className="font-bold text-sm text-gray-100 block group-hover:text-[#f3c64c]">
                      Nafid
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      nafidkhan@racezoneventures.com
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#d4af37]/20 text-[#f3c64c] border border-[#d4af37]/30">
                  Authorized
                </span>
              </button>

              {/* Account 2: Aflah */}
              <button
                onClick={() =>
                  handleSelectAccount(
                    'aflah@racezoneventures.com',
                    'Aflah RZ',
                    'https://ui-avatars.com/api/?name=Aflah+RZ&background=d4af37&color=090a0d&bold=true'
                  )
                }
                disabled={isVerifying}
                className="w-full p-3 rounded-xl bg-[#171a25] hover:bg-[#202534] border border-[#272e42] flex items-center justify-between text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f3c64c] text-black font-black flex items-center justify-center text-sm shadow">
                    A
                  </div>
                  <div>
                    <span className="font-bold text-sm text-gray-100 block group-hover:text-[#f3c64c]">
                      Aflah
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      aflah@racezoneventures.com
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#d4af37]/20 text-[#f3c64c] border border-[#d4af37]/30">
                  Authorized
                </span>
              </button>

              {/* Account 3: Sulthan (Owner) */}
              <button
                onClick={() =>
                  handleSelectAccount(
                    'pullatsulthan@gmail.com',
                    'Sulthan Pullat',
                    'https://ui-avatars.com/api/?name=Sulthan+Pullat&background=d4af37&color=090a0d&bold=true'
                  )
                }
                disabled={isVerifying}
                className="w-full p-3 rounded-xl bg-[#171a25] hover:bg-[#202534] border border-[#272e42] flex items-center justify-between text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#e6b800] text-black font-black flex items-center justify-center text-sm shadow">
                    S
                  </div>
                  <div>
                    <span className="font-bold text-sm text-gray-100 block group-hover:text-[#f3c64c]">
                      Sulthan
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      pullatsulthan@gmail.com
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#d4af37]/20 text-[#f3c64c] border border-[#d4af37]/30">
                  Authorized
                </span>
              </button>
            </div>

            {/* Test another Google account to verify access restriction */}
            <div className="pt-2 border-t border-[#232736]">
              <details className="text-xs text-gray-400 cursor-pointer">
                <summary className="font-semibold text-gray-400 hover:text-white py-1">
                  Use another Google account... (Test Allowlist)
                </summary>
                <form onSubmit={handleCustomAccountSubmit} className="mt-2 space-y-2 text-left">
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="e.g. unauthorized.guest@gmail.com"
                    className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2.5 py-1.5 text-xs text-gray-100 font-mono focus:outline-none focus:border-rose-400"
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-3 py-1 rounded bg-[#252b3e] hover:bg-[#30384f] text-gray-200 text-[11px] font-bold"
                    >
                      Verify Account
                    </button>
                  </div>
                </form>
              </details>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAccountChooser(false)}
                className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded bg-[#171a25]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
