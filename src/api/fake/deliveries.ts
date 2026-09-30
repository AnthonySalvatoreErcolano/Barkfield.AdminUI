// Fake DeliveriesPort and ProductsPort. The guards and messages are the API domain's own
// (Delivery.cs): closed deliveries refuse changes, paid contents are locked, packing needs every line
// resolved, a delivery cannot be emptied. Awkward on purpose:
//   - Tess Nolan's delivery 409s on its first change, as if the procurement board saved a line at the
//     same moment — the reload shows that other line moved
//   - generation skips Jake Morrison (no address), resumes Beth Sullivan (dated pause ends today) and
//     picks up two overdue subscriptions, so partial success is what a normal run looks like
import { DeliveryLineSource, DeliveryStatus, DeliveryStatusNames, FulfillmentMethod, LineOrderStatus, PaymentStatus, SubscriptionStatus } from '../generated/enums';
import { ConflictError, NotFoundError, ValidationError } from '../errors';
import { SORT_KEYS } from '../sortKeys';
import type { DeliveriesPort, DeliveryDetail, DeliveryLine, DueSubscription, LineAction, ProductsPort } from '../ports';
import { makeLine, recompute, toDeliveryListItem } from './deliveryModel';
import { completeCycle, manifest } from './subscriptionModel';
import type { Seed } from './seed';

const dateOnly = (iso: string) => iso.slice(0, 10);
const asDay = (date: string) => dateOnly(date) + 'T00:00:00Z';

/** The domain guards and line transitions, shared by the delivery detail and the procurement board fakes. */
export function lineRules(db: Seed) {
  const findLine = (d: DeliveryDetail, lineId: string) => {
    const l = d.lines.find(x => x.id === lineId);
    if (!l) throw new ValidationError(`Delivery line '${lineId}' was not found on this delivery.`);
    return l;
  };
  const product = (id: string) => {
    const p = db.products.find(x => x.id === id);
    if (!p) throw new NotFoundError(`Product with ID '${id}' was not found.`);
    return p;
  };
  const ensureOpen = (d: DeliveryDetail) => {
    if (d.isClosed) throw new ValidationError(`This delivery is already '${DeliveryStatusNames[d.status]}' and cannot be changed.`);
  };
  const ensureContentsEditable = (d: DeliveryDetail) => {
    ensureOpen(d);
    if (d.contentsAreLocked) {
      throw new ValidationError('This delivery has already been charged, so its contents cannot be changed. Refund or adjust the payment in Square first.');
    }
  };

  const setLine = (l: DeliveryLine, status: number, note?: string) => {
    l.orderStatus = status as DeliveryLine['orderStatus'];
    l.substitutedWithProductId = null;
    l.substitutedWithProductName = null;
    l.substitutedWithUnitPrice = null;
    l.statusNote = note?.trim() || null;
    l.statusUpdatedAt = new Date().toISOString();
  };

  /** One procurement decision on one line, under the domain's guards. Throws ValidationError. */
  const applyLineAction = (d: DeliveryDetail, lineId: string, action: LineAction) => {
    ensureOpen(d);
    const l = findLine(d, lineId);
    switch (action.kind) {
      case 'ordered': setLine(l, LineOrderStatus.Ordered, action.note); break;
      case 'out-of-stock': setLine(l, LineOrderStatus.OutOfStock, action.note); break;
      case 'short': setLine(l, LineOrderStatus.Shorted, action.note); break;
      case 'reset': setLine(l, LineOrderStatus.Pending, action.note); l.quantityReceived = 0; break;
      case 'received': {
        const qty = action.quantityReceived ?? l.quantity;
        if (qty < 0) throw new ValidationError('Received quantity cannot be negative.');
        // Derived from the count, not taken on trust: fewer than ordered stays on the worklist.
        setLine(l, qty === 0 ? LineOrderStatus.Ordered : qty >= l.quantity ? LineOrderStatus.Received : LineOrderStatus.PartiallyReceived, action.note);
        l.quantityReceived = qty;
        break;
      }
      case 'substitute': {
        // A substitute carries its own price, so it changes the contents — refused once paid.
        ensureContentsEditable(d);
        const p = product(action.substituteProductId);
        if (!p.isActive) throw new ValidationError(`Replacement product '${p.id}' was not found.`);
        setLine(l, LineOrderStatus.Substituted, action.note);
        l.substitutedWithProductId = p.id;
        l.substitutedWithProductName = p.name;
        l.substitutedWithUnitPrice = p.price;
        break;
      }
    }
  };
  return { findLine, product, ensureOpen, ensureContentsEditable, setLine, applyLineAction };
}

