// In-memory implementations for building screens without the API. They bypass http.ts, so auth and
// error mapping are covered separately (src/api/http.test.ts, at the fetch level with MSW).
//
// A fake that always succeeds is worse than none: it lets the unhappy paths go unbuilt. This one
// reproduces the API's awkward behaviour on purpose — see each method.

import { PERMISSIONS, type Permission } from '../generated/permissions';
import { RateLimitError, SignInError, ValidationError } from '../errors';
import type { Api, UserDetail } from '../ports';

/** The fake's sign-in password, for every seeded account. Shown on the login screen in fake mode. */
export const FAKE_PASSWORD = 'barkfield-dev';

// The live Staff role as the dev database holds it (read from /api/users/me, 2026-09-29). Note it has
// no billing:* and no delivery:manage, although API-CONTEXT §3 says staff hold billing:charge — raised
// with the API side. Role contents are data, so the fake follows the database, not the prose.
const STAFF_PERMISSIONS: Permission[] = [
  'customer:view', 'customer:create', 'customer:edit',
  'subscription:view', 'subscription:manage',
  'delivery:view', 'delivery:pack',
  'dispatch:view',
  'product:view',
];

const now = '2026-09-01T14:00:00Z';

function seedUsers(): UserDetail[] {
  return [
    {
      id: '00000000-0000-4000-8000-000000000001', name: 'Kevin Neglia', email: 'admin@barkfield.test',
      isActive: true, isAdmin: true, createdAt: now, updatedAt: null, roleIds: null,
      roles: [{ id: 'r-admin', name: 'Admin', description: 'Full access', isSystemRole: true }],
      permissions: [...PERMISSIONS], // isAdmin users hold every permission, exactly as the API returns them
    },
    {
      id: '00000000-0000-4000-8000-000000000002', name: 'Joe Russo', email: 'staff@barkfield.test',
      isActive: true, isAdmin: false, createdAt: now, updatedAt: null, roleIds: null,
      roles: [{ id: 'r-staff', name: 'Staff', description: 'Shop floor', isSystemRole: true }],
      permissions: STAFF_PERMISSIONS,
    },
  ];
}

const pause = (ms = 180 + Math.random() * 220) => new Promise(r => setTimeout(r, ms));

export interface FakeControls {
  /** Simulate the refresh token being revoked mid-session. */
  expireSession(): void;
}

export function createFakeApi(options: { latency?: boolean } = {}): Api & { fake: FakeControls } {
  const wait = options.latency === false ? () => Promise.resolve() : pause;
  const users = seedUsers();
  const passwords = new Map(users.map(u => [u.id, FAKE_PASSWORD]));
  const expiredListeners = new Set<() => void>();
  let signedInId: string | null = null;
  let failedSignIns = 0;

  const current = () => {
    const user = users.find(u => u.id === signedInId);
    if (!user) throw new SignInError('Not signed in.');
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
        signedInId = user.id;
      },
      async logout() {
        await wait();
        signedInId = null;
      },
      async restore() {
        await wait();
        // The fake has no cookie, so a reload always lands on sign-in — as a live session would
        // after its refresh token expired.
        return signedInId !== null;
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
        if (signedInId === user.id) signedInId = null; // a reset revokes every session
      },
      onSessionExpired(listener) {
        expiredListeners.add(listener);
        return () => expiredListeners.delete(listener);
      },
    },
    users: {
      async me() {
        await wait();
        return structuredClone(current());
      },
      async changePassword({ currentPassword, newPassword }) {
        await wait();
        const user = current();
        if (passwords.get(user.id) !== currentPassword) throw new ValidationError('The current password is incorrect.');
        const invalid = tooShort(newPassword);
        if (invalid) throw invalid;
        passwords.set(user.id, newPassword);
      },
    },
    fake: {
      expireSession() {
        signedInId = null;
        expiredListeners.forEach(l => l());
      },
    },
  };
}
