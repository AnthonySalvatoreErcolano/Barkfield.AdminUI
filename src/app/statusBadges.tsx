// Status → badge, in one place so the same state always looks the same across screens. Keyed on the
// integer enum; the label comes from the DTO's own …Name where it has one.
import { DeliveryStatus, FulfillmentMethod, LineOrderStatus, PaymentStatus, ProcurementStatus, SubscriptionStatus } from '../api/generated/enums';
import { Badge, type Tone } from '../ui';

const SUBSCRIPTION: Record<number, { tone: Tone; label: string }> = {
  [SubscriptionStatus.NewSignUp]: { tone: 'info', label: 'New sign-up' },
  [SubscriptionStatus.Active]: { tone: 'success', label: 'Active' },
  [SubscriptionStatus.Paused]: { tone: 'warning', label: 'Paused' },
  [SubscriptionStatus.Canceled]: { tone: 'neutral', label: 'Canceled' },
};

export function SubscriptionStatusBadge({ status }: { status: number }) {
  const s = SUBSCRIPTION[status] ?? { tone: 'neutral' as const, label: 'Unknown' };
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
}

const DELIVERY: Record<number, { tone: Tone; label: string }> = {
  [DeliveryStatus.Scheduled]: { tone: 'info', label: 'Scheduled' },
  [DeliveryStatus.Packed]: { tone: 'brand', label: 'Packed' },
  [DeliveryStatus.Routed]: { tone: 'brand', label: 'Routed' },
  [DeliveryStatus.OutForDelivery]: { tone: 'brand', label: 'Out for delivery' },
  [DeliveryStatus.Delivered]: { tone: 'success', label: 'Delivered' },
  [DeliveryStatus.Failed]: { tone: 'danger', label: 'Failed' },
  [DeliveryStatus.Canceled]: { tone: 'neutral', label: 'Canceled' },
};

export function DeliveryStatusBadge({ status }: { status: number }) {
  const s = DELIVERY[status] ?? { tone: 'neutral' as const, label: 'Unknown' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

const PAYMENT: Record<number, { tone: Tone; label: string }> = {
  [PaymentStatus.NotCharged]: { tone: 'neutral', label: 'Not charged' },
  [PaymentStatus.Paid]: { tone: 'success', label: 'Paid' },
  [PaymentStatus.Failed]: { tone: 'danger', label: 'Payment failed' },
};

export function PaymentStatusBadge({ status }: { status: number }) {
  const s = PAYMENT[status] ?? { tone: 'neutral' as const, label: 'Unknown' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

const LINE: Record<number, { tone: Tone; label: string }> = {
  [LineOrderStatus.Pending]: { tone: 'neutral', label: 'Pending' },
  [LineOrderStatus.Ordered]: { tone: 'info', label: 'Ordered' },
  [LineOrderStatus.PartiallyReceived]: { tone: 'warning', label: 'Part received' },
  [LineOrderStatus.Received]: { tone: 'success', label: 'Received' },
  [LineOrderStatus.OutOfStock]: { tone: 'danger', label: 'Out of stock' },
  [LineOrderStatus.Substituted]: { tone: 'brand', label: 'Substituted' },
  [LineOrderStatus.Shorted]: { tone: 'neutral', label: 'Shorted' },
};

export function LineStatusBadge({ status }: { status: number }) {
  const s = LINE[status] ?? { tone: 'neutral' as const, label: 'Unknown' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

const PROCUREMENT: Record<number, { tone: Tone; label: string }> = {
  [ProcurementStatus.NotStarted]: { tone: 'neutral', label: 'Not started' },
  [ProcurementStatus.InProgress]: { tone: 'info', label: 'In progress' },
  [ProcurementStatus.Blocked]: { tone: 'danger', label: 'Blocked' },
  [ProcurementStatus.Ready]: { tone: 'success', label: 'Ready to pack' },
};

/** The delivery's rolled-up procurement state. Derived by the API from the lines — never sent. */
export function ProcurementBadge({ status }: { status: number }) {
  const s = PROCUREMENT[status] ?? { tone: 'neutral' as const, label: 'Unknown' };
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
}

export const FULFILLMENT_LABEL: Record<number, string> = {
  [FulfillmentMethod.LocalDelivery]: 'Local delivery',
  [FulfillmentMethod.Pickup]: 'Pickup',
  [FulfillmentMethod.Shipping]: 'Shipping',
};
