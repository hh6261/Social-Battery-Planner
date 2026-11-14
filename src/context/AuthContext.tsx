import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { dataService, RegistrationInput, User, UserPatch } from '../services';

/**
 * loading    – restoring a remembered session on launch
 * signedOut  – Splash / Log in / Registration
 * onboarding – registered (or logged in) but hasn't finished Onboarding + Personalization
 * signedIn   – main app with the tab bar
 */
export type AuthStatus = 'loading' | 'signedOut' | 'onboarding' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signIn(email: string, password: string, remember: boolean): Promise<void>;
  register(input: RegistrationInput): Promise<void>;
  finishOnboarding(): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
  updateUser(patch: UserPatch): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    dataService
      .getSession()
      .then((session) => {
        if (cancelled) return;
        setUser(session?.user ?? null);
        setStatus(!session ? 'signedOut' : session.onboarded ? 'signedIn' : 'onboarding');
      })
      .catch(() => {
        if (!cancelled) setStatus('signedOut');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string, remember: boolean) => {
    const session = await dataService.signIn(email, password, remember);
    setUser(session.user);
    setStatus(session.onboarded ? 'signedIn' : 'onboarding');
  }, []);

  const register = useCallback(async (input: RegistrationInput) => {
    const session = await dataService.register(input);
    setUser(session.user);
    setStatus('onboarding');
  }, []);

  const finishOnboarding = useCallback(async () => {
    if (!user) return;
    await dataService.completeOnboarding(user.id);
    setStatus('signedIn');
  }, [user]);

  const signOut = useCallback(async () => {
    await dataService.signOut();
    setUser(null);
    setStatus('signedOut');
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    await dataService.deleteAccount(user.id);
    setUser(null);
    setStatus('signedOut');
  }, [user]);

  const updateUser = useCallback(
    async (patch: UserPatch) => {
      if (!user) return;
      const updated = await dataService.updateUser(user.id, patch);
      setUser(updated);
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, register, finishOnboarding, signOut, deleteAccount, updateUser }),
    [status, user, signIn, register, finishOnboarding, signOut, deleteAccount, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** For screens that only render when signed in (Profile tab etc.). */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('useCurrentUser called while signed out');
  return user;
}
