// Products screens against the fake API and its stand-in Square catalog: adding from Square (and what
// can't be added), syncing prices, and discontinuing something still on subscriptions.
import { screen, waitFor, within } from '@testing-library/react';
import { renderSignedIn, type User } from '../../test/renderApp';

const table = () => screen.getByRole('table');

async function searchSquare(user: User, text: string) {
  const box = await screen.findByLabelText('Search Square’s catalog');
  await user.clear(box);
  await user.type(box, `${text}{Enter}`);
}

async function openProduct(user: User, name: string) {
  await user.type(await screen.findByRole('searchbox', { name: 'Search products' }), name);
  await user.click(await within(table()).findByText(name));
  await screen.findByRole('heading', { level: 1, name });
}

describe('products list', () => {
  it('hides discontinued products until asked, and offers staff no catalog changes', async () => {
    const { user } = await renderSignedIn('/products', 'staff');
    await within(await screen.findByRole('table')).findByText('Acana Wild Atlantic 25 lb');
    expect(within(table()).queryByText('Blue Seal Chicken & Rice 30 lb')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add from Square' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sync with Square' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Include discontinued' }));
    const row = (await within(table()).findByText('Blue Seal Chicken & Rice 30 lb')).closest('tr')!;
    expect(within(row).getByText('Discontinued')).toBeInTheDocument();
  });

  it('syncs every product and lists the ones Square no longer prices, rather than removing them', async () => {
    const { user } = await renderSignedIn('/products');
    await user.click(await screen.findByRole('button', { name: 'Sync with Square' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Sync now' }));

    const dialog = await screen.findByRole('dialog', { name: 'Synced with Square' });
    expect(within(dialog).getByText('1 updated')).toBeInTheDocument(); // Acana's price moved in Square
    expect(within(dialog).getByText('Pumpkin Bites — bakery')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Done' }));
    const acana = within(table()).getByText('Acana Wild Atlantic 25 lb').closest('tr')!;
    await waitFor(() => expect(within(acana).getByText('$104.99')).toBeInTheDocument());
  });
});

describe('adding from Square', () => {
  it('adds one variation of an item, and says why a per-sale price can’t be added', async () => {
    const { user } = await renderSignedIn('/products/add');
    await searchSquare(user, 'yak');
    const yak = await screen.findByText('Himalayan Yak Chew');
    expect(screen.getAllByRole('button', { name: /^Add Himalayan Yak Chew/ })).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: 'Add Himalayan Yak Chew — Medium' }));
    expect(await screen.findByText('Added Himalayan Yak Chew — Medium')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole('button', { name: /^Add Himalayan Yak Chew/ })).toHaveLength(2));
    expect(within(yak.closest('.br-card') as HTMLElement).getByText('In the catalog')).toBeInTheDocument();

    await searchSquare(user, 'northwest');
    expect(await screen.findByText('Priced per sale')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /By the pound/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Northwest Naturals Chicken — Nuggets 6 lb' })).toBeInTheDocument();
  });

  it('marks a stale price, and adds back a discontinued product', async () => {
    const { user } = await renderSignedIn('/products/add');
    await searchSquare(user, 'acana');
    expect(await screen.findByText('Price out of date')).toBeInTheDocument();
    expect(screen.getByText(/Here \$99\.99/)).toBeInTheDocument();

    await searchSquare(user, 'blue seal');
    expect(await screen.findByText('Discontinued here')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add back Blue Seal Chicken & Rice 30 lb' }));
    expect(await screen.findByText('Blue Seal Chicken & Rice 30 lb is back in the catalog')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('In the catalog')).toBeInTheDocument());
  });
});

describe('product detail', () => {
  it('reports a Square outage on sync without changing anything, and succeeds on retry', async () => {
    const { user } = await renderSignedIn('/products');
    await openProduct(user, 'Orijen Six Fish 23.5 lb');
    await user.click(screen.getByRole('button', { name: 'Sync from Square' }));
    expect(await screen.findByText('Couldn’t sync')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sync from Square' }));
    expect(await screen.findByText('Synced with Square')).toBeInTheDocument();
  });

  it('says when a product is gone from Square', async () => {
    const { user } = await renderSignedIn('/products');
    await openProduct(user, 'Pumpkin Bites — bakery');
    await user.click(screen.getByRole('button', { name: 'Sync from Square' }));
    expect(await screen.findByText('Gone from Square')).toBeInTheDocument();
    expect(screen.getByText(/The price here is unchanged/)).toBeInTheDocument();
  });

  it('warns that subscriptions keep a discontinued product, then restores it', async () => {
    const { user } = await renderSignedIn('/products');
    await openProduct(user, 'Open Farm Lamb & Oat 24 lb');
    await user.click(screen.getByRole('button', { name: 'Discontinue' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/^Still on \d+ subscription lines?$/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Discontinue' }));

    expect(await screen.findByText(/each of those subscriptions flags it/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Restore' }));
    expect(await screen.findByText('In the catalog')).toBeInTheDocument();
  });
});
