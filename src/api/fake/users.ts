// Fake staff accounts and roles. Behaves like the API (UsersController, UserService, User.cs):
//   - the four seeded system roles with their real ids; permissions come from roles in the database,
//     never through the UI, and an admin holds every permission
//   - search over name and email, the fixed sort keys, deactivated users hidden unless asked for
//   - a taken email is a 400 with a message only (the service's check), not a field error
//   - too-short passwords and missing roles fail model validation, as ProblemDetails field errors
//   - deactivating your own account is refused
import { PERMISSIONS, type Permission } from '../generated/permissions';
import { NotFoundError, ValidationError } from '../errors';
import { SORT_KEYS } from '../sortKeys';
import type { Role, UserDetail, UserListItem, UsersPort } from '../ports';

/** 002_seed_reference_data.sql. */
export const ROLES: Role[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Administrator', description: 'Full access to everything.', isSystemRole: true },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Manager', description: 'Runs the operation day to day. No staff user management.', isSystemRole: true },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Staff', description: 'Customer, subscription and packing work.', isSystemRole: true },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Driver', description: 'Delivery access only. No admin screens.', isSystemRole: true },
];
const [ADMINISTRATOR, MANAGER, STAFF, DRIVER] = ROLES.map(r => r.id) as [string, string, string, string];

// The live Staff role as the dev database holds it (read from /api/users/me, 2026-09-29) — it also
// charges, which the seed script alone doesn't grant. Role contents are data, so the fake follows the
// database.
const GRANTS: Record<string, readonly Permission[]> = {
  [ADMINISTRATOR]: PERMISSIONS,
  [MANAGER]: PERMISSIONS.filter(p => !['user:create', 'user:edit', 'user:delete'].includes(p)),
  [STAFF]: [
    'customer:view', 'customer:create', 'customer:edit',
    'subscription:view', 'subscription:manage',
    'delivery:view', 'delivery:pack',
    'billing:view', 'billing:charge',
    'dispatch:view',
    'product:view',
  ],
  [DRIVER]: ['delivery:view', 'dispatch:view'],
};

export interface UserState {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string | null;
  roleIds: string[];
}

export function seedUsers(): UserState[] {
  const user = (n: number, name: string, email: string, roleIds: string[], extra: Partial<UserState> = {}): UserState => ({
    id: `00000000-0000-4000-8000-00000000000${n}`, name, email, isActive: true, isAdmin: false,
    createdAt: `2026-0${Math.min(n + 2, 9)}-01T14:00:00Z`, updatedAt: null, roleIds, ...extra,
  });
  return [
    user(1, 'Kevin Neglia', 'admin@barkfield.test', [ADMINISTRATOR], { isAdmin: true }),
    user(2, 'Joe Russo', 'staff@barkfield.test', [STAFF]),
    user(3, 'Maria Lopez', 'maria@barkfield.test', [MANAGER]),
    user(4, 'Dev Patel', 'dev@barkfield.test', [DRIVER]),
    user(5, 'Sam Ortiz', 'sam@barkfield.test', [STAFF, DRIVER]),
    user(6, 'Lena Fox', 'lena@barkfield.test', [STAFF], { isActive: false, updatedAt: '2026-09-20T15:00:00Z' }),
  ];
}

const rolesOf = (u: UserState) => ROLES.filter(r => u.roleIds.includes(r.id)).sort((a, b) => a.name.localeCompare(b.name));

/** What GET /api/users/{id} returns. An admin gets the whole permission list, as the API sends it. */
export function toUserDetail(u: UserState): UserDetail {
  const granted = u.isAdmin ? PERMISSIONS : [...new Set(u.roleIds.flatMap(id => GRANTS[id] ?? []))];
  return {
    id: u.id, name: u.name, email: u.email, isActive: u.isActive, isAdmin: u.isAdmin,
    createdAt: u.createdAt, updatedAt: u.updatedAt, roleIds: null,
    roles: structuredClone(rolesOf(u)),
    permissions: [...granted].sort(),
  };
}

const toListItem = (u: UserState): UserListItem => ({
  id: u.id, name: u.name, email: u.email, isActive: u.isActive, isAdmin: u.isAdmin, createdAt: u.createdAt,
  roles: rolesOf(u).map(r => r.name).join(', '),
});

