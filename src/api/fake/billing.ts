// Fake BillingPort. Plays Square's part (its discount list, pricing, card outcomes) and follows the
// API's BillingService: local checks first, a refused card is a result not an error, "no card on file"
// is recorded as a failed payment so it lands on the needs-attention list, and charge-all skips anything
// paid or not ready, naming why.
//
// Card outcomes, so the ring list is never empty in a demo:
//   Luis Ramirez   declined — PAYMENT_METHOD_ERROR (the card needs fixing)
//   Grace Wu       declined — INSUFFICIENT_FUNDS
//   Hannah Lee     no usable card on file
//   Jamal Hughes   Square error (failed, retryable)
//   Marcus Bell, Noah Feld   not linked to Square — not attempted
import { ChargeAttentionReason, ChargeOutcome, DeliveryStatusNames, LineOrderStatus, PaymentStatus, ProcurementStatus } from '../generated/enums';
import { NotFoundError, ValidationError } from '../errors';
import type { BillingPort, ChargeResult, DeliveryDetail, SquareDiscount } from '../ports';
import { recompute } from './deliveryModel';
import type { Seed } from './seed';

const DISCOUNTS: SquareDiscount[] = [
  { id: 'DISC-AUTOSHIP', name: 'Autoship Discount', discountType: 'FIXED_PERCENTAGE', percentage: 12, amount: null },
  { id: 'DISC-LOYAL5', name: 'Loyalty — $5 off', discountType: 'FIXED_AMOUNT', percentage: null, amount: 5 },
  { id: 'DISC-SENIOR', name: 'Senior pup', discountType: 'FIXED_PERCENTAGE', percentage: 10, amount: null },
];

const CARD_OUTCOME: Record<string, { outcome: 'declined' | 'failed' | 'nocard'; code: string; message: string }> = {
  'Luis Ramirez': { outcome: 'declined', code: 'PAYMENT_METHOD_ERROR', message: 'Card declined by the issuer.' },
  'Grace Wu': { outcome: 'declined', code: 'INSUFFICIENT_FUNDS', message: 'Insufficient funds.' },
  'Hannah Lee': { outcome: 'nocard', code: 'NO_CARD_ON_FILE', message: 'Hannah Lee has no usable card on file in Square.' },
  'Jamal Hughes': { outcome: 'failed', code: 'TEMPORARY_ERROR', message: 'Square could not complete the payment. Try again shortly.' },
};

const round = (n: number) => Math.round(n * 100) / 100;
const dateOnly = (iso: string) => iso.slice(0, 10);