export function createFakeDeliveries(db: Seed, wait: () => Promise<void>): DeliveriesPort {
  const { findLine, product, ensureOpen, ensureContentsEditable, setLine, applyLineAction } = lineRules(db);
  const conflictOnce = new Set(db.deliveries.filter(d => d.customerName === 'Tess Nolan' && !d.isClosed).map(d => d.id));

  const find = (id: string) => {
    const d = db.deliveries.find(x => x.id === id);
    if (!d) throw new NotFoundError(`Delivery with ID '${id}' was not found.`);
    return d;
  };
  /** Load, change, save with the revision bumped — and the one planned collision. */
  const mutate = (id: string, change: (d: DeliveryDetail) => void) => {
    const d = find(id);
    if (conflictOnce.has(id)) {
      conflictOnce.delete(id);
      const other = d.lines.find(l => l.orderStatus === LineOrderStatus.Pending);
      if (other) { other.orderStatus = LineOrderStatus.Ordered as DeliveryLine['orderStatus']; other.statusNote = 'Ordered from the procurement board.'; }
      d.revision++;
      d.updatedAt = new Date().toISOString();
      recompute(d);
      throw new ConflictError('This delivery was changed by someone else while you were working on it. Reload and try again.');
    }
    change(d);
    d.revision++;
    d.updatedAt = new Date().toISOString();
    recompute(d);
  };

  const dueFor = (date: string): DueSubscription[] => {
    const day = dateOnly(date);
    return db.subscriptions
      .filter(s => {
        const customer = db.customers.find(c => c.id === s.customerId);
        if (!customer?.isActive) return false;
        const pauseEnded = s.status === SubscriptionStatus.Paused && s.pausedUntil !== null && dateOnly(s.pausedUntil) <= day;
        const already = db.deliveries.some(d => d.subscriptionId === s.id && dateOnly(d.scheduledFor) === day && d.status !== DeliveryStatus.Canceled);
        return already || ((s.status === SubscriptionStatus.Active || pauseEnded) && dateOnly(s.nextDeliveryDate) <= day);
      })
      .map(s => {
        const customer = db.customers.find(c => c.id === s.customerId)!;
        const alreadyGenerated = db.deliveries.some(d => d.subscriptionId === s.id && dateOnly(d.scheduledFor) === day && d.status !== DeliveryStatus.Canceled);
        const lineCount = manifest(db, s.id).length;
        // The API's own order of reasons (GenerationModels.cs).
        const skipReason = alreadyGenerated ? 'A delivery already exists for this date.'
          : lineCount === 0 ? 'Nothing is scheduled to ship.'
          : s.fulfillmentMethod === FulfillmentMethod.LocalDelivery && !customer.hasAddress ? 'The customer has no address on file for a local delivery.'
          : null;
        return {
          subscriptionId: s.id, subscriptionName: s.name, customerId: s.customerId, customerName: s.customerName,
          nextDeliveryDate: s.nextDeliveryDate, status: s.status, statusName: s.statusName, fulfillmentMethod: s.fulfillmentMethod, fulfillmentMethodName: s.fulfillmentMethodName,
          pausedUntil: s.pausedUntil, customerHasAddress: customer.hasAddress, alreadyGenerated, scheduledLineCount: lineCount,
          resumingFromPause: s.status === SubscriptionStatus.Paused && s.pausedUntil !== null,
          isOverdue: !alreadyGenerated && dateOnly(s.nextDeliveryDate) < day,
          skipReason, willGenerate: skipReason === null,
        };
      })
      .sort((a, b) => Number(a.willGenerate) - Number(b.willGenerate) || a.customerName.localeCompare(b.customerName));
  };

  const newDelivery = (customerId: string, sub: Seed['subscriptions'][number] | null, date: string, method: number, lines: DeliveryLine[], notes: string | null) => {
    const c = db.customers.find(x => x.id === customerId)!;
    const d: DeliveryDetail = recompute({
      id: crypto.randomUUID(), subscriptionId: sub?.id ?? null, subscriptionName: sub?.name ?? null,
      // The name, or the composed label for an unnamed subscription; null for a one-off.
      subscriptionDisplayName: sub?.displayName ?? null, frequencyInterval: sub?.frequencyInterval ?? null, frequencyUnit: sub?.frequencyUnit ?? null,
      customerId, customerName: c.fullName ?? `${c.firstName} ${c.lastName}`,
      scheduledFor: asDay(date), completedAt: null, status: DeliveryStatus.Scheduled as DeliveryDetail['status'],
      fulfillmentMethod: method as DeliveryDetail['fulfillmentMethod'], procurementStatus: 1 as DeliveryDetail['procurementStatus'],
      paymentStatus: PaymentStatus.NotCharged as DeliveryDetail['paymentStatus'], paymentAttemptCount: 0,
      paymentFailureCode: null, paymentFailureReason: null, paymentAttemptedAt: null, squareOrderId: null, squarePaymentId: null, squareReceiptUrl: null,
      amountCharged: null, astroCompleted: false, externalOrderId: null, sentToRoutingAt: null, notes, failureReason: null,
      createdAt: new Date().toISOString(), updatedAt: null, revision: 1,
      lines, discounts: [], photos: [], driverNotes: null, customerNotifiedAt: null, customerHasBeenNotified: false, hasProofOfDelivery: false,
      deliveryStreet: c.street ?? '', deliveryCity: c.city ?? '', deliveryState: c.state ?? '', deliveryZipCode: c.zipCode ?? '',
      deliveryLatitude: c.latitude, deliveryLongitude: c.longitude,
      requestedWindowStart: c.preferredWindowStart, requestedWindowEnd: c.preferredWindowEnd, serviceDurationMinutesOverride: null,
      customerPhoneNumber: c.phoneNumber, accessNotes: c.accessNotes, serviceDurationMinutes: c.serviceDurationMinutes,
      totalUnits: 0, total: 0, unresolvedLines: [], chargeVariance: null, needsRefundAttention: false, packingBlockers: [], effectiveServiceDurationMinutes: 0,
      statusName: null, fulfillmentMethodName: null, procurementStatusName: null, paymentStatusName: null,
      isOneOff: false, isClosed: false, isReadyToPack: false, hasPaid: false, contentsAreLocked: false, paymentFailed: false,
    });
    db.deliveries.push(d);
    return d;
  };

  const sortValue = (d: DeliveryDetail, key: string): string | number =>
    key === 'customer' ? d.customerName : key === 'status' ? d.status : key === 'procurement' ? d.procurementStatus
      : key === 'createdAt' ? d.createdAt : key === 'total' ? d.total : d.scheduledFor + d.customerName;

  return {
    async list(q) {
      await wait();
      const term = q.searchTerm?.trim().toLowerCase();
      let rows = db.deliveries
        .filter(d => q.includeClosed || !d.isClosed)
        .filter(d => !q.customerId || d.customerId === q.customerId)
        .filter(d => !q.subscriptionId || d.subscriptionId === q.subscriptionId)
        .filter(d => !q.scheduledFrom || dateOnly(d.scheduledFor) >= dateOnly(q.scheduledFrom))
        .filter(d => !q.scheduledTo || dateOnly(d.scheduledFor) <= dateOnly(q.scheduledTo))
        .filter(d => q.status === undefined || d.status === q.status)
        .filter(d => q.procurementStatus === undefined || d.procurementStatus === q.procurementStatus)
        .filter(d => q.fulfillmentMethod === undefined || d.fulfillmentMethod === q.fulfillmentMethod)
        .filter(d => q.hasPaid === undefined || d.hasPaid === q.hasPaid)
        .filter(d => !q.oneOffOnly || d.isOneOff)
        .filter(d => !term || [d.customerName, d.subscriptionName ?? ''].some(v => v.toLowerCase().includes(term)));
      const allowed = SORT_KEYS['/api/deliveries'];
      const key = (allowed.keys as readonly string[]).includes(q.sortBy ?? '') ? q.sortBy! : allowed.default;
      rows = rows.sort((a, b) => {
        const x = sortValue(a, key), y = sortValue(b, key);
        return (typeof x === 'number' ? x - (y as number) : x.localeCompare(y as string)) * (q.sortDescending ? -1 : 1);
      });
      const pageSize = Math.min(Math.max(Number(q.pageSize ?? 25), 1), 200);
      const pageNumber = Math.max(Number(q.pageNumber ?? 1), 1);
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
      return {
        items: rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize).map(d => toDeliveryListItem(structuredClone(d))),
        totalCount: rows.length, pageNumber, pageSize, totalPages, hasNextPage: pageNumber < totalPages, hasPreviousPage: pageNumber > 1,
      };
    },

    async get(id) {
      await wait();
      return structuredClone(find(id));
    },

    async due(date) {
      await wait();
      return dueFor(date);
    },

    async generate(date) {
      await wait();
      const due = dueFor(date);
      const created: string[] = [];
      const resumed: string[] = [];
      for (const candidate of due.filter(d => d.willGenerate)) {
        const s = db.subscriptions.find(x => x.id === candidate.subscriptionId)!;
        // The subscription's manifest: standing items, each active rotation's current item, pending add-ons.
        const lines = manifest(db, s.id).map(m => makeLine(m.product, m.quantity, m.source, m.sourceId));
        created.push(newDelivery(s.customerId, s, date, s.fulfillmentMethod, lines, null).id);
        completeCycle(db, s.id); // rotations move on, add-ons are used up
        if (candidate.resumingFromPause) {
          resumed.push(s.id);
          s.status = SubscriptionStatus.Active as typeof s.status;
          s.statusName = 'Active';
          s.pausedUntil = null;
        }
        const cycle = s.frequencyUnit === 1 ? s.frequencyInterval : s.frequencyUnit === 2 ? s.frequencyInterval * 7 : s.frequencyInterval * 30;
        s.lastDeliveryDate = asDay(date);
        s.nextDeliveryDate = new Date(Date.parse(asDay(date)) + cycle * 86_400_000).toISOString().slice(0, 10) + 'T00:00:00Z';
      }
      const skipped = due.filter(d => !d.willGenerate).map(d => ({
        subscriptionId: d.subscriptionId, subscriptionName: d.subscriptionName ?? 'Unnamed subscription', customerName: d.customerName, reason: d.skipReason!,
      }));
      return {
        deliveryDate: asDay(date), considered: due.length, createdDeliveryIds: created, resumedFromPause: resumed, skipped,
        created: created.length, skippedCount: skipped.length, resumedCount: resumed.length,
      };
    },

    async createOneOff(body) {
      await wait();
      const c = db.customers.find(x => x.id === body.customerId);
      if (!c) throw new NotFoundError(`Customer with ID '${body.customerId}' was not found.`);
      if (!body.lines.length) throw new ValidationError('A delivery cannot be scheduled with no line items.');
      const method = body.fulfillmentMethod ?? FulfillmentMethod.LocalDelivery;
      if (method === FulfillmentMethod.LocalDelivery && !c.hasAddress) {
        throw new ValidationError(`${c.fullName} has no address on file, so a local delivery cannot be scheduled.`);
      }
      const lines = body.lines.map(l => {
        const p = product(l.productId);
        if (!p.isActive) throw new ValidationError(`'${p.name}' has been discontinued and cannot be added to a delivery.`);
        return makeLine(p, l.quantity ?? 1, DeliveryLineSource.Manual, null);
      });
      newDelivery(c.id, null, body.scheduledFor, method, lines, body.notes ?? null);
    },

    async sheet({ from, to }) {
      await wait();
      return db.deliveries
        .filter(d => d.status !== DeliveryStatus.Canceled && dateOnly(d.scheduledFor) >= dateOnly(from) && dateOnly(d.scheduledFor) <= dateOnly(to))
        .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor) || a.customerName.localeCompare(b.customerName))
        .map(d => ({
          deliveryId: d.id, scheduledFor: d.scheduledFor, customerId: d.customerId, customerName: d.customerName, phoneNumber: d.customerPhoneNumber,
          deliveryStreet: d.deliveryStreet || null, deliveryCity: d.deliveryCity || null, fulfillmentMethod: d.fulfillmentMethod, fulfillmentMethodName: d.fulfillmentMethodName,
          subscriptionName: d.subscriptionName, totalUnits: d.totalUnits,
          // No lineId, by design: the sheet is for paper, not for acting on.
          lines: d.lines.map(l => ({
            productName: l.productName, quantity: l.quantity, substitutedWithProductName: l.substitutedWithProductName, packingName: l.packingName,
            orderStatus: l.orderStatus, orderStatusName: l.orderStatusName, isShorted: l.orderStatus === LineOrderStatus.Shorted,
          })),
        }));
    },

    async lineAction(id, lineId, action) {
      await wait();
      mutate(id, d => applyLineAction(d, lineId, action));
    },

    async orderAll(id, note) {
      await wait();
      mutate(id, d => {
        ensureOpen(d);
        d.lines.filter(l => !l.isResolved).forEach(l => setLine(l, LineOrderStatus.Ordered, note));
      });
    },

    async pack(id) {
      await wait();
      mutate(id, d => {
        ensureOpen(d);
        if (d.status !== DeliveryStatus.Scheduled) throw new ValidationError(`A delivery in '${DeliveryStatusNames[d.status]}' cannot be marked packed.`);
        if (!d.isReadyToPack) {
          throw new ValidationError(`This delivery cannot be packed until every line is resolved. Outstanding: ${(d.packingBlockers ?? []).join(', ')}.`);
        }
        d.status = DeliveryStatus.Packed as DeliveryDetail['status'];
      });
    },

    async addLine(id, { productId, quantity = 1 }) {
      await wait();
      mutate(id, d => {
        ensureContentsEditable(d);
        const p = product(productId);
        if (!p.isActive) throw new ValidationError(`'${p.name}' has been discontinued and cannot be added to a delivery.`);
        const existing = d.lines.find(l => l.productId === productId);
        if (existing) { existing.quantity += quantity; existing.quantityReceived = 0; setLine(existing, LineOrderStatus.Pending); }
        else d.lines.push(makeLine(p, quantity, DeliveryLineSource.Manual, null));
      });
    },

    async changeQuantity(id, lineId, quantity) {
      await wait();
      mutate(id, d => {
        ensureContentsEditable(d);
        if (quantity <= 0) throw new ValidationError('Quantity must be greater than zero.');
        const l = findLine(d, lineId);
        l.quantity = quantity;
        l.quantityReceived = 0;
        setLine(l, LineOrderStatus.Pending); // a new quantity starts procurement again
      });
    },

    async removeLine(id, lineId) {
      await wait();
      mutate(id, d => {
        ensureContentsEditable(d);
        findLine(d, lineId);
        if (d.lines.length === 1) throw new ValidationError('A delivery must have at least one line. Cancel it instead of emptying it.');
        d.lines = d.lines.filter(l => l.id !== lineId);
      });
    },

    async updateNotes(id, notes) {
      await wait();
      mutate(id, d => { d.notes = notes?.trim() || null; });
    },

    async setWindow(id, { start, end }) {
      await wait();
      mutate(id, d => {
        ensureOpen(d);
        if ((start && !end) || (!start && end)) throw new ValidationError('A delivery window needs both a start and an end time.');
        if (start && end && end <= start) throw new ValidationError(`A time window must end after it starts (got ${start.slice(0, 5)}–${end.slice(0, 5)}).`);
        d.requestedWindowStart = start;
        d.requestedWindowEnd = end;
      });
    },

    async setServiceDuration(id, minutes) {
      await wait();
      mutate(id, d => {
        ensureOpen(d);
        if (minutes !== null && (minutes < 0 || minutes > 480)) throw new ValidationError('Service duration must be between 0 and 480 minutes.');
        d.serviceDurationMinutesOverride = minutes;
      });
    },

    async markDelivered(id, deliveredOn) {
      await wait();
      mutate(id, d => {
        ensureOpen(d);
        d.status = DeliveryStatus.Delivered as DeliveryDetail['status'];
        d.completedAt = deliveredOn ?? new Date().toISOString();
      });
    },

    async markFailed(id, reason) {
      await wait();
      mutate(id, d => {
        ensureOpen(d);
        if (!reason.trim()) throw new ValidationError('A failure reason is required.');
        d.status = DeliveryStatus.Failed as DeliveryDetail['status'];
        d.failureReason = reason.trim();
      });
    },

    async cancel(id) {
      await wait();
      mutate(id, d => {
        ensureOpen(d);
        d.status = DeliveryStatus.Canceled as DeliveryDetail['status'];
      });
    },

    async photo() {
      await wait();
      // A stand-in picture: the real endpoint proxies Routific's proof-of-delivery image bytes.
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#C09473"/><rect x="220" y="200" width="200" height="140" fill="#8a6a4d"/><text x="320" y="420" font-family="sans-serif" font-size="26" fill="#fff" text-anchor="middle">Proof of delivery (sample)</text></svg>`;
      return new Blob([svg], { type: 'image/svg+xml' });
    },
  };
}

export function createFakeProducts(db: Seed, wait: () => Promise<void>): ProductsPort {
  return {
    async list(q) {
      await wait();
      const term = q.searchTerm?.trim().toLowerCase();
      const rows = db.products
        .filter(p => q.includeInactive || p.isActive)
        .filter(p => !term || [p.name, p.sku ?? ''].some(v => v.toLowerCase().includes(term)))
        .sort((a, b) => a.name.localeCompare(b.name));
      const pageSize = Math.min(Math.max(Number(q.pageSize ?? 25), 1), 200);
      const pageNumber = Math.max(Number(q.pageNumber ?? 1), 1);
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
      return {
        items: structuredClone(rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)),
        totalCount: rows.length, pageNumber, pageSize, totalPages, hasNextPage: pageNumber < totalPages, hasPreviousPage: pageNumber > 1,
      };
    },
  };
}
