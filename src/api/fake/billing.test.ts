// The billing fake must behave like the API's BillingService.
import { ChargeAttentionReason, ChargeOutcome } from '../generated/enums';
import { createFakeApi } from '.';
import { FAKE_TODAY } from './seed';

const fresh = () => createFakeApi({ latency: false, persistSession: false });
const today = FAKE_TODAY.slice(0, 10);

it('charges the day into one list: paid, declined, failed, not attempted, skipped', async () => {
  const api = fresh();
  const r = await api.billing.chargeAll(today);
  const outcome = (name: string) => r.attempted.find(a => a.customerName === name)?.outcome;
  expect(outcome('Luis Ramirez')).toBe(ChargeOutcome.Declined);
  expect(outcome('Grace Wu')).toBe(ChargeOutcome.Declined);
  expect(outcome('Hannah Lee')).toBe(ChargeOutcome.Declined); // no card: the same job — get a card from them
  expect(outcome('Jamal Hughes')).toBe(ChargeOutcome.Failed);
  expect(outcome('Noah Feld')).toBe(ChargeOutcome.NotAttempted);
  expect(r.paidCount).toBeGreaterThan(0);
  expect(r.needsAttention?.map(a => a.customerName).sort()).toEqual(['Grace Wu', 'Hannah Lee', 'Jamal Hughes', 'Luis Ramirez']);
  expect(r.skipped.some(s => s.reason === 'Already paid.')).toBe(true); // Frank, Kate, Pat
  expect(r.skipped.some(s => s.reason.startsWith('Not ready to charge — procurement is'))).toBe(true);
  expect(r.totalCharged).toBeCloseTo(r.attempted.filter(a => a.isPaid).reduce((s, a) => s + (a.amountCharged ?? 0), 0), 2);
});

it('puts declines and refunds owed on the needs-attention list', async () => {
  const api = fresh();
  await api.billing.chargeAll(today);
  const items = await api.billing.needsAttention({ from: today, to: today });
  expect(items.find(i => i.customerName === 'Luis Ramirez')).toMatchObject({ reason: ChargeAttentionReason.PaymentFailed, detail: 'PAYMENT_METHOD_ERROR: Card declined by the issuer.' });
  expect(items.find(i => i.customerName === 'Kate Dunn')).toMatchObject({ reason: ChargeAttentionReason.RefundOwed });
});

it('lets Square apply the chosen discounts, and refuses them once paid', async () => {
  const api = fresh();
  const special = ['Luis Ramirez', 'Grace Wu', 'Hannah Lee', 'Jamal Hughes', 'Marcus Bell', 'Noah Feld', 'Sofia Rossi'];
  const d = (await api.deliveries.list({ scheduledFrom: today, scheduledTo: today, procurementStatus: 4, hasPaid: false, pageSize: 100 })).items
    .find(x => !special.includes(x.customerName));
  expect(d).toBeDefined();
  await api.billing.selectDiscounts(d!.id, ['DISC-AUTOSHIP']);
  const result = await api.billing.charge(d!.id);
  expect(result.isPaid).toBe(true);
  expect(result.amountCharged).toBeLessThan(d!.total);
  await expect(api.billing.selectDiscounts(d!.id, [])).rejects.toThrow(/already been charged/);
  await expect(api.billing.selectDiscounts('nope', [])).rejects.toThrow(/not found/);
});
