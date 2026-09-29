// Session state for the whole app: restoring → signedOut | signedIn. Holds the signed-in user and
// answers every permission question.
//
// Gating is always on the flat `permissions` array, never on role names or isAdmin — an admin comes
// back holding every permission, so no special case is needed (API-CONTEXT §3).

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Api, UserDetail } from '../api/ports';
import { OPERATION_PERMISSIONS, type GatedOperation, type Permission } from '../api/generated/permissions';

export type SessionState =
  | { status: 'restoring' }
  | { status: 'signedOut'; reason?: 'expired' | 'signedOut' }
  | { status: 'signedIn'; user: UserDetail };

export interface Session {
  state: SessionState;
  /** The signed-in user. Only call inside the signed-in part of the app. */
  user: UserDetail;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  /** Holds this permission. */
  can(permission: Permission): boolean;
  /**
   * May call this operation, per the spec's x-required-permission. Prefer this over `can` in screens:
   * a control is gated on the endpoint it calls, so the permission string is never retyped.
   */
  canCall(operation: GatedOperation): boolean;
}

const SessionContext = createContext<Session | null>(null);
const ApiContext = createContext<Api | null>(null);

export function SessionProvider({ api, children }: { api: Api; children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SessionState>({ status: 'restoring' });

  // Restore once. StrictMode runs this effect twice in development; the ref keeps it to one pass, and
  // the refresh itself is single-flight in http.ts regardless.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    (async () => {
      try {
        if (await api.auth.restore()) {
          setState({ status: 'signedIn', user: await api.users.me() });
          return;
        }
      } catch {
        // Fall through: any failure while restoring just means "show sign-in".
      }
      setState({ status: 'signedOut' });
    })();
  }, [api]);

  useEffect(() => api.auth.onSessionExpired(() => {
    queryClient.clear();
    setState({ status: 'signedOut', reason: 'expired' });
  }), [api, queryClient]);

  const signIn = useCallback(async (email: string, password: string) => {
    await api.auth.login({ email, password });
    const user = await api.users.me();
    queryClient.clear(); // nothing cached under a previous user survives into this one
    setState({ status: 'signedIn', user });
  }, [api, queryClient]);

  const signOut = useCallback(async () => {
    await api.auth.logout();
    queryClient.clear();
    setState({ status: 'signedOut', reason: 'signedOut' });
  }, [api, queryClient]);

  const value = useMemo<Session>(() => {
    const granted = new Set(state.status === 'signedIn' ? state.user.permissions : []);
    const can = (permission: Permission) => granted.has(permission);
    return {
      state,
      get user() {
        if (state.status !== 'signedIn') throw new Error('useSession().user read outside the signed-in app');
        return state.user;
      },
      signIn,
      signOut,
      can,
      canCall: operation => can(OPERATION_PERMISSIONS[operation]),
    };
  }, [state, signIn, signOut]);

  return (
    <ApiContext.Provider value={api}>
      <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
    </ApiContext.Provider>
  );
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside <SessionProvider>');
  return session;
}

/**
 * The API implementation this app was started with (live or fake). Screens always take it from here,
 * never by importing the module singleton, so tests and fake mode reach every screen.
 */
export function useApi(): Api {
  const api = useContext(ApiContext);
  if (!api) throw new Error('useApi must be used inside <SessionProvider>');
  return api;
}

/** Renders children only when the user may call the operation. For hiding controls, not for security. */
export function Can({ call, children, fallback = null }: { call: GatedOperation; children: ReactNode; fallback?: ReactNode }) {
  return useSession().canCall(call) ? children : fallback;
}
