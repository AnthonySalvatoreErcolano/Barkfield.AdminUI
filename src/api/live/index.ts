// Live implementations over http.ts. No cross-cutting concerns here — those all belong to http.ts.
import { clearAccessToken, configureHttp, http, refreshSessionWithin, setAccessToken } from '../http';
import type { Api } from '../ports';
import { toApiDay } from '../../lib/dates';

/** Charging goes to Square once per delivery; a day's run can take minutes. */
const CHARGE_TIMEOUT_MS = 5 * 60_000;

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
      // Waits a bounded time; the refresh itself is never aborted (see http.ts).
      restore: () => refreshSessionWithin(),
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
    deliveries: {
      list: (query, signal) => http.get('/api/deliveries', { query, signal }),
      get: (deliveryId, signal) => http.get('/api/deliveries/{deliveryId}', { path: { deliveryId }, signal }),
      due: date => http.get('/api/deliveries/due', { query: { date } }),
      generate: date => http.post('/api/deliveries/generate', { body: { deliveryDate: date } }),
      async createOneOff(body) {
        await http.post('/api/deliveries', { body });
      },
      sheet: range => http.get('/api/deliveries/sheet', { query: range }),
      async lineAction(deliveryId, lineId, action) {
        const path = { deliveryId, lineId };
        const note = action.note?.trim() || null;
        switch (action.kind) {
          case 'ordered': await http.post('/api/deliveries/{deliveryId}/lines/{lineId}/ordered', { path, body: { note } }); break;
          case 'received':
            await http.post('/api/deliveries/{deliveryId}/lines/{lineId}/received', {
              path, body: { quantityReceived: action.quantityReceived ?? null, note },
            });
            break;
          case 'out-of-stock': await http.post('/api/deliveries/{deliveryId}/lines/{lineId}/out-of-stock', { path, body: { note } }); break;
          case 'substitute':
            await http.post('/api/deliveries/{deliveryId}/lines/{lineId}/substitute', {
              path, body: { substituteProductId: action.substituteProductId, note },
            });
            break;
          case 'short': await http.post('/api/deliveries/{deliveryId}/lines/{lineId}/short', { path, body: { note } }); break;
          case 'reset': await http.post('/api/deliveries/{deliveryId}/lines/{lineId}/reset', { path, body: { note } }); break;
        }
      },
      async orderAll(deliveryId, note) {
        await http.post('/api/deliveries/{deliveryId}/order-all', { path: { deliveryId }, body: { note: note?.trim() || null } });
      },
      async pack(deliveryId) {
        await http.post('/api/deliveries/{deliveryId}/pack', { path: { deliveryId } });
      },
      async addLine(deliveryId, body) {
        await http.post('/api/deliveries/{deliveryId}/lines', { path: { deliveryId }, body });
      },
      async changeQuantity(deliveryId, lineId, quantity) {
        await http.put('/api/deliveries/{deliveryId}/lines/{lineId}/quantity', { path: { deliveryId, lineId }, body: { quantity } });
      },
      async removeLine(deliveryId, lineId) {
        await http.delete('/api/deliveries/{deliveryId}/lines/{lineId}', { path: { deliveryId, lineId } });
      },
      async updateNotes(deliveryId, notes) {
        await http.put('/api/deliveries/{deliveryId}/notes', { path: { deliveryId }, body: { notes } });
      },
      async setWindow(deliveryId, window) {
        await http.put('/api/deliveries/{deliveryId}/window', { path: { deliveryId }, body: window });
      },
      async setServiceDuration(deliveryId, minutes) {
        await http.put('/api/deliveries/{deliveryId}/service-duration', { path: { deliveryId }, body: { minutes } });
      },
      async markDelivered(deliveryId, deliveredOn) {
        await http.post('/api/deliveries/{deliveryId}/delivered', { path: { deliveryId }, body: { deliveredOn: deliveredOn ?? null } });
      },
      async markFailed(deliveryId, reason) {
        await http.post('/api/deliveries/{deliveryId}/failed', { path: { deliveryId }, body: { reason } });
      },
      async cancel(deliveryId) {
        await http.delete('/api/deliveries/{deliveryId}', { path: { deliveryId } });
      },
      photo: (deliveryId, photoUuid) =>
        http.blob('/api/dispatch/deliveries/{deliveryId}/photos/{photoUuid}', { path: { deliveryId, photoUuid } }),
    },
    products: {
      list: (query, signal) => http.get('/api/products', { query, signal }),
    },
    billing: {
      discounts: () => http.get('/api/discounts'),
      async selectDiscounts(deliveryId, squareDiscountIds) {
        await http.put('/api/deliveries/{deliveryId}/discounts', { path: { deliveryId }, body: { squareDiscountIds } });
      },
      // Real card payments: a long limit, because giving up early would not stop the charge.
      charge: deliveryId => http.post('/api/deliveries/{deliveryId}/charge', { path: { deliveryId }, timeoutMs: CHARGE_TIMEOUT_MS }),
      chargeAll: date => http.post('/api/deliveries/charge-all', { body: { deliveryDate: toApiDay(date) }, timeoutMs: CHARGE_TIMEOUT_MS }),
      needsAttention: range => http.get('/api/deliveries/needs-attention', { query: range }),
    },
    subscriptions: {
      list: (query, signal) => http.get('/api/subscriptions', { query, signal }),
      get: (subscriptionId, signal) => http.get('/api/subscriptions/{subscriptionId}', { path: { subscriptionId }, signal }),
      // The API returns the new id in the 201 body; the spec omits that body, so the type says void.
      create: async body => (await http.post('/api/subscriptions', { body })) as unknown as string,
      async cancel(subscriptionId) {
        await http.delete('/api/subscriptions/{subscriptionId}', { path: { subscriptionId } });
      },
      nextDelivery: subscriptionId => http.get('/api/subscriptions/{subscriptionId}/next-delivery', { path: { subscriptionId } }),
      upcoming: (subscriptionId, cycles) => http.get('/api/subscriptions/{subscriptionId}/upcoming', { path: { subscriptionId }, query: { cycles } }),
      async rename(subscriptionId, name) {
        await http.put('/api/subscriptions/{subscriptionId}/name', { path: { subscriptionId }, body: { name } });
      },
      async changeFrequency(subscriptionId, body) {
        await http.put('/api/subscriptions/{subscriptionId}/frequency', { path: { subscriptionId }, body });
      },
      async changeFulfillment(subscriptionId, fulfillmentMethod) {
        await http.put('/api/subscriptions/{subscriptionId}/fulfillment', { path: { subscriptionId }, body: { fulfillmentMethod } });
      },
      async reschedule(subscriptionId, nextDeliveryDate) {
        await http.put('/api/subscriptions/{subscriptionId}/schedule', { path: { subscriptionId }, body: { nextDeliveryDate: toApiDay(nextDeliveryDate) } });
      },
      async skip(subscriptionId) {
        await http.post('/api/subscriptions/{subscriptionId}/skip', { path: { subscriptionId } });
      },
      async activate(subscriptionId) {
        await http.post('/api/subscriptions/{subscriptionId}/activate', { path: { subscriptionId } });
      },
      async pause(subscriptionId, resumeOn) {
        await http.post('/api/subscriptions/{subscriptionId}/pause', { path: { subscriptionId }, body: { resumeOn: resumeOn ? toApiDay(resumeOn) : null } });
      },
      async resume(subscriptionId) {
        await http.post('/api/subscriptions/{subscriptionId}/resume', { path: { subscriptionId } });
      },
      async addItem(subscriptionId, body) {
        await http.post('/api/subscriptions/{subscriptionId}/items', { path: { subscriptionId }, body });
      },
      async changeItemQuantity(subscriptionId, productId, quantity) {
        await http.put('/api/subscriptions/{subscriptionId}/items/{productId}', { path: { subscriptionId, productId }, body: { quantity } });
      },
      async removeItem(subscriptionId, productId) {
        await http.delete('/api/subscriptions/{subscriptionId}/items/{productId}', { path: { subscriptionId, productId } });
      },
      async addAddOn(subscriptionId, body) {
        await http.post('/api/subscriptions/{subscriptionId}/add-ons', { path: { subscriptionId }, body });
      },
      async changeAddOnQuantity(subscriptionId, addOnId, quantity) {
        await http.put('/api/subscriptions/{subscriptionId}/add-ons/{addOnId}', { path: { subscriptionId, addOnId }, body: { quantity } });
      },
      async removeAddOn(subscriptionId, addOnId) {
        await http.delete('/api/subscriptions/{subscriptionId}/add-ons/{addOnId}', { path: { subscriptionId, addOnId } });
      },
      async addRotationGroup(subscriptionId, name) {
        await http.post('/api/subscriptions/{subscriptionId}/rotation-groups', { path: { subscriptionId }, body: { name } });
      },
      async renameRotationGroup(subscriptionId, groupId, name) {
        await http.put('/api/subscriptions/{subscriptionId}/rotation-groups/{groupId}', { path: { subscriptionId, groupId }, body: { name } });
      },
      async removeRotationGroup(subscriptionId, groupId) {
        await http.delete('/api/subscriptions/{subscriptionId}/rotation-groups/{groupId}', { path: { subscriptionId, groupId } });
      },
      async pauseRotationGroup(subscriptionId, groupId) {
        await http.post('/api/subscriptions/{subscriptionId}/rotation-groups/{groupId}/pause', { path: { subscriptionId, groupId } });
      },
      async resumeRotationGroup(subscriptionId, groupId) {
        await http.post('/api/subscriptions/{subscriptionId}/rotation-groups/{groupId}/resume', { path: { subscriptionId, groupId } });
      },
      async addRotationItem(subscriptionId, groupId, body) {
        await http.post('/api/subscriptions/{subscriptionId}/rotation-groups/{groupId}/items', { path: { subscriptionId, groupId }, body });
      },
      async changeRotationItemQuantity(subscriptionId, groupId, itemId, quantity) {
        await http.put('/api/subscriptions/{subscriptionId}/rotation-groups/{groupId}/items/{itemId}', { path: { subscriptionId, groupId, itemId }, body: { quantity } });
      },
      async removeRotationItem(subscriptionId, groupId, itemId) {
        await http.delete('/api/subscriptions/{subscriptionId}/rotation-groups/{groupId}/items/{itemId}', { path: { subscriptionId, groupId, itemId } });
      },
      async reorderRotation(subscriptionId, groupId, itemIdsInOrder) {
        await http.put('/api/subscriptions/{subscriptionId}/rotation-groups/{groupId}/order', { path: { subscriptionId, groupId }, body: { itemIdsInOrder } });
      },
      async jumpTo(subscriptionId, groupId, itemId) {
        await http.post('/api/subscriptions/{subscriptionId}/rotation-groups/{groupId}/jump-to/{itemId}', { path: { subscriptionId, groupId, itemId } });
      },
    },
    procurement: {
      products: (query, signal) => http.get('/api/procurement/products', { query, signal }),
      lines: (query, signal) => http.get('/api/procurement/lines', { query, signal }),
      apply: decisions => http.post('/api/procurement/lines/status', { body: { lines: decisions } }),
    },
  };
}
