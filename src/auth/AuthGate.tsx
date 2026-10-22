import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { firebaseAuth, getFreshIdToken, signInWithGoogle, signOutCurrentUser } from './firebase-client';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let validationSequence = 0;
    const originalFetch = window.fetch.bind(window);

    const validateServerAccess = async (nextUser: User | null) => {
      const sequence = ++validationSequence;
      if (!active) return;
      setUser(nextUser);
      setAuthorized(false);
      setError(null);
      if (!nextUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = await nextUser.getIdToken();
        const response = await originalFetch('/api/auth/session', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!active || sequence !== validationSequence) return;
        if (!response.ok) {
          setAuthorized(false);
          setError(response.status === 403
            ? 'This Google account is not authorized for RZ MINETRIX.'
            : 'The server could not verify access. Please check deployment configuration.');
          return;
        }
        const session = await response.json() as { authenticated?: boolean };
        if (session.authenticated !== true) {
          setAuthorized(false);
          setError('The server did not confirm an authorized session.');
          return;
        }
        setAuthorized(true);
      } catch {
        if (active && sequence === validationSequence) {
          setAuthorized(false);
          setError('Unable to verify access with the server. Please try again later.');
        }
      } finally {
        if (active && sequence === validationSequence) setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      void validateServerAccess(nextUser);
    });

    const authenticatedApiFetch: typeof window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
      if (!url.startsWith('/api/') && !url.includes(`${window.location.origin}/api/`)) return originalFetch(input, init);

      const token = await getFreshIdToken();
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

      let response = await originalFetch(input, { ...init, headers });
      if (response.status === 401 && firebaseAuth.currentUser) {
        const refreshedToken = await getFreshIdToken(true);
        if (refreshedToken) {
          headers.set('Authorization', `Bearer ${refreshedToken}`);
          response = await originalFetch(input, { ...init, headers });
        }
      }
      return response;
    };

    window.fetch = authenticatedApiFetch;
    return () => {
      active = false;
      validationSequence += 1;
      unsubscribe();
      window.fetch = originalFetch;
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#090a0d] text-[#d4af37] flex items-center justify-center">Verifying RZ MINETRIX access…</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#090a0d] text-[#e5e7eb] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-[#d4af37]/30 bg-[#12141a] p-8 shadow-2xl">
          <div className="text-xs tracking-[0.35em] text-[#d4af37]">RZ MINETRIX</div>
          <h1 className="mt-3 text-2xl font-semibold">Business Operation System</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in with one of the two authorized Google accounts.</p>
          {error && <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
          <button className="mt-6 w-full rounded-xl bg-[#d4af37] px-4 py-3 font-semibold text-[#090a0d] transition hover:bg-[#f3c64c]" onClick={async () => {
            setError(null);
            try { await signInWithGoogle(); } catch (err) { setError(err instanceof Error ? err.message : 'Google sign-in failed'); }
          }}>Continue with Google</button>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#090a0d] text-[#e5e7eb] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#12141a] p-8 shadow-2xl">
          <div className="text-xs tracking-[0.35em] text-[#d4af37]">RZ MINETRIX</div>
          <h1 className="mt-3 text-2xl font-semibold">Access not authorized</h1>
          <p className="mt-3 text-sm text-slate-300">{error || 'The backend has not confirmed access for this account.'}</p>
          <button className="mt-6 w-full rounded-xl border border-[#d4af37]/40 px-4 py-3 font-semibold text-[#d4af37]" onClick={() => void signOutCurrentUser()}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => void signOutCurrentUser()} className="fixed right-4 top-4 z-50 rounded-lg border border-[#d4af37]/30 bg-[#12141a]/95 px-3 py-2 text-xs text-[#d4af37] backdrop-blur" title={user.email || 'Sign out'}>Sign out</button>
      {children}
    </div>
  );
};
