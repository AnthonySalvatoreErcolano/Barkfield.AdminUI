import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../design/styles.css';
import { api } from './api';
import { NetworkError, OutageError } from './api/errors';
import { App } from './app/App';
import { ToastProvider } from './app/toast';
import { SessionProvider } from './session/SessionProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Only transient failures are worth retrying. A 400/404/409 will say the same thing again.
      retry: (count, error) => count < 2 && (error instanceof NetworkError || error instanceof OutageError),
      refetchOnWindowFocus: false,
    },
    // Never retry a write. A 409 in particular means the data changed underneath — the user must see it.
    mutations: { retry: false },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SessionProvider api={api}>
          <ToastProvider>
            <App />
          </ToastProvider>
        </SessionProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