/** Model validation: ProblemDetails with field errors, worded as ASP.NET words them. */
function validateBody(body: { name: string; email: string; roleIds: string[]; password?: string }) {
  const fieldErrors: Record<string, string[]> = {};
  if (!body.name?.trim()) fieldErrors.name = ['The Name field is required.'];
  if (!body.email?.trim()) fieldErrors.email = ['The Email field is required.'];
  else if (!/^[^@]+@[^@]+$/.test(body.email.trim())) fieldErrors.email = ['The Email field is not a valid e-mail address.'];
  if (body.password !== undefined && body.password.length < 12) {
    fieldErrors.password = ['The field Password must be a string or array type with a minimum length of \'12\'.'];
  }
  if (!body.roleIds?.length) fieldErrors.roleIds = ['The field RoleIds must be a string or array type with a minimum length of \'1\'.'];
  if (Object.keys(fieldErrors).length) throw new ValidationError(Object.values(fieldErrors)[0]![0]!, fieldErrors);
  const unknown = body.roleIds.filter(id => !ROLES.some(r => r.id === id));
  if (unknown.length) throw new ValidationError(`Unknown role id(s): ${unknown.join(', ')}.`);
}

export function createFakeUsers(
  users: UserState[],
  wait: () => Promise<void>,
  /** The signed-in user's id, for the rules about your own account. */
  currentId: () => string | null,
): Omit<UsersPort, 'me' | 'changePassword'> {
  const find = (id: string) => {
    const u = users.find(x => x.id === id);
    if (!u) throw new NotFoundError(`User with ID '${id}' was not found.`);
    return u;
  };
  const emailTaken = (email: string, exceptId?: string) =>
    users.some(u => u.id !== exceptId && u.email === email.trim().toLowerCase());

  return {
    async list(q) {
      await wait();
      const term = q.searchTerm?.trim().toLowerCase();
      const allowed = SORT_KEYS['/api/users'];
      const key = (allowed.keys as readonly string[]).includes(q.sortBy ?? '') ? q.sortBy! : allowed.default;
      const value = (u: UserState) => (key === 'email' ? u.email : key === 'createdAt' ? u.createdAt : u.name);
      const rows = users
        .filter(u => q.includeInactive || u.isActive)
        .filter(u => !q.roleId || u.roleIds.includes(q.roleId))
        .filter(u => !term || u.name.toLowerCase().includes(term) || u.email.includes(term))
        .sort((a, b) => (value(a).localeCompare(value(b)) || a.id.localeCompare(b.id)) * (q.sortDescending ? -1 : 1))
        .map(toListItem);
      const pageSize = Math.min(Math.max(Number(q.pageSize ?? 25), 1), 200);
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
      const pageNumber = Math.max(Number(q.pageNumber ?? 1), 1);
      return {
        items: rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
        totalCount: rows.length, pageNumber, pageSize, totalPages,
        hasNextPage: pageNumber < totalPages, hasPreviousPage: pageNumber > 1,
      };
    },

    async get(id) {
      await wait();
      return toUserDetail(find(id));
    },

    async create(body) {
      await wait();
      const roleIds = [...new Set(body.roleIds)];
      validateBody({ ...body, roleIds });
      if (emailTaken(body.email)) throw new ValidationError(`A user with the email '${body.email}' already exists.`);
      const u: UserState = {
        id: crypto.randomUUID(), name: body.name.trim(), email: body.email.trim().toLowerCase(),
        isActive: true, isAdmin: !!body.isAdmin, createdAt: new Date().toISOString(), updatedAt: null, roleIds,
      };
      users.push(u);
      return u.id;
    },

    async update(id, body) {
      await wait();
      const u = find(id);
      const roleIds = [...new Set(body.roleIds)];
      validateBody({ ...body, roleIds });
      if (emailTaken(body.email, id)) throw new ValidationError(`Another user already uses the email '${body.email}'.`);
      Object.assign(u, { name: body.name.trim(), email: body.email.trim().toLowerCase(), roleIds, isAdmin: !!body.isAdmin, updatedAt: new Date().toISOString() });
    },

    async deactivate(id) {
      await wait();
      if (id === currentId()) throw new ValidationError('You cannot deactivate your own account.');
      const u = find(id);
      u.isActive = false;
      u.updatedAt = new Date().toISOString();
    },

    async reactivate(id) {
      await wait();
      const u = find(id);
      u.isActive = true;
      u.updatedAt = new Date().toISOString();
    },

    async roles() {
      await wait();
      return structuredClone(ROLES);
    },
  };
}
