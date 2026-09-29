// The session flow end to end, against the fake API: restore, sign-in, gating, expiry, sign-out.
import { StrictMode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createFakeApi, FAKE_PASSWORD } from '../api/fake';
import { SessionProvider } from '../session/SessionProvider';
import { App } from './App';
import { ToastProvider } from './toast';

function renderApp(path = '/', api = createFakeApi({ latency: false })) {
  const user = userEvent.setup();
  render(
    <StrictMode>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={[path]}>
          <SessionProvider api={api}>
            <ToastProvider>
              <App />
            </ToastProvider>
          </SessionProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
  return { user, api };
}

async function signIn(user: ReturnType<typeof userEvent.setup>, email: string, password = FAKE_PASSWORD) {
  await user.type(await screen.findByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

const nav = () => within(screen.getByRole('navigation', { name: 'Main' }));

describe('session', () => {
  it('lands on sign-in when there is no session to restore, and restores only once under StrictMode', async () => {
    const api = createFakeApi({ latency: false });
    const restore = vi.spyOn(api.auth, 'restore');
    renderApp('/', api);

    expect(await screen.findByRole('heading', { name: 'Staff sign-in' })).toBeInTheDocument();
    expect(restore).toHaveBeenCalledTimes(1);
  });

  it('signs in and shows only the screens the user’s permissions cover', async () => {
    const { user } = renderApp();
    await signIn(user, 'staff@barkfield.test');

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(nav().getByRole('link', { name: 'Customers' })).toBeInTheDocument();
    expect(nav().getByRole('link', { name: 'Dispatch' })).toBeInTheDocument();
    expect(nav().queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
  });

  it('shows an admin every screen, with no isAdmin special case', async () => {
    const { user } = renderApp();
    await signIn(user, 'admin@barkfield.test');

    await screen.findByRole('heading', { name: 'Dashboard' });
    for (const name of ['Customers', 'Subscriptions', 'Deliveries', 'Procurement', 'Billing', 'Dispatch', 'Products', 'Users']) {
      expect(nav().getByRole('link', { name })).toBeInTheDocument();
    }
  });

  it('shows the API’s message for bad credentials, and the rate limit as its own state', async () => {
    const { user } = renderApp();
    await signIn(user, 'staff@barkfield.test', 'wrong-password');
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');

    for (let i = 0; i < 5; i++) {
      await user.type(screen.getByLabelText('Password'), 'wrong-password');
      await user.click(screen.getByRole('button', { name: 'Sign in' }));
    }
    expect(await screen.findByText(/Too many sign-in attempts/)).toBeInTheDocument();
  });

  it('sends a deep link through sign-in and back to where it was going', async () => {
    const { user } = renderApp('/customers');
    await signIn(user, 'staff@barkfield.test');
    expect(await screen.findByRole('heading', { name: 'Customers' })).toBeInTheDocument();
  });

  it('explains, rather than errors, when a typed URL is outside the user’s permissions', async () => {
    const { user } = renderApp('/users');
    await signIn(user, 'staff@barkfield.test');
    expect(await screen.findByText(/Your account doesn’t include users/)).toBeInTheDocument();
  });

  it('returns to sign-in when the session expires, says why, and comes back to the same page', async () => {
    const { user, api } = renderApp('/customers');
    await signIn(user, 'staff@barkfield.test');
    await screen.findByRole('heading', { name: 'Customers' });

    api.fake.expireSession();

    expect(await screen.findByText(/Your session ended/)).toBeInTheDocument();
    await signIn(user, 'staff@barkfield.test');
    expect(await screen.findByRole('heading', { name: 'Customers' })).toBeInTheDocument();
  });

  it('signs out to a plain sign-in page', async () => {
    const { user } = renderApp('/customers');
    await signIn(user, 'staff@barkfield.test');
    await screen.findByRole('heading', { name: 'Customers' });

    await user.click(screen.getByRole('button', { name: /Account menu/ }));
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Staff sign-in' })).toBeInTheDocument();
    expect(screen.queryByText(/Your session ended/)).not.toBeInTheDocument();
    await signIn(user, 'staff@barkfield.test');
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });
});

describe('my account', () => {
  it('changes the password, showing the API’s message when the current one is wrong', async () => {
    const { user } = renderApp('/account');
    await signIn(user, 'staff@barkfield.test');
    await screen.findByRole('heading', { name: 'My account' });

    await user.type(screen.getByLabelText('Current password'), 'not-it');
    await user.type(screen.getByLabelText('New password'), 'a-much-longer-password');
    await user.type(screen.getByLabelText('Confirm new password'), 'a-much-longer-password');
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The current password is incorrect.');

    await user.clear(screen.getByLabelText('Current password'));
    await user.type(screen.getByLabelText('Current password'), FAKE_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByText('Password changed')).toBeInTheDocument();
  });

  it('stops a too-short password before it reaches the API', async () => {
    const { user, api } = renderApp('/account');
    await signIn(user, 'staff@barkfield.test');
    await screen.findByRole('heading', { name: 'My account' });
    const change = vi.spyOn(api.users, 'changePassword');

    await user.type(screen.getByLabelText('Current password'), FAKE_PASSWORD);
    await user.type(screen.getByLabelText('New password'), 'short');
    await user.type(screen.getByLabelText('Confirm new password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Change password' }));

    expect(await screen.findByText('Use at least 12 characters.')).toBeInTheDocument();
    expect(change).not.toHaveBeenCalled();
  });
});
