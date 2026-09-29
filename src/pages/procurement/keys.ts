// TanStack Query keys for the procurement board.
import type { ProcurementQuery } from '../../api/ports';

export const procurementKeys = {
  all: ['procurement'] as const,
  products: (query: ProcurementQuery) => ['procurement', 'products', query] as const,
  lines: (query: ProcurementQuery) => ['procurement', 'lines', query] as const,
  /** Lines fetched to act on a whole product row (not displayed). */
  forProduct: (productId: string, action: string, query: ProcurementQuery) => ['procurement', 'for-product', productId, action, query] as const,
};
