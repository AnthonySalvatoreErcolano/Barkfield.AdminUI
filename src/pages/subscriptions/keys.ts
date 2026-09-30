// TanStack Query keys for subscriptions.
import type { SubscriptionListQuery } from '../../api/ports';

export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  list: (query: SubscriptionListQuery) => ['subscriptions', 'list', query] as const,
  detail: (id: string) => ['subscriptions', 'detail', id] as const,
  upcoming: (id: string, cycles: number) => ['subscriptions', 'detail', id, 'upcoming', cycles] as const,
};
