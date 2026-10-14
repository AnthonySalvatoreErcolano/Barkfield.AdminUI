// Fake DispatchPort, with a stand-in Routific behind it. Built as DispatchService builds things:
//   - the board: the day's local deliveries (closed included, canceled not), counts, stage and the
//     status line in the API's own words
//   - send: closed ones skipped by what they are, already-sent counted not resent, unpacked skipped,
//     unpaid ones SENT (billing and routing are separate days). Stored as sentToRoutingAt/externalOrderId.
//   - "Ridge Rd" deliveries are refused by Routific (an address it can't geocode), as a per-order failure
//   - withdraw: refused for one never sent; otherwise unlinked and sendable again
//   - the load list: one entry per doorstep (shared addresses carry two boxes), in LOADING order (the
//     reverse of driving), quantities as actually going, access notes and phones from everyone at the door
//   - an ad-hoc stop (added in Routific) has a route-stop row, but the load list carries no id for it
//     (routeStopId is only on deliveries), so nobody can tick it and it never reads as loaded — as in the API
// Routes don't arrive by themselves here: the dispatcher's side is `publishRoutes` / `pullBack` on the
// fake controls, and in demo mode a route is published a few seconds after a send.
import { DeliveryStatus, FulfillmentMethod, LineOrderStatus, PaymentStatus } from '../generated/enums';
import { NotFoundError, ValidationError } from '../errors';
import type { DeliveryDetail, DispatchBoard, DispatchPort, LoadList, LoadListDelivery, LoadListStop, RouteListItem } from '../ports';
import { toDeliveryListItem } from './deliveryModel';
import type { Seed } from './seed';

interface StopState { routeStopId: string; deliveryId: string | null; externalStopId: string; sequenceOrder: number; plannedArrival: string; loadedAt: string | null; label?: string; address?: string }
interface RouteState { id: string; externalRouteId: string; date: string; name: string; status: number; driverName: string; publishedAt: string; receivedAt: string; stops: StopState[] }

