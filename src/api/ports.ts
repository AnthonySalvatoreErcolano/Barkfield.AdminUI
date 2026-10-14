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

/** GET /api/customers query, as the spec types it. */
export type CustomerListQuery = NonNullable<paths['/api/customers']['get']['parameters']['query']>;

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

export type Allergy = Schemas['AllergyDto'];
export type PetWrite = Schemas['CreatePetRequest'];

/** Pets hang off a customer (customers.pets lists them); one pet is addressed by its own id. */
export interface PetsPort {
  get(petId: string, signal?: AbortSignal): Promise<Pet>;
  /** Resolves the new pet's id. */
  create(customerId: string, body: PetWrite): Promise<string>;
  /** Allergies are replaced wholesale by allergyIds; an empty list clears them. */
  update(petId: string, body: PetWrite): Promise<void>;
  /** Soft: kept, and restorable. Most often a pet leaves the list because it has died. */
  deactivate(petId: string): Promise<void>;
  reactivate(petId: string): Promise<void>;
  /** The shared reference list, sorted by name. */
  allergies(): Promise<Allergy[]>;
  /** Adds to the shared list, or returns the existing one with that name (case-insensitively). */
  addAllergy(allergyName: string): Promise<string>;
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

export type UserListItem = Schemas['UserListItemDto'];
export type UserPage = Schemas['PagedResultOfUserListItemDto'];
export type Role = Schemas['RoleDto'];
export type CreateUser = Schemas['CreateUserRequest'];
export type UpdateUser = Schemas['UpdateUserRequest'];
export type UserListQuery = NonNullable<paths['/api/users']['get']['parameters']['query']>;

export interface UsersPort {
  me(): Promise<UserDetail>;
  /** Throws ValidationError when the current password is wrong. Other sessions stay signed in. */
  changePassword(body: Schemas['ChangePasswordRequest']): Promise<void>;

  /** Deactivated users are left out unless includeInactive. `roles` on each row is one comma-joined string. */
  list(query: UserListQuery, signal?: AbortSignal): Promise<UserPage>;
  get(userId: string, signal?: AbortSignal): Promise<UserDetail>;
  /** At least one role. A taken email is a 400 with a message, not a field error. Resolves the new id. */
  create(body: CreateUser): Promise<string>;
  /** Replaces the roles wholesale. The password is not changed here. */
  update(userId: string, body: UpdateUser): Promise<void>;
  /** Soft: sign-in and every gated call are refused from then on. Refused for your own account. */
  deactivate(userId: string): Promise<void>;
  reactivate(userId: string): Promise<void>;
  /** The fixed set to assign from. Permissions are granted to roles in the database, never here. */
  roles(): Promise<Role[]>;
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

  /**
   * delivery:manage — scheduling and outcomes. These three submit a whole value, so they take the
   * `revision` the form was built from: a stale one is a 409 instead of silently overwriting a
   * colleague's change. Omitted, last write wins (API-CONTEXT §4).
   */
  updateNotes(deliveryId: string, notes: string | null, revision?: number): Promise<void>;
  setWindow(deliveryId: string, window: { start: string | null; end: string | null }, revision?: number): Promise<void>;
  setServiceDuration(deliveryId: string, minutes: number | null, revision?: number): Promise<void>;
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

export type SquareDiscount = Schemas['SquareDiscountDto'];
export type ChargeResult = Schemas['DeliveryChargeResult'];
export type BatchChargeResult = Schemas['BatchChargeResult'];
export type ChargeAttentionItem = Schemas['ChargeAttentionItem'];

export interface BillingPort {
  /** Square's live discount list, for staff to pick from. The percentages are labels — never do arithmetic with them. */
  discounts(): Promise<SquareDiscount[]>;
  /** Replace the chosen discounts (ids only; Square applies them). Refused once the delivery is paid. */
  selectDiscounts(deliveryId: string, squareDiscountIds: string[]): Promise<void>;
  /** Charge one delivery. A refused card is a result, not an error. */
  charge(deliveryId: string): Promise<ChargeResult>;
  /** Charge every ready, unpaid delivery on a day. One list back: paid, declined, failed, skipped. */
  chargeAll(date: string): Promise<BatchChargeResult>;
  /** Cards refused, and paid deliveries that came up short (a refund owed, made by hand in Square). */
  needsAttention(range: { from?: string; to?: string }): Promise<ChargeAttentionItem[]>;
}

export type SubscriptionDetail = Schemas['SubscriptionDetailDto'];
export type SubscriptionPage = Schemas['PagedResultOfSubscriptionListItemDto'];
export type RotationGroup = Schemas['RotationGroupDto'];
export type RotationItem = Schemas['RotationGroupItemDto'];
export type SubscriptionAddOn = Schemas['SubscriptionAddOnDto'];
export type DeliveryPreview = Schemas['DeliveryPreviewDto'];
export type CreateSubscription = Schemas['CreateSubscriptionRequest'];
export type SubscriptionListQuery = NonNullable<paths['/api/subscriptions']['get']['parameters']['query']>;

export interface SubscriptionsPort {
  list(query: SubscriptionListQuery, signal?: AbortSignal): Promise<SubscriptionPage>;
  get(subscriptionId: string, signal?: AbortSignal): Promise<SubscriptionDetail>;
  /** Created as a new sign-up; it starts delivering once activated. Resolves the new id. */
  create(body: CreateSubscription): Promise<string>;
  /** Permanent. A customer who comes back gets a new subscription. */
  cancel(subscriptionId: string): Promise<void>;
  nextDelivery(subscriptionId: string): Promise<DeliveryPreview>;
  upcoming(subscriptionId: string, cycles: number): Promise<DeliveryPreview[]>;

