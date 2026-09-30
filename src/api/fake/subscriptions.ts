// Fake SubscriptionsPort, following the API domain (Subscription.cs, RotationGroup.cs) and its messages.
// Awkward on purpose: Chris Pardo's subscription 409s on its first change — as if a colleague had just
// added an add-on — so the reload-and-reapply path is reachable.
import { FulfillmentMethodNames, SubscriptionStatus } from '../generated/enums';
import { ConflictError, NotFoundError, ValidationError } from '../errors';
import { SORT_KEYS } from '../sortKeys';
import type { SubscriptionListItem, SubscriptionsPort } from '../ports';
import type { Seed } from './seed';
import { currentItem, frequencyLabel, hasNothingScheduled, nextDate, preview, recount, repointTo, resequence, toDetail, todayDay, type RotationState } from './subscriptionModel';

const dateOnly = (iso: string) => iso.slice(0, 10);
const asDay = (date: string) => dateOnly(date) + 'T00:00:00Z';

export function createFakeSubscriptions(db: Seed, wait: () => Promise<void>): SubscriptionsPort {
  const conflictOnce = new Set(db.subscriptions.filter(s => s.customerName === 'Chris Pardo').map(s => s.id));

  const find = (id: string) => {
    const s = db.subscriptions.find(x => x.id === id);
    if (!s) throw new NotFoundError(`Subscription with ID '${id}' was not found.`);
    return s;
  };
  const editable = (s: SubscriptionListItem) => {
    if (s.status === SubscriptionStatus.Canceled) throw new ValidationError('A canceled subscription cannot be modified.');
  };
  const product = (id: string) => {
    const p = db.products.find(x => x.id === id);
    if (!p) throw new NotFoundError(`Product with ID '${id}' was not found.`);
    return p;
  };
  const group = (subId: string, groupId: string): RotationState => {
    const g = (db.rotationGroups.get(subId) ?? []).find(x => x.id === groupId);
    if (!g) throw new ValidationError(`Rotation group '${groupId}' was not found on this subscription.`);
    return g;
  };
  const rotationItem = (g: RotationState, itemId: string) => {
    const i = g.items.find(x => x.id === itemId);
    if (!i) throw new ValidationError(`Rotation item '${itemId}' was not found in this group.`);
    return i;
  };
  const quantity = (q: number | undefined) => {
    if (q === undefined || !Number.isInteger(q) || q < 1) throw new ValidationError('Quantity must be greater than zero.');
    return q;
  };

  /** Load, change, save — with the one planned collision. */
  const mutate = async (id: string, change: (s: SubscriptionListItem) => void) => {
    await wait();
    const s = find(id);
    if (conflictOnce.has(id)) {
      conflictOnce.delete(id);
      const pupcake = db.products.find(p => p.name.startsWith('Birthday Pupcake'))!;
      db.addOns.set(id, [...(db.addOns.get(id) ?? []), { id: crypto.randomUUID(), productId: pupcake.id, quantity: 1, note: 'Added by a colleague on the phone', createdAt: new Date().toISOString(), consumedAt: null }]);
      s.revision++;
      recount(db, id);
      throw new ConflictError('This subscription was changed by someone else while you were working on it. Reload and try again.');
    }
    change(s);
    s.revision++;
    s.updatedAt = new Date().toISOString();
    recount(db, id);
  };

  const sortValue = (s: SubscriptionListItem, key: string): string | number =>
    key === 'customer' ? s.customerName : key === 'status' ? s.status : key === 'createdAt' ? s.createdAt
      : key === 'lastDelivery' ? s.lastDeliveryDate ?? '' : key === 'name' ? (s.displayName ?? '') : s.nextDeliveryDate;

  return {
    async list(q) {
      await wait();
      const term = q.searchTerm?.trim().toLowerCase();
      let rows = db.subscriptions
        .filter(s => q.includeCanceled || q.status === SubscriptionStatus.Canceled || s.status !== SubscriptionStatus.Canceled)
        .filter(s => q.status === undefined || s.status === q.status)
        .filter(s => !q.customerId || s.customerId === q.customerId)
        .filter(s => !q.dueFrom || dateOnly(s.nextDeliveryDate) >= dateOnly(q.dueFrom))
        .filter(s => !q.dueTo || dateOnly(s.nextDeliveryDate) <= dateOnly(q.dueTo))
        .filter(s => q.pauseExpired === undefined || s.isPauseExpired === q.pauseExpired)
        .filter(s => !term || [s.customerName, s.name ?? '', s.displayName ?? ''].some(v => v.toLowerCase().includes(term)));
      const allowed = SORT_KEYS['/api/subscriptions'];
      const key = (allowed.keys as readonly string[]).includes(q.sortBy ?? '') ? q.sortBy! : allowed.default;
      rows = rows.sort((a, b) => {
        const x = sortValue(a, key), y = sortValue(b, key);
        return (typeof x === 'number' ? x - (y as number) : x.localeCompare(y as string)) * (q.sortDescending ? -1 : 1);
      });
      const pageSize = Math.min(Math.max(Number(q.pageSize ?? 25), 1), 200);
      const pageNumber = Math.max(Number(q.pageNumber ?? 1), 1);
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
      return {
        items: structuredClone(rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)),
        totalCount: rows.length, pageNumber, pageSize, totalPages, hasNextPage: pageNumber < totalPages, hasPreviousPage: pageNumber > 1,
      };
    },

    async get(id) {
      await wait();
      return structuredClone(toDetail(db, find(id)));
    },

    async create(body) {
      await wait();
      const c = db.customers.find(x => x.id === body.customerId);
      if (!c) throw new NotFoundError(`Customer with ID '${body.customerId}' was not found.`);
      if (dateOnly(body.firstDeliveryDate) < dateOnly(todayDay())) throw new ValidationError('First delivery date cannot be in the past.');
      const interval = body.frequencyInterval ?? 1;
      if (!Number.isInteger(interval) || interval < 1) {
        throw new ValidationError('The field FrequencyInterval must be between 1 and 2147483647.', { frequencyInterval: ['The field FrequencyInterval must be between 1 and 2147483647.'] });
      }
      const method = body.fulfillmentMethod ?? 1;
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const s: SubscriptionListItem = {
        id, customerId: c.id, customerName: c.fullName ?? `${c.firstName} ${c.lastName}`, name: body.name?.trim() || null, displayName: null,
        status: SubscriptionStatus.NewSignUp as SubscriptionListItem['status'], statusName: 'NewSignUp',
        frequencyInterval: interval, frequencyUnit: body.frequencyUnit, frequencyLabel: frequencyLabel(interval, body.frequencyUnit),
        fulfillmentMethod: method as SubscriptionListItem['fulfillmentMethod'], fulfillmentMethodName: FulfillmentMethodNames[method as 1 | 2 | 3],
        nextDeliveryDate: asDay(body.firstDeliveryDate), lastDeliveryDate: null, signUpDate: now, pausedUntil: null, isPauseExpired: false,
        itemCount: 0, rotationGroupCount: 0, pendingAddOnCount: 0, inactiveProductCount: 0, createdAt: now, updatedAt: null, revision: 1,
      };
      db.subscriptions.push(s);
      db.subscriptionItems.set(id, []);
      recount(db, id);
      return id;
    },

    async cancel(id) {
      await mutate(id, s => { s.status = SubscriptionStatus.Canceled as typeof s.status; s.pausedUntil = null; });
    },

    async nextDelivery(id) {
      await wait();
      const s = find(id);
      return preview(db, s, 0, s.nextDeliveryDate);
    },

    async upcoming(id, cycles) {
      await wait();
      const s = find(id);
      const out = [];
      let date = s.nextDeliveryDate;
      for (let i = 0; i < Math.min(Math.max(cycles, 1), 12); i++) {
        out.push(preview(db, s, i, date));
        date = nextDate(date, s.frequencyInterval, s.frequencyUnit);
      }
      return out;
    },

    async rename(id, name) {
      if (name && name.trim().length > 100) throw new ValidationError('Subscription name cannot exceed 100 characters.');
      await mutate(id, s => { editable(s); s.name = name?.trim() || null; });
    },

    async changeFrequency(id, body) {
      const interval = body.frequencyInterval ?? 1;
      if (!Number.isInteger(interval) || interval < 1) {
        throw new ValidationError('The field FrequencyInterval must be between 1 and 2147483647.', { frequencyInterval: ['The field FrequencyInterval must be between 1 and 2147483647.'] });
      }
      await mutate(id, s => {
        s.frequencyInterval = interval;
        s.frequencyUnit = body.frequencyUnit;
        if (body.recalculateNextDelivery ?? true) s.nextDeliveryDate = nextDate(s.lastDeliveryDate ?? todayDay(), interval, body.frequencyUnit);
      });
    },

    async changeFulfillment(id, method) {
      await mutate(id, s => { s.fulfillmentMethod = method; s.fulfillmentMethodName = FulfillmentMethodNames[method]; });
    },

    async reschedule(id, date) {
      await mutate(id, s => {
        if (s.status === SubscriptionStatus.Canceled) throw new ValidationError('A canceled subscription cannot be rescheduled.');
        if (dateOnly(date) < dateOnly(todayDay())) throw new ValidationError('Delivery date cannot be in the past.');
        s.nextDeliveryDate = asDay(date);
      });
    },

    async skip(id) {
      await mutate(id, s => {
        if (s.status === SubscriptionStatus.Canceled) throw new ValidationError('A canceled subscription has no deliveries to skip.');
        s.nextDeliveryDate = nextDate(s.nextDeliveryDate, s.frequencyInterval, s.frequencyUnit);
      });
    },

    async activate(id) {
      await mutate(id, s => {
        if (s.status === SubscriptionStatus.Canceled) throw new ValidationError('A canceled subscription cannot be reactivated.');
        if (hasNothingScheduled(db, id)) throw new ValidationError('A subscription needs at least one item or active rotation group before it can be activated.');
        s.status = SubscriptionStatus.Active as typeof s.status;
        s.pausedUntil = null;
      });
    },

    async pause(id, resumeOn) {
      await mutate(id, s => {
        if (s.status === SubscriptionStatus.Canceled) throw new ValidationError('A canceled subscription cannot be paused.');
        if (resumeOn && dateOnly(resumeOn) <= dateOnly(todayDay())) throw new ValidationError('A pause must end on a future date.');
        s.status = SubscriptionStatus.Paused as typeof s.status;
        s.pausedUntil = resumeOn ? asDay(resumeOn) : null;
      });
    },

    async resume(id) {
      await mutate(id, s => {
        if (s.status !== SubscriptionStatus.Paused) throw new ValidationError('Only a paused subscription can be resumed.');
        const resumeOn = s.pausedUntil;
        s.status = SubscriptionStatus.Active as typeof s.status;
        s.pausedUntil = null;
        // A dated pause resumes on its date; an open one that passed its delivery date rolls forward from today.
        if (resumeOn) s.nextDeliveryDate = asDay(resumeOn);
        else if (dateOnly(s.nextDeliveryDate) < dateOnly(todayDay())) s.nextDeliveryDate = nextDate(todayDay(), s.frequencyInterval, s.frequencyUnit);
      });
    },

    async addItem(id, body) {
      const q = quantity(body.quantity ?? 1);
      product(body.productId);
      await mutate(id, s => {
        editable(s);
        const items = db.subscriptionItems.get(id) ?? [];
        const existing = items.find(i => i.productId === body.productId);
        if (existing) existing.quantity += q;
        else items.push({ id: crypto.randomUUID(), productId: body.productId, quantity: q, createdAt: new Date().toISOString() });
        db.subscriptionItems.set(id, items);
      });
    },

    async changeItemQuantity(id, productId, qty) {
      const q = quantity(qty);
      await mutate(id, s => {
        editable(s);
        const item = (db.subscriptionItems.get(id) ?? []).find(i => i.productId === productId);
        if (!item) throw new ValidationError(`Product '${productId}' is not on this subscription.`);
        item.quantity = q;
      });
    },

    async removeItem(id, productId) {
      await mutate(id, s => {
        editable(s);
        db.subscriptionItems.set(id, (db.subscriptionItems.get(id) ?? []).filter(i => i.productId !== productId));
      });
    },

    async addAddOn(id, body) {
      const q = quantity(body.quantity ?? 1);
      product(body.productId);
      await mutate(id, s => {
        editable(s);
        const list = db.addOns.get(id) ?? [];
        const existing = list.find(a => !a.consumedAt && a.productId === body.productId);
        if (existing) existing.quantity += q;
        else list.push({ id: crypto.randomUUID(), productId: body.productId, quantity: q, note: body.note?.trim() || null, createdAt: new Date().toISOString(), consumedAt: null });
        db.addOns.set(id, list);
      });
    },

    async changeAddOnQuantity(id, addOnId, qty) {
      const q = quantity(qty);
      await mutate(id, s => {
        editable(s);
        const a = (db.addOns.get(id) ?? []).find(x => x.id === addOnId);
        if (!a) throw new ValidationError(`Add-on '${addOnId}' was not found on this subscription.`);
        a.quantity = q;
      });
    },

    async removeAddOn(id, addOnId) {
      await mutate(id, s => {
        editable(s);
        const a = (db.addOns.get(id) ?? []).find(x => x.id === addOnId);
        if (!a) return;
        if (a.consumedAt) throw new ValidationError('A consumed add-on cannot be removed; it is part of delivery history.');
        db.addOns.set(id, (db.addOns.get(id) ?? []).filter(x => x.id !== addOnId));
      });
    },

    async addRotationGroup(id, name) {
      await mutate(id, s => {
        editable(s);
        if (!name.trim()) throw new ValidationError('Rotation group name is required and cannot be empty.');
        const groups = db.rotationGroups.get(id) ?? [];
        if (groups.some(g => g.name.toLowerCase() === name.trim().toLowerCase())) {
          throw new ValidationError(`This subscription already has a rotation group named '${name.trim()}'.`);
        }
        groups.push({ id: crypto.randomUUID(), name: name.trim(), position: 0, isActive: true, createdAt: new Date().toISOString(), updatedAt: null, items: [] });
        db.rotationGroups.set(id, groups);
      });
    },

    async renameRotationGroup(id, groupId, name) {
      await mutate(id, s => {
        editable(s);
        if (!name.trim()) throw new ValidationError('Rotation group name is required and cannot be empty.');
        group(id, groupId).name = name.trim();
      });
    },

    async removeRotationGroup(id, groupId) {
      await mutate(id, s => { editable(s); db.rotationGroups.set(id, (db.rotationGroups.get(id) ?? []).filter(g => g.id !== groupId)); });
    },

    async pauseRotationGroup(id, groupId) {
      await mutate(id, s => { editable(s); group(id, groupId).isActive = false; });
    },

    async resumeRotationGroup(id, groupId) {
      await mutate(id, s => { editable(s); group(id, groupId).isActive = true; });
    },

    async addRotationItem(id, groupId, body) {
      const q = quantity(body.quantity ?? 1);
      product(body.productId);
      await mutate(id, s => {
        editable(s);
        const g = group(id, groupId);
        if (g.items.some(i => i.productId === body.productId)) {
          throw new ValidationError('That product is already in this rotation group. Adjust its quantity instead.');
        }
        const next = g.items.length ? Math.max(...g.items.map(i => i.sequenceOrder)) + 1 : 1;
        g.items.push({ id: crypto.randomUUID(), productId: body.productId, quantity: q, sequenceOrder: next, createdAt: new Date().toISOString() });
      });
    },

    async changeRotationItemQuantity(id, groupId, itemId, qty) {
      const q = quantity(qty);
      await mutate(id, s => { editable(s); rotationItem(group(id, groupId), itemId).quantity = q; });
    },

    async removeRotationItem(id, groupId, itemId) {
      await mutate(id, s => {
        editable(s);
        const g = group(id, groupId);
        const item = g.items.find(i => i.id === itemId);
        if (!item) return;
        const upNext = currentItem(g)?.productId;
        g.items = g.items.filter(i => i.id !== itemId);
        resequence(g);
        // If what was up next is still in the rotation, keep pointing at it.
        if (upNext && upNext !== item.productId) repointTo(g, upNext);
      });
    },

    async reorderRotation(id, groupId, order) {
      await mutate(id, s => {
        editable(s);
        const g = group(id, groupId);
        if (order.length !== g.items.length || new Set(order).size !== order.length || order.some(x => !g.items.some(i => i.id === x))) {
          throw new ValidationError('Reorder must list every item in this rotation group exactly once.');
        }
        const upNext = currentItem(g)?.productId;
        order.forEach((itemId, i) => { rotationItem(g, itemId).sequenceOrder = i + 1; });
        if (upNext) repointTo(g, upNext);
      });
    },

    async jumpTo(id, groupId, itemId) {
      await mutate(id, s => {
        editable(s);
        const g = group(id, groupId);
        repointTo(g, rotationItem(g, itemId).productId);
      });
    },
  };
}

