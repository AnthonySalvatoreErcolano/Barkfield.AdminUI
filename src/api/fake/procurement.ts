// Fake ProcurementPort, over the same deliveries and line rules as the delivery detail fake, so the
// board and the detail can never disagree. Mirrors the API (ProcurementService / ProcurementQueries):
//   - scope: the date range is required; cancelled deliveries always excluded, delivered and failed
//     only with includeClosed
//   - product rows: pending/ordered by line quantity, received by what actually arrived
//   - the bulk write: one save per delivery; outcomes for every line; the whole batch refused for an
//     empty request, a repeated line, or more than 500 decisions
// Awkward on purpose: Ann Cho's delivery "keeps changing" on its first batch, so the board has
// to render a partial failure — the rest of the batch still applies.
import { DeliveryStatus, LineOrderStatus } from '../generated/enums';
import { ValidationError } from '../errors';
import { SORT_KEYS } from '../sortKeys';
import type { DeliveryDetail, DeliveryLine, LineAction, ProcurementDecision, ProcurementLine, ProcurementPort, ProcurementProduct, ProcurementQuery } from '../ports';
import { recompute } from './deliveryModel';
import { lineRules } from './deliveries';
import type { Seed } from './seed';

const dateOnly = (iso: string) => iso.slice(0, 10);

function toAction(d: ProcurementDecision): LineAction {
  const note = d.note ?? undefined;
  switch (d.status) {
    case LineOrderStatus.Pending: return { kind: 'reset', note };
    case LineOrderStatus.Ordered: return { kind: 'ordered', note };
    case LineOrderStatus.OutOfStock: return { kind: 'out-of-stock', note };
    case LineOrderStatus.Shorted: return { kind: 'short', note };
    // Both land here: the status is derived from the count, not taken on trust.
    case LineOrderStatus.Received:
    case LineOrderStatus.PartiallyReceived:
      return { kind: 'received', quantityReceived: d.quantityReceived ?? undefined, note };
    case LineOrderStatus.Substituted:
      if (!d.substituteProductId) throw new ValidationError('A substitution needs a replacement product.');
      return { kind: 'substitute', substituteProductId: d.substituteProductId, note };
    default:
      throw new ValidationError(`'${d.status}' is not a procurement status that can be set.`);
  }
}

