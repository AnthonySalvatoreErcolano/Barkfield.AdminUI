// The fake is only useful if it behaves like the API. These pin down the data volume the kickoff asks
// for and the domain rules the screens are built against.
import { LineOrderStatus, ProcurementStatus } from '../generated/enums';
import { ConflictError, ValidationError } from '../errors';
import { createFakeApi } from '.';
import { FAKE_TODAY } from './seed';

const fresh = () => createFakeApi({ latency: false, persistSession: false });
const today = FAKE_TODAY.slice(0, 10);

async function todays(api = fresh()) {
  return (await api.deliveries.list({ scheduledFrom: today, scheduledTo: today, pageSize: 200 })).items;
}

it('seeds a realistic day: about 25 open deliveries, two households at one address, every procurement state', async () => {
  const items = await todays();
  expect(items.length).toBeGreaterThanOrEqual(22);
  expect(items.length).toBeLessThanOrEqual(30);
  const morenos = items.filter(d => d.customerName.endsWith('Moreno'));
  expect(morenos).toHaveLength(2);
  const states = new Set(items.map(d => d.procurementStatus));
  for (const s of [ProcurementStatus.NotStarted, ProcurementStatus.InProgress, ProcurementStatus.Blocked, ProcurementStatus.Ready]) expect(states).toContain(s);
});

it('previews generation with the API’s skip reasons, then reports partial success as a list', async () => {
  const api = fresh();
  const due = await api.deliveries.due(today);
  const jake = due.find(d => d.customerName === 'Jake Morrison')!;
  expect(jake.skipReason).toBe('The customer has no address on file for a local delivery.');
  expect(due.find(d => d.customerName === 'Beth Sullivan')?.resumingFromPause).toBe(true);
  expect(due.some(d => d.isOverdue)).toBe(true);
  expect(due.some(d => d.alreadyGenerated)).toBe(true);

  const result = await api.deliveries.generate(today);
  expect(result.created).toBeGreaterThanOrEqual(3); // Beth + the two overdue
  expect(result.resumedCount).toBe(1);
  expect(result.skipped.map(s => s.reason)).toContain('The customer has no address on file for a local delivery.');

  const again = await api.deliveries.generate(today);
  expect(again.created).toBe(0); // idempotent for the day
});

it('derives a line’s status from the count received, and rolls the delivery up from its lines', async () => {
  const api = fresh();
  const d = (await todays(api)).find(x => x.procurementStatus === ProcurementStatus.NotStarted && x.customerName !== 'Tess Nolan')!;
  const detail = await api.deliveries.get(d.id);
  const line = detail.lines[0]!;
  await api.deliveries.changeQuantity(d.id, line.id, 3);
  await api.deliveries.lineAction(d.id, line.id, { kind: 'received', quantityReceived: 2 });
  let after = await api.deliveries.get(d.id);
  expect(after.lines[0]!.orderStatus).toBe(LineOrderStatus.PartiallyReceived);
  expect(after.lines[0]!.quantityOutstanding).toBe(1);
  expect(after.procurementStatus).toBe(ProcurementStatus.InProgress);

  await api.deliveries.lineAction(d.id, line.id, { kind: 'out-of-stock' });
  after = await api.deliveries.get(d.id);
  expect(after.procurementStatus).toBe(ProcurementStatus.Blocked);
  await expect(api.deliveries.pack(d.id)).rejects.toThrow(/cannot be packed until every line is resolved/);
});

it('locks contents once paid, but still lets a line be shorted — and flags the refund', async () => {
  const api = fresh();
  const paid = (await todays(api)).find(x => x.customerName === 'Frank DeLuca')!;
  expect(paid.contentsAreLocked).toBe(true);
  const detail = await api.deliveries.get(paid.id);
  await expect(api.deliveries.changeQuantity(paid.id, detail.lines[0]!.id, 5)).rejects.toThrow(/already been charged/);
  await expect(api.deliveries.lineAction(paid.id, detail.lines[0]!.id, { kind: 'substitute', substituteProductId: detail.lines[0]!.productId }))
    .rejects.toThrow(/already been charged/);
  await api.deliveries.lineAction(paid.id, detail.lines[0]!.id, { kind: 'short' });
  expect((await api.deliveries.get(paid.id)).needsRefundAttention).toBe(true);
});

it('refuses to empty a delivery, and refuses any change once it is closed', async () => {
  const api = fresh();
  const d = (await todays(api)).find(x => x.lineCount === 1 && !x.contentsAreLocked && x.customerName !== 'Tess Nolan')!;
  const detail = await api.deliveries.get(d.id);
  await expect(api.deliveries.removeLine(d.id, detail.lines[0]!.id)).rejects.toThrow('A delivery must have at least one line. Cancel it instead of emptying it.');
  await api.deliveries.cancel(d.id);
  await expect(api.deliveries.updateNotes(d.id, 'x')).resolves.toBeUndefined();
  await expect(api.deliveries.lineAction(d.id, detail.lines[0]!.id, { kind: 'ordered' })).rejects.toBeInstanceOf(ValidationError);
});

it('409s once on Tess Nolan’s delivery, having moved another line underneath', async () => {
  const api = fresh();
  const d = (await todays(api)).find(x => x.customerName === 'Tess Nolan')!;
  const before = await api.deliveries.get(d.id);
  const pendingBefore = before.lines.filter(l => l.orderStatus === LineOrderStatus.Pending).length;
  await expect(api.deliveries.lineAction(d.id, before.lines[0]!.id, { kind: 'received' })).rejects.toBeInstanceOf(ConflictError);
  const after = await api.deliveries.get(d.id);
  expect(after.lines.filter(l => l.orderStatus === LineOrderStatus.Pending).length).toBe(pendingBefore - 1);
  await expect(api.deliveries.lineAction(d.id, before.lines[0]!.id, { kind: 'received' })).resolves.toBeUndefined();
});
