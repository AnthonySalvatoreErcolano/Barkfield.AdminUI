// Users screens against the fake API: the role picker as a fixed set, the API's refusals in the right
// place, and the guard rails around your own account.
import { screen, waitFor, within } from '@testing-library/react';
import { renderApp, renderSignedIn, signIn, type User } from '../../test/renderApp';

const table = () => screen.getByRole('table');
const rowFor = (name: string) => within(table()).getByText(name).closest('tr')!;

async function openUser(user: User, name: string) {
  await user.click(await within(await screen.findByRole('table')).findByText(name));
  await screen.findByRole('heading', { level: 1, name });
}

describe('users list', () => {
  it('filters by role and hides deactivated accounts until asked', async () => {
    const { user } = await renderSignedIn('/users');
    await within(await screen.findByRole('table')).findByText('Sam Ortiz');
    expect(within(rowFor('Sam Ortiz')).getByText('Driver, Staff')).toBeInTheDocument();
    expect(within(rowFor('Kevin Neglia')).getByText('You')).toBeInTheDocument();
    expect(within(table()).queryByText('Lena Fox')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Driver' }));
    await waitFor(() => expect(within(table()).getAllByRole('row')).toHaveLength(3)); // header + Dev + Sam
    expect(screen.getByText('2 users with the Driver role.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Driver' }));
    await user.click(screen.getByRole('button', { name: 'Include deactivated' }));
    expect(within(await within(table()).findByText('Lena Fox').then(n => n.closest('tr')!)).getByText('Deactivated')).toBeInTheDocument();
  });

  it('is out of reach for staff, who hold no user permissions', async () => {
    await renderSignedIn('/users', 'staff');
    expect(await screen.findByText(/doesn’t include users/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
  });

  it('lets a manager look but not change anything', async () => {
    const { user } = renderApp('/users');
    await signIn(user, 'maria@barkfield.test');
    await openUser(user, 'Joe Russo');
    expect(screen.queryByRole('button', { name: 'New user' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit user' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument();
    expect(screen.getByText('Charge')).toBeInTheDocument(); // what Staff allows, from their permissions
  });
});

describe('creating a user', () => {
  it('needs a role and a long enough password, and puts a taken email under Email', async () => {
    const { user, api } = await renderSignedIn('/users/new');
    await user.type(await screen.findByLabelText('Name'), 'Rosa Diaz');
    await user.type(screen.getByLabelText('Email'), 'STAFF@barkfield.test');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create user' }));
    expect(screen.getByText('At least 12 characters.')).toBeInTheDocument();
    expect(screen.getByText('Choose at least one role.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Suggest one' }));
    expect((screen.getByLabelText('Password') as HTMLInputElement).value).toMatch(/^\w{4}-\w{4}-\w{4}-\w{4}$/);
    await user.click(screen.getByRole('checkbox', { name: /^Staff/ }));
    await user.click(screen.getByRole('button', { name: 'Create user' }));
    expect(await screen.findByText('A user with the email \'STAFF@barkfield.test\' already exists.')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Email'));
    await user.type(screen.getByLabelText('Email'), 'Rosa@Barkfield.test');
    const create = vi.spyOn(api.users, 'create');
    await user.click(screen.getByRole('button', { name: 'Create user' }));
    await screen.findByRole('heading', { level: 1, name: 'Rosa Diaz' });
    expect(create.mock.calls[0]![0]).toMatchObject({ roleIds: ['33333333-3333-3333-3333-333333333333'], isAdmin: false });
    expect(screen.getByText('rosa@barkfield.test')).toBeInTheDocument(); // the API lower-cases it
  });
});

describe('editing a user', () => {
  it('folds in a colleague’s change made while the form was open, then saves', async () => {
    const { user, api } = await renderSignedIn('/users');
    await openUser(user, 'Dev Patel');
    await user.click(screen.getByRole('button', { name: 'Edit user' }));
    await user.click(await screen.findByRole('checkbox', { name: /^Staff/ }));

    // Someone else renames him meanwhile.
    const dev = (await api.users.list({ searchTerm: 'Dev' })).items[0]!;
    const detail = await api.users.get(dev.id);
    await api.users.update(dev.id, { name: 'Devesh Patel', email: detail.email, roleIds: detail.roles.map(r => r.id), isAdmin: false });

    const update = vi.spyOn(api.users, 'update');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('This user changed while you were editing')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Devesh Patel');
    expect(screen.getByRole('checkbox', { name: /^Staff/ })).toBeChecked(); // your edit kept
    expect(update).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByRole('heading', { level: 1, name: 'Devesh Patel' });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('asks before you take away your own access, and sends you elsewhere once it’s gone', async () => {
    const { user } = await renderSignedIn('/users');
    await openUser(user, 'Kevin Neglia');
    expect(screen.queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument(); // never your own

    await user.click(screen.getByRole('button', { name: 'Edit user' }));
    await user.click(await screen.findByRole('checkbox', { name: /^Staff/ }));
    await user.click(screen.getByRole('checkbox', { name: /^Administrator/ }));
    await user.click(screen.getByRole('switch', { name: 'Administrator' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    const dialog = await screen.findByRole('dialog', { name: 'Change your own access?' });
    expect(within(dialog).getByText(/the administrator flag and the Administrator role/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Save anyway' }));

    await screen.findByRole('heading', { level: 1, name: 'My account' });
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
  });
});

describe('deactivating', () => {
  it('deactivates and restores someone else', async () => {
    const { user } = await renderSignedIn('/users');
    await openUser(user, 'Joe Russo');
    await user.click(screen.getByRole('button', { name: 'Deactivate' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Deactivate' }));
    expect(await screen.findByText(/can’t sign in, and nothing they try is allowed/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Restore' }));
    expect(await screen.findByText('Active')).toBeInTheDocument();
  });
});
