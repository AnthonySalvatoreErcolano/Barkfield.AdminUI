// Dispatch against the fake API and its stand-in Routific: sending once (and saying so), the load list in
// loading order, a pulled-back route, withdrawing, and a refused Routific token.
import { screen, waitFor, within } from '@testing-library/react';
import { CredentialError } from '../../api/errors';
import { DeliveryStatus, FulfillmentMethod } from '../../api/generated/enums';
import { todayIso } from '../../lib/dates';
import { renderApp, renderSignedIn, signIn, type User } from '../../test/renderApp';
import type { createFakeApi } from '../../api/fake';

type FakeApi = ReturnType<typeof createFakeApi>;

/** Pack every one of today's local deliveries that can be, so there is a real day to send. */
async function packToday(api: FakeApi) {
  const today = api.fake.db.deliveries.filter(d => d.scheduledFor.slice(0, 10) === todayIso() && d.fulfillmentMethod === FulfillmentMethod.LocalDelivery);
  for (const d of today) if (d.isReadyToPack && d.status === DeliveryStatus.Scheduled) await api.deliveries.pack(d.id);
  return api.fake.db.deliveries.filter(d => today.some(t => t.id === d.id) && d.status === DeliveryStatus.Packed);
}

async function sendDay(user: User) {
  await user.click(await screen.findByRole('button', { name: /^Send \d+ packed deliver/ }));
  const dialog = await screen.findByRole('dialog');
  await user.click(within(dialog).getByRole('button', { name: 'Send' }));
  return screen.findByRole('dialog', { name: /^Sent \d+ deliver/ });
}

describe('sending for routing', () => {
  it('sends only packed boxes, reports all four outcomes, then says not to send again', async () => {
    const { user, api } = await renderSignedIn('/dispatch');
    const packed = await packToday(api);
    await user.click(await screen.findByRole('button', { name: 'Refresh' }));

    await user.click(await screen.findByRole('button', { name: `Send ${packed.length} packed deliveries for routing` }));
    const confirm = await screen.findByRole('dialog');
    expect(within(confirm).getByText(/haven’t paid|hasn’t paid/)).toBeInTheDocument(); // unpaid ones go anyway
    expect(within(confirm).getByText(/Not packed, so not going/)).toBeInTheDocument();
    await user.click(within(confirm).getByRole('button', { name: 'Send' }));

    const result = await screen.findByRole('dialog', { name: /^Sent \d+ deliver/ });
    expect(within(result).getByText(/already there \(left alone\)/)).toBeInTheDocument();
    expect(within(result).getByText(/Skipped \d+ deliver/)).toBeInTheDocument(); // the unpacked ones, named
    await user.click(within(result).getByRole('button', { name: 'Done' }));

    // Some of today's boxes weren't packed, so the day is part-sent — and nothing offers a whole-day resend.
    expect(await screen.findByText('Some deliveries haven’t gone yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /packed deliveries for routing/ })).not.toBeInTheDocument();
  });

  it('once everything has gone, says it is waiting for a route — so nobody sends the day twice', async () => {
    const { user, api } = await renderSignedIn('/dispatch');
    await packToday(api);
    // Whatever couldn't be packed is called off, so everything left on the day gets sent.
    for (const d of api.fake.db.deliveries.filter(x => x.scheduledFor.slice(0, 10) === todayIso() && x.fulfillmentMethod === FulfillmentMethod.LocalDelivery && x.status === DeliveryStatus.Scheduled)) {
      // Tess Nolan's delivery 409s on its first change (the fake's overlap trap) — a person reloads and retries.
      await api.deliveries.cancel(d.id).catch(() => api.deliveries.cancel(d.id));
    }
    await user.click(await screen.findByRole('button', { name: 'Refresh' }));
    await user.click(within(await sendDay(user)).getByRole('button', { name: 'Done' }));
    expect(await screen.findByText(/^Sent at .* — waiting for a route$/)).toBeInTheDocument();
    expect(screen.getByText(/Don’t send the day again/)).toBeInTheDocument();
  });

  it('shows a refused Routific token prominently, not as a passing toast', async () => {
    const { user, api } = await renderSignedIn('/dispatch');
    await packToday(api);
    vi.spyOn(api.dispatch, 'send').mockRejectedValue(new CredentialError('Routific rejected our credentials: the token has expired. A new API token has to be issued.'));
    await user.click(await screen.findByRole('button', { name: 'Refresh' }));
    await user.click(await screen.findByRole('button', { name: /^Send \d+ packed deliver/ }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('Routific refused our credentials')).toBeInTheDocument();
    expect(screen.getByText(/trying again won’t help/)).toBeInTheDocument();
  });

  it('withdraws a sent delivery, which can then be sent again on its own', async () => {
    const { user, api } = await renderSignedIn('/dispatch');
    const packed = await packToday(api);
    await user.click(await screen.findByRole('button', { name: 'Refresh' }));
    await user.click(within(await sendDay(user)).getByRole('button', { name: 'Done' }));

    const name = packed[0]!.customerName;
    const row = (await within(screen.getByRole('table')).findByText(name)).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: 'Withdraw' }));
    await user.click(within(await screen.findByRole('dialog', { name: `Withdraw ${name}?` })).getByRole('button', { name: 'Withdraw' }));
    expect(await screen.findByText(`${name} withdrawn from Routific`)).toBeInTheDocument();
    await waitFor(() => expect(within(within(screen.getByRole('table')).getByText(name).closest('tr')!).getByRole('button', { name: 'Send' })).toBeInTheDocument());
  });
});

