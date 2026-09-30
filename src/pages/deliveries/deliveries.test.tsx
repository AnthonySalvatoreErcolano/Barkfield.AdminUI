// Deliveries screens against the fake API, including the traps PAGES.md names for them.
import { screen, waitFor, within } from '@testing-library/react';
import { renderSignedIn, type User } from '../../test/renderApp';

const table = () => screen.getByRole('table');

/** Open the first worklist row whose Work cell matches — by state, not by name, so the seed can change. */
async function openFirstWhere(user: User, work: RegExp, exclude: string[] = ['Tess Nolan']) {
  await within(await screen.findByRole('table')).findAllByText(work);
  const row = within(table()).getAllByRole('row').slice(1)
    .find(r => work.test(r.textContent ?? '') && !exclude.some(n => r.textContent?.includes(n)))!;
  const name = within(row).getAllByRole('cell')[1]!.querySelector('div > div')!.textContent!;
  await user.click(row);
  await screen.findByRole('heading', { level: 1, name });
  return name;
}

async function openDelivery(user: User, customer: string) {
  await user.click(await within(await screen.findByRole('table')).findByText(customer));
  await screen.findByRole('heading', { level: 1, name: customer });
}

describe('worklist', () => {
  it('opens on the coming week, counting the work per delivery without showing lines', async () => {
    const { user } = await renderSignedIn('/deliveries');
    await within(await screen.findByRole('table')).findByText('Tess Nolan');
    expect(within(table()).getAllByText(/to resolve/).length).toBeGreaterThan(3);
    expect(within(table()).getAllByText('Ready to pack').length).toBeGreaterThan(0);

    // An unnamed subscription shows its composed label (subscriptionDisplayName), not a blank or 'one-off'.
    expect(within(table()).getAllByText(/ — every \d+ weeks?$/).length).toBeGreaterThan(0);
    expect(within(table()).queryByText('One-off delivery')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Blocked' }));
    await waitFor(() => {
      const rows = within(table()).getAllByRole('row').slice(1);
      expect(rows.length).toBeGreaterThan(0);
      rows.forEach(r => expect(within(r).getByText(/blocked/)).toBeInTheDocument());
    });
  });

  it('shows pack work to staff but not the manage actions they do not hold', async () => {
    const { user } = await renderSignedIn('/deliveries', 'staff');
    await within(await screen.findByRole('table')).findByText('Tess Nolan');
    expect(screen.queryByRole('button', { name: 'Generate deliveries' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'One-off delivery' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prep sheet' })).toBeInTheDocument();

    await openFirstWhere(user, /to resolve/);
    expect(screen.getAllByRole('button', { name: /^Update / }).length).toBeGreaterThan(0); // delivery:pack
    expect(screen.queryByRole('button', { name: 'Add product' })).not.toBeInTheDocument(); // delivery:manage
    expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument();
  });
});

describe('delivery detail', () => {
  it('records a partial receipt, which keeps the line open', async () => {
    const { user } = await renderSignedIn('/deliveries');
    await openFirstWhere(user, /to resolve/);
    const line = within(table()).getAllByRole('row')[1]!;
    const qty = within(line).getByRole('spinbutton');
    await user.clear(qty);
    await user.type(qty, '4{Enter}'); // differs from every seeded quantity, so it is a real change
    await screen.findByText('Quantity changed');

    await user.click(within(table()).getAllByRole('button', { name: /^Update / })[0]!);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('radio', { name: /Only some arrived/ }));
    await user.clear(within(dialog).getByLabelText('How many arrived'));
    await user.type(within(dialog).getByLabelText('How many arrived'), '2');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await within(table()).findByText('2 of 4')).toBeInTheDocument();
    expect(within(table()).getByText('Part received')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark packed' })).toBeDisabled();
  });

  it('locks the contents once paid, but still allows sending it short — and flags the refund', async () => {
    const { user } = await renderSignedIn('/deliveries');
    await openDelivery(user, 'Frank DeLuca');
    expect(screen.getByText(/Paid, so the contents are fixed/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add product' })).toBeDisabled();
    expect(within(table()).queryByRole('spinbutton')).not.toBeInTheDocument();

    await user.click(within(table()).getAllByRole('button', { name: /^Update / })[0]!);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('radio', { name: /Send something else instead/ })).toBeDisabled();
    await user.click(within(dialog).getByRole('radio', { name: /Send without it/ }));
    expect(within(dialog).getByText(/flags the delivery for a refund/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Refund owed')).toBeInTheDocument();
  });

  it('packs a delivery once every line is resolved', async () => {
    const { user } = await renderSignedIn('/deliveries?procurement=4');
    await openFirstWhere(user, /Ready to pack/, ['Frank DeLuca', 'Marcus Bell', 'Pat Kim']);
    await user.click(await screen.findByRole('button', { name: 'Mark packed' }));
    expect(await screen.findByText('Packed', { selector: '.br-toast__title' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark packed' })).not.toBeInTheDocument();
  });

  it('turns a 409 into a reload with an explanation, never a silent retry', async () => {
    const { user, api } = await renderSignedIn('/deliveries');
    await openDelivery(user, 'Tess Nolan');
    const action = vi.spyOn(api.deliveries, 'lineAction');
    const orderedBefore = within(table()).getAllByText('Ordered').length;

    await user.click(within(table()).getAllByRole('button', { name: /^Update / })[0]!);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('radio', { name: /All 2 arrived/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('This delivery just changed')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(within(table()).getAllByText('Ordered').length).toBe(orderedBefore + 1)); // the reload shows the other change
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('cancels from the manage menu, and the delivery then reads as closed', async () => {
    const { user } = await renderSignedIn('/deliveries');
    await openFirstWhere(user, /to resolve/);
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Cancel delivery' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel this delivery?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel delivery' }));
    expect(await screen.findByText(/This delivery is closed and can’t be changed/)).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: /^Update / })).toHaveLength(0);
  });
});

describe('generating deliveries', () => {
  it('previews every skip reason, then reports partial success as a list', async () => {
    const { user } = await renderSignedIn('/deliveries/generate');
    const preview = await screen.findByRole('table');
    await within(preview).findByText('Jake Morrison');
    expect(within(within(preview).getByText('Jake Morrison').closest('tr')!).getByText('The customer has no address on file for a local delivery.')).toBeInTheDocument();
    expect(within(preview).getAllByText('Overdue').length).toBe(2);
    expect(within(preview).getByText('Pause ends')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Create \d+ deliveries$/ }));
    expect(await screen.findByText('Created 3 deliveries')).toBeInTheDocument();
    expect(screen.getByText('Back from a pause')).toBeInTheDocument();
    expect(screen.getByText(/Jake Morrison/, { selector: 'strong' })).toBeInTheDocument();
  });
});

describe('one-off delivery', () => {
  it('schedules a delivery for a customer with no subscription behind it', async () => {
    const { user } = await renderSignedIn('/deliveries/new');
    await user.type(await screen.findByLabelText('Customer'), 'pardo');
    await user.click(await screen.findByRole('option', { name: /Chris Pardo/ }));
    await user.click(await screen.findByRole('option', { name: /Birthday Pupcake/ }));
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.click(screen.getByRole('button', { name: 'Schedule delivery' }));

    expect(await screen.findByText('One-off delivery scheduled')).toBeInTheDocument();
    await screen.findByRole('heading', { level: 1, name: 'Deliveries' }); // the form's own table is gone
    expect(await within(await screen.findByRole('table')).findByText('Chris Pardo')).toBeInTheDocument();
    expect(within(table()).getByText('One-off delivery')).toBeInTheDocument();
  });

  it('refuses a local delivery for a customer with no address before it reaches the API', async () => {
    const { user } = await renderSignedIn('/deliveries/new');
    await user.type(await screen.findByLabelText('Customer'), 'morrison');
    await user.click(await screen.findByRole('option', { name: /Jake Morrison/ }));
    expect(screen.getByText(/can’t be a local delivery/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schedule delivery' })).toBeDisabled();
  });
});

describe('prep sheet', () => {
  it('keeps shorted lines on the sheet, struck through', async () => {
    await renderSignedIn('/deliveries/sheet');
    const kate = (await screen.findByText('Kate Dunn')).closest('.sheet__box')!;
    expect(kate.querySelector('.sheet__line--short')).not.toBeNull();
    expect(within(kate as HTMLElement).getByText(/not going/)).toBeInTheDocument();
  });
});
