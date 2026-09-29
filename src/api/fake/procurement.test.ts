// The procurement fake must agree with the API: aggregates, scope, and the bulk write's semantics.
import { LineOrderStatus } from '../generated/enums';
import { createFakeApi } from '.';
import { FAKE_TODAY } from './seed';

const fresh = () => createFakeApi({ latency: false, persistSession: false });
const today = FAKE_TODAY.slice(0, 10);
const range = { from: today, to: today, pageSize: 200 };

it('counts partial receipts by what arrived, and puts the biggest order first', async () => {
  const api = fresh();
  const { items } = await api.procurement.products(range);
  expect(items[0]!.pendingQuantity).toBeGreaterThanOrEqual(items[1]!.pendingQuantity);
  const lines = (await api.procurement.lines(range)).items;
  const partial = lines.find(l => l.orderStatus === LineOrderStatus.PartiallyReceived)!;
  const row = items.find(p => p.productId === partial.productId)!;
  const receivedForProduct = lines.filter(l => l.productId === partial.productId && (l.orderStatus === LineOrderStatus.Received || l.orderStatus === LineOrderStatus.PartiallyReceived))
    .reduce((s, l) => s + l.quantityReceived, 0);
  expect(row.receivedQuantity).toBe(receivedForProduct);
  expect(partial.quantityReceived).toBeLessThan(partial.quantity);
});

it('reads lines customer → subscription → product by default', async () => {
  const { items } = await fresh().procurement.lines(range);
  const lasts = items.map(l => l.customerName.split(' ').slice(-1)[0]!);
  expect([...lasts]).toEqual([...lasts].sort((a, b) => a.localeCompare(b)));
});

it('applies every decision for one delivery in one save — the adjacent-rows case that 409s one by one', async () => {
  const api = fresh();
  const tess = (await api.procurement.lines({ ...range, searchTerm: 'Nolan' })).items;
  expect(tess.length).toBe(4);
  const before = (await api.deliveries.get(tess[0]!.deliveryId)).revision;
  const result = await api.procurement.apply(tess.map(l => ({ deliveryId: l.deliveryId, lineId: l.lineId, status: LineOrderStatus.Ordered, note: 'PO 5102' })));
  expect(result.appliedCount).toBe(4);
  expect(result.deliveries).toHaveLength(1);
  expect((await api.deliveries.get(tess[0]!.deliveryId)).revision).toBe(before + 1); // one bump, not four
});

it('reports a partial failure per line and still applies the rest', async () => {
  const api = fresh();
  const lines = (await api.procurement.lines(range)).items.filter(l => l.isUnresolved);
  const moran = lines.filter(l => l.customerName === 'Ann Cho');
  const others = lines.filter(l => l.customerName !== 'Ann Cho' && l.customerName !== 'Tess Nolan').slice(0, 5);
  expect(moran.length).toBeGreaterThan(0);
  const result = await api.procurement.apply([...moran, ...others].map(l => ({ deliveryId: l.deliveryId, lineId: l.lineId, status: LineOrderStatus.OutOfStock })));
  expect(result.failedCount).toBe(moran.length);
  expect(result.appliedCount).toBe(others.length);
  expect(result.results.find(r => !r.applied)!.reason).toBe('This delivery kept changing while you were saving. Reload and try again.');
});

it('refuses the whole batch for a repeated line or an empty request', async () => {
  const api = fresh();
  const [l] = (await api.procurement.lines(range)).items;
  const d = { deliveryId: l!.deliveryId, lineId: l!.lineId, status: LineOrderStatus.Ordered };
  await expect(api.procurement.apply([d, d])).rejects.toThrow(/appears more than once/);
  await expect(api.procurement.apply([])).rejects.toThrow('No procurement decisions were sent.');
});

it('substitution after payment fails for that line with the API’s reason', async () => {
  const api = fresh();
  const frank = (await api.procurement.lines({ ...range, searchTerm: 'DeLuca' })).items[0]!;
  const other = (await api.products.list({ pageSize: 5 })).items.find(p => p.id !== frank.productId)!;
  const result = await api.procurement.apply([{ deliveryId: frank.deliveryId, lineId: frank.lineId, status: LineOrderStatus.Substituted, substituteProductId: other.id }]);
  expect(result.results[0]!.applied).toBe(false);
  expect(result.results[0]!.reason).toMatch(/already been charged/);
});
