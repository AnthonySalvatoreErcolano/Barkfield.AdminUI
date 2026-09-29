// Customers screens against the fake API — including the unhappy paths the fake is built to produce.
import { screen, waitFor, within } from '@testing-library/react';
import { renderSignedIn } from '../../test/renderApp';

const table = () => screen.getByRole('table');
const rowFor = (name: string) => within(table()).getByText(name).closest('tr')!;

async function openCustomer(user: Awaited<ReturnType<typeof renderSignedIn>>['user'], name: string) {
  await user.type(await screen.findByRole('searchbox', { name: 'Search customers' }), name.split(' ')[1]!);
  await user.click(await screen.findByText(name));
  await screen.findByRole('heading', { level: 1, name });
}

describe('customers list', () => {
  it('pages, searches and hides archived customers until asked', async () => {
    const { user } = await renderSignedIn('/customers');
    await screen.findByText('Showing 1–25 of 38');
    expect(within(table()).queryByText('Priya Shah')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Include archived' }));
    await screen.findByText('Showing 1–25 of 40');

    await user.type(screen.getByRole('searchbox', { name: 'Search customers' }), 'shah');
    await waitFor(() => expect(rowFor('Priya Shah')).toBeInTheDocument());
    expect(within(rowFor('Priya Shah')).getByText('Archived')).toBeInTheDocument();
  });

  it('sorts only by the keys the endpoint accepts', async () => {
    const { user } = await renderSignedIn('/customers');
    await screen.findByText('Showing 1–25 of 38');
    const header = (name: string) => screen.getByRole('columnheader', { name: new RegExp(name) });

    expect(within(header('Town')).getByRole('button')).toBeInTheDocument();
    expect(within(header('Pets')).queryByRole('button')).not.toBeInTheDocument(); // not a sort key

    await user.click(within(header('Town')).getByRole('button'));
    await waitFor(() => expect(header('Town')).toHaveAttribute('aria-sort', 'ascending'));
    const towns = within(table()).getAllByRole('row').slice(1, 4).map(r => (r as HTMLTableRowElement).cells[2]!.textContent);
    // No address sorts first, as SQL Server orders NULLs — the fake matches the API, not a nicer order.
    expect(towns).toEqual(['No address', 'No address', 'Centerport']);
  });

  it('flags customers whose Square link is broken', async () => {
    const { user } = await renderSignedIn('/customers');
    await user.click(await screen.findByRole('button', { name: 'Not linked to Square' }));
    await waitFor(() => expect(within(table()).getAllByRole('row')).toHaveLength(3)); // header + Marcus Bell + Noah Feld
    expect(rowFor('Marcus Bell')).toBeInTheDocument();
  });

  it('gates create and archive on the operations they call', async () => {
    const { user } = await renderSignedIn('/customers', 'staff');
    expect(await screen.findByRole('button', { name: 'New customer' })).toBeInTheDocument(); // staff hold customer:create
    await openCustomer(user, 'Chris Pardo');
    expect(screen.getByRole('button', { name: 'Edit customer' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument(); // no customer:delete
  });
});

describe('editing a customer', () => {
  it('turns a 409 into reload-and-reapply, never an error toast or an auto-retry', async () => {
    const { user, api } = await renderSignedIn('/customers');
    await openCustomer(user, 'Sam Whitaker');
    await user.click(screen.getByRole('button', { name: 'Edit customer' }));
    const update = vi.spyOn(api.customers, 'update');

    await user.clear(await screen.findByLabelText('Phone'));
    await user.type(screen.getByLabelText('Phone'), '6315550000');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('This customer changed while you were editing')).toBeInTheDocument();
    expect(screen.getByText(/Their changes are shown below/)).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toHaveValue('Moved to the Tuesday run from next week.'); // their change
    expect(screen.getByLabelText('Phone')).toHaveValue('6315550000'); // my change kept
    expect(update).toHaveBeenCalledTimes(1); // not retried behind the user's back

    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByRole('heading', { level: 1, name: 'Sam Whitaker' });
    expect(screen.getByText('(631) 555-0000')).toBeInTheDocument();
  });

  it('re-reads before saving and shows what someone else changed, keeping my other edits', async () => {
    const { user, api } = await renderSignedIn('/customers');
    await openCustomer(user, 'Chris Pardo');
    await user.click(screen.getByRole('button', { name: 'Edit customer' }));
    await user.type(await screen.findByLabelText('Notes'), 'Prefers mornings.');

    // Meanwhile, a colleague changes the phone number.
    const record = api.fake.db.customers.find(c => c.fullName === 'Chris Pardo')!;
    record.phoneNumber = '6315551234';
    record.updatedAt = new Date().toISOString();

    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Phone is now “(631) 555-1234”')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toHaveValue('Prefers mornings.');
    expect(record.notes).toBeNull(); // nothing saved yet — the user looks first
  });

  it('shows the field that clashed with my own edit, with what I had typed', async () => {
    const { user, api } = await renderSignedIn('/customers');
    await openCustomer(user, 'Chris Pardo');
    await user.click(screen.getByRole('button', { name: 'Edit customer' }));
    await user.clear(await screen.findByLabelText('Phone'));
    await user.type(screen.getByLabelText('Phone'), '6315559999');

    const record = api.fake.db.customers.find(c => c.fullName === 'Chris Pardo')!;
    record.phoneNumber = '6315551234';

    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Just changed by someone else. You had: “6315559999”')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toHaveValue('6315551234');
  });

  it('shows the API’s wording for a duplicate email', async () => {
    const { user } = await renderSignedIn('/customers');
    await openCustomer(user, 'Chris Pardo');
    await user.click(screen.getByRole('button', { name: 'Edit customer' }));
    await user.clear(await screen.findByLabelText('Email'));
    await user.type(screen.getByLabelText('Email'), 'daniella.russo@example.com');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Another customer already uses the email \'daniella.russo@example.com\'.')).toBeInTheDocument();
  });
});

describe('the Square link', () => {
  it('reports a save that did not reach Square, and retries through an outage', async () => {
    const { user } = await renderSignedIn('/customers');
    await openCustomer(user, 'Marcus Bell');
    expect(screen.getByText('Not linked to Square', { selector: '.br-alert__title' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit customer' }));
    await user.type(await screen.findByLabelText('Notes'), ' Gate sticks.');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText(/Square said: “Square did not accept the update/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try the Square link again' }));
    expect(await screen.findByText('An upstream service is currently unavailable.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try the Square link again' }));
    expect(await screen.findByText('Linked to Square', { selector: '.br-badge' })).toBeInTheDocument();
    expect(screen.queryByText('Try the Square link again')).not.toBeInTheDocument();
  });
});

describe('new customer', () => {
  it('finds an existing Square profile and links it rather than creating a duplicate', async () => {
    const { user, api } = await renderSignedIn('/customers/new');
    const create = vi.spyOn(api.customers, 'create');
    await user.type(await screen.findByLabelText('Email'), 'linda.park@example.com');
    await user.type(screen.getByLabelText('Phone (optional)'), '631 555 0901');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('2 matches in Square')).toBeInTheDocument(); // the phone matches a second profile
    await user.click(screen.getByRole('radio', { name: /linda\.park@example\.com/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByLabelText('First name')).toHaveValue('Linda');
    await user.type(screen.getByLabelText('Street'), '12 Elm St');
    await user.type(screen.getByLabelText('Town'), 'Huntington');
    await user.click(screen.getByRole('button', { name: 'Add customer' }));

    await screen.findByRole('heading', { level: 1, name: 'Linda Park' });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ squareCustomerId: 'SQ7001' }));
  });

  it('stops at an existing customer, and at an archived one says to restore instead', async () => {
    const { user } = await renderSignedIn('/customers/new');
    await user.type(await screen.findByLabelText('Email'), 'priya.shah@example.com');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('An archived customer uses this email')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add customer' })).not.toBeInTheDocument();
  });

  it('refuses half an address before it reaches the API', async () => {
    const { user, api } = await renderSignedIn('/customers/new');
    const create = vi.spyOn(api.customers, 'create');
    await user.type(await screen.findByLabelText('Email'), 'new.person@example.com');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.type(await screen.findByLabelText('First name'), 'New');
    await user.type(screen.getByLabelText('Last name'), 'Person');
    await user.type(screen.getByLabelText('ZIP'), '11768');
    await user.click(screen.getByRole('button', { name: 'Add customer' }));
    expect(await screen.findByText('A delivery address needs a street.')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });
});

describe('delivery details', () => {
  it('checks the window and saves, noting it applies to tonight’s run', async () => {
    const { user } = await renderSignedIn('/customers');
    await openCustomer(user, 'Chris Pardo');
    await user.click(screen.getByRole('button', { name: 'Edit delivery details' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delivery details' });
    expect(within(dialog).getByText(/read/)).toHaveTextContent('read live when the day is sent for routing');

    await user.type(within(dialog).getByLabelText('Window from'), '14:00');
    await user.type(within(dialog).getByLabelText('Window until'), '10:00');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(dialog).findByText('Must be after the start.')).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText('Window until'));
    await user.type(within(dialog).getByLabelText('Window until'), '17:00');
    await user.type(within(dialog).getByLabelText('Access notes'), 'Side door.');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Delivery details saved')).toBeInTheDocument();
    expect(await screen.findByText('2pm–5pm')).toBeInTheDocument();
    expect(screen.getByText('Side door.')).toBeInTheDocument();
  });
});

describe('archive and restore', () => {
  it('warns that subscriptions keep running, archives, and restores', async () => {
    const { user } = await renderSignedIn('/customers');
    await openCustomer(user, 'Daniella Russo');
    await user.click(screen.getByRole('button', { name: 'Archive' }));
    const dialog = await screen.findByRole('dialog', { name: 'Archive Daniella?' });
    expect(await within(dialog).findByText(/doesn’t pause or cancel their 2 subscriptions/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Archive' }));
    expect(await screen.findByText('Archived', { selector: '.br-badge' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Restore' }));
    expect(await screen.findByText('Active', { selector: '.br-badge' })).toBeInTheDocument();
  });
});
