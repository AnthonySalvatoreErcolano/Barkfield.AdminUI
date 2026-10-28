// The notification centre against the fake API: the off → dry run → live path, the rule form changing
// shape, preview with an unresolved placeholder, releasing a held email, templates, settings, consent.
import { screen, waitFor, within } from '@testing-library/react';
import { renderApp, renderSignedIn, signIn, type User } from '../../test/renderApp';

const card = (name: string | HTMLElement) =>
  (typeof name === 'string' ? screen.getByText(name, { selector: '.br-card a, .br-card strong' }) : name).closest('.br-card') as HTMLElement;
const clickBox = (user: User, el: HTMLElement) => user.click(el.closest('label')!.querySelector('.br-check__box, .br-switch__track') ?? el);

describe('rules', () => {
  it('shows each rule as a sentence with its state, and says nothing is really sent', async () => {
    await renderSignedIn('/notifications');
    expect(await screen.findByText('Emails aren’t actually being sent yet')).toBeInTheDocument();
    const live = card('Tell the customer when a delivery arrives');
    expect(within(live).getByText('Live')).toBeInTheDocument();
    expect(within(live).getByText('When a delivery becomes delivered, send "Delivery confirmation"')).toBeInTheDocument();
    const reminder = card('Remind customers 3 days ahead');
    expect(within(reminder).getByText('Dry run')).toBeInTheDocument();
    expect(within(reminder).getByText('3 days before the next delivery, send "Delivery reminder"')).toBeInTheDocument();
    expect(within(card('Tell the shop when a card is refused')).getByText('Off')).toBeInTheDocument();
    expect(within(card('Tell the shop when a card is refused')).getByText(/No shop address is set/)).toBeInTheDocument();
  });

  it('leads from dry run to live through reading what it would have sent', async () => {
    const { user, api } = await renderSignedIn('/notifications');
    const reminder = card(await screen.findByText('Remind customers 3 days ahead'));
    await user.click(within(reminder).getByRole('link', { name: 'Read what it would have sent' }));
    expect(await screen.findByText(/What “Remind customers 3 days ahead” would have sent while in dry run/)).toBeInTheDocument();
    expect(await within(screen.getByRole('table')).findByText('Daniella Russo')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Rules' }));
    await user.click(within(card(await screen.findByText('Remind customers 3 days ahead'))).getByRole('button', { name: 'Go live…' }));
    const dialog = await screen.findByRole('dialog', { name: /Go live with/ });
    expect(within(dialog).getByText(/An email can’t be unsent/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Go live' }));
    await waitFor(() => expect(within(card('Remind customers 3 days ahead')).getByText('Live')).toBeInTheDocument());
    expect((await api.notifications.rules()).find(r => r.name === 'Remind customers 3 days ahead')!.willSend).toBe(true);
  });

  it('builds a new rule, changing shape for a reminder, and it starts off', async () => {
    const { user } = await renderSignedIn('/notifications');
    await user.click(await screen.findByRole('button', { name: 'New rule' }));
    const dialog = await screen.findByRole('dialog', { name: 'New rule' });
    await user.type(within(dialog).getByLabelText('Name'), 'Out of stock heads-up');
    await user.selectOptions(within(dialog).getByLabelText('When'), 'Days before the next delivery');
    expect(within(dialog).getByLabelText('Days before the next delivery')).toBeInTheDocument();
    expect(within(dialog).queryByLabelText('Becomes')).not.toBeInTheDocument();

    await user.selectOptions(within(dialog).getByLabelText('When'), 'A product on a delivery changes');
    expect(within(dialog).queryByLabelText('Days before the next delivery')).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Create rule' }));
    expect(within(dialog).getByText('Choose the status it reacts to.')).toBeInTheDocument();

    await user.selectOptions(within(dialog).getByLabelText('Becomes'), 'Out of stock');
    await user.selectOptions(within(dialog).getByLabelText('Send'), 'Item out of stock');
    await user.click(within(dialog).getByRole('button', { name: 'Create rule' }));
    // Lands on the new rule's own page (the list refreshes first, so wait for the page, not the text).
    await screen.findByLabelText('Show it for a real delivery');
    expect(screen.getByText('When a product on a delivery becomes out of stock, send "Item out of stock"')).toBeInTheDocument();
    expect(within(card('Out of stock heads-up')).getByText('Off')).toBeInTheDocument();
  });

  it('previews against a real delivery, flags what it couldn’t fill, and queues a test', async () => {
    const { user, api } = await renderSignedIn('/notifications');
    await user.click(await screen.findByRole('link', { name: 'Tell the customer about a substitution' }));
    // A delivery with nothing substituted: the substitute's name can't be filled.
    const plain = api.fake.db.deliveries.find(d => d.lines[0] && !d.lines[0].substitutedWithProductName && d.scheduledFor >= new Date(Date.now() - 20 * 86400_000).toISOString())!;
    const picker = await screen.findByLabelText('Show it for a real delivery');
    await waitFor(() => expect(within(picker).getAllByRole('option').length).toBeGreaterThan(1));
    await user.selectOptions(picker, plain.id);
    expect(await screen.findByText('One placeholder couldn’t be filled')).toBeInTheDocument();
    expect(screen.getAllByText(/\{\{SubstitutedWithProductName\}\}/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Send test' }));
    expect(await screen.findByText('Test queued')).toBeInTheDocument();
    const tests = (await api.notifications.outbox({})).items.filter(e => e.subject.startsWith('[TEST]'));
    expect(tests[0]).toMatchObject({ toEmail: 'admin@barkfield.test' });
  });

  it('lets staff look but change nothing', async () => {
    const { user } = await renderSignedIn('/notifications', 'staff');
    await screen.findByText('Tell the customer when a delivery arrives');
    expect(screen.queryByRole('button', { name: 'New rule' })).not.toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Outbox' }));
    expect(screen.queryByRole('button', { name: 'Send waiting emails now' })).not.toBeInTheDocument();
  });

  it('is out of reach for a driver', async () => {
    const { user } = renderApp('/notifications');
    await signIn(user, 'dev@barkfield.test');
    expect(await screen.findByText(/doesn’t include notifications/)).toBeInTheDocument();
  });
});

describe('outbox', () => {
  it('words a held email as the shop’s decision, and releases it', async () => {
    const { user } = await renderSignedIn('/notifications/outbox');
    await user.click(await screen.findByRole('button', { name: 'Held for review' }));
    await user.click(await within(screen.getByRole('table')).findByText('Greg Olsen'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Held — a pet in this household has recorded allergies')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'It’s safe — send it' }));
    expect(await screen.findByText('Released — it will send shortly')).toBeInTheDocument();
  });

  it('offers retry for a failure, with the reason', async () => {
    const { user } = await renderSignedIn('/notifications/outbox');
    await user.click(await screen.findByRole('button', { name: 'Failed' }));
    await user.click(await within(screen.getByRole('table')).findByText('Marcus Bell'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/refused the connection/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Back in the queue')).toBeInTheDocument();
  });
});

describe('templates', () => {
  it('keeps built-in templates, and inserts a placeholder where you’re typing', async () => {
    const { user, api } = await renderSignedIn('/notifications/templates');
    await user.click(await screen.findByText('Delivery confirmation'));
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'New template' }));
    await user.type(screen.getByLabelText('Name'), 'Thanks');
    await user.type(screen.getByLabelText('Subject'), 'Thank you');
    await user.type(screen.getByLabelText('Email'), 'Hi ');
    await user.click(screen.getByRole('button', { name: 'Customer first name' }));
    await user.type(screen.getByLabelText('Email'), '{{{{Typo}}'); // user-event: "{{" types one "{"
    expect(screen.getByText(/isn’t available for this trigger/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create template' }));
    expect(await screen.findByText('Template created')).toBeInTheDocument();
    expect((await api.notifications.templates()).find(t => t.name === 'Thanks')!.bodyText).toBe('Hi {{CustomerFirstName}}{{Typo}}');
  });
});

describe('settings', () => {
  it('refuses half a quiet-hours window, and says a second reminder run is normal', async () => {
    const { user } = await renderSignedIn('/notifications/settings');
    await user.selectOptions(await screen.findByLabelText('Quiet from'), '9pm');
    await user.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(screen.getByText('Choose both a start and an end, or neither.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Check for reminders now' }));
    await user.click(await screen.findByRole('button', { name: 'Check for reminders now' }));
    expect(await screen.findByText('Reminders already ran today')).toBeInTheDocument();
  });
});

describe('customer email preferences', () => {
  it('records marketing consent with the time it was given', async () => {
    const { user } = await renderSignedIn('/customers');
    await user.type(await screen.findByRole('searchbox', { name: 'Search customers' }), 'Pardo');
    await user.click(await within(await screen.findByRole('table')).findByText('Chris Pardo'));
    expect(await screen.findByText(/Never recorded/)).toBeInTheDocument();
    await clickBox(user, screen.getByRole('switch', { name: 'Agreed to marketing emails' }));
    expect(await screen.findByText('Chris agreed to marketing emails')).toBeInTheDocument();
    expect(await screen.findByText(/^Recorded /)).toBeInTheDocument();
  });
});
