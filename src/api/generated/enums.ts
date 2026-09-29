// GENERATED from contracts/openapi.json by scripts/generate-api.mjs — do not edit by hand.

// Enums cross the wire as integers. Send the number (e.g. DeliveryStatus.Packed); use the Names map,
// or the DTO's own …Name field, for display.

export const ChargeAttentionReason = {
  PaymentFailed: 1,
  RefundOwed: 2,
} as const;
export type ChargeAttentionReason = (typeof ChargeAttentionReason)[keyof typeof ChargeAttentionReason];
export const ChargeAttentionReasonNames: Record<ChargeAttentionReason, string> = {
  1: "PaymentFailed",
  2: "RefundOwed",
};

export const ChargeOutcome = {
  Paid: 1,
  Declined: 2,
  Failed: 3,
  NotAttempted: 4,
} as const;
export type ChargeOutcome = (typeof ChargeOutcome)[keyof typeof ChargeOutcome];
export const ChargeOutcomeNames: Record<ChargeOutcome, string> = {
  1: "Paid",
  2: "Declined",
  3: "Failed",
  4: "NotAttempted",
};

export const DeliveryLineSource = {
  Recurring: 1,
  Rotation: 2,
  AddOn: 3,
  Manual: 4,
} as const;
export type DeliveryLineSource = (typeof DeliveryLineSource)[keyof typeof DeliveryLineSource];
export const DeliveryLineSourceNames: Record<DeliveryLineSource, string> = {
  1: "Recurring",
  2: "Rotation",
  3: "AddOn",
  4: "Manual",
};

export const DeliveryStatus = {
  Scheduled: 1,
  Packed: 2,
  Routed: 3,
  OutForDelivery: 4,
  Delivered: 5,
  Failed: 6,
  Canceled: 7,
} as const;
export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];
export const DeliveryStatusNames: Record<DeliveryStatus, string> = {
  1: "Scheduled",
  2: "Packed",
  3: "Routed",
  4: "OutForDelivery",
  5: "Delivered",
  6: "Failed",
  7: "Canceled",
};

export const DispatchStage = {
  NothingToDispatch: 1,
  ReadyToSend: 2,
  SentAwaitingRoutes: 3,
  PartiallySent: 4,
  RoutesPublished: 5,
  PulledBack: 6,
} as const;
export type DispatchStage = (typeof DispatchStage)[keyof typeof DispatchStage];
export const DispatchStageNames: Record<DispatchStage, string> = {
  1: "NothingToDispatch",
  2: "ReadyToSend",
  3: "SentAwaitingRoutes",
  4: "PartiallySent",
  5: "RoutesPublished",
  6: "PulledBack",
};

export const FrequencyUnit = {
  Days: 1,
  Weeks: 2,
  Months: 3,
} as const;
export type FrequencyUnit = (typeof FrequencyUnit)[keyof typeof FrequencyUnit];
export const FrequencyUnitNames: Record<FrequencyUnit, string> = {
  1: "Days",
  2: "Weeks",
  3: "Months",
};

export const FulfillmentMethod = {
  LocalDelivery: 1,
  Pickup: 2,
  Shipping: 3,
} as const;
export type FulfillmentMethod = (typeof FulfillmentMethod)[keyof typeof FulfillmentMethod];
export const FulfillmentMethodNames: Record<FulfillmentMethod, string> = {
  1: "LocalDelivery",
  2: "Pickup",
  3: "Shipping",
};

export const LineOrderStatus = {
  Pending: 1,
  Ordered: 2,
  PartiallyReceived: 3,
  Received: 4,
  OutOfStock: 5,
  Substituted: 6,
  Shorted: 7,
} as const;
export type LineOrderStatus = (typeof LineOrderStatus)[keyof typeof LineOrderStatus];
export const LineOrderStatusNames: Record<LineOrderStatus, string> = {
  1: "Pending",
  2: "Ordered",
  3: "PartiallyReceived",
  4: "Received",
  5: "OutOfStock",
  6: "Substituted",
  7: "Shorted",
};

export const PaymentStatus = {
  NotCharged: 1,
  Paid: 2,
  Failed: 3,
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
export const PaymentStatusNames: Record<PaymentStatus, string> = {
  1: "NotCharged",
  2: "Paid",
  3: "Failed",
};

export const PetType = {
  Dog: 1,
  Cat: 2,
  Other: 3,
} as const;
export type PetType = (typeof PetType)[keyof typeof PetType];
export const PetTypeNames: Record<PetType, string> = {
  1: "Dog",
  2: "Cat",
  3: "Other",
};

export const ProcurementStatus = {
  NotStarted: 1,
  InProgress: 2,
  Blocked: 3,
  Ready: 4,
} as const;
export type ProcurementStatus = (typeof ProcurementStatus)[keyof typeof ProcurementStatus];
export const ProcurementStatusNames: Record<ProcurementStatus, string> = {
  1: "NotStarted",
  2: "InProgress",
  3: "Blocked",
  4: "Ready",
};

export const RouteStatus = {
  Planned: 1,
  Published: 2,
  Executing: 3,
  Completed: 4,
  Canceled: 5,
  Unpublished: 6,
} as const;
export type RouteStatus = (typeof RouteStatus)[keyof typeof RouteStatus];
export const RouteStatusNames: Record<RouteStatus, string> = {
  1: "Planned",
  2: "Published",
  3: "Executing",
  4: "Completed",
  5: "Canceled",
  6: "Unpublished",
};

export const SubscriptionStatus = {
  NewSignUp: 1,
  Active: 2,
  Paused: 3,
  Canceled: 4,
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
export const SubscriptionStatusNames: Record<SubscriptionStatus, string> = {
  1: "NewSignUp",
  2: "Active",
  3: "Paused",
  4: "Canceled",
};
