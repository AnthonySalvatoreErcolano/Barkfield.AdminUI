// The subscription rules the API's domain enforces (Subscription.cs, RotationGroup.cs), for the fake:
// how the next box is built (standing items, then each active rotation group's current item, then
// pending add-ons), what a completed cycle does (rotations advance, add-ons are consumed), and the
// derived fields the DTOs carry. Shared by the subscriptions fake and delivery generation.
import { DeliveryLineSource, FrequencyUnit, SubscriptionStatus } from '../generated/enums';
import type { DeliveryPreview, Product, RotationGroup, SubscriptionDetail, SubscriptionListItem } from '../ports';
import type { Seed } from './seed';

export interface RotationState {
  id: string;
  name: string;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  items: Array<{ id: string; productId: string; quantity: number; sequenceOrder: number; createdAt: string }>;
}

export interface AddOnState {
  id: string;
  productId: string;
  quantity: number;
  note: string | null;
  createdAt: string;
  consumedAt: string | null;
}

export interface ItemState {
  id: string;
  productId: string;
  quantity: number;
  createdAt: string;
}

/** The API's OrderFrequency.ToString(): "every week", "every 3 weeks". */
export function frequencyLabel(interval: number, unit: number) {
  const name = { [FrequencyUnit.Days]: 'days', [FrequencyUnit.Weeks]: 'weeks', [FrequencyUnit.Months]: 'months' }[unit] ?? 'weeks';
  return interval === 1 ? `every ${name.replace(/s$/, '')}` : `every ${interval} ${name}`;
}

/** The next date after `from` on this cadence. Date-only in, date-only out. */
export function nextDate(from: string, interval: number, unit: number): string {
  const [y, m, d] = from.slice(0, 10).split('-').map(Number);
  const t = unit === FrequencyUnit.Months
    ? new Date(Date.UTC(y!, m! - 1 + interval, d!))
    : new Date(Date.UTC(y!, m! - 1, d! + interval * (unit === FrequencyUnit.Weeks ? 7 : 1)));
  return t.toISOString().slice(0, 10) + 'T00:00:00Z';
}

export const todayDay = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())).toISOString().slice(0, 10) + 'T00:00:00Z';
};

const ordered = (g: RotationState) => [...g.items].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
export const currentItem = (g: RotationState) => (g.items.length ? ordered(g)[g.position % g.items.length]! : null);

/** Point the rotation at a product while keeping the cycle count (RotationGroup.RepointTo). */
export function repointTo(g: RotationState, productId: string) {
  const list = ordered(g);
  const index = list.findIndex(i => i.productId === productId);
  if (index < 0 || !list.length) return;
  const cycles = Math.floor(g.position / list.length);
  g.position = cycles * list.length + index;
}

export function resequence(g: RotationState) {
  ordered(g).forEach((item, i) => { item.sequenceOrder = i + 1; });
}

const productOf = (db: Seed, id: string) => db.products.find(p => p.id === id)!;

interface ManifestLine { product: Product; quantity: number; source: number; sourceId: string; sourceLabel: string | null }

/** What the delivery `offset` cycles from now would contain (BuildManifestFor). */
export function manifest(db: Seed, subId: string, offset = 0): ManifestLine[] {
  const lines: ManifestLine[] = [];
  for (const item of db.subscriptionItems.get(subId) ?? []) {
    lines.push({ product: productOf(db, item.productId), quantity: item.quantity, source: DeliveryLineSource.Recurring, sourceId: item.id, sourceLabel: null });
  }
  for (const g of (db.rotationGroups.get(subId) ?? []).filter(x => x.isActive).sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    if (!g.items.length) continue;
    const item = ordered(g)[(g.position + offset) % g.items.length]!;
    lines.push({ product: productOf(db, item.productId), quantity: item.quantity, source: DeliveryLineSource.Rotation, sourceId: g.id, sourceLabel: g.name });
  }
  // Add-ons ride on the next delivery only.
  if (offset === 0) {
    for (const a of (db.addOns.get(subId) ?? []).filter(x => !x.consumedAt)) {
      lines.push({ product: productOf(db, a.productId), quantity: a.quantity, source: DeliveryLineSource.AddOn, sourceId: a.id, sourceLabel: a.note });
    }
  }
  return lines;
}

/** After a delivery is generated: rotations move on, add-ons are used up. */
export function completeCycle(db: Seed, subId: string) {
  for (const g of db.rotationGroups.get(subId) ?? []) if (g.isActive && g.items.length) g.position++;
  for (const a of db.addOns.get(subId) ?? []) if (!a.consumedAt) a.consumedAt = new Date().toISOString();
  recount(db, subId);
}

