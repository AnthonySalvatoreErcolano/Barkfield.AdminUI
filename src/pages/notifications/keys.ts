// TanStack Query keys for the notification centre. Everything hangs off ['notifications'], so any write
// refreshes rules, templates, the outbox and settings together — a rule change moves template counts,
// a retry moves the outbox.
import type { OutboxQuery } from '../../api/ports';

export const notificationKeys = {
  all: ['notifications'] as const,
  triggers: ['notifications', 'triggers'] as const,
  rules: ['notifications', 'rules'] as const,
  rule: (id: string) => ['notifications', 'rules', id] as const,
  templates: ['notifications', 'templates'] as const,
  outbox: (query: OutboxQuery) => ['notifications', 'outbox', query] as const,
  settings: ['notifications', 'settings'] as const,
  suppressions: ['notifications', 'suppressions'] as const,
  preferences: (customerId: string) => ['customers', 'detail', customerId, 'notification-preferences'] as const,
};
