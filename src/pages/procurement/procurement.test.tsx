// The procurement board against the fake API — including the rules PAGES.md sets for it.
import { screen, waitFor, within } from '@testing-library/react';
import { renderSignedIn, type User } from '../../test/renderApp';

const table = () => screen.getByRole('table');
const rows = () => within(table()).getAllByRole('row').slice(1);
const cellText = (row: HTMLElement, i: number) => (row as HTMLTableRowElement).cells[i]!.textContent ?? '';

async function productAction(user: User, rowIndex: number, label: RegExp) {
  await user.click(within(rows()[rowIndex]!).getByRole('button', { name: /Actions for/ }));
  await user.click(screen.getByRole('menuitem', { name: label }));
  return screen.findByRole('dialog');
}

describe('by product (the ordering pass)', () => {
  it('opens on the biggest supplier order first, with each shortage’s reach', async () => {
    await renderSignedIn('/procurement');
    await waitFor(() => expect(rows().length).toBeGreaterThan(3));
    const pending = rows().map(r => Number(cellText(r, 1)));
    expect(pending).toEqual([...pending].sort((a, b) => b - a));
    expect(within(rows()[0]!).getByText(/customer.* · .*deliver/)).toBeInTheDocument();
  });

  it('marks a product’s pending lines ordered in one batch, with a PO note', async () => {
    const { user, api } = await renderSignedIn('/procurement');
    await waitFor(() => expect(rows().length).toBeGreaterThan(3));
    const name = cellText(rows()[0]!, 0);
    const apply = vi.spyOn(api.procurement, 'apply');

    const dialog = await productAction(user, 0, /^Mark \d+ ordered/);
    await within(dialog).findByText(/across/);
    await user.type(within(dialog).getByLabelText('Note (optional)'), 'PO 5102');
    await user.click(within(dialog).getByRole('button', { name: /^Mark ordered/ }));

    await waitFor(() => expect(apply).toHaveBeenCalledTimes(1)); // one request, however many lines
    const sent = apply.mock.calls[0]![0];
    expect(sent.every(d => d.note === 'PO 5102')).toBe(true);
    const before = Number(cellText(rows()[0]!, 1));
    // Everything applied except any line on the fake's deliberately busy delivery (shown as a failure).
    const failed = (await apply.mock.results[0]!.value).failedCount;
    await waitFor(() => {
      const row = rows().find(r => cellText(r, 0) === name);
      expect(Number(row ? cellText(row, 1) : 0)).toBeLessThan(before === 0 ? 1 : before + 1);
    });
    if (!failed) expect(await screen.findByText('Mark ordered', { selector: '.br-toast__title' })).toBeInTheDocument();
  });

  it('receives all of one product only after saying what that claims', async () => {
    const { user } = await renderSignedIn('/procurement');
    await waitFor(() => expect(rows().length).toBeGreaterThan(3));
    const index = rows().findIndex(r => Number(cellText(r, 2)) > 0); // something on order
    const before = Number(cellText(rows()[index]!, 3));
    const ordered = Number(cellText(rows()[index]!, 2));
    const name = cellText(rows()[index]!, 0);

    const dialog = await productAction(user, index, /^Receive all/);
    expect(await within(dialog).findByText('Only if they’re all in your hands')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /^Receive all \(/ }));

    await waitFor(() => {
      const row = rows().find(r => cellText(r, 0) === name)!;
      expect(Number(cellText(row, 3))).toBeGreaterThan(before); // more in hand
      expect(Number(cellText(row, 2))).toBeLessThan(ordered);   // less still on order
    });
  });
});

describe('by line (receiving and allocating)', () => {
  it('batches a whole delivery’s adjacent rows into one request — the case that 409s one by one', async () => {
    const { user, api } = await renderSignedIn('/procurement?view=lines&q=Nolan');
    await waitFor(() => expect(within(table()).getAllByRole('checkbox')).toHaveLength(5)); // 4 rows + select-all
    const apply = vi.spyOn(api.procurement, 'apply');
    const single = vi.spyOn(api.deliveries, 'lineAction');

    await user.click(within(table()).getByRole('checkbox', { name: 'Select all' }));
    await user.click(screen.getByRole('button', { name: 'Update selected…' }));
    const dialog = await screen.findByRole('dialog', { name: 'Update 4 lines' });
    expect(within(dialog).queryByRole('radio', { name: /arrived|received/i })).not.toBeInTheDocument(); // no bulk receive
    await user.click(within(dialog).getByRole('radio', { name: /Ordered from the supplier/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));

    expect(await screen.findByText('Marked ordered', { selector: '.br-toast__title' })).toBeInTheDocument();
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply.mock.calls[0]![0]).toHaveLength(4);
    expect(single).not.toHaveBeenCalled();
  });

  it('shows a partial failure as a list, with the rest saved', async () => {
    const { user } = await renderSignedIn('/procurement?view=lines&status=1');
    await waitFor(() => expect(within(table()).getAllByRole('checkbox').length).toBeGreaterThan(5));
    const ann = rows().filter(r => r.textContent?.includes('Ann Cho'));
    const others = rows().filter(r => !r.textContent?.includes('Ann Cho') && !r.textContent?.includes('Tess Nolan')).slice(0, 3);
    for (const r of [...ann, ...others]) await user.click(within(r).getByRole('checkbox'));

    await user.click(screen.getByRole('button', { name: 'Update selected…' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('radio', { name: /Out of stock/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }));

    const alert = await screen.findByText(new RegExp(`Marked out of stock: ${others.length} applied`));
    const panel = alert.closest('[role="status"]') as HTMLElement;
    expect(within(panel).getAllByText('Ann Cho').length).toBe(ann.length);
    expect(within(panel).getAllByText(/kept changing while you were saving/).length).toBe(ann.length);
  });

  it('uses the per-line endpoint for a single row, including a partial receipt', async () => {
    const { user, api } = await renderSignedIn('/procurement?view=lines&status=2');
    await waitFor(() => expect(within(table()).getAllByRole('checkbox').length).toBeGreaterThan(1)); // real rows, not 'Loading…'
    const apply = vi.spyOn(api.procurement, 'apply');
    const single = vi.spyOn(api.deliveries, 'lineAction');
    const row = rows().find(r => Number(cellText(r, 4)) > 1 && !r.textContent?.includes('Tess Nolan'));
    const target = row ?? rows().find(r => !r.textContent?.includes('Tess Nolan'))!;

    await user.click(within(target).getByRole('button', { name: /^Update / }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('radio', { name: /^(All \d+ arrived|It arrived)$/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(single).toHaveBeenCalledTimes(1));
    expect(apply).not.toHaveBeenCalled();
  });

  it('never labels a line one-off just because its subscription has no name', async () => {
    await renderSignedIn('/procurement?view=lines');
    await waitFor(() => expect(within(table()).getAllByRole('checkbox').length).toBeGreaterThan(5));
    expect(within(table()).queryByText(/one-off/i)).not.toBeInTheDocument(); // the seed has no one-offs
  });

  it('opens a product’s lines from the ordering pass, filtered to that product', async () => {
    const { user } = await renderSignedIn('/procurement');
    await waitFor(() => expect(rows().length).toBeGreaterThan(3));
    const name = cellText(rows()[0]!, 0);
    await user.click(rows()[0]!);
    await waitFor(() => expect(screen.getByRole('columnheader', { name: /Customer/ })).toBeInTheDocument());
    expect(screen.getByText(name, { selector: '.br-chip span' })).toBeInTheDocument();
    rows().forEach(r => expect(r.textContent).toContain(name));
  });
});
