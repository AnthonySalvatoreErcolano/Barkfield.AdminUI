// TanStack Query keys for products. Everything hangs off ['products'], so a write invalidates it all —
// including the product pickers, which share the list key.
import type { ProductListQuery } from '../../api/ports';

export const productKeys = {
  all: ['products'] as const,
  list: (query: ProductListQuery) => ['products', 'list', query] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
  square: (q: string) => ['products', 'square', q] as const,
};