export interface FakeRoutific {
  /** The dispatcher publishes a route from everything sent for that day. Returns its id. */
  publishRoutes(date: string): string | null;
  /** The dispatcher withdraws a route in Routific for re-planning. */
  pullBack(routeId: string): void;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const STAGE_NAMES = ['', 'NothingToDispatch', 'ReadyToSend', 'SentAwaitingRoutes', 'PartiallySent', 'RoutesPublished', 'PulledBack'];
const ROUTE_STATUS = ['', 'Planned', 'Published', 'Executing', 'Completed', 'Canceled', 'Unpublished'];
const Published = 2, Completed = 4, Canceled = 5, Unpublished = 6;
const isClosed = (r: RouteState) => r.status === Completed || r.status === Canceled;
const doorOf = (d: DeliveryDetail) => `${d.deliveryStreet ?? ''}|${d.deliveryCity ?? ''}`.toLowerCase();

export function createFakeDispatch(db: Seed, wait: () => Promise<void>, options: { autoPublish?: boolean } = {}): DispatchPort & { routific: FakeRoutific } {
  const routes: RouteState[] = [];
  const now = () => new Date().toISOString();
  const day = (iso: string) => iso.slice(0, 10);
  const find = (id: string) => {
    const d = db.deliveries.find(x => x.id === id);
    if (!d) throw new NotFoundError(`Delivery '${id}' was not found.`);
    return d;
  };
  const customerOf = (d: DeliveryDetail) => db.customers.find(c => c.id === d.customerId);
  const ofDay = (date: string) => db.deliveries.filter(d => day(d.scheduledFor) === day(date) && d.fulfillmentMethod === FulfillmentMethod.LocalDelivery);

  const toRouteItem = (r: RouteState): RouteListItem => {
    const doors = new Map<string, StopState[]>();
    r.stops.forEach(s => doors.set(s.externalStopId, [...(doors.get(s.externalStopId) ?? []), s]));
    const all = [...doors.values()];
    return {
      id: r.id, externalRouteId: r.externalRouteId, scheduledDate: r.date + 'T00:00:00Z', name: r.name, status: r.status as RouteListItem['status'],
      statusName: ROUTE_STATUS[r.status]!, driverName: r.driverName, driverEmail: null, routificDriverUuid: null, workingTimeSeconds: 3 * 3600 + 1200,
      distanceKilometers: 42.5, ordersCount: r.stops.filter(s => s.deliveryId).length, publishedAt: r.publishedAt, receivedAt: r.receivedAt, updatedAt: null,
      stopCount: all.length, loadedStopCount: all.filter(g => g.every(s => s.loadedAt)).length, visitedStopCount: 0,
      adHocStopCount: all.filter(g => g.every(s => !s.deliveryId)).length,
      isFullyLoaded: all.length > 0 && all.every(g => g.every(s => s.loadedAt)),
      wasPulledBack: r.status === Unpublished, isClosed: isClosed(r),
    };
  };

  const routific: FakeRoutific = {
    publishRoutes(date) {
      const sent = ofDay(date).filter(d => d.externalOrderId && d.status !== DeliveryStatus.Canceled);
      if (!sent.length) return null;
      // Republishing replaces the plan but keeps loading ticks, which are our fact, not Routific's.
      const previous = routes.find(r => r.date === day(date) && !isClosed(r));
      const ticks = new Map((previous?.stops ?? []).map(s => [s.deliveryId, s.loadedAt]));
      const doors = [...new Set(sent.map(doorOf))];
      const start = new Date(`${day(date)}T13:00:00Z`).getTime();
      const stops: StopState[] = sent.map(d => {
        const seq = doors.indexOf(doorOf(d)) + 1;
        return {
          routeStopId: previous?.stops.find(s => s.deliveryId === d.id)?.routeStopId ?? crypto.randomUUID(), deliveryId: d.id,
          externalStopId: `stop-${seq}`, sequenceOrder: seq, plannedArrival: new Date(start + seq * 17 * 60_000).toISOString(), loadedAt: ticks.get(d.id) ?? null,
        };
      });
      // The dispatcher also added a stop of their own that matches nothing here.
      stops.push({ routeStopId: crypto.randomUUID(), deliveryId: null, externalStopId: `stop-${doors.length + 1}`, sequenceOrder: doors.length + 1,
        plannedArrival: new Date(start + (doors.length + 1) * 17 * 60_000).toISOString(), loadedAt: null,
        label: 'Collect returns — Kings Park Vet', address: '12 Main St, Kings Park' });
      const route: RouteState = previous ?? {
        id: crypto.randomUUID(), externalRouteId: `rt_${Math.random().toString(36).slice(2, 8)}`, date: day(date), name: 'Route A', status: Published,
        driverName: 'Dev Patel', publishedAt: now(), receivedAt: now(), stops: [],
      };
      Object.assign(route, { stops, status: Published, publishedAt: now(), receivedAt: now() });
      if (!previous) routes.push(route);
      return route.id;
    },
    pullBack(routeId) {
      const r = routes.find(x => x.id === routeId);
      if (r) r.status = Unpublished;
    },
  };

  const lineToLoad = (l: DeliveryDetail['lines'][number]) => {
    const q = l.orderStatus === LineOrderStatus.Shorted || l.orderStatus === LineOrderStatus.OutOfStock ? 0
      : l.orderStatus === LineOrderStatus.Received || l.orderStatus === LineOrderStatus.Substituted || l.orderStatus === LineOrderStatus.PartiallyReceived ? l.quantityReceived
      : l.quantity;
    return q;
  };

  return {
    routific,

    async board(date) {
      await wait();
      const live = ofDay(date).filter(d => d.status !== DeliveryStatus.Canceled);
      const dayRoutes = routes.filter(r => r.date === day(date));
      const sentAt = live.map(d => d.sentToRoutingAt).filter((x): x is string => !!x).sort();
      const sent = sentAt.length;
      const stage = live.length === 0 ? 1 : dayRoutes.some(r => r.status === Unpublished) ? 6 : dayRoutes.some(r => !isClosed(r)) ? 5
        : sent === 0 ? 2 : sent === live.length ? 3 : 4;
      const items = dayRoutes.map(toRouteItem);
      const at = sentAt[0] ? ` at ${new Date(sentAt[0]).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : '';
      const statusLine = [
        '',
        'No local deliveries scheduled for this day.',
        `${plural(live.length, 'delivery', 'deliveries')} ready to send for routing.`,
        `${plural(sent, 'order', 'orders')} sent${at} — no route published yet.`,
        `${sent} of ${live.length} orders sent${at} — ${plural(live.length - sent, 'delivery', 'deliveries')} still to send.`,
        `${plural(items.length, 'route', 'routes')} published, ${items.reduce((s, r) => s + r.loadedStopCount, 0)} of ${items.reduce((s, r) => s + r.stopCount, 0)} stops loaded.`,
        'A route has been pulled back for re-planning — the plan below is out of date.',
      ][stage]!;
      return structuredClone({
        date: day(date) + 'T00:00:00Z', deliveries: live.map(toDeliveryListItem), routes: items,
        stage: stage as DispatchBoard['stage'], stageName: STAGE_NAMES[stage]!, statusLine,
        deliveryCount: live.length, sentCount: sent, unsentCount: live.length - sent, firstSentAt: sentAt[0] ?? null,
        unpaidCount: live.filter(d => d.paymentStatus !== PaymentStatus.Paid).length,
        paymentFailedCount: live.filter(d => d.paymentStatus === PaymentStatus.Failed).length,
        notYetPackedCount: live.filter(d => d.status === DeliveryStatus.Scheduled).length,
        canSend: live.length - sent > 0,
      });
    },

    async send(date, deliveryIds) {
      await wait();
      let candidates = ofDay(date);
      if (deliveryIds?.length) candidates = candidates.filter(d => deliveryIds.includes(d.id));
      const skipped: Array<{ deliveryId: string; customerName: string; reason: string }> = [];
      const failures: typeof skipped = [];
      let alreadySentCount = 0, sentCount = 0;
      for (const d of candidates) {
        if (d.isClosed) { skipped.push({ deliveryId: d.id, customerName: d.customerName, reason: `Already ${(d.statusName ?? '').toLowerCase()}.` }); continue; }
        if (d.sentToRoutingAt || d.externalOrderId) { alreadySentCount++; continue; }
        if (d.status !== DeliveryStatus.Packed) { skipped.push({ deliveryId: d.id, customerName: d.customerName, reason: `Not packed yet (it is ${d.statusName}).` }); continue; }
        if (/ridge rd/i.test(d.deliveryStreet ?? '')) { failures.push({ deliveryId: d.id, customerName: d.customerName, reason: 'Routific could not find this address. Check the street and ZIP, then send it again.' }); continue; }
        d.externalOrderId = `ord_${d.id.slice(0, 8)}`;
        d.sentToRoutingAt = now();
        sentCount++;
      }
      if (options.autoPublish && sentCount) setTimeout(() => routific.publishRoutes(date), 6000);
      return { sentCount, alreadySentCount, failures, skipped, allSucceeded: failures.length === 0 };
    },

    async withdraw(deliveryId) {
      await wait();
      const d = find(deliveryId);
      if (!d.externalOrderId) throw new ValidationError('This delivery has not been sent for routing.');
      d.externalOrderId = null;
      d.sentToRoutingAt = null;
    },

    async loadList(routeId) {
      await wait();
      const r = routes.find(x => x.id === routeId);
      if (!r) throw new NotFoundError(`Route '${routeId}' was not found.`);
      const doors = new Map<string, StopState[]>();
      r.stops.forEach(s => doors.set(s.externalStopId, [...(doors.get(s.externalStopId) ?? []), s]));
      const stops: LoadListStop[] = [...doors.values()].map(rows => {
        const deliveries: LoadListDelivery[] = rows.filter(s => s.deliveryId).map(s => {
          const d = db.deliveries.find(x => x.id === s.deliveryId)!;
          const c = customerOf(d);
          const lines = d.lines.map(l => {
            const quantityToLoad = lineToLoad(l);
            const sub = l.orderStatus === LineOrderStatus.Substituted ? (l.substitutedWithProductName ?? null) : null;
            return {
              deliveryId: d.id, id: l.id, productName: l.productName, substitutedWithProductName: sub, quantity: l.quantity,
              quantityReceived: l.quantityReceived, orderStatus: l.orderStatus, displayName: sub ?? l.productName, quantityToLoad,
              wasSubstituted: l.orderStatus === LineOrderStatus.Substituted, isShort: quantityToLoad < l.quantity,
            };
          });
          return {
            deliveryId: d.id, routeStopId: s.routeStopId, customerId: d.customerId, customerName: d.customerName,
            subscriptionName: d.subscriptionDisplayName ?? d.subscriptionName, status: d.status, paymentStatus: d.paymentStatus,
            paymentStatusName: d.paymentStatusName, accessNotes: c?.accessNotes ?? null, phoneNumber: c?.phoneNumber ?? null,
            isLoaded: !!s.loadedAt, lines, totalUnits: lines.reduce((n, l) => n + l.quantityToLoad, 0), hasShortage: lines.some(l => l.isShort),
          } as LoadListDelivery;
        });
        const first = rows[0]!;
        const firstDelivery = first.deliveryId ? db.deliveries.find(x => x.id === first.deliveryId) : undefined;
        const notes = [...new Set(deliveries.map(x => x.accessNotes).filter((n): n is string => !!n?.trim()))];
        return {
          externalStopId: first.externalStopId, sequenceOrder: first.sequenceOrder, loadingPosition: 0, plannedArrival: first.plannedArrival, deliveries,
          label: deliveries.length ? [...new Set(deliveries.map(x => x.customerName))].join('; ') : first.label ?? first.address ?? '(unnamed stop)',
          address: first.address ?? [firstDelivery?.deliveryStreet, firstDelivery?.deliveryCity].filter(Boolean).join(', '),
          accessNotes: notes.length ? notes.join(' · ') : null,
          phoneNumbers: [...new Set(deliveries.map(x => x.phoneNumber).filter((p): p is string => !!p))],
          isAdHoc: deliveries.length === 0, isLoaded: rows.every(s => s.loadedAt),
          totalUnits: deliveries.reduce((n, x) => n + x.totalUnits, 0),
          hasUnpaidDelivery: deliveries.some(x => x.paymentStatus !== PaymentStatus.Paid), hasShortage: deliveries.some(x => x.hasShortage),
        } as LoadListStop;
      }).sort((a, b) => b.sequenceOrder - a.sequenceOrder || (a.externalStopId ?? '').localeCompare(b.externalStopId ?? ''));
      stops.forEach((s, i) => { s.loadingPosition = i + 1; });
      const list: LoadList = {
        routeId: r.id, routeName: r.name, externalRouteId: r.externalRouteId, scheduledDate: r.date + 'T00:00:00Z',
        routeStatus: r.status as LoadList['routeStatus'], driverName: r.driverName, stops, isStale: r.status === Unpublished,
        stopCount: stops.length, loadedStopCount: stops.filter(s => s.isLoaded).length, totalUnits: stops.reduce((n, s) => n + s.totalUnits, 0),
        isFullyLoaded: stops.length > 0 && stops.every(s => s.isLoaded), unpaidStops: stops.filter(s => s.hasUnpaidDelivery),
      };
      return structuredClone(list);
    },

    async setStopLoaded(routeId, routeStopId, loaded) {
      await wait();
      const r = routes.find(x => x.id === routeId);
      if (!r) throw new NotFoundError(`Route '${routeId}' was not found.`);
      const s = r.stops.find(x => x.routeStopId === routeStopId);
      if (!s) throw new NotFoundError(`Stop '${routeStopId}' is not on this route.`);
      // Allowed on a pulled-back plan on purpose: staff record what they have actually done.
      s.loadedAt = loaded ? now() : null;
    },
  };
}
