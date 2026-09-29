// TanStack Query keys for customers. Everything hangs off ['customers'], so a write invalidates it all.
import type { CustomerListQuery } from '../../api/ports';

export const customerKeys = {
  all: ['customers'] as const,
  list: (query: CustomerListQuery) => ['customers', 'list', query] as const,
  detail: (id: string) => ['customers', 'detail', id] as const,
  pets: (id: string) => ['customers', 'detail', id, 'pets'] as const,
  subscriptions: (id: string) => ['customers', 'detail', id, 'subscriptions'] as const,
  deliveries: (id: string, page: number) => ['customers', 'detail', id, 'deliveries', page] as const,
};
