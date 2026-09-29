// The one fetch wrapper. Every cross-cutting concern — the bearer token, credentials, error mapping
// and the 401 refresh — lives here and nowhere else. Services call `http.get/post/put/delete`; none of
// them ever calls fetch directly.

import type { paths } from './generated/schema';
import { ANONYMOUS_OPERATIONS } from './generated/permissions';
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
  UnavailableError,
  ValidationError,
  type ApiError,
} from './errors';

// --- configuration -------------------------------------------------------------------------------

let baseUrl: string = import.meta.env.VITE_API_BASE_URL ?? '';
let onSessionExpired: () => void = () => {};

/** Called once at startup. `onSessionExpired` should send the app to the sign-in screen. */
export function configureHttp(options: { baseUrl?: string; onSessionExpired?: () => void }) {
  if (options.baseUrl !== undefined) baseUrl = options.baseUrl.replace(/\/$/, '');
  if (options.onSessionExpired) onSessionExpired = options.onSessionExpired;
}

// --- the access token: memory only ---------------------------------------------------------------
// Never localStorage or sessionStorage. A reload recovers it through refreshSession(), which spends the
// httpOnly refresh cookie — so the token itself never touches disk.

let accessToken: string | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

export function hasAccessToken() {
  return accessToken !== null;
}

// --- the refresh: single-flight ------------------------------------------------------------------
// The API rotates the refresh token on every use and treats a rotated-away token as theft, revoking
// every session the user has. Two concurrent refreshes therefore log the user out everywhere. So there
// is only ever one refresh in flight: the first caller creates the promise, everyone else awaits that
// same promise, and it is cleared once it settles.

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Exchange the refresh cookie for a new access token. Resolves true on success. Shared by the 401
 * path and app start-up (where React StrictMode's double effect would otherwise fire it twice).
 */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      // No bearer header: the httpOnly cookie is the credential.
      const res = await fetch(baseUrl + '/api/auth/refresh-token', { method: 'POST', credentials: 'include' });
      if (!res.ok) return false;
      const body = (await res.json()) as { accessToken?: string };
      if (!body.accessToken) return false;
      accessToken = body.accessToken;
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

let expiring = false;

/** Clear state and hand off to sign-in — once, however many requests discovered it together. */
function endSession(): never {
  accessToken = null;
  if (!expiring) {
    expiring = true;
    queueMicrotask(() => {
      expiring = false;
      onSessionExpired();
    });
  }
  throw new SessionExpiredError();
}

// --- error mapping -------------------------------------------------------------------------------

async function toError(res: Response): Promise<ApiError> {
  // Two shapes (API-CONTEXT §4): the middleware's { message, status }, and — for model validation,
  // which short-circuits before the middleware — ProblemDetails { title, errors }. `message` first.
  let message = '';
  let fieldErrors: Record<string, string[]> = {};
  try {
    const body = (await res.json()) as { message?: string; detail?: string; title?: string; errors?: Record<string, string[]> };
    if (body.errors) fieldErrors = normalizeFieldErrors(body.errors);
    const firstFieldError = Object.values(fieldErrors).flat()[0];
    message = body.message ?? body.detail ?? firstFieldError ?? body.title ?? '';
  } catch {
    // Not JSON — fall through to our own wording.
  }

  switch (res.status) {
    case 400: return new ValidationError(message || 'That request was refused.', fieldErrors);
    case 401: return new SignInError(message || 'That email and password don’t match.'); // only anonymous calls get here
    case 404: return new NotFoundError(message || 'That record no longer exists.');
    case 409: return new ConflictError(message || 'Someone else changed this while you were working. Reload and try again.');
    case 429: return new RateLimitError();
    case 403:
      console.error(`403 on ${res.url} — a control is not gated on the permission this endpoint requires.`);
      return new ForbiddenError();
    case 502:
      // Same status, opposite reactions: an expired upstream token needs an administrator; an
      // outage needs patience. The credential message is written for staff and says so.
      return /credential/i.test(message)
        ? new CredentialError(message)
        : new OutageError(message || 'Square or Routific is unavailable right now. Try again shortly.');
    case 503: return new UnavailableError();
    default: return new ServerError(res.status); // a 500's message is never shown
  }
}

/**
 * ASP.NET keys field errors by C# name ("Password"), JSON path ("$.password") or nested path
 * ("Items[0].Quantity"). Forms bind to the camelCase wire names, so normalize to those.
 */
function normalizeFieldErrors(errors: Record<string, string[]>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(errors)) {
    const name = key
      .replace(/^\$\.?/, '')
      .split('.')
      .map(part => part.charAt(0).toLowerCase() + part.slice(1))
      .join('.');
    (out[name] ??= []).push(...messages);
  }
  return out;
}

// --- typed operations over the generated `paths` -------------------------------------------------

type Method = 'get' | 'post' | 'put' | 'delete';
type Op<P extends keyof paths, M extends Method> = NonNullable<paths[P][M]>;

/** The paths that support method M. */
export type PathsFor<M extends Method> = {
  [P in keyof paths]: [NonNullable<paths[P][M]>] extends [never] ? never : P;
}[keyof paths];

