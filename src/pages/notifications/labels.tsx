// Plain words for the notification centre. The API names statuses as identifiers ("OutForDelivery") and
// builds rule summaries from them; staff read "Out for delivery". Nothing here decides anything — the
// API's own flags (willSend, needsAttention, isHeldForReview, isWaiting) drive every badge.
import { NotificationStatus, NotificationTriggerKind } from '../../api/generated/enums';
import type { NotificationRule, OutboxEntry } from '../../api/ports';
import { Badge, type Tone } from '../../ui';

/** "OutForDelivery" → "Out for delivery". Already-plain words pass through. */
export function humanize(identifier: string): string {
  const words = identifier.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ');
  return words.map((w, i) => (i === 0 ? w : w.toLowerCase())).join(' ');
}

/**
 * The API's summary sentence, with its status identifiers made readable. Template names are quoted in
 * the sentence, so only the text outside quotes is touched.
 */
export function readableSummary(summary: string | null | undefined): string {
  if (!summary) return '';
  return summary.split('"').map((part, i) => (i % 2 ? part : part
    // Status names follow "becomes" and "from": "becomes OutForDelivery" → "becomes out for delivery".
    .replace(/\b(becomes|from) ([A-Z]\w*)/g, (_m, word: string, status: string) => `${word} ${humanize(status).toLowerCase()}`)
    // The reminder form reads "3 day(s) before, send …" — say before what.
    .replace(/^(\d+) day\(s\) before,/, (_m, n: string) => `${n} ${n === '1' ? 'day' : 'days'} before the next delivery,`)
  )).join('"');
}

/** What a trigger kind is about, for the rule form's picker. Falls back to the API's name. */
export function triggerLabel(kind: number, kindName: string): string {
  return ({
    [NotificationTriggerKind.DeliveryStatus]: 'A delivery’s status changes',
    [NotificationTriggerKind.LineOrderStatus]: 'A product on a delivery changes',
    [NotificationTriggerKind.PaymentStatus]: 'A payment is taken or refused',
    [NotificationTriggerKind.BeforeNextDelivery]: 'Days before the next delivery',
  } as Record<number, string>)[kind] ?? humanize(kindName);
}

/** Off · Dry run · Live — the three states a rule can be in, read from its two independent flags. */
export function RuleStateBadge({ rule }: { rule: Pick<NotificationRule, 'isEnabled' | 'isDryRun' | 'willSend'> }) {
  if (rule.willSend) return <Badge tone="success" dot>Live</Badge>;
  if (rule.isEnabled) return <Badge tone="warning" dot>Dry run</Badge>;
  return <Badge tone="neutral" dot>Off</Badge>;
}

const OUTBOX: Record<number, { tone: Tone; label: string }> = {
  [NotificationStatus.Queued]: { tone: 'info', label: 'Waiting to send' },
  [NotificationStatus.Sent]: { tone: 'success', label: 'Sent' },
  [NotificationStatus.Failed]: { tone: 'danger', label: 'Failed' },
  [NotificationStatus.Suppressed]: { tone: 'neutral', label: 'Address blocked' },
  [NotificationStatus.Skipped]: { tone: 'neutral', label: 'Not sent (dry run)' },
  [NotificationStatus.HeldForReview]: { tone: 'warning', label: 'Held for review' },
};

export function OutboxStatusBadge({ entry }: { entry: Pick<OutboxEntry, 'status' | 'isWaiting'> }) {
  const s = OUTBOX[entry.status] ?? { tone: 'neutral' as const, label: 'Unknown' };
  return <Badge tone={s.tone} dot>{entry.isWaiting ? 'Scheduled' : s.label}</Badge>;
}

/** Filter chips for the outbox, in the order staff look for them. */
export const OUTBOX_FILTERS: Array<{ value: number | null; label: string }> = [
  { value: null, label: 'All' },
  { value: NotificationStatus.HeldForReview, label: 'Held for review' },
  { value: NotificationStatus.Failed, label: 'Failed' },
  { value: NotificationStatus.Queued, label: 'Waiting' },
  { value: NotificationStatus.Sent, label: 'Sent' },
  { value: NotificationStatus.Skipped, label: 'Dry run' },
  { value: NotificationStatus.Suppressed, label: 'Blocked' },
];
