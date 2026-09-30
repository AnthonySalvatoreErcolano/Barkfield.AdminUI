// Covers http.ts itself at the fetch level with MSW. The port-level fake bypasses http.ts entirely,
// so these tests are the only thing exercising auth and error mapping without a running API.

import { http as msw, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';
import { __resetHttpForTests, configureHttp, hasAccessToken, http, refreshSession, refreshSessionWithin, setAccessToken } from './http';
import {
  ConflictError,
  CredentialError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  OutageError,
  RateLimitError,
  ServerError,
  SessionExpiredError,
  SignInError,
  TimeoutError,
  UnavailableError,
  ValidationError,
} from './errors';

const API = 'http://api.test';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let sessionExpired: ReturnType<typeof vi.fn<() => void>>;
beforeEach(() => {
  __resetHttpForTests();
  sessionExpired = vi.fn<() => void>();
  configureHttp({ baseUrl: API, onSessionExpired: sessionExpired });
});

const me = { id: 'u1', name: 'Joe', email: 'joe@example.com', isAdmin: false, permissions: [] };

/** A stub API where only `valid` is accepted as a bearer token; refresh hands out `valid`. */
function stubApi(options: { refresh?: 'ok' | 'fail'; alwaysUnauthorized?: boolean } = {}) {
  const calls = { refresh: 0, refreshHadBearer: false, refreshCredentials: '' as RequestCredentials, me: 0 };
  server.use(
    msw.post(`${API}/api/auth/refresh-token`, async ({ request }) => {
      calls.refresh++;
      calls.refreshHadBearer = request.headers.has('Authorization');
      calls.refreshCredentials = request.credentials;
      await delay(20); // long enough that every concurrent 401 arrives while it is in flight
      return options.refresh === 'fail'
        ? HttpResponse.json({ message: 'Invalid refresh token.', status: 401 }, { status: 401 })
        : HttpResponse.json({ accessToken: 'valid', email: me.email, userId: me.id });
    }),
    msw.get(`${API}/api/users/me`, ({ request }) => {
      calls.me++;
      const ok = !options.alwaysUnauthorized && request.headers.get('Authorization') === 'Bearer valid';
      return ok ? HttpResponse.json(me) : HttpResponse.json({ message: 'Unauthorized', status: 401 }, { status: 401 });
    }),
  );
  return calls;
}

describe('the 401 refresh', () => {
  it('refreshes exactly once when five requests 401 at the same moment', async () => {
    setAccessToken('expired');
    const calls = stubApi();

    const results = await Promise.all(Array.from({ length: 5 }, () => http.get('/api/users/me')));

    expect(calls.refresh).toBe(1);
    expect(results).toHaveLength(5);
    results.forEach(r => expect(r).toEqual(me));
    expect(calls.me).toBe(10); // five 401s, five retries
    expect(sessionExpired).not.toHaveBeenCalled();
  });

  it('sends no bearer header on the refresh, and includes credentials', async () => {
    setAccessToken('expired');
    const calls = stubApi();

    await http.get('/api/users/me');

    expect(calls.refreshHadBearer).toBe(false);
    expect(calls.refreshCredentials).toBe('include');
  });

  it('retries once, never in a loop — a second 401 after a fresh token ends the session', async () => {
    setAccessToken('expired');
    const calls = stubApi({ alwaysUnauthorized: true });

    await expect(http.get('/api/users/me')).rejects.toBeInstanceOf(SessionExpiredError);

    expect(calls.refresh).toBe(1);
    expect(calls.me).toBe(2);
    expect(hasAccessToken()).toBe(false);
    await vi.waitFor(() => expect(sessionExpired).toHaveBeenCalledTimes(1));
  });

  it('clears state and goes to sign-in once when the refresh fails, however many requests hit it', async () => {
    setAccessToken('expired');
    const calls = stubApi({ refresh: 'fail' });

    const results = await Promise.allSettled(Array.from({ length: 5 }, () => http.get('/api/users/me')));

    expect(calls.refresh).toBe(1);
    results.forEach(r => expect(r.status === 'rejected' && r.reason).toBeInstanceOf(SessionExpiredError));
    expect(hasAccessToken()).toBe(false);
    await vi.waitFor(() => expect(sessionExpired).toHaveBeenCalledTimes(1));
  });

  it('does not refresh again for a request that 401s after another request already refreshed', async () => {
    setAccessToken('expired');
    const calls = stubApi();

    await http.get('/api/users/me'); // refreshes; token is now valid
    // A request that was sent with the old token and comes back late must reuse the new one.
    server.use(
      msw.get(`${API}/api/customers`, ({ request }) =>
        request.headers.get('Authorization') === 'Bearer valid'
          ? HttpResponse.json({ items: [], totalCount: 0, pageNumber: 1, pageSize: 25 })
          : HttpResponse.json({ message: 'Unauthorized', status: 401 }, { status: 401 })),
    );
    await http.get('/api/customers');

    expect(calls.refresh).toBe(1);
  });

  it('shares one refresh between app start-up and a request that 401s at the same time', async () => {
    setAccessToken('expired');
    const calls = stubApi();

    const [restored, result] = await Promise.all([refreshSession(), http.get('/api/users/me'), refreshSession()]);

    expect(restored).toBe(true);
    expect(result).toEqual(me);
    expect(calls.refresh).toBe(1);
  });

  it('treats a 401 on an anonymous endpoint as the answer, not an expired token', async () => {
    const calls = stubApi();
    server.use(msw.post(`${API}/api/auth/login`, () =>
      HttpResponse.json({ message: 'Invalid email or password.', status: 401 }, { status: 401 })));

    await expect(http.post('/api/auth/login', { body: { email: 'a@b.c', password: 'x' } })).rejects.toBeInstanceOf(SignInError);
    expect(calls.refresh).toBe(0);
    expect(sessionExpired).not.toHaveBeenCalled();
  });
});

describe('every request', () => {
  it('sends the bearer token and includes credentials', async () => {
    setAccessToken('valid');
    let seen: Request | undefined;
    server.use(msw.get(`${API}/api/customers`, ({ request }) => {
      seen = request;
      return HttpResponse.json({ items: [], totalCount: 0, pageNumber: 1, pageSize: 25 });
    }));

    await http.get('/api/customers', { query: { searchTerm: 'russo', pageNumber: 2, includeInactive: undefined } });

    expect(seen?.headers.get('Authorization')).toBe('Bearer valid');
    expect(seen?.credentials).toBe('include');
    expect(new URL(seen!.url).search).toBe('?searchTerm=russo&pageNumber=2');
  });

  it('sends no bearer header to anonymous endpoints even when signed in', async () => {
    setAccessToken('valid');
    let auth: string | null = 'unset';
    server.use(msw.post(`${API}/api/auth/forgot-password`, ({ request }) => {
      auth = request.headers.get('Authorization');
      return new HttpResponse(null, { status: 200 });
    }));

    await http.post('/api/auth/forgot-password', { body: { email: 'a@b.c' } });

    expect(auth).toBeNull();
  });

  it('fills path parameters', async () => {
    setAccessToken('valid');
    let url = '';
    server.use(msw.get(`${API}/api/customers/:id`, ({ request }) => {
      url = request.url;
      return HttpResponse.json({});
    }));

    await http.get('/api/customers/{customerId}', { path: { customerId: 'abc 123' } });

    expect(url).toBe(`${API}/api/customers/abc%20123`);
  });
});

describe('error mapping', () => {
  beforeEach(() => setAccessToken('valid'));

  const respond = (status: number, message: string) =>
    server.use(msw.get(`${API}/api/customers`, () => HttpResponse.json({ message, status }, { status })));

  it.each([
    [400, 'Email is already in use.', ValidationError],
    [404, 'Customer not found.', NotFoundError],
    [409, 'This record was changed by someone else. Reload and try again.', ConflictError],
  ])('%i surfaces the API message as-is', async (status, message, type) => {
    respond(status, message);
    const error = await http.get('/api/customers').catch(e => e);
    expect(error).toBeInstanceOf(type);
    expect(error.message).toBe(message);
    expect(error.showable).toBe(true);
  });

  it('never surfaces a 500’s message', async () => {
    respond(500, 'Login failed for user sa; Server=tcp:barkfield.database.windows.net');
    const error = await http.get('/api/customers').catch(e => e);
    expect(error).toBeInstanceOf(ServerError);
    expect(error.message).not.toMatch(/Server=|sa/);
  });

  it('tells the two 502s apart', async () => {
    respond(502, 'Routific rejected our credentials: 401 Unauthorized. A new API token has to be issued.');
    expect(await http.get('/api/customers').catch(e => e)).toBeInstanceOf(CredentialError);

    respond(502, 'An upstream service is currently unavailable.');
    expect(await http.get('/api/customers').catch(e => e)).toBeInstanceOf(OutageError);
  });

  it('logs a 403 as a gating bug', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    respond(403, 'Forbidden');
    expect(await http.get('/api/customers').catch(e => e)).toBeInstanceOf(ForbiddenError);
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });

  it('maps 429 and 503 to their own states', async () => {
    respond(429, 'Too many requests');
    expect(await http.get('/api/customers').catch(e => e)).toBeInstanceOf(RateLimitError);
    respond(503, 'Database unavailable');
    expect(await http.get('/api/customers').catch(e => e)).toBeInstanceOf(UnavailableError);
  });

  it('accepts ProblemDetails bodies as the spec describes them', async () => {
    server.use(msw.get(`${API}/api/customers`, () =>
      HttpResponse.json({ title: 'Bad Request', detail: 'Page size must be positive.', status: 400 }, { status: 400 })));
    const error = await http.get('/api/customers').catch(e => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('Page size must be positive.');
  });

  it('turns a model-validation ProblemDetails into field errors, not the generic title', async () => {
    server.use(msw.get(`${API}/api/customers`, () => HttpResponse.json({
      type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
      title: 'One or more validation errors occurred.',
      status: 400,
      errors: { Email: ['The Email field is required.'], '$.phoneNumber': ['Too long.'], 'Items[0].Quantity': ['Must be at least 1.'] },
    }, { status: 400 })));

    const error = await http.get('/api/customers').catch(e => e);

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('The Email field is required.');
    expect(error.fieldErrors).toEqual({
      email: ['The Email field is required.'],
      phoneNumber: ['Too long.'],
      'items[0].quantity': ['Must be at least 1.'],
    });
  });

  it('carries no field errors for a domain-rule 400', async () => {
    respond(400, 'Contents cannot be changed once the delivery is paid for.');
    const error = await http.get('/api/customers').catch(e => e);
    expect(error.fieldErrors).toEqual({});
  });

  it('gives up on a server that accepts the request but never answers', async () => {
    configureHttp({ timeoutMs: 50 });
    server.use(msw.get(`${API}/api/customers`, async () => { await delay('infinite'); return HttpResponse.json({}); }));
    const error = await http.get('/api/customers').catch(e => e);
    expect(error).toBeInstanceOf(TimeoutError);
    expect(error.message).toMatch(/didn’t answer in time/);
  });

  it('lets a long-running call (charging the day) ask for more time than the default limit', async () => {
    configureHttp({ timeoutMs: 50 });
    setAccessToken('valid');
    server.use(msw.post(`${API}/api/deliveries/charge-all`, async () => {
      await delay(150);
      return HttpResponse.json({ deliveryDate: '2026-10-01T00:00:00Z', considered: 0, attempted: [], skipped: [] });
    }));
    await expect(http.post('/api/deliveries/charge-all', { body: { deliveryDate: '2026-10-01T00:00:00Z' } })).rejects.toBeInstanceOf(TimeoutError);
    await expect(http.post('/api/deliveries/charge-all', { body: { deliveryDate: '2026-10-01T00:00:00Z' }, timeoutMs: 1000 })).resolves.toMatchObject({ considered: 0 });
  });

  it('does not hold start-up on a slow refresh — it stops waiting, but never aborts the refresh', async () => {
    configureHttp({ timeoutMs: 50 });
    const seen = { finished: false, aborted: false, calls: 0 };
    server.use(msw.post(`${API}/api/auth/refresh-token`, async ({ request }) => {
      seen.calls++;
      await delay(200);
      seen.aborted = request.signal.aborted;
      seen.finished = true;
      return HttpResponse.json({ accessToken: 'late-but-valid', email: 'a@b.c', userId: 'u' });
    }));

    expect(await refreshSessionWithin()).toBe(false); // the caller moves on after 50ms

    // Meanwhile another refresh is wanted: it must join the one still running, not send the old cookie again.
    const joined = refreshSession();
    await vi.waitFor(() => expect(seen.finished).toBe(true), { timeout: 1000 });
    expect(await joined).toBe(true);
    expect(seen.calls).toBe(1);
    expect(seen.aborted).toBe(false);
    expect(hasAccessToken()).toBe(true); // the rotated token was kept, so the cookie and token agree
  });

  it('sends the refresh with no abort signal at all', async () => {
    let signalOnRequest: AbortSignal | undefined;
    const realFetch = globalThis.fetch;
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      if (String(input).endsWith('/api/auth/refresh-token')) signalOnRequest = init?.signal ?? undefined;
      return realFetch(input, init);
    });
    server.use(msw.post(`${API}/api/auth/refresh-token`, () => HttpResponse.json({ accessToken: 't', email: 'a@b.c', userId: 'u' })));
    await refreshSession();
    spy.mockRestore();
    expect(signalOnRequest).toBeUndefined();
  });

  it('ends the session on a hung refresh during a 401, without aborting the refresh', async () => {
    configureHttp({ timeoutMs: 50 });
    setAccessToken('expired');
    let aborted: boolean | undefined;
    server.use(
      msw.get(`${API}/api/users/me`, () => HttpResponse.json({ message: 'Unauthorized', status: 401 }, { status: 401 })),
      msw.post(`${API}/api/auth/refresh-token`, async ({ request }) => {
        await delay(150);
        aborted = request.signal.aborted;
        return HttpResponse.json({ message: 'Invalid refresh token.', status: 401 }, { status: 401 });
      }),
    );
    await expect(http.get('/api/users/me')).rejects.toBeInstanceOf(SessionExpiredError);
    await vi.waitFor(() => expect(aborted).toBe(false), { timeout: 1000 });
  });

  it('still lets the caller cancel, and does not report that as an error of ours', async () => {
    server.use(msw.get(`${API}/api/customers`, async () => { await delay('infinite'); return HttpResponse.json({}); }));
    const controller = new AbortController();
    const pending = http.get('/api/customers', { signal: controller.signal }).catch(e => e);
    controller.abort();
    const error = await pending;
    expect(error.name).toBe('AbortError');
    expect(error).not.toBeInstanceOf(NetworkError);
  });

  it('reports an unreachable server as a network error', async () => {
    server.use(msw.get(`${API}/api/customers`, () => HttpResponse.error()));
    expect(await http.get('/api/customers').catch(e => e)).toBeInstanceOf(NetworkError);
  });
});
