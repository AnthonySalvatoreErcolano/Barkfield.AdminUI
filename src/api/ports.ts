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

export interface Api {
  auth: AuthPort;
  users: UsersPort;
  customers: CustomersPort;
}
