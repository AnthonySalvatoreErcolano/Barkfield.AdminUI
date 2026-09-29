// The interfaces screens depend on. Two implementations: live/ (over http.ts) and fake/ (in memory).
// Kept close to the endpoints and grown screen by screen — add a method when a screen needs it.
// Data shapes are the generated contract types, never re-declared here.

import type { components, paths } from './generated/schema';

type Schemas = components['schemas'];

export type UserDetail = Schemas['UserDetailDto'];

export type CustomerListItem = Schemas['CustomerListItemDto'];
export type CustomerDetail = Schemas['CustomerDetailDto'];
export type CustomerPage = Schemas['PagedResultOfCustomerListItemDto'];
export type CustomerWrite = Schemas['CustomerWriteResponse'];
export type CreateCustomer = Schemas['CreateCustomerRequest'];
export type UpdateCustomer = Schemas['UpdateCustomerRequest'];
export type DeliveryDetails = Schemas['UpdateDeliveryDetailsRequest'];
export type SquareCandidate = Schemas['SquareCustomerCandidateDto'];
export type Pet = Schemas['PetDto'];
export type SubscriptionListItem = Schemas['SubscriptionListItemDto'];
export type DeliveryPage = Schemas['PagedResultOfDeliveryListItemDto'];
export type DeliveryListItem = Schemas['DeliveryListItemDto'];

/**
 * GET /api/customers query, as the spec types it — minus Skip and EffectiveSortBy, which are computed
 * properties of the API's filter record that leak into the spec and mean nothing when sent.
 */
export type CustomerListQuery = Omit<NonNullable<paths['/api/customers']['get']['parameters']['query']>, 'Skip' | 'EffectiveSortBy'>;

export interface CustomersPort {
  list(query: CustomerListQuery, signal?: AbortSignal): Promise<CustomerPage>;
  get(customerId: string, signal?: AbortSignal): Promise<CustomerDetail>;
  /** Saves locally first; `squareSynced: false` means saved, but the Square link needs a retry. */
  create(body: CreateCustomer): Promise<CustomerWrite>;
  /** Pushes to Square as well; `squareSynced: false` means saved here, not in Square. */
  update(customerId: string, body: UpdateCustomer): Promise<CustomerWrite>;
  /** Soft: the customer is deactivated and can be restored. Subscriptions are not touched. */
  archive(customerId: string): Promise<void>;
  restore(customerId: string): Promise<void>;
  /** The driver-facing stop details, read live at dispatch time. */
  updateDeliveryDetails(customerId: string, body: DeliveryDetails): Promise<void>;
  /** Look for an existing Square profile before creating one, so a duplicate is not made. */
  searchSquare(body: Schemas['SearchSquareCustomerRequest']): Promise<SquareCandidate[]>;
  /** Retry or re-push the Square link. Unlike create/update, a Square failure here throws. */
  syncSquare(customerId: string): Promise<CustomerWrite>;
  pets(customerId: string, includeInactive?: boolean): Promise<Pet[]>;
  subscriptions(customerId: string, includeCanceled?: boolean): Promise<SubscriptionListItem[]>;
  deliveries(customerId: string, page: { pageNumber: number; pageSize: number }): Promise<DeliveryPage>;
}

export interface AuthPort {
  /** Sign in and hold the access token. Throws SignInError (wrong credentials) or RateLimitError. */
  login(credentials: Schemas['LoginRequest']): Promise<void>;
  /** End the session server-side (clears the refresh cookie) and drop the token. Never throws. */
  logout(): Promise<void>;
  /** Resume a session from the refresh cookie after a reload. Resolves false when there is none. */
  restore(): Promise<boolean>;
  /** Always succeeds for a well-formed email, whether or not an account exists. */
  forgotPassword(body: Schemas['ForgotPasswordRequest']): Promise<void>;
  /** Completes a reset. The API revokes every existing session for that user. */
  resetPassword(body: Schemas['ResetPasswordRequest']): Promise<void>;
  /** Called when a session could not be renewed. Returns an unsubscribe function. */
  onSessionExpired(listener: () => void): () => void;
}

export interface UsersPort {
  me(): Promise<UserDetail>;
  /** Throws ValidationError when the current password is wrong. Other sessions stay signed in. */
  changePassword(body: Schemas['ChangePasswordRequest']): Promise<void>;
}

export type DeliveryDetail = Schemas['DeliveryDetailDto'];
export type DeliveryLine = Schemas['DeliveryLineDto'];
export type DueSubscription = Schemas['DueSubscriptionDto'];
export type GenerationResult = Schemas['DeliveryGenerationResult'];
export type DeliverySheet = Schemas['DeliverySheetDto'];
export type CreateOneOffDelivery = Schemas['CreateOneOffDeliveryRequest'];
export type Product = Schemas['ProductDto'];
export type ProductPage = Schemas['PagedResultOfProductDto'];

