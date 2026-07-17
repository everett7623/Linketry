import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, checkMe, type AuthResult } from '../api/auth';
import { getApiBaseOverride, getBuildApiBase, setApiBaseOverride } from '../api/client';
import {
  readBrowserSetting,
  removeBrowserSetting,
  writeBrowserSetting,
} from '../utils/browserStorage';
import { DEMO_ACCESS_CODE, IS_PUBLIC_DEMO } from '../config/demo';
import { isValidDemoAccessCode } from '../utils/demoMode';

interface AuthState {
  authenticated: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string) => Promise<AuthResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function initialAuthState(): AuthState {
  if (!IS_PUBLIC_DEMO) return { authenticated: false, loading: true };
  try {
    return {
      authenticated: readBrowserSetting('demoAccess') === 'granted',
      loading: false,
    };
  } catch {
    return { authenticated: false, loading: false };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialAuthState);

  useEffect(() => {
    if (IS_PUBLIC_DEMO) return;

    const stored = readBrowserSetting('token');
    if (!stored) {
      setState({ authenticated: false, loading: false });
      return;
    }
    checkMe().then(async (result) => {
      const overrideApiBase = getApiBaseOverride();
      const buildApiBase = getBuildApiBase();
      if (
        result === 'unreachable' &&
        overrideApiBase &&
        buildApiBase &&
        overrideApiBase !== buildApiBase
      ) {
        const buildResult = await checkMe(buildApiBase);
        if (buildResult === 'authenticated') {
          setApiBaseOverride('');
          result = buildResult;
        }
      }
      setState({ authenticated: result === 'authenticated', loading: false });
      if (result === 'unauthorized') removeBrowserSetting('token');
    });
  }, []);

  const login = useCallback(async (token: string): Promise<AuthResult> => {
    if (IS_PUBLIC_DEMO) {
      if (!isValidDemoAccessCode(token, DEMO_ACCESS_CODE)) return 'unauthorized';
      writeBrowserSetting('demoAccess', 'granted');
      setState({ authenticated: true, loading: false });
      return 'authenticated';
    }

    writeBrowserSetting('token', token);
    const result = await apiLogin(token);
    if (result === 'authenticated') {
      setState({ authenticated: true, loading: false });
    } else {
      removeBrowserSetting('token');
      setState({ authenticated: false, loading: false });
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    if (IS_PUBLIC_DEMO) {
      removeBrowserSetting('demoAccess');
      setState({ authenticated: false, loading: false });
      return;
    }
    removeBrowserSetting('token');
    setState({ authenticated: false, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
