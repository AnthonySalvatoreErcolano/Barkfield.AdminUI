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
    customers: {
      list: (query, signal) => http.get('/api/customers', { query, signal }),
      get: (customerId, signal) => http.get('/api/customers/{customerId}', { path: { customerId }, signal }),
      create: body => http.post('/api/customers', { body }),
      update: (customerId, body) => http.put('/api/customers/{customerId}', { path: { customerId }, body }),
      async archive(customerId) {
        await http.delete('/api/customers/{customerId}', { path: { customerId } });
      },
      async restore(customerId) {
        await http.post('/api/customers/{customerId}/reactivate', { path: { customerId } });
      },
      async updateDeliveryDetails(customerId, body) {
        await http.put('/api/customers/{customerId}/delivery-details', { path: { customerId }, body });
      },
      searchSquare: body => http.post('/api/customers/search-square', { body }),
      syncSquare: customerId => http.post('/api/customers/{customerId}/sync-square', { path: { customerId } }),
      pets: (customerId, includeInactive) =>
        http.get('/api/customers/{customerId}/pets', { path: { customerId }, query: { includeInactive } }),
      subscriptions: (customerId, includeCanceled) =>
        http.get('/api/customers/{customerId}/subscriptions', { path: { customerId }, query: { includeCanceled } }),
      deliveries: (customerId, page) =>
        http.get('/api/customers/{customerId}/deliveries', { path: { customerId }, query: page }),
    },
  };
}
