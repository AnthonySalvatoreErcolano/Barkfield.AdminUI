// Pets on the customer page, against the fake API: allergies picked from the shared list (and added to it
// inline), edits, and taking a pet off the list without losing the record.
import { screen, waitFor, within } from '@testing-library/react';
import { renderSignedIn, type User } from '../../test/renderApp';

async function openCustomer(user: User, name: string, includeArchived = false) {
  if (includeArchived) await user.click(await screen.findByRole('button', { name: 'Include archived' }));
  await user.type(await screen.findByRole('searchbox', { name: 'Search customers' }), name.split(' ')[1]!);
  await user.click(await within(await screen.findByRole('table')).findByText(name));
  await screen.findByRole('heading', { level: 1, name });
}

const petCard = (name: string) => screen.getByText(name, { selector: '.br-card *' }).closest('.br-card') as HTMLElement;

describe('pets', () => {
  it('adds a pet with an allergy from the list and one added to the list inline', async () => {
    const { user, api } = await renderSignedIn('/customers', 'staff'); // staff hold customer:edit
    await openCustomer(user, 'Chris Pardo');
    await user.click(screen.getByRole('button', { name: 'Add pet' }));
    const dialog = await screen.findByRole('dialog', { name: /Add a pet for Chris/ });
    await user.type(within(dialog).getByLabelText('Name'), 'Pickles');
    await user.selectOptions(within(dialog).getByLabelText('Type'), 'Cat');

    const find = within(dialog).getByRole('textbox', { name: 'Find an allergy' });
    await user.type(find, 'chick');
    await user.click(await within(dialog).findByRole('button', { name: 'Chicken' }));
    await user.type(find, 'chicken');
    expect(within(dialog).getByText('Already picked.')).toBeInTheDocument(); // the list matches in any case
    await user.clear(find);
    await user.type(find, 'Venison');
    await user.click(within(dialog).getByRole('button', { name: 'Add “Venison” to the list' }));
    await waitFor(() => expect(find).toHaveValue(''));

    await user.click(within(dialog).getByRole('button', { name: 'Add pet' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const allergies = within(petCard('Pickles')).getByLabelText('Pickles’s allergies');
    expect(within(allergies).getByText('Chicken')).toBeInTheDocument();
    expect(within(allergies).getByText('Venison')).toBeInTheDocument();
    expect((await api.pets.allergies()).filter(a => a.allergyName === 'Venison')).toHaveLength(1);
  });

  it('refuses a future birthday before it reaches the API', async () => {
    const { user, api } = await renderSignedIn('/customers');
    await openCustomer(user, 'Chris Pardo');
    await user.click(screen.getByRole('button', { name: 'Add pet' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Name'), 'Future');
    await user.type(within(dialog).getByLabelText('Birthday'), '2099-01-01');
    const create = vi.spyOn(api.pets, 'create');
    await user.click(within(dialog).getByRole('button', { name: 'Add pet' }));
    expect(within(dialog).getByText('A birthday can’t be in the future.')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('edits allergies — the list is replaced, so removing one clears it', async () => {
    const { user } = await renderSignedIn('/customers');
    await openCustomer(user, 'Greg Olsen');
    expect(within(petCard('Duke')).getByText('Allergic to')).toBeInTheDocument();
    await user.click(within(petCard('Duke')).getByRole('button', { name: 'Actions for Duke' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit Duke' });
    await user.click(within(dialog).getByRole('button', { name: 'Remove' })); // the Chicken chip
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await within(petCard('Duke')).findByText('No allergies')).toBeInTheDocument();
  });

  it('takes a pet off the list and restores it from past pets', async () => {
    const { user } = await renderSignedIn('/customers');
    await openCustomer(user, 'Greg Olsen');
    await user.click(within(petCard('Duke')).getByRole('button', { name: 'Actions for Duke' }));
    await user.click(screen.getByRole('menuitem', { name: 'Take off the list…' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Take off the list' }));
    expect(await screen.findByText('No pets on file.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show past pets' }));
    expect(await within(petCard('Duke')).findByText('Past')).toBeInTheDocument();
    await user.click(within(petCard('Duke')).getByRole('button', { name: 'Restore' }));
    await user.click(screen.getByRole('button', { name: 'Show past pets' }));
    await waitFor(() => expect(within(petCard('Duke')).queryByText('Past')).not.toBeInTheDocument());
  });

  it('doesn’t offer changes on an archived customer', async () => {
    const { user } = await renderSignedIn('/customers');
    await openCustomer(user, 'Priya Shah', true);
    expect(screen.getByRole('button', { name: 'Add pet' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Actions for Mochi' })).not.toBeInTheDocument();
  });
});
