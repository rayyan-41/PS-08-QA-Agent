import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { PlatformConfig } from '../config';
import { readJson, writeJson } from '../lib/storage';
import { createBackend, type Backend, type TokenGetter } from './backend';

interface BackendContextValue {
  config: PlatformConfig;
  devtools: boolean;
  /** Active backend base URL ("" = same origin). */
  target: string;
  setTarget: (target: string) => void;
  backend: Backend;
}

const BackendContext = createContext<BackendContextValue | null>(null);
const TARGET_KEY = 'pokayoke.backendTarget';

export function BackendProvider({
  config,
  devtools,
  getToken,
  children,
}: {
  config: PlatformConfig;
  devtools: boolean;
  getToken?: TokenGetter;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  // The inspector's saved target only applies while devtools are enabled.
  const [target, setTargetState] = useState<string>(() =>
    devtools ? readJson<string>(TARGET_KEY, config.apiBaseUrl) : config.apiBaseUrl,
  );
  const backend = useMemo(() => createBackend(target, getToken), [target, getToken]);

  const value = useMemo<BackendContextValue>(
    () => ({
      config,
      devtools,
      target,
      backend,
      setTarget: (next: string) => {
        writeJson(TARGET_KEY, next);
        setTargetState(next);
        void queryClient.invalidateQueries();
      },
    }),
    [config, devtools, target, backend, queryClient],
  );
  return <BackendContext.Provider value={value}>{children}</BackendContext.Provider>;
}

export function useBackend(): BackendContextValue {
  const value = useContext(BackendContext);
  if (!value) throw new Error('useBackend must be used inside BackendProvider.');
  return value;
}
