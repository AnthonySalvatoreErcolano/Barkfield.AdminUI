// In-memory implementations for building screens without the API. They bypass http.ts, so auth and
// error mapping are covered separately (src/api/http.test.ts, at the fetch level with MSW).
//
// A fake that always succeeds is worse than none: it lets the unhappy paths go unbuilt. This one
// reproduces the API's awkward behaviour on purpose — see each method.

import { RateLimitError, SignInError, ValidationError } from '../errors';
import type { Api } from '../ports';
import { createFakeCustomers } from './customers';
import { createFakeDeliveries, createFakeProducts } from './deliveries';
import { createFakeProcurement } from './procurement';
import { createFakeBilling } from './billing';
import { createFakeSubscriptions } from './subscriptions';
import { createSeed, type Seed } from './seed';
import { createFakeUsers, seedUsers, toUserDetail } from './users';

/** The fake's sign-in password, for every seeded account. Shown on the login screen in fake mode. */
export const FAKE_PASSWORD = 'barkfield-dev';

const pause = (ms = 180 + Math.random() * 220) => new Promise<void>(r => setTimeout(r, ms));

export interface FakeControls {
  /** Simulate the refresh token being revoked mid-session. */
  expireSession(): void;
  /** The fake's data, for tests that need to change something behind the screen's back. */
  db: Seed;
}

// Fake mode is what gets shown to clients from a preview deployment. Remembering which demo account is
// signed in (never a token — the fake has none) lets a reload behave like a live session would.
const SESSION_KEY = 'barkfield-fake-session';
const storage = {
  get(): string | null { try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; } },
  set(id: string | null) { try { if (id) sessionStorage.setItem(SESSION_KEY, id); else sessionStorage.removeItem(SESSION_KEY); } catch { /* storage blocked */ } },
};

export function createFakeApi(options: { latency?: boolean; persistSession?: boolean } = {}): Api & { fake: FakeControls } {
  const wait = options.latency === false ? () => Promise.resolve() : pause;
  const persist = options.persistSession ?? true;
  const db = createSeed();
  const users = seedUsers();
  const passwords = new Map(users.map(u => [u.id, FAKE_PASSWORD]));
  const expiredListeners = new Set<() => void>();
  let signedInId: string | null = persist ? storage.get() : null;
  const setSignedIn = (id: string | null) => { signedInId = id; if (persist) storage.set(id); };
  let failedSignIns = 0;

  const current = () => {
    const user = users.find(u => u.id === signedInId);
    if (!user || !user.isActive) throw new SignInError('Not signed in.');
    return user;
  };

  const tooShort = (password: string) =>
    password.length < 12
      // Model validation comes back as ProblemDetails with field errors, not { message }.
      ? new ValidationError('The field newPassword must be a string with a minimum length of 12.', {
          newPassword: ['The field newPassword must be a string with a minimum length of 12.'],
        })
      : null;

  return {
    auth: {
      async login({ email, password }) {
        await wait();
        // The API rate-limits sign-in per IP (30/min). Five is enough to see the state while building.
        if (failedSignIns >= 5) throw new RateLimitError();
        const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!user || passwords.get(user.id) !== password || !user.isActive) {
          failedSignIns++;
          throw new SignInError('Invalid email or password.');
        }
        failedSignIns = 0;
        setSignedIn(user.id);
      },
      async logout() {
        await wait();
        setSignedIn(null);
      },
      async restore() {
        await wait();
        return users.some(u => u.id === signedInId && u.isActive);
      },
      async forgotPassword() {
        await wait();
        // Succeeds whether or not the account exists, so the screen cannot reveal who has one.
      },
      async resetPassword({ email, resetToken, newPassword }) {
        await wait();
        const invalid = tooShort(newPassword);
        if (invalid) throw invalid;
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user || resetToken !== 'valid-token') throw new ValidationError('The reset link is invalid or has expired.');
        passwords.set(user.id, newPassword);
        if (signedInId === user.id) setSignedIn(null); // a reset revokes every session
      },
      onSessionExpired(listener) {
        expiredListeners.add(listener);
        return () => expiredListeners.delete(listener);
      },
    },
    users: {
      async me() {
        await wait();
        return toUserDetail(current());
      },
      async changePassword({ currentPassword, newPassword }) {
        await wait();
        const user = current();
        if (passwords.get(user.id) !== currentPassword) throw new ValidationError('The current password is incorrect.');
        const invalid = tooShort(newPassword);
        if (invalid) throw invalid;
        passwords.set(user.id, newPassword);
      },
      ...createFakeUsers(users, wait, () => signedInId),
    },
    customers: createFakeCustomers(db, wait),
    deliveries: createFakeDeliveries(db, wait),
    products: createFakeProducts(db, wait),
    procurement: createFakeProcurement(db, wait),
    billing: createFakeBilling(db, wait),
    subscriptions: createFakeSubscriptions(db, wait),
    fake: {
      db,
      expireSession() {
        setSignedIn(null);
        expiredListeners.forEach(l => l());
      },
    },
  };
}