export function createFakeProcurement(db: Seed, wait: () => Promise<void>): ProcurementPort {
  const rules = lineRules(db);
  const keepsChanging = new Set(db.deliveries.filter(d => d.customerName === 'Ann Cho' && !d.isClosed).map(d => d.id));

  const scoped = (q: ProcurementQuery) => {
    // Required by the API (the range is the screen) though the spec does not mark them so.
    if (!q.from || !q.to) throw new ValidationError('A date range is required.');
    const from = dateOnly(q.from), to = dateOnly(q.to);
    if (to < from) throw new ValidationError('The end of the range cannot be before the start.');
    const term = q.searchTerm?.trim().toLowerCase();
    const rows: Array<{ d: DeliveryDetail; l: DeliveryLine }> = [];
    for (const d of db.deliveries) {
      const day = dateOnly(d.scheduledFor);
      if (day < from || day > to) continue;
      if (d.status === DeliveryStatus.Canceled) continue; // not work anybody is going to do
      if (!q.includeClosed && d.isClosed) continue;
      if (q.procurementStatus !== undefined && d.procurementStatus !== q.procurementStatus) continue;
      if (q.fulfillmentMethod !== undefined && d.fulfillmentMethod !== q.fulfillmentMethod) continue;
      if (q.customerId && d.customerId !== q.customerId) continue;
      for (const l of d.lines) {
        if (q.orderStatus !== undefined && l.orderStatus !== q.orderStatus) continue;
        if (q.productId && l.productId !== q.productId) continue;
        if (term && ![l.productName, d.customerName, d.subscriptionName ?? ''].some(v => v.toLowerCase().includes(term))) continue;
        rows.push({ d, l });
      }
    }
    return rows;
  };

  const page = <T,>(rows: T[], q: ProcurementQuery) => {
    const pageSize = Math.min(Math.max(Number(q.pageSize ?? 25), 1), 200);
    const pageNumber = Math.max(Number(q.pageNumber ?? 1), 1);
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    return {
      items: rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
      totalCount: rows.length, pageNumber, pageSize, totalPages, hasNextPage: pageNumber < totalPages, hasPreviousPage: pageNumber > 1,
    };
  };

  const lastName = (name: string) => name.split(' ').slice(-1)[0] ?? name;

  return {
    async products(q) {
      await wait();
      const groups = new Map<string, Array<{ d: DeliveryDetail; l: DeliveryLine }>>();
      for (const row of scoped(q)) groups.set(row.l.productId, [...(groups.get(row.l.productId) ?? []), row]);
      let items: ProcurementProduct[] = [...groups.entries()].map(([productId, rows]) => {
        const sum = (f: (r: { d: DeliveryDetail; l: DeliveryLine }) => number) => rows.reduce((s, r) => s + f(r), 0);
        const pending = sum(r => r.l.orderStatus === LineOrderStatus.Pending ? r.l.quantity : 0);
        const ordered = sum(r => r.l.orderStatus === LineOrderStatus.Ordered ? r.l.quantity : 0);
        const blocked = sum(r => r.l.orderStatus === LineOrderStatus.OutOfStock ? 1 : 0);
        const days = rows.map(r => r.d.scheduledFor).sort();
        return {
          productId, productName: rows[0]!.l.productName,
          totalQuantity: sum(r => r.l.quantity), pendingQuantity: pending, orderedQuantity: ordered,
          // What actually arrived — four of six is four, or nobody orders the shortfall.
          receivedQuantity: sum(r => r.l.orderStatus === LineOrderStatus.Received || r.l.orderStatus === LineOrderStatus.PartiallyReceived ? r.l.quantityReceived : 0),
          blockedLineCount: blocked,
          resolvedWithoutStockCount: sum(r => r.l.orderStatus === LineOrderStatus.Substituted || r.l.orderStatus === LineOrderStatus.Shorted ? 1 : 0),
          lineCount: rows.length,
          customerCount: new Set(rows.map(r => r.d.customerId)).size,
          deliveryCount: new Set(rows.map(r => r.d.id)).size,
          earliestScheduledFor: days[0]!, latestScheduledFor: days[days.length - 1]!,
          isFullyOrdered: pending === 0, isSettled: pending === 0 && ordered === 0 && blocked === 0,
        };
      });
      const allowed = SORT_KEYS['/api/procurement/products'];
      const key = (allowed.keys as readonly string[]).includes(q.sortBy ?? '') ? q.sortBy! : allowed.default;
      const cmp: Record<string, (a: ProcurementProduct, b: ProcurementProduct) => number> = {
        pending: (a, b) => b.pendingQuantity - a.pendingQuantity,
        product: (a, b) => a.productName.localeCompare(b.productName),
        total: (a, b) => b.totalQuantity - a.totalQuantity,
        earliest: (a, b) => a.earliestScheduledFor.localeCompare(b.earliestScheduledFor),
        customers: (a, b) => b.customerCount - a.customerCount,
      };
      items = items.sort((a, b) => (cmp[key]!(a, b) || a.productName.localeCompare(b.productName)) * (q.sortDescending ? -1 : 1));
      return page(items, q);
    },

    async lines(q) {
      await wait();
      let items: ProcurementLine[] = scoped(q).map(({ d, l }) => ({
        deliveryId: d.id, lineId: l.id, scheduledFor: d.scheduledFor, customerId: d.customerId, customerName: d.customerName,
        subscriptionId: d.subscriptionId, subscriptionName: d.subscriptionName, subscriptionDisplayName: d.subscriptionDisplayName,
        frequencyInterval: d.frequencyInterval, frequencyUnit: d.frequencyUnit, isOneOff: d.isOneOff,
        productId: l.productId, productName: l.productName, quantity: l.quantity,
        quantityReceived: l.quantityReceived, orderStatus: l.orderStatus, orderStatusName: l.orderStatusName,
        substitutedWithProductName: l.substitutedWithProductName, packingName: l.packingName,
        deliveryProcurementStatus: d.procurementStatus, deliveryStatus: d.status, fulfillmentMethod: d.fulfillmentMethod,
        isUnresolved: !l.isResolved, isBlocking: l.isBlocking, quantityOutstanding: l.quantityOutstanding,
      }));
      const allowed = SORT_KEYS['/api/procurement/lines'];
      const key = (allowed.keys as readonly string[]).includes(q.sortBy ?? '') ? q.sortBy! : allowed.default;
      const byCustomer = (a: ProcurementLine, b: ProcurementLine) =>
        lastName(a.customerName).localeCompare(lastName(b.customerName)) || a.customerName.localeCompare(b.customerName);
      const cmp: Record<string, (a: ProcurementLine, b: ProcurementLine) => number> = {
        // customer → subscription → product, so a customer reads down in one block
        customer: (a, b) => byCustomer(a, b) || (a.subscriptionName ?? '').localeCompare(b.subscriptionName ?? '') || a.productName.localeCompare(b.productName),
        product: (a, b) => a.productName.localeCompare(b.productName) || byCustomer(a, b),
        scheduledFor: (a, b) => a.scheduledFor.localeCompare(b.scheduledFor) || byCustomer(a, b),
        status: (a, b) => a.orderStatus - b.orderStatus || a.productName.localeCompare(b.productName),
        quantity: (a, b) => a.quantity - b.quantity,
      };
      items = items.sort((a, b) => cmp[key]!(a, b) * (q.sortDescending ? -1 : 1));
      return page(items, q);
    },

    async apply(decisions) {
      await wait();
      if (decisions.length === 0) throw new ValidationError('No procurement decisions were sent.');
      if (decisions.length > 500) throw new ValidationError(`A single request can carry at most 500 decisions; ${decisions.length} were sent.`);
      const seen = new Set<string>();
      for (const d of decisions) {
        const key = `${d.deliveryId}/${d.lineId}`;
        if (seen.has(key)) throw new ValidationError(`Line '${d.lineId}' appears more than once in the request.`);
        seen.add(key);
      }

      const results: Array<{ deliveryId: string; lineId: string; applied: boolean; reason: string | null }> = [];
      const deliveries: Array<{ deliveryId: string; procurementStatus: DeliveryDetail['procurementStatus']; isReadyToPack: boolean }> = [];
      const byDelivery = new Map<string, ProcurementDecision[]>();
      for (const d of decisions) byDelivery.set(d.deliveryId, [...(byDelivery.get(d.deliveryId) ?? []), d]);

      for (const [deliveryId, group] of byDelivery) {
        const delivery = db.deliveries.find(x => x.id === deliveryId);
        if (!delivery) {
          group.forEach(g => results.push({ deliveryId, lineId: g.lineId, applied: false, reason: `Delivery '${deliveryId}' was not found.` }));
          continue;
        }
        if (keepsChanging.has(deliveryId)) {
          // The API re-reads and retries a delivery once; still moving after that, it gives up on it.
          keepsChanging.delete(deliveryId);
          group.forEach(g => results.push({ deliveryId, lineId: g.lineId, applied: false, reason: 'This delivery kept changing while you were saving. Reload and try again.' }));
          continue;
        }
        // Work on a copy; one save for the whole group, or none if nothing applied.
        const draft = structuredClone(delivery);
        let anyApplied = false;
        for (const g of group) {
          try {
            rules.applyLineAction(draft, g.lineId, toAction(g));
            results.push({ deliveryId, lineId: g.lineId, applied: true, reason: null });
            anyApplied = true;
          } catch (error) {
            results.push({ deliveryId, lineId: g.lineId, applied: false, reason: error instanceof Error ? error.message : 'Refused.' });
          }
        }
        if (!anyApplied) continue;
        recompute(draft);
        draft.revision = delivery.revision + 1;
        draft.updatedAt = new Date().toISOString();
        Object.assign(delivery, draft);
        deliveries.push({ deliveryId, procurementStatus: delivery.procurementStatus, isReadyToPack: delivery.isReadyToPack });
      }

      const appliedCount = results.filter(r => r.applied).length;
      return { appliedCount, failedCount: results.length - appliedCount, results, deliveries, allSucceeded: appliedCount === results.length };
    },
  };
}
