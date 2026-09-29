// The interfaces screens depend on. Two implementations: live/ (over http.ts) and fake/ (in memory).
// Kept close to the endpoints and grown screen by screen — add a method when a screen needs it.
// Data shapes are the generated contract types, never re-declared here.

import type { components } from './generated/schema';

type Schemas = components['schemas'];

export type UserDetail = Schemas['UserDetailDto'];

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
}
