// Subscriptions screens against the fake API, including the traps PAGES.md names: frequency as number +
// unit, dated vs open pauses, permanent cancel, rotation "next up" and jump-to, add-ons as one-offs.
import { screen, waitFor, within } from '@testing-library/react';
import { renderSignedIn, type User } from '../../test/renderApp';

const table = () => screen.getByRole('table');

async function openSubscription(user: User, search: string, text: string | RegExp) {
  await user.type(await screen.findByRole('searchbox', { name: 'Search subscriptions' }), search);
  await user.click(await within(table()).findByText(text));
  await screen.findByRole('heading', { level: 1 });
}

describe('list', () => {
  it('says how each paused subscription is paused, hides canceled ones, and finds ended pauses', async () => {
    const { user } = await renderSignedIn('/subscriptions');
    await within(await screen.findByRole('table')).findByText('Sam Whitaker');
    expect(within(within(table()).getByText('Sam Whitaker').closest('tr')!).getByText(/^Paused until/)).toBeInTheDocument();
    expect(within(table()).queryByText('Priya Shah')).not.toBeInTheDocument(); // canceled (and archived)

    await user.click(screen.getByRole('button', { name: 'Pause ended' }));
    await waitFor(() => expect(within(table()).getAllByRole('row')).toHaveLength(2));
    expect(within(table()).getByText('Beth Sullivan')).toBeInTheDocument();
    expect(within(table()).getByText(/^Pause ended/)).toBeInTheDocument();
  });
});

describe('creating one', () => {
  it('starts as a new sign-up; it can only be activated once something is in the box', async () => {
    const { user } = await renderSignedIn('/customers');
    await user.type(await screen.findByRole('searchbox', { name: 'Search customers' }), 'Pardo');
    await user.click(await screen.findByText('Chris Pardo'));
    await user.click(await screen.findByRole('tab', { name: /Subscriptions/ }));
    await user.click(await screen.findByRole('button', { name: 'New subscription' }));

    expect(await screen.findByText(/For/)).toHaveTextContent('Chris Pardo');
    await user.clear(screen.getByLabelText('Number'));
    await user.type(screen.getByLabelText('Number'), '3');
    await user.selectOptions(screen.getByLabelText('Unit'), 'weeks');
    expect(screen.getByText('Then every 3 weeks.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Name (optional)'), 'Treats');
    await user.click(screen.getByRole('button', { name: 'Create subscription' }));

    await screen.findByRole('heading', { level: 1, name: 'Treats' });
    expect(screen.getByText('Not active yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activate' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Add product' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a standing item' });
    await user.click(await within(dialog).findByRole('option', { name: /Bully Sticks/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Activate' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Activate' }));
    expect(await screen.findByText('Activated', { selector: '.br-toast__title' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Skip next' })).toBeInTheDocument();
  });

  it('refuses a frequency that is not a whole number of 1 or more', async () => {
    const { user } = await renderSignedIn('/subscriptions/new');
    await user.type(await screen.findByLabelText('Customer'), 'pardo');
    await user.click(await screen.findByRole('option', { name: /Chris Pardo/ }));
    await user.clear(screen.getByLabelText('Number'));
    await user.type(screen.getByLabelText('Number'), '0');
    await user.click(screen.getByRole('button', { name: 'Create subscription' }));
    expect(await screen.findByText('A whole number, 1 or more.')).toBeInTheDocument();
  });
});

describe('rotation groups', () => {
  it('marks what is up next, keeps it there through a reorder, and sends something out of turn on request', async () => {
    const { user } = await renderSignedIn('/subscriptions');
    await openSubscription(user, 'Russo', 'Biscuit’s food');
    const ring = screen.getByRole('list', { name: 'Protein rotation order' });
    const upNext = () => within(ring).getByText('Next up').closest('li')!;
    expect(upNext()).toHaveTextContent(/Salmon/);

    await user.click(within(ring).getByRole('button', { name: /Move Open Farm Wild Salmon.* up/ }));
    await waitFor(() => expect(within(ring).getAllByRole('listitem')[0]).toHaveTextContent(/Salmon/));
    expect(upNext()).toHaveTextContent(/Salmon/);

    await user.click(within(ring).getByRole('button', { name: /Send Raw Bistro Beef.* next/ }));
    await waitFor(() => expect(upNext()).toHaveTextContent(/Beef/));
    const coming = screen.getByText('Coming up').closest('section')!;
    await waitFor(() => expect(within(coming).getAllByRole('listitem')[0]!.textContent).toMatch(/Beef|Lamb/));
  });

  it('pauses a rotation on its own, leaving the rest of the box', async () => {
    const { user } = await renderSignedIn('/subscriptions');
    await openSubscription(user, 'Russo', 'Biscuit’s food');
    await user.click(screen.getByRole('button', { name: 'Actions for Protein rotation' }));
    await user.click(screen.getByRole('menuitem', { name: 'Pause this rotation' }));
    expect(await screen.findByText(/nothing from this rotation ships until it’s resumed/)).toBeInTheDocument();
  });
});

describe('the schedule', () => {
  it('shows which kind of pause is in effect', async () => {
    const { user } = await renderSignedIn('/subscriptions');
    await openSubscription(user, 'Carter', /Ben Carter/);
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    let dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Pause' }));
    expect(await screen.findByText(/^Paused until/, { selector: '.br-alert__title' })).toBeInTheDocument();
    expect(screen.getByText(/A dated pause: it restarts on that day/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Resume' }));
    await user.click(await screen.findByRole('button', { name: 'Pause' }));
    dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByText('Until someone resumes it'));
    await user.click(within(dialog).getByRole('button', { name: 'Pause' }));
    expect(await screen.findByText('Paused — no end date', { selector: '.br-alert__title' })).toBeInTheDocument();
  });

  it('confirms cancel as permanent, and afterwards offers nothing to change', async () => {
    const { user } = await renderSignedIn('/subscriptions');
    await openSubscription(user, 'Carter', /Ben Carter/);
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Cancel subscription…' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel this subscription for good?' });
    expect(within(dialog).getByText('This is permanent')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel permanently' }));

    expect(await screen.findByText('Canceled — this is permanent')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add product' })).not.toBeInTheDocument();
  });
});

describe('add-ons', () => {
  it('reads as a one-off for the next box only', async () => {
    const { user } = await renderSignedIn('/subscriptions');
    await openSubscription(user, 'Russo', 'Bakery box');
    const extras = screen.getByText('One-off extras').closest('section')!;
    expect(within(extras).getByText(/Used once/)).toBeInTheDocument();
    expect(within(extras).getByText('Birthday Pupcake')).toBeInTheDocument();
    const coming = screen.getByText('Coming up').closest('section')!;
    await waitFor(() => expect(within(coming).getAllByText('one-off')).toHaveLength(1)); // first box only
  });
});

it('turns a 409 into a reload with an explanation', async () => {
  const { user } = await renderSignedIn('/subscriptions');
  await openSubscription(user, 'Pardo', /Chris Pardo/);
  await user.click(screen.getByRole('button', { name: 'Skip next' }));
  expect(await screen.findByText('This subscription just changed')).toBeInTheDocument();
  expect(await screen.findByText('Added by a colleague on the phone')).toBeInTheDocument();
});
