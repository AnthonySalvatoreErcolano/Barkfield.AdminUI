// The dashboard against the fake API: each tile's number agrees with the screen it opens, tiles appear
// only for the permissions behind them, and one failing read doesn't take the page down.
import { screen, waitFor, within } from '@testing-library/react';
import { ProcurementStatus } from '../../api/generated/enums';
import { addDays, dayOf, todayIso } from '../../lib/dates';
import { renderApp, renderSignedIn, signIn } from '../../test/renderApp';

const tile = (label: string) => screen.findByRole('button', { name: new RegExp(`^${label}: \\d+$`) });

describe('dashboard', () => {
  it('counts the day from the same reads the screens use', async () => {
    const { api } = await renderSignedIn('/');
    const today = todayIso();
    const week = (await api.deliveries.list({ scheduledFrom: today, scheduledTo: addDays(today, 6), includeClosed: false, pageSize: 200 })).items;
    const todays = week.filter(d => dayOf(d.scheduledFor) === today);
    const blocked = week.filter(d => d.procurementStatus === ProcurementStatus.Blocked);

    expect(await tile('Today’s deliveries')).toHaveAccessibleName(`Today’s deliveries: ${todays.length}`);
    expect(await tile('Blocked on stock')).toHaveAccessibleName(`Blocked on stock: ${blocked.length}`);
    await tile('Still to order');
    await tile('Still to generate');

    // Today's table, the dispatch status line in the API's words, and the refused cards up top.
    const card = screen.getByText('Today’s deliveries', { selector: '.br-card *' }).closest('.br-card') as HTMLElement;
    await within(card).findByText(todays[0]!.customerName);
    expect(await screen.findByText(/ready to send for routing/)).toBeInTheDocument();
    expect(await screen.findByText(/refused/)).toBeInTheDocument();
  });

  it('opens the screen behind a tile', async () => {
    const { user } = await renderSignedIn('/');
    await user.click(await tile('Blocked on stock'));
    await screen.findByRole('heading', { level: 1, name: 'Deliveries' });
    expect(screen.getByRole('button', { name: 'Blocked' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows a driver only what their permissions cover', async () => {
    const { user } = renderApp('/');
    await signIn(user, 'dev@barkfield.test'); // Driver: delivery:view + dispatch:view, no billing
    await tile('Today’s deliveries');
    expect(await screen.findByText(/ready to send for routing/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Review' })).not.toBeInTheDocument();
  });

  it('keeps the rest of the page when one read fails', async () => {
    const { api, user } = renderApp('/');
    vi.spyOn(api.procurement, 'products').mockRejectedValue(new Error('down'));
    await signIn(user, 'admin@barkfield.test');
    expect(await screen.findByRole('button', { name: 'Still to order: couldn’t load' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /^Today’s deliveries: \d+$/ })).toBeInTheDocument());
  });
});
