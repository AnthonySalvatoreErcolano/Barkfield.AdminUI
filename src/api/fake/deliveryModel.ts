// The delivery rules the API's domain model enforces, reproduced for the fake: how a line's status is
// derived, how the delivery's procurement status rolls up, what locks and what closes. Every fake
// mutation ends in recompute(), so derived fields can never disagree with the lines.
// Source: Barkfield.Administration.Domain/Entities/Delivery.cs and DeliveryLine.cs.

import { DeliveryLineSource, DeliveryLineSourceNames, DeliveryStatus, DeliveryStatusNames, FulfillmentMethodNames, LineOrderStatus, LineOrderStatusNames, PaymentStatus, PaymentStatusNames, ProcurementStatus, ProcurementStatusNames } from '../generated/enums';
import type { DeliveryDetail, DeliveryLine, DeliveryListItem, Product } from '../ports';

export function makeLine(product: Product, quantity: number, source: number, sourceId: string | null, status: number = LineOrderStatus.Pending): DeliveryLine {
  const line: DeliveryLine = {
    id: crypto.randomUUID(), productId: product.id, productName: product.name, unitPrice: product.price, quantity,
    source: source as DeliveryLine['source'], sourceId, sourceName: null,
    orderStatus: status as DeliveryLine['orderStatus'], orderStatusName: null,
    quantityReceived: status === LineOrderStatus.Received ? quantity : 0,
    substitutedWithProductId: null, substitutedWithProductName: null, substitutedWithUnitPrice: null,
    statusNote: null, statusUpdatedAt: null,
    quantityOutstanding: 0, isResolved: false, isBlocking: false, packingName: null, lineTotal: 0,
  };
  return recomputeLine(line);
}

const RESOLVED: number[] = [LineOrderStatus.Received, LineOrderStatus.Substituted, LineOrderStatus.Shorted];

export function recomputeLine(l: DeliveryLine): DeliveryLine {
  l.orderStatusName = LineOrderStatusNames[l.orderStatus];
  l.sourceName = DeliveryLineSourceNames[l.source];
  l.isResolved = RESOLVED.includes(l.orderStatus);
  l.isBlocking = l.orderStatus === LineOrderStatus.OutOfStock;
  l.quantityOutstanding = l.isResolved ? 0 : Math.max(0, l.quantity - l.quantityReceived);
  l.lineTotal = l.orderStatus === LineOrderStatus.Shorted ? 0
    : l.orderStatus === LineOrderStatus.Substituted ? round((l.substitutedWithUnitPrice ?? l.unitPrice) * l.quantity)
    : round(l.unitPrice * l.quantity);
  // What actually goes in the box: the substitute's name when there is one.
  l.packingName = l.orderStatus === LineOrderStatus.Substituted ? l.substitutedWithProductName : l.productName;
  return l;
}

const round = (n: number) => Math.round(n * 100) / 100;

const CLOSED: number[] = [DeliveryStatus.Delivered, DeliveryStatus.Failed, DeliveryStatus.Canceled];

export function recompute(d: DeliveryDetail): DeliveryDetail {
  d.lines.forEach(recomputeLine);
  const lines = d.lines;
  d.procurementStatus = (
    lines.length === 0 ? ProcurementStatus.NotStarted
      : lines.some(l => l.isBlocking) ? ProcurementStatus.Blocked
      : lines.every(l => l.isResolved) ? ProcurementStatus.Ready
      : lines.every(l => l.orderStatus === LineOrderStatus.Pending) ? ProcurementStatus.NotStarted
      : ProcurementStatus.InProgress
  ) as DeliveryDetail['procurementStatus'];
  d.statusName = DeliveryStatusNames[d.status];
  d.procurementStatusName = ProcurementStatusNames[d.procurementStatus];
  d.paymentStatusName = PaymentStatusNames[d.paymentStatus];
  d.fulfillmentMethodName = FulfillmentMethodNames[d.fulfillmentMethod];
  d.isClosed = CLOSED.includes(d.status);
  d.isReadyToPack = d.procurementStatus === ProcurementStatus.Ready;
  d.hasPaid = d.paymentStatus === PaymentStatus.Paid;
  d.contentsAreLocked = d.hasPaid;
  d.paymentFailed = d.paymentStatus === PaymentStatus.Failed;
  d.needsRefundAttention = d.hasPaid && lines.some(l => l.orderStatus === LineOrderStatus.Shorted);
  d.total = round(lines.reduce((s, l) => s + l.lineTotal, 0));
  d.totalUnits = lines.reduce((s, l) => s + l.quantity, 0);
  const unresolved = lines.filter(l => !l.isResolved);
  d.unresolvedLines = unresolved;
  d.packingBlockers = unresolved.map(l => `${l.productName} (${l.orderStatusName})`);
  d.chargeVariance = d.hasPaid && d.amountCharged != null ? round(d.amountCharged - d.total) : null;
  d.effectiveServiceDurationMinutes = d.serviceDurationMinutesOverride ?? d.serviceDurationMinutes;
  d.isOneOff = d.subscriptionId === null;
  return d;
}

export function toDeliveryListItem(d: DeliveryDetail): DeliveryListItem {
  return {
    id: d.id, subscriptionId: d.subscriptionId, subscriptionName: d.subscriptionName, subscriptionDisplayName: d.subscriptionDisplayName,
    frequencyInterval: d.frequencyInterval, frequencyUnit: d.frequencyUnit, customerId: d.customerId, customerName: d.customerName,
    scheduledFor: d.scheduledFor, completedAt: d.completedAt, status: d.status, statusName: d.statusName,
    fulfillmentMethod: d.fulfillmentMethod, fulfillmentMethodName: d.fulfillmentMethodName,
    procurementStatus: d.procurementStatus, procurementStatusName: d.procurementStatusName,
    paymentStatus: d.paymentStatus, paymentStatusName: d.paymentStatusName, paymentAttemptCount: d.paymentAttemptCount,
    paymentFailureCode: d.paymentFailureCode, paymentFailureReason: d.paymentFailureReason, paymentAttemptedAt: d.paymentAttemptedAt,
    squareOrderId: d.squareOrderId, squarePaymentId: d.squarePaymentId, squareReceiptUrl: d.squareReceiptUrl, amountCharged: d.amountCharged,
    astroCompleted: d.astroCompleted, externalOrderId: d.externalOrderId, sentToRoutingAt: d.sentToRoutingAt, notes: d.notes, failureReason: d.failureReason,
    createdAt: d.createdAt, updatedAt: d.updatedAt, revision: d.revision,
    isOneOff: d.isOneOff, isClosed: d.isClosed, isReadyToPack: d.isReadyToPack, hasPaid: d.hasPaid, contentsAreLocked: d.contentsAreLocked, paymentFailed: d.paymentFailed,
    lineCount: d.lines.length, unresolvedLineCount: d.lines.filter(l => !l.isResolved).length, blockedLineCount: d.lines.filter(l => l.isBlocking).length,
    totalUnits: d.totalUnits, total: d.total, deliveryCity: d.deliveryCity,
  };
}

export { DeliveryLineSource };
