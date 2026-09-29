// Live implementations over http.ts. No cross-cutting concerns here — those all belong to http.ts.
import { clearAccessToken, configureHttp, http, refreshSession, setAccessToken } from '../http';
import type { Api } from '../ports';

export function createLiveApi(): Api {
  const expiredListeners = new Set<() => void>();
  configureHttp({ onSessionExpired: () => expiredListeners.forEach(l => l()) });

  return {
    auth: {
      async login(credentials) {
        const { accessToken } = await http.post('/api/auth/login', { body: credentials });
        setAccessToken(accessToken);
      },
      async logout() {
        try {
          await http.post('/api/auth/logout');
        } catch {
          // Already expired or unreachable: there is nothing left to end server-side that we can reach.
        } finally {
          clearAccessToken();
        }
      },
      restore: refreshSession,
      async forgotPassword(body) {
        await http.post('/api/auth/forgot-password', { body });
      },
      async resetPassword(body) {
        await http.post('/api/auth/reset-password', { body });
      },
      onSessionExpired(listener) {
        expiredListeners.add(listener);
        return () => expiredListeners.delete(listener);
      },
    },
    users: {
      me: () => http.get('/api/users/me'),
      async changePassword(body) {
        await http.post('/api/users/me/change-password', { body });
      },
    },
  };
}
