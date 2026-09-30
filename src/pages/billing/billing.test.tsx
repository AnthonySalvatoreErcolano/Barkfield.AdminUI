// Billing against the fake API. The trap: a declined card is a 200 — the screen must show a list of
// people to ring, not success/failure.
import { screen, waitFor, within } from '@testing-library/react';
import { renderSignedIn } from '../../test/renderApp';

const table = () => screen.getByRole('table');
const rowOf = (name: string) => within(table()).getByText(name).closest('tr')!;

describe('charging the day', () => {
  it('charges every ready delivery in one go and returns a worklist of who to ring', async () => {
    const { user, api } = await renderSignedIn('/billing', 'staff'); // staff run the day's charges
    const chargeAll = vi.spyOn(api.billing, 'chargeAll');
    await user.click(await screen.findByRole('button', { name: /^Charge \d+ ready deliver/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/These are real payments/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /^Charge \d+ deliver/ }));

    const ring = await screen.findByText('Ring 4 customers');
    const worklist = ring.closest('section')!;
    expect(within(worklist).getByText('Luis Ramirez')).toBeInTheDocument();
    expect(within(worklist).getByText(/The card needs fixing — ring them/)).toBeInTheDocument();
    expect(within(worklist).getByText(/No card on file — ring them/)).toBeInTheDocument();
    expect(within(worklist).getByText(/Square error — worth retrying later/)).toBeInTheDocument();
    expect(within(worklist).getByText(/Noah Feld is not linked to a Square profile/)).toBeInTheDocument();
    expect(within(worklist).getByText(/taken by Square/)).toBeInTheDocument();
    expect(chargeAll).toHaveBeenCalledTimes(1); // one request for the whole day, never retried
  });

  it('shows a declined single charge as something to act on, not a success', async () => {
    const { user } = await renderSignedIn('/billing');
    await waitFor(() => expect(rowOf('Luis Ramirez')).toBeInTheDocument());
    await user.click(within(rowOf('Luis Ramirez')).getByRole('button', { name: 'Charge Luis Ramirez' }));
    expect(await screen.findByText('Luis Ramirez’s card was declined')).toBeInTheDocument();
    expect(screen.getByText(/The card needs fixing — ring them/)).toBeInTheDocument();
    expect(screen.queryByText('Luis Ramirez charged')).not.toBeInTheDocument();
    await waitFor(() => expect(within(rowOf('Luis Ramirez')).getByRole('button', { name: 'Charge Luis Ramirez' })).toHaveTextContent('Retry charge'));
  });

  it('lets staff pick discounts before charging, and locks them once paid', async () => {
    const { user } = await renderSignedIn('/billing');
    await waitFor(() => expect(within(table()).getAllByRole('row').length).toBeGreaterThan(5));
    expect(within(rowOf('Frank DeLuca')).getByRole('button', { name: 'Discounts for Frank DeLuca' })).toBeDisabled(); // already paid

    // A ready, unpaid delivery for a customer with no planned card outcome in the fake.
    const target = within(table()).getAllByRole('row').slice(1).find(r => {
      const buttons = within(r).queryAllByRole('button');
      return buttons.length === 2 && buttons.every(b => !(b as HTMLButtonElement).disabled) && !/Luis|Grace|Hannah|Jamal|Marcus|Noah|Sofia/.test(r.textContent ?? '');
    })!;
    const name = within(target).getAllByRole('link')[0]!.textContent!;
    await user.click(within(target).getByRole('button', { name: `Discounts for ${name}` }));
    const dialog = await screen.findByRole('dialog', { name: 'Discounts' });
    await user.click(await within(dialog).findByText('Autoship Discount — 12% off'));
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Discounts saved')).toBeInTheDocument();

    await user.click(within(rowOf(name)).getByRole('button', { name: `Charge ${name}` }));
    expect(await screen.findByText(`${name} charged`)).toBeInTheDocument();
    await waitFor(() => expect(within(rowOf(name)).getByRole('button', { name: `Discounts for ${name}` })).toBeDisabled());
  });
});

describe('needs attention', () => {
  it('lists refused cards and refunds owed, with a retry for the cards', async () => {
    const { user } = await renderSignedIn('/billing?tab=attention');
    await waitFor(() => expect(rowOf('Marcus Bell')).toBeInTheDocument());
    expect(within(rowOf('Marcus Bell')).getByText('Card refused')).toBeInTheDocument();
    expect(within(rowOf('Kate Dunn')).getByText('Refund owed')).toBeInTheDocument();
    expect(within(rowOf('Kate Dunn')).getByText('Refund in Square')).toBeInTheDocument();

    await user.click(within(rowOf('Marcus Bell')).getByRole('button', { name: 'Retry charge for Marcus Bell' }));
    expect(await screen.findByText('Marcus Bell wasn’t charged')).toBeInTheDocument();
    expect(screen.getByText(/not linked to a Square profile/)).toBeInTheDocument();
  });
});
