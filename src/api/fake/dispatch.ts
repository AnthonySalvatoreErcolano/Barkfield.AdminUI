// Fake DispatchPort — the board only, so far. Built as DispatchService.GetBoardAsync builds it: the
// day's local deliveries (closed ones included, canceled ones not), the counts, and the status line in
// the API's own words. The fake has no Routific, so there are never routes.
import { DeliveryStatus, FulfillmentMethod, PaymentStatus } from '../generated/enums';
import type { DispatchBoard, DispatchPort } from '../ports';
import { toDeliveryListItem } from './deliveryModel';
import type { Seed } from './seed';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const STAGE_NAMES = ['', 'NothingToDispatch', 'ReadyToSend', 'SentAwaitingRoutes', 'PartiallySent', 'RoutesPublished', 'PulledBack'];

export function createFakeDispatch(db: Seed, wait: () => Promise<void>): DispatchPort {
  return {
    async board(date) {
      await wait();
      const day = date.slice(0, 10);
      const live = db.deliveries.filter(d => d.scheduledFor.slice(0, 10) === day
        && d.fulfillmentMethod === FulfillmentMethod.LocalDelivery && d.status !== DeliveryStatus.Canceled);
      const sentAt = live.map(d => d.sentToRoutingAt).filter((x): x is string => !!x).sort();
      const sent = sentAt.length;
      const stage = live.length === 0 ? 1 : sent === 0 ? 2 : sent === live.length ? 3 : 4;
      const at = sentAt[0] ? ` at ${new Date(sentAt[0]).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : '';
      const statusLine = [
        '',
        'No local deliveries scheduled for this day.',
        `${plural(live.length, 'delivery', 'deliveries')} ready to send for routing.`,
        `${plural(sent, 'order', 'orders')} sent${at} — no route published yet.`,
        `${sent} of ${live.length} orders sent${at} — ${plural(live.length - sent, 'delivery', 'deliveries')} still to send.`,
      ][stage]!;
      return structuredClone({
        date: day + 'T00:00:00Z', deliveries: live.map(toDeliveryListItem), routes: [],
        stage: stage as DispatchBoard['stage'], stageName: STAGE_NAMES[stage]!, statusLine,
        deliveryCount: live.length, sentCount: sent, unsentCount: live.length - sent, firstSentAt: sentAt[0] ?? null,
        unpaidCount: live.filter(d => d.paymentStatus !== PaymentStatus.Paid).length,
        paymentFailedCount: live.filter(d => d.paymentStatus === PaymentStatus.Failed).length,
        notYetPackedCount: live.filter(d => d.status === DeliveryStatus.Scheduled).length,
        canSend: live.length - sent > 0,
      });
    },
  };
}