describe('the load list', () => {
  it('comes in loading order, one entry per doorstep, and ticks boxes into the van', async () => {
    const { user, api } = await renderSignedIn('/dispatch');
    await packToday(api);
    await user.click(await screen.findByRole('button', { name: 'Refresh' }));
    await user.click(within(await sendDay(user)).getByRole('button', { name: 'Done' }));

    api.fake.routific.publishRoutes(todayIso()); // the dispatcher publishes in Routific
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(await screen.findByText('Route published')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open load list' }));
    await screen.findByRole('heading', { level: 1, name: 'Route A load list' });

    // Loading order: the last drop goes in first; the ad-hoc stop shows with nothing to load.
    const drops = [...document.querySelectorAll('.load-stop')].map(s => Number(/drop (\d+)/.exec(s.textContent ?? '')![1]));
    expect(drops).toEqual([...drops].sort((a, b) => b - a));
    expect(screen.getByText('Added in Routific')).toBeInTheDocument();
    expect(screen.getByText('Nothing to load — the driver still stops here.')).toBeInTheDocument();

    const box = screen.getAllByRole('checkbox', { name: /box is in the van$/ })[0]!;
    await user.click(box.closest('label')!.querySelector('.br-check__box')!);
    await waitFor(() => expect(box).toBeChecked());
    expect(screen.getByText(/^1 of \d+ stops? loaded$/)).toBeInTheDocument();

    // The stop the dispatcher added has nothing to load, but it is ticked like any other door.
    const adHoc = screen.getByRole('checkbox', { name: /is ready to go$/ });
    await user.click(adHoc.closest('label')!.querySelector('.br-check__box')!);
    await waitFor(() => expect(adHoc).toBeChecked());
    expect(screen.getByText(/^2 of \d+ stops loaded$/)).toBeInTheDocument();
  });

  it('says the plan is out of date when the route is pulled back', async () => {
    const { user, api } = await renderSignedIn('/dispatch');
    await packToday(api);
    await user.click(await screen.findByRole('button', { name: 'Refresh' }));
    await user.click(within(await sendDay(user)).getByRole('button', { name: 'Done' }));
    const routeId = api.fake.routific.publishRoutes(todayIso())!;
    api.fake.routific.pullBack(routeId);

    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(await screen.findByText('Stop loading — a route was pulled back for re-planning')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open load list' }));
    expect(await screen.findByText('This plan is out of date — stop loading')).toBeInTheDocument();
  });

  it('lets a driver read the board and load list, but not send, withdraw or tick', async () => {
    const { user, api } = renderApp('/dispatch');
    const packed = await packToday(api);
    await api.dispatch.send(todayIso());
    api.fake.routific.publishRoutes(todayIso());
    await signIn(user, 'dev@barkfield.test'); // Driver: dispatch:view, no dispatch:send or delivery:pack
    await screen.findByText('Route published');
    expect(screen.queryByRole('button', { name: 'Withdraw' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open load list' }));
    expect((await screen.findAllByText(packed[0]!.customerName)).length).toBeGreaterThan(0);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
