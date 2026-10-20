import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { firebaseAuth, signInWithGoogle, signOutCurrentUser } from './firebase-client';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(firebaseAuth, (nextUser) => {
    setUser(nextUser);
    setLoading(false);
  }), []);

  if (loading) {
    return <div className="min-h-screen bg-[#090a0d] text-[#d4af37] flex items-center justify-center">Loading RZ MINETRIX…</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#090a0d] text-[#e5e7eb] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-[#d4af37]/30 bg-[#12141a] p-8 shadow-2xl">
          <div className="text-xs tracking-[0.35em] text-[#d4af37]">RZ MINETRIX</div>
          <h1 className="mt-3 text-2xl font-semibold">Business Operation System</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in with your authorized Google account to continue.</p>
          {error && <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
          <button
            className="mt-6 w-full rounded-xl bg-[#d4af37] px-4 py-3 font-semibold text-[#090a0d] transition hover:bg-[#f3c64c]"
            onClick={async () => {
              setError(null);
              try { await signInWithGoogle(); } catch (err) { setError(err instanceof Error ? err.message : 'Google sign-in failed'); }
            }}
          >
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void signOutCurrentUser()}
        className="fixed right-4 top-4 z-50 rounded-lg border border-[#d4af37]/30 bg-[#12141a]/95 px-3 py-2 text-xs text-[#d4af37] backdrop-blur"
        title={user.email || 'Sign out'}
      >
        Sign out
      </button>
      {children}
    </div>
  );
};
