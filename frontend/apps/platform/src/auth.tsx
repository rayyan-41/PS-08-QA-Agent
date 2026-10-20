import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Auth, User } from 'firebase/auth';
import type { PlatformConfig } from './config';

/**
 * Firebase email/password sign-in. Active only when config.json has
 * "auth": "firebase". With "auth": "none" (the default, because the backend has
 * no auth yet) there is no sign-in and no token is sent.
 */
type AuthState =
  | { mode: 'none' }
  | { mode: 'firebase'; status: 'loading' | 'signed-out' | 'error'; error?: string }
  | { mode: 'firebase'; status: 'signed-in'; email: string };

interface AuthContextValue {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | undefined>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  config,
  children,
}: {
  config: PlatformConfig;
  children: ReactNode;
}) {
  const enabled = config.auth === 'firebase' && Boolean(config.firebase);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!enabled || !config.firebase) return;
    let unsubscribe: (() => void) | undefined;
    // Loaded on demand so the default "none" mode ships no Firebase code.
    void Promise.all([import('firebase/app'), import('firebase/auth')])
      .then(([appModule, authModule]) => {
        const app = appModule.initializeApp(config.firebase!);
        const instance = authModule.getAuth(app);
        setAuth(instance);
        unsubscribe = authModule.onAuthStateChanged(instance, (next) => {
          setUser(next);
          setStatus('ready');
        });
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : String(reason));
        setStatus('error');
      });
    return () => unsubscribe?.();
  }, [enabled, config.firebase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!auth) throw new Error('Sign-in is still loading. Try again in a moment.');
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(auth, email, password);
    },
    [auth],
  );
  const signOut = useCallback(async () => {
    if (!auth) return;
    const { signOut: firebaseSignOut } = await import('firebase/auth');
    await firebaseSignOut(auth);
  }, [auth]);
  const getToken = useCallback(async () => (user ? user.getIdToken() : undefined), [user]);

  const state: AuthState = useMemo(() => {
    if (!enabled) return { mode: 'none' };
    if (status === 'error') return { mode: 'firebase', status: 'error', error };
    if (status === 'loading') return { mode: 'firebase', status: 'loading' };
    return user
      ? { mode: 'firebase', status: 'signed-in', email: user.email ?? 'Signed in' }
      : { mode: 'firebase', status: 'signed-out' };
  }, [enabled, status, error, user]);

  const value = useMemo(
    () => ({ state, signIn, signOut, getToken }),
    [state, signIn, signOut, getToken],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