export function createFakeBilling(db: Seed, wait: () => Promise<void>): BillingPort {
  const find = (id: string) => {
    const d = db.deliveries.find(x => x.id === id);
    if (!d) throw new NotFoundError(`Delivery with ID '${id}' was not found.`);
    return d;
  };
  const save = (d: DeliveryDetail) => { d.revision++; d.updatedAt = new Date().toISOString(); recompute(d); };

  /** Square prices the order: its catalog, the chosen discounts. (The screen never does this sum.) */
  const squarePrice = (d: DeliveryDetail) => {
    let amount = d.total;
    for (const disc of d.discounts) {
      if (disc.percentage) amount -= amount * disc.percentage / 100;
      if (disc.amountOff) amount -= disc.amountOff;
    }
    // Square's live catalog price occasionally differs from the snapshot taken here.
    if (d.customerName === 'Sofia Rossi') amount += 0.85;
    return Math.max(0, round(amount));
  };

  const chargeOne = (d: DeliveryDetail): ChargeResult => {
    const base = { deliveryId: d.id, customerName: d.customerName, amountCharged: null, squarePaymentId: null, receiptUrl: null, cardLabel: null, errorCode: null };
    const notAttempted = (message: string): ChargeResult => ({ ...base, outcome: ChargeOutcome.NotAttempted as ChargeResult['outcome'], outcomeName: 'NotAttempted', message, isPaid: false });

    // Local checks first, so nothing reaches Square that was never going to work.
    if (d.paymentStatus === PaymentStatus.Paid) return notAttempted('Already paid.');
    if (d.isClosed) return notAttempted(`The delivery is ${DeliveryStatusNames[d.status]}.`);
    if (d.procurementStatus !== ProcurementStatus.Ready) {
      return notAttempted(`Not ready to charge. Outstanding: ${(d.packingBlockers ?? []).join(', ')}.`);
    }
    const customer = db.customers.find(c => c.id === d.customerId)!;
    if (!customer.squareCustomerId || !customer.isSyncedToSquare) {
      return notAttempted(`${customer.fullName} is not linked to a Square profile, so there is no card to charge.`);
    }
    if (d.lines.every(l => l.orderStatus === LineOrderStatus.Shorted)) {
      return notAttempted('Nothing on this delivery can be billed — every line was shorted.');
    }

    const planned = CARD_OUTCOME[d.customerName];
    d.paymentAttemptCount++;
    d.paymentAttemptedAt = new Date().toISOString();
    if (planned) {
      d.paymentStatus = PaymentStatus.Failed as DeliveryDetail['paymentStatus'];
      d.paymentFailureCode = planned.code;
      d.paymentFailureReason = planned.message;
      save(d);
      return {
        ...base, outcome: (planned.outcome === 'failed' ? ChargeOutcome.Failed : ChargeOutcome.Declined) as ChargeResult['outcome'],
        outcomeName: planned.outcome === 'failed' ? 'Failed' : 'Declined', errorCode: planned.code, message: planned.message, isPaid: false,
      };
    }
    const amount = squarePrice(d);
    const index = db.customers.indexOf(customer);
    const cardLabel = `Visa ending ${String(4242 + index * 17).slice(-4)}`;
    Object.assign(d, {
      paymentStatus: PaymentStatus.Paid, amountCharged: amount, paymentFailureCode: null, paymentFailureReason: null,
      squarePaymentId: `PAY-${d.id.slice(-6)}-${d.paymentAttemptCount}`, squareReceiptUrl: 'https://squareup.com/receipt/preview/example',
    });
    save(d);
    return {
      ...base, outcome: ChargeOutcome.Paid as ChargeResult['outcome'], outcomeName: 'Paid', amountCharged: amount,
      squarePaymentId: d.squarePaymentId, receiptUrl: d.squareReceiptUrl, cardLabel, isPaid: true,
      message: `Charged ${amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} to ${cardLabel}.`,
    };
  };

  return {
    async discounts() {
      await wait();
      return structuredClone(DISCOUNTS);
    },

    async selectDiscounts(id, ids) {
      await wait();
      const d = find(id);
      if (d.isClosed) throw new ValidationError(`This delivery is already '${DeliveryStatusNames[d.status]}' and cannot be changed.`);
      if (d.contentsAreLocked) {
        throw new ValidationError('This delivery has already been charged, so its contents cannot be changed. Refund or adjust the payment in Square first.');
      }
      const chosen = [...new Set(ids)].map(x => {
        const disc = DISCOUNTS.find(s => s.id === x);
        if (!disc) throw new ValidationError(`Square has no discount with ID '${x}'.`);
        return disc;
      });
      d.discounts = chosen.map(s => ({
        squareDiscountId: s.id, name: s.name, discountType: s.discountType, percentage: s.percentage, amountOff: s.amount,
        createdAt: new Date().toISOString(), label: s.percentage ? `${s.name} (${s.percentage}%)` : s.name,
      }));
      save(d);
    },

    async charge(id) {
      await wait();
      return chargeOne(find(id));
    },

    async chargeAll(date) {
      await wait();
      const day = dateOnly(date);
      const candidates = db.deliveries.filter(d => dateOnly(d.scheduledFor) === day && !d.isClosed)
        .sort((a, b) => a.customerName.localeCompare(b.customerName));
      const attempted: ChargeResult[] = [];
      const skipped: Array<{ deliveryId: string; customerName: string; reason: string }> = [];
      for (const d of candidates) {
        if (d.paymentStatus === PaymentStatus.Paid) { skipped.push({ deliveryId: d.id, customerName: d.customerName, reason: 'Already paid.' }); continue; }
        if (d.procurementStatus !== ProcurementStatus.Ready) {
          skipped.push({ deliveryId: d.id, customerName: d.customerName, reason: `Not ready to charge — procurement is ${d.procurementStatusName}.` });
          continue;
        }
        attempted.push(chargeOne(d));
      }
      const paid = attempted.filter(a => a.outcome === ChargeOutcome.Paid);
      const needsAttention = attempted.filter(a => a.outcome === ChargeOutcome.Declined || a.outcome === ChargeOutcome.Failed);
      return {
        deliveryDate: day + 'T00:00:00Z', considered: candidates.length, attempted, skipped,
        paidCount: paid.length, declinedCount: attempted.filter(a => a.outcome === ChargeOutcome.Declined).length,
        failedCount: attempted.filter(a => a.outcome === ChargeOutcome.Failed).length, skippedCount: skipped.length,
        totalCharged: round(paid.reduce((s, a) => s + (a.amountCharged ?? 0), 0)), needsAttention,
      };
    },

    async needsAttention({ from, to }) {
      await wait();
      return db.deliveries
        .filter(d => (!from || dateOnly(d.scheduledFor) >= dateOnly(from)) && (!to || dateOnly(d.scheduledFor) <= dateOnly(to)))
        .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
        .flatMap(d => {
          if (d.paymentStatus === PaymentStatus.Failed) {
            return [{
              deliveryId: d.id, customerName: d.customerName, scheduledFor: d.scheduledFor,
              reason: ChargeAttentionReason.PaymentFailed as ChargeAttentionReason, reasonName: 'PaymentFailed',
              detail: `${d.paymentFailureCode ?? ''}: ${d.paymentFailureReason ?? ''}`.replace(/^[\s:]+|[\s:]+$/g, ''), attemptCount: d.paymentAttemptCount,
            }];
          }
          if (d.needsRefundAttention && d.lines.every(l => l.isResolved)) {
            const shorted = d.lines.filter(l => l.orderStatus === LineOrderStatus.Shorted).map(l => l.productName).join(', ');
            return [{
              deliveryId: d.id, customerName: d.customerName, scheduledFor: d.scheduledFor,
              reason: ChargeAttentionReason.RefundOwed as ChargeAttentionReason, reasonName: 'RefundOwed',
              detail: `Paid, but shorted: ${shorted}. Refund in Square.`, attemptCount: d.paymentAttemptCount,
            }];
          }
          return [];
        });
    },
  };
}
