import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleAuthUser } from '../types/quarry';

interface AuthContextType {
  user: GoogleAuthUser | null;
  isLoading: boolean;
  isAccessRestricted: boolean;
  restrictedEmail: string | null;
  authError: string | null;
  continueWithGoogle: (email: string, displayName?: string, picture?: string) => Promise<boolean>;
  verifyGoogleCredential: (credential: string) => Promise<boolean>;
  signOut: () => void;
  clearRestrictedState: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_STORAGE_KEY = 'rz_minetrix_google_session_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<GoogleAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAccessRestricted, setIsAccessRestricted] = useState<boolean>(false);
  const [restrictedEmail, setRestrictedEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Restore session on load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          // Verify with backend
          fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: parsed.email }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.authorized && data.user) {
                setUser(data.user);
                setIsAccessRestricted(false);
              } else {
                localStorage.removeItem(SESSION_STORAGE_KEY);
                setUser(null);
                if (data.email) {
                  setIsAccessRestricted(true);
                  setRestrictedEmail(data.email);
                }
              }
            })
            .catch(() => {
              // Network fallback: retain parsed session
              setUser(parsed);
            })
            .finally(() => {
              setIsLoading(false);
            });
          return;
        }
      }
    } catch (e) {
      console.warn('Session load error:', e);
    }
    setIsLoading(false);
  }, []);

  const continueWithGoogle = async (
    email: string,
    displayName?: string,
    picture?: string
  ): Promise<boolean> => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: displayName,
          picture,
        }),
      });

      const data = await res.json();

      if (res.ok && data.authorized && data.user) {
        setUser(data.user);
        setIsAccessRestricted(false);
        setRestrictedEmail(null);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.user));
        setIsLoading(false);
        return true;
      } else {
        // Access restricted
        setUser(null);
        setIsAccessRestricted(true);
        setRestrictedEmail(email);
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setAuthError(data.error || 'This Google account is not authorized to access RZ Laterite Stone Quarry.');
        setIsLoading(false);
        return false;
      }
    } catch (err: any) {
      console.error('Google verification request failed:', err);
      // Fallback check if server offline: local allowlist check
      const normalized = email.trim().toLowerCase();
      const isNafid = normalized.includes('nafid');
      const isSulthan = normalized.includes('pullat') || normalized === 'pullatsulthan@gmail.com';
      const isAflah = normalized.includes('aflah');

      if (isNafid || isAflah || isSulthan) {
        const fallbackUser: GoogleAuthUser = {
          id: isNafid ? 'goog_nafid_rz' : isSulthan ? 'goog_sulthan_rz' : 'goog_aflah_rz',
          email: normalized,
          name: displayName || (isNafid ? 'Nafid Khan' : isSulthan ? 'Sulthan Pullat' : 'Aflah RZ'),
          shortName: isNafid ? 'Nafid' : isSulthan ? 'Sulthan' : 'Aflah',
          picture,
          verifiedAt: new Date().toISOString(),
        };
        setUser(fallbackUser);
        setIsAccessRestricted(false);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(fallbackUser));
        setIsLoading(false);
        return true;
      } else {
        setIsAccessRestricted(true);
        setRestrictedEmail(email);
        setAuthError('This Google account is not authorized to access RZ Laterite Stone Quarry.');
        setIsLoading(false);
        return false;
      }
    }
  };

  const verifyGoogleCredential = async (credential: string): Promise<boolean> => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();

      if (res.ok && data.authorized && data.user) {
        setUser(data.user);
        setIsAccessRestricted(false);
        setRestrictedEmail(null);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.user));
        setIsLoading(false);
        return true;
      } else {
        setUser(null);
        setIsAccessRestricted(true);
        setRestrictedEmail(data.email || 'unknown');
        setAuthError(data.error || 'This Google account is not authorized to access RZ Laterite Stone Quarry.');
        setIsLoading(false);
        return false;
      }
    } catch (err: any) {
      setAuthError('Failed to verify Google credential.');
      setIsLoading(false);
      return false;
    }
  };

  const signOut = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setUser(null);
    setIsAccessRestricted(false);
    setRestrictedEmail(null);
    setAuthError(null);
  };

  const clearRestrictedState = () => {
    setIsAccessRestricted(false);
    setRestrictedEmail(null);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAccessRestricted,
        restrictedEmail,
        authError,
        continueWithGoogle,
        verifyGoogleCredential,
        signOut,
        clearRestrictedState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
