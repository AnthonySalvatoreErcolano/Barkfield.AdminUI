// Renders the whole app — router, session, shell — against a fresh fake API, for screen-level tests.
import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createFakeApi, FAKE_PASSWORD } from '../api/fake';
import { SessionProvider } from '../session/SessionProvider';
import { App } from '../app/App';
import { ToastProvider } from '../app/toast';

export function renderApp(path = '/', api = createFakeApi({ latency: false, persistSession: false })) {
  const user = userEvent.setup();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
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

export type User = ReturnType<typeof userEvent.setup>;

export async function signIn(user: User, email: string, password = FAKE_PASSWORD) {
  await user.type(await screen.findByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

/** Render at a path and sign in as the given fake account. */
export async function renderSignedIn(path: string, who: 'admin' | 'staff' = 'admin') {
  const r = renderApp(path);
  await signIn(r.user, `${who}@barkfield.test`);
  return r;
}