/** GET /api/deliveries query, as the spec types it. */
export type DeliveryListQuery = NonNullable<paths['/api/deliveries']['get']['parameters']['query']>;

/**
 * One procurement decision on one line — the per-line endpoints, expressed as data. The detail screen
 * sends one at a time; the procurement board will send many through the bulk endpoint.
 */
export type LineAction = { note?: string } & (
  | { kind: 'ordered' }
  /** Omit quantity to receive the whole line; fewer than ordered leaves it partially received. */
  | { kind: 'received'; quantityReceived?: number }
  | { kind: 'out-of-stock' }
  | { kind: 'substitute'; substituteProductId: string }
  | { kind: 'short' }
  | { kind: 'reset' }
);

export interface DeliveriesPort {
  list(query: DeliveryListQuery, signal?: AbortSignal): Promise<DeliveryPage>;
  get(deliveryId: string, signal?: AbortSignal): Promise<DeliveryDetail>;
  /** What generation for this day would create, and every reason a subscription would be passed over. */
  due(date: string): Promise<DueSubscription[]>;
  /** Partial success is normal: skipped subscriptions come back in the result, not as an error. */
  generate(date: string): Promise<GenerationResult>;
  createOneOff(body: CreateOneOffDelivery): Promise<void>;
  sheet(range: { from: string; to: string }): Promise<DeliverySheet[]>;

  /** delivery:pack — recording what happened to a line. Stays open after payment. */
  lineAction(deliveryId: string, lineId: string, action: LineAction): Promise<void>;
  orderAll(deliveryId: string, note?: string): Promise<void>;
  pack(deliveryId: string): Promise<void>;

  /** delivery:manage — changing the contents. Refused once paid (contentsAreLocked). */
  addLine(deliveryId: string, body: Schemas['AddDeliveryLineRequest']): Promise<void>;
  changeQuantity(deliveryId: string, lineId: string, quantity: number): Promise<void>;
  removeLine(deliveryId: string, lineId: string): Promise<void>;

  /** delivery:manage — scheduling and outcomes. */
  updateNotes(deliveryId: string, notes: string | null): Promise<void>;
  setWindow(deliveryId: string, window: { start: string | null; end: string | null }): Promise<void>;
  setServiceDuration(deliveryId: string, minutes: number | null): Promise<void>;
  /** The manual override — normally completion arrives from Routific. */
  markDelivered(deliveryId: string, deliveredOn?: string): Promise<void>;
  markFailed(deliveryId: string, reason: string): Promise<void>;
  cancel(deliveryId: string): Promise<void>;
  /** Proof-of-delivery photo bytes, proxied because the upstream needs our API token. */
  photo(deliveryId: string, photoUuid: string): Promise<Blob>;
}

export type ProcurementProduct = Schemas['ProcurementProductDto'];
export type ProcurementLine = Schemas['ProcurementLineDto'];
export type ProcurementDecision = Schemas['ProcurementLineDecisionRequest'];
export type ProcurementResult = Schemas['ProcurementUpdateResult'];

/** Both procurement reads take the same filter; from and to are required — the range is the screen. */
export type ProcurementQuery = NonNullable<paths['/api/procurement/lines']['get']['parameters']['query']>;

export interface ProcurementPort {
  /** The ordering pass: one row per product across the range. pendingQuantity goes on the supplier order. */
  products(query: ProcurementQuery, signal?: AbortSignal): Promise<Schemas['PagedResultOfProcurementProductDto']>;
  /** The receiving and allocating pass: flat lines, each carrying deliveryId + lineId. */
  lines(query: ProcurementQuery, signal?: AbortSignal): Promise<Schemas['PagedResultOfProcurementLineDto']>;
  /**
   * Several decisions in one request — applied with one save per delivery, so adjacent rows of the same
   * delivery cannot 409 against each other. Partial failure is a 200 with per-line results.
   * For a single row, use DeliveriesPort.lineAction instead.
   */
  apply(decisions: ProcurementDecision[]): Promise<ProcurementResult>;
}

export interface ProductsPort {
  list(query: NonNullable<paths['/api/products']['get']['parameters']['query']>, signal?: AbortSignal): Promise<ProductPage>;
}

export interface Api {
  auth: AuthPort;
  users: UsersPort;
  customers: CustomersPort;
  deliveries: DeliveriesPort;
  products: ProductsPort;
  procurement: ProcurementPort;
}
