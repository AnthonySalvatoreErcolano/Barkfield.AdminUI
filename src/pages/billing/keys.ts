// TanStack Query keys for billing.
export const billingKeys = {
  all: ['billing'] as const,
  discounts: ['billing', 'discounts'] as const,
  attention: (from: string, to: string) => ['billing', 'attention', from, to] as const,
};