export function preview(db: Seed, sub: SubscriptionListItem, offset: number, date: string): DeliveryPreview {
  const lines = manifest(db, sub.id, offset);
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    deliveryDate: date, cycleNumber: offset + 1,
    lines: lines.map(l => ({
      productId: l.product.id, productName: l.product.name, quantity: l.quantity, unitPrice: l.product.price,
      source: ['', 'Recurring', 'Rotation', 'AddOn', 'Manual'][l.source]!, sourceId: l.sourceId, sourceLabel: l.sourceLabel,
      productIsActive: l.product.isActive, lineTotal: round(l.product.price * l.quantity),
    })),
    isEmpty: lines.length === 0, totalUnits: lines.reduce((s, l) => s + l.quantity, 0),
    estimatedTotal: round(lines.reduce((s, l) => s + l.product.price * l.quantity, 0)),
    discontinuedProductNames: [...new Set(lines.filter(l => !l.product.isActive).map(l => l.product.name))],
  };
}

/** Keep the list item's derived counts and names in step with the detail state. */
export function recount(db: Seed, subId: string) {
  const s = db.subscriptions.find(x => x.id === subId);
  if (!s) return;
  const items = db.subscriptionItems.get(subId) ?? [];
  const groups = db.rotationGroups.get(subId) ?? [];
  const addOns = (db.addOns.get(subId) ?? []).filter(a => !a.consumedAt);
  s.itemCount = items.length;
  s.rotationGroupCount = groups.length;
  s.pendingAddOnCount = addOns.length;
  const productIds = [...items.map(i => i.productId), ...groups.flatMap(g => g.items.map(i => i.productId)), ...addOns.map(a => a.productId)];
  s.inactiveProductCount = new Set(productIds.filter(id => !productOf(db, id).isActive)).size;
  s.frequencyLabel = frequencyLabel(s.frequencyInterval, s.frequencyUnit);
  s.displayName = s.name ?? s.frequencyLabel;
  s.statusName = ['', 'NewSignUp', 'Active', 'Paused', 'Canceled'][s.status]!;
  s.isPauseExpired = s.status === SubscriptionStatus.Paused && s.pausedUntil !== null && s.pausedUntil.slice(0, 10) <= todayDay().slice(0, 10);
}

export function hasNothingScheduled(db: Seed, subId: string) {
  return !(db.subscriptionItems.get(subId)?.length) && !(db.rotationGroups.get(subId) ?? []).some(g => g.isActive && g.items.length);
}

export function toDetail(db: Seed, s: SubscriptionListItem): SubscriptionDetail {
  const round = (n: number) => Math.round(n * 100) / 100;
  const line = (productId: string, quantity: number) => {
    const p = productOf(db, productId);
    return { productId, productName: p.name, unitPrice: p.price, productIsActive: p.isActive, quantity, lineTotal: round(p.price * quantity) };
  };
  const groups: RotationGroup[] = (db.rotationGroups.get(s.id) ?? []).map(g => {
    const items = ordered(g).map(i => ({ ...line(i.productId, i.quantity), id: i.id, rotationGroupId: g.id, sequenceOrder: i.sequenceOrder, createdAt: i.createdAt, updatedAt: null }));
    const current = currentItem(g);
    return {
      id: g.id, name: g.name, rotationPosition: g.position, isActive: g.isActive, createdAt: g.createdAt, updatedAt: g.updatedAt,
      items, completedCycles: g.items.length ? Math.floor(g.position / g.items.length) : 0,
      currentItem: (current ? items.find(i => i.id === current.id)! : null) as RotationGroup['currentItem'],
      hasInactiveProduct: items.some(i => !i.productIsActive),
    };
  });
  const pending = (db.addOns.get(s.id) ?? []).filter(a => !a.consumedAt);
  const discontinued = [...new Set([
    ...(db.subscriptionItems.get(s.id) ?? []).map(i => i.productId),
    ...groups.flatMap(g => g.items.map(i => i.productId)),
    ...pending.map(a => a.productId),
  ].map(id => productOf(db, id)).filter(p => !p.isActive).map(p => p.name))];
  return {
    id: s.id, customerId: s.customerId, customerName: s.customerName, name: s.name, displayName: s.displayName,
    status: s.status, statusName: s.statusName, frequencyInterval: s.frequencyInterval, frequencyUnit: s.frequencyUnit, frequencyLabel: s.frequencyLabel,
    fulfillmentMethod: s.fulfillmentMethod, fulfillmentMethodName: s.fulfillmentMethodName,
    nextDeliveryDate: s.nextDeliveryDate, lastDeliveryDate: s.lastDeliveryDate, signUpDate: s.signUpDate, pausedUntil: s.pausedUntil,
    createdAt: s.createdAt, updatedAt: s.updatedAt, revision: s.revision, isPauseExpired: s.isPauseExpired,
    items: (db.subscriptionItems.get(s.id) ?? []).map(i => ({ ...line(i.productId, i.quantity), id: i.id, createdAt: i.createdAt, updatedAt: null })),
    rotationGroups: groups,
    pendingAddOns: pending.map(a => ({ ...line(a.productId, a.quantity), id: a.id, note: a.note, consumedAt: null, isPending: true, createdAt: a.createdAt, updatedAt: null })),
    hasNothingScheduled: hasNothingScheduled(db, s.id),
    discontinuedProductNames: discontinued,
  };
}
