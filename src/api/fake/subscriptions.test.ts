// The subscriptions fake must follow the API domain (Subscription.cs, RotationGroup.cs).
import { FrequencyUnit, SubscriptionStatus } from '../generated/enums';
import { ConflictError } from '../errors';
import { addDays, todayIso } from '../../lib/dates';
import { createFakeApi } from '.';

const fresh = () => createFakeApi({ latency: false, persistSession: false });
const subOf = async (api: ReturnType<typeof fresh>, customer: string, name?: string) =>
  (await api.subscriptions.list({ searchTerm: customer, includeCanceled: true, pageSize: 20 })).items.find(s => name === undefined || s.name === name)!;

describe('rotation groups', () => {
  it('keeps what is up next when the ring is reordered, and jumps out of turn on request', async () => {
    const api = fresh();
    const s = await subOf(api, 'Daniella', 'Biscuit’s food');
    let g = (await api.subscriptions.get(s.id)).rotationGroups[0]!;
    expect(g.currentItem.productName).toMatch(/Salmon/);
    await api.subscriptions.reorderRotation(s.id, g.id, [...g.items].reverse().map(i => i.id));
    g = (await api.subscriptions.get(s.id)).rotationGroups[0]!;
    expect(g.currentItem.productName).toMatch(/Salmon/);
    expect(g.items[0]!.productName).toMatch(/Beef/);

    const lamb = g.items.find(i => /Lamb/.test(i.productName))!;
    await api.subscriptions.jumpTo(s.id, g.id, lamb.id);
    expect((await api.subscriptions.get(s.id)).rotationGroups[0]!.currentItem.productName).toMatch(/Lamb/);
  });

  it('refuses a duplicate product and an incomplete reorder', async () => {
    const api = fresh();
    const s = await subOf(api, 'Daniella', 'Biscuit’s food');
    const g = (await api.subscriptions.get(s.id)).rotationGroups[0]!;
    await expect(api.subscriptions.addRotationItem(s.id, g.id, { productId: g.items[0]!.productId, quantity: 1 })).rejects.toThrow(/already in this rotation group/);
    await expect(api.subscriptions.reorderRotation(s.id, g.id, [g.items[0]!.id])).rejects.toThrow(/every item in this rotation group exactly once/);
  });
});

describe('the schedule', () => {
  it('resumes a dated pause on its date, and an open pause rolls forward from today', async () => {
    const api = fresh();
    const s = await subOf(api, 'Ben Carter');
    const on = addDays(todayIso(), 10);
    await api.subscriptions.pause(s.id, on);
    await api.subscriptions.resume(s.id);
    expect((await api.subscriptions.get(s.id)).nextDeliveryDate.slice(0, 10)).toBe(on);

    await expect(api.subscriptions.pause(s.id, todayIso())).rejects.toThrow('A pause must end on a future date.');
    await expect(api.subscriptions.resume(s.id)).rejects.toThrow('Only a paused subscription can be resumed.');
  });

  it('needs something scheduled before activating, and is permanent once canceled', async () => {
    const api = fresh();
    const [customer] = (await api.customers.list({ searchTerm: 'Pardo' })).items;
    const id = await api.subscriptions.create({ customerId: customer!.id, frequencyInterval: 2, frequencyUnit: FrequencyUnit.Weeks as FrequencyUnit, firstDeliveryDate: addDays(todayIso(), 3) + 'T00:00:00Z' });
    expect((await api.subscriptions.get(id)).status).toBe(SubscriptionStatus.NewSignUp);
    await expect(api.subscriptions.activate(id)).rejects.toThrow(/at least one item or active rotation group/);
    const product = (await api.products.list({ pageSize: 1 })).items[0]!;
    await api.subscriptions.addItem(id, { productId: product.id, quantity: 1 });
    await api.subscriptions.activate(id);
    await api.subscriptions.cancel(id);
    await expect(api.subscriptions.activate(id)).rejects.toThrow('A canceled subscription cannot be reactivated.');
    await expect(api.subscriptions.addItem(id, { productId: product.id, quantity: 1 })).rejects.toThrow('A canceled subscription cannot be modified.');
  });

  it('refuses a first delivery in the past', async () => {
    const api = fresh();
    const [customer] = (await api.customers.list({ searchTerm: 'Voss' })).items;
    await expect(api.subscriptions.create({ customerId: customer!.id, frequencyInterval: 1, frequencyUnit: FrequencyUnit.Months as FrequencyUnit, firstDeliveryDate: addDays(todayIso(), -1) + 'T00:00:00Z' }))
      .rejects.toThrow('First delivery date cannot be in the past.');
  });
});

it('generation takes the rotation’s current item and the add-ons, then moves the rotation on and uses the add-ons up', async () => {
  const api = fresh();
  const bakery = await subOf(api, 'Daniella', 'Bakery box');
  expect((await api.subscriptions.get(bakery.id)).pendingAddOns).toHaveLength(1);
  const food = await subOf(api, 'Daniella', 'Biscuit’s food');
  const upcoming = await api.subscriptions.upcoming(food.id, 3);
  expect(upcoming.map(u => u.lines.find(l => l.source === 'Rotation')?.productName)).toEqual([
    expect.stringMatching(/Salmon/), expect.stringMatching(/Beef/), expect.stringMatching(/Lamb/),
  ]);

  // A day with no delivery yet for either (today's were generated in the seed).
  const day = addDays(todayIso(), 2);
  await api.subscriptions.reschedule(bakery.id, day);
  await api.subscriptions.reschedule(food.id, day);
  await api.deliveries.generate(day);
  expect((await api.subscriptions.get(bakery.id)).pendingAddOns).toHaveLength(0);
  expect((await api.subscriptions.get(food.id)).rotationGroups[0]!.currentItem.productName).toMatch(/Beef/);
});

it('409s once on Chris Pardo’s subscription, with a colleague’s add-on underneath', async () => {
  const api = fresh();
  const s = await subOf(api, 'Pardo');
  await expect(api.subscriptions.skip(s.id)).rejects.toBeInstanceOf(ConflictError);
  expect((await api.subscriptions.get(s.id)).pendingAddOns.some(a => a.note === 'Added by a colleague on the phone')).toBe(true);
  await expect(api.subscriptions.skip(s.id)).resolves.toBeUndefined();
});