type Params<P extends keyof paths, M extends Method> = Op<P, M> extends { parameters: infer X } ? X : never;
type PathParams<P extends keyof paths, M extends Method> = Params<P, M> extends { path?: infer X } ? NonNullable<X> : never;
type QueryParams<P extends keyof paths, M extends Method> = Params<P, M> extends { query?: infer X } ? NonNullable<X> : never;
type RequestBody<P extends keyof paths, M extends Method> = Op<P, M> extends { requestBody?: infer R } ? NonNullable<R> : never;
type Body<P extends keyof paths, M extends Method> =
  [RequestBody<P, M>] extends [never] ? never
    : RequestBody<P, M> extends { content: { 'application/json': infer B } } ? B : never;

/** The JSON body of the operation's 200 response, or void when it has none. */
export type ResponseOf<P extends keyof paths, M extends Method> =
  Op<P, M> extends { responses: { 200: { content: { 'application/json': infer R } } } } ? R : void;

type Options<P extends keyof paths, M extends Method> =
  ([PathParams<P, M>] extends [never] ? { path?: never } : { path: PathParams<P, M> }) &
  ([QueryParams<P, M>] extends [never] ? { query?: never } : { query?: QueryParams<P, M> }) &
  ([Body<P, M>] extends [never] ? { body?: never } : { body: Body<P, M> }) &
  { signal?: AbortSignal };

type Args<P extends keyof paths, M extends Method> =
  [PathParams<P, M>] extends [never]
    ? [Body<P, M>] extends [never] ? [options?: Options<P, M>] : [options: Options<P, M>]
    : [options: Options<P, M>];

const anonymous = new Set<string>(ANONYMOUS_OPERATIONS);

function buildUrl(template: string, path?: Record<string, unknown>, query?: Record<string, unknown>) {
  let url = template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = path?.[name];
    if (value === undefined || value === null) throw new Error(`Missing path parameter "${name}" for ${template}`);
    return encodeURIComponent(String(value));
  });
  if (query) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      for (const v of Array.isArray(value) ? value : [value]) qs.append(key, String(v));
    }
    const s = qs.toString();
    if (s) url += '?' + s;
  }
  return baseUrl + url;
}

interface RawRequest {
  method: Method;
  template: string;
  path?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
  signal?: AbortSignal;
  as: 'json' | 'blob';
}

async function send(req: RawRequest): Promise<unknown> {
  const isAnonymous = anonymous.has(`${req.method.toUpperCase()} ${req.template}`);
  const url = buildUrl(req.template, req.path, req.query);

  const attempt = (token: string | null) => {
    const headers: Record<string, string> = { Accept: req.as === 'json' ? 'application/json' : '*/*' };
    if (req.body !== undefined) headers['Content-Type'] = 'application/json';
    if (token && !isAnonymous) headers.Authorization = `Bearer ${token}`;
    return fetch(url, {
      method: req.method.toUpperCase(),
      headers,
      body: req.body === undefined ? undefined : JSON.stringify(req.body),
      // On every request, not only the refresh: the cookie is scoped to the API origin and the
      // browser will not attach it cross-origin otherwise.
      credentials: 'include',
      signal: req.signal,
    });
  };

  let res: Response;
  try {
    const sentWith = accessToken;
    res = await attempt(sentWith);

    // 401 on an anonymous call (a failed login) is an answer, not an expired token.
    if (res.status === 401 && !isAnonymous) {
      // If another request already refreshed while this one was in flight, the new token is in hand —
      // use it rather than spending the refresh cookie again.
      const renewed = accessToken !== null && accessToken !== sentWith ? true : await refreshSession();
      if (!renewed) endSession();

      // Retry exactly once. A second 401 with a fresh token is not expiry, so there is no loop.
      res = await attempt(accessToken);
      if (res.status === 401) endSession();
    }
  } catch (error) {
    if (error instanceof SessionExpiredError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') throw error; // our own cancel
    throw new NetworkError();
  }

  if (!res.ok) throw await toError(res);
  if (req.as === 'blob') return res.blob();

  const text = await res.text();
  return text ? JSON.parse(text) : undefined;
}

function operation<M extends Method>(method: M) {
  return <P extends PathsFor<M>>(template: P, ...[options]: Args<P, M>) => {
    const o = (options ?? {}) as { path?: Record<string, unknown>; query?: Record<string, unknown>; body?: unknown; signal?: AbortSignal };
    return send({ method, template, ...o, as: 'json' }) as Promise<ResponseOf<P, M>>;
  };
}

export const http = {
  get: operation('get'),
  post: operation('post'),
  put: operation('put'),
  delete: operation('delete'),

  /** GET an endpoint that returns bytes (proof-of-delivery photos). Use with URL.createObjectURL. */
  blob<P extends PathsFor<'get'>>(template: P, ...[options]: Args<P, 'get'>): Promise<Blob> {
    const o = (options ?? {}) as { path?: Record<string, unknown>; signal?: AbortSignal };
    return send({ method: 'get', template, ...o, as: 'blob' }) as Promise<Blob>;
  },
};

/** Test-only: reset module state between tests. */
export function __resetHttpForTests() {
  accessToken = null;
  refreshInFlight = null;
  expiring = false;
  onSessionExpired = () => {};
}
