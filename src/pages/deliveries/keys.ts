// TanStack Query keys for deliveries. Everything hangs off ['deliveries']; customers' delivery tabs
// hang off ['customers'], so a delivery write invalidates both.
import type { DeliveryListQuery } from '../../api/ports';

export const deliveryKeys = {
  all: ['deliveries'] as const,
  list: (query: DeliveryListQuery) => ['deliveries', 'list', query] as const,
  detail: (id: string) => ['deliveries', 'detail', id] as const,
  due: (date: string) => ['deliveries', 'due', date] as const,
  sheet: (from: string, to: string) => ['deliveries', 'sheet', from, to] as const,
  photo: (id: string, uuid: string) => ['deliveries', 'photo', id, uuid] as const,
};
