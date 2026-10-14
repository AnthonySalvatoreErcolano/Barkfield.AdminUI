// TanStack Query keys for users. Everything hangs off ['users'], so a write invalidates it all.
import type { UserListQuery } from '../../api/ports';

export const userKeys = {
  all: ['users'] as const,
  list: (query: UserListQuery) => ['users', 'list', query] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
  roles: ['users', 'roles'] as const,
};
