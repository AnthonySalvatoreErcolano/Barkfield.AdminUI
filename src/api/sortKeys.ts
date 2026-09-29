// The sortBy keys each list endpoint accepts. The API silently falls back to its default on anything
// else, so a column offering an unlisted key looks broken rather than erroring.
//
// ⚠️ The one hand-maintained contract table in this project, because the spec types SortBy as a bare
// string (API-CONTEXT §5). Copied from the API repo's filter records:
//   Application/DataAccess/Customers/CustomerFilter.cs          AllowedSortKeys
//   Application/DataAccess/Users/UserFilter.cs                  AllowedSortKeys
//   Application/DataAccess/Deliveries/DeliveryFilter.cs         AllowedSortKeys
//   Application/DataAccess/Subscriptions/SubscriptionFilter.cs  AllowedSortKeys
//   Application/DataAccess/Products/ProductFilter.cs            AllowedSortKeys
//   Application/DataAccess/Procurement/ProcurementDtos.cs       AllowedLineSortKeys / AllowedProductSortKeys
// Once the spec carries these as an enum on SortBy, generate them and delete this file.

export const SORT_KEYS = {
  '/api/customers': { keys: ['name', 'email', 'createdAt', 'city', 'phone'], default: 'name' },
  '/api/users': { keys: ['name', 'email', 'createdAt'], default: 'name' },
  '/api/deliveries': { keys: ['scheduledFor', 'customer', 'status', 'procurement', 'createdAt', 'total'], default: 'scheduledFor' },
  '/api/subscriptions': { keys: ['nextDelivery', 'customer', 'status', 'createdAt', 'lastDelivery', 'name'], default: 'nextDelivery' },
  '/api/products': { keys: ['name', 'price', 'sku', 'createdAt', 'lastSyncedAt'], default: 'name' },
  '/api/procurement/lines': { keys: ['customer', 'product', 'scheduledFor', 'status', 'quantity'], default: 'customer' },
  '/api/procurement/products': { keys: ['product', 'pending', 'total', 'earliest', 'customers'], default: 'pending' },
} as const;

export type SortablePath = keyof typeof SORT_KEYS;
export type SortKey<P extends SortablePath> = (typeof SORT_KEYS)[P]['keys'][number];