  rename(subscriptionId: string, name: string | null): Promise<void>;
  /** Every N days/weeks/months. recalculateNextDelivery moves the next date to fit the new cycle. */
  changeFrequency(subscriptionId: string, body: Schemas['ChangeFrequencyRequest']): Promise<void>;
  changeFulfillment(subscriptionId: string, fulfillmentMethod: Schemas['FulfillmentMethod']): Promise<void>;
  reschedule(subscriptionId: string, nextDeliveryDate: string): Promise<void>;
  skip(subscriptionId: string): Promise<void>;
  activate(subscriptionId: string): Promise<void>;
  /** With a date, it resumes on that date; without one it is paused until someone resumes it. */
  pause(subscriptionId: string, resumeOn: string | null): Promise<void>;
  resume(subscriptionId: string): Promise<void>;

  addItem(subscriptionId: string, body: Schemas['AddSubscriptionItemRequest']): Promise<void>;
  changeItemQuantity(subscriptionId: string, productId: string, quantity: number): Promise<void>;
  removeItem(subscriptionId: string, productId: string): Promise<void>;

  /** One-off extras for the next delivery only; consumed when it is generated. */
  addAddOn(subscriptionId: string, body: Schemas['AddAddOnRequest']): Promise<void>;
  changeAddOnQuantity(subscriptionId: string, addOnId: string, quantity: number): Promise<void>;
  removeAddOn(subscriptionId: string, addOnId: string): Promise<void>;

  addRotationGroup(subscriptionId: string, name: string): Promise<void>;
  renameRotationGroup(subscriptionId: string, groupId: string, name: string): Promise<void>;
  removeRotationGroup(subscriptionId: string, groupId: string): Promise<void>;
  pauseRotationGroup(subscriptionId: string, groupId: string): Promise<void>;
  resumeRotationGroup(subscriptionId: string, groupId: string): Promise<void>;
  addRotationItem(subscriptionId: string, groupId: string, body: Schemas['AddRotationItemRequest']): Promise<void>;
  changeRotationItemQuantity(subscriptionId: string, groupId: string, itemId: string, quantity: number): Promise<void>;
  removeRotationItem(subscriptionId: string, groupId: string, itemId: string): Promise<void>;
  /** Every item exactly once. What is up next stays up next. */
  reorderRotation(subscriptionId: string, groupId: string, itemIdsInOrder: string[]): Promise<void>;
  /** Out of turn: send this one next. */
  jumpTo(subscriptionId: string, groupId: string, itemId: string): Promise<void>;
}

export type ProductListQuery = NonNullable<paths['/api/products']['get']['parameters']['query']>;
export type CatalogSearchResult = Schemas['CatalogSearchResultDto'];
export type CatalogSyncResult = Schemas['CatalogSyncResult'];

/**
 * The catalog mirrors Square, which owns names and prices: products are imported and synced, never
 * created or edited here. Every Square call can fail with a 502 (OutageError or CredentialError).
 */
export interface ProductsPort {
  list(query: ProductListQuery, signal?: AbortSignal): Promise<ProductPage>;
  get(productId: string, signal?: AbortSignal): Promise<Product>;
  /** Square's catalog, not ours — every variation of each matching item, marked if already here. */
  searchSquare(q: string, limit?: number): Promise<CatalogSearchResult[]>;
  /** Idempotent: an existing product is refreshed and restored, not duplicated. Resolves its id. */
  import(squareVariationId: string): Promise<string>;
  /** Refresh one product's name, price and SKU. 404 when Square no longer has it. */
  sync(productId: string): Promise<void>;
  /** Every active product. Ones Square no longer prices are reported in `missing`, never removed. */
  syncAll(): Promise<CatalogSyncResult>;
  /** Soft: subscription lines and history keep it; it drops out of pickers. */
  deactivate(productId: string): Promise<void>;
  reactivate(productId: string): Promise<void>;
}

export type DispatchBoard = Schemas['DispatchBoardDto'];
export type DispatchSendResult = Schemas['DispatchSendResult'];
export type RouteListItem = Schemas['RouteListItemDto'];
export type LoadList = Schemas['LoadListDto'];
export type LoadListStop = Schemas['LoadListStopDto'];
export type LoadListDelivery = Schemas['LoadListDeliveryDto'];

/**
 * The day's local deliveries against Routific. Routes are built there, not here: we send orders, a
 * dispatcher publishes a route, and it arrives by webhook. Routific calls can fail with a 502.
 */
export interface DispatchPort {
  /** Includes closed deliveries (a delivered stop is still part of the day); `statusLine` is ready to show. */
  board(date: string, signal?: AbortSignal): Promise<DispatchBoard>;
  /**
   * Push packed deliveries — the whole day, or just `deliveryIds` (ones packed after the first send).
   * Already-sent ones are skipped, never resent: Routific has no idempotency key. Partial failure is a 200.
   */
  send(date: string, deliveryIds?: string[]): Promise<DispatchSendResult>;
  /** Pull one out of Routific (a card that couldn't be fixed, a cancellation). It becomes sendable again. */
  withdraw(deliveryId: string): Promise<void>;
  /** Stops in LOADING order — the reverse of driving order. Render as given. */
  loadList(routeId: string, signal?: AbortSignal): Promise<LoadList>;
  /** Per route stop row (one delivery's boxes at a door), so a doorstep with two boxes needs two ticks. */
  setStopLoaded(routeId: string, routeStopId: string, loaded: boolean): Promise<void>;
}

export interface Api {
  auth: AuthPort;
  users: UsersPort;
  customers: CustomersPort;
  pets: PetsPort;
  deliveries: DeliveriesPort;
  products: ProductsPort;
  procurement: ProcurementPort;
  billing: BillingPort;
  subscriptions: SubscriptionsPort;
  dispatch: DispatchPort;
}
