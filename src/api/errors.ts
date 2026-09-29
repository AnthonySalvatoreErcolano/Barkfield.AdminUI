// Typed errors for every failure http.ts can produce. Screens branch on the class, never on a status
// number. See contracts/API-CONTEXT.md §4 for what each status means in this application.

export abstract class ApiError extends Error {
  abstract readonly status: number;
  /** True when `message` was written for staff by the API and is safe to show as-is. */
  abstract readonly showable: boolean;
}

/**
 * 400 — validation, or a domain rule refused the action. Show on the form.
 *
 * A domain rule arrives as `{ message }` and has no field errors. A data-annotation failure arrives as
 * ProblemDetails with `errors`, which land in `fieldErrors` keyed by camelCase field name, so a form
 * can put each one under its input.
 */
export class ValidationError extends ApiError {
  readonly status = 400;
  readonly showable = true;
  constructor(message: string, readonly fieldErrors: Record<string, string[]> = {}) {
    super(message);
  }
}

/** 404 — unknown id. */
export class NotFoundError extends ApiError {
  readonly status = 404;
  readonly showable = true;
}

/**
 * 409 — someone else changed this record while the user was working. A workflow, not a toast:
 * reload the record and let them reapply. Never auto-retry.
 */
export class ConflictError extends ApiError {
  readonly status = 409;
  readonly showable = true;
}

/**
 * 502 — Square or Routific rejected our API token. Retrying will never work; an administrator has to
 * issue a new token. The message says so, and should be surfaced prominently.
 */
export class CredentialError extends ApiError {
  readonly status = 502;
  readonly showable = true;
}

/** 502 — Square or Routific is down or unreachable. Retrying later is reasonable. */
export class OutageError extends ApiError {
  readonly status = 502;
  readonly showable = true;
}

/** 401 on sign-in — the email and password did not match. (Elsewhere a 401 is handled inside http.ts.) */
export class SignInError extends ApiError {
  readonly status = 401;
  readonly showable = true;
}

/** 429 — the login rate limit (per IP), not bad credentials. */
export class RateLimitError extends ApiError {
  readonly status = 429;
  readonly showable = false;
  constructor() {
    super('Too many sign-in attempts. Wait a moment and try again.');
  }
}

/**
 * 403 — signed in but lacking the permission. Controls are gated on the user's permissions, so this
 * means a gate is wrong somewhere: it is logged as a bug, not explained to the user.
 */
export class ForbiddenError extends ApiError {
  readonly status = 403;
  readonly showable = false;
  constructor() {
    super('You don’t have access to do that.');
  }
}

/** 503 — the database is unavailable. Full-page retry state. */
export class UnavailableError extends ApiError {
  readonly status = 503;
  readonly showable = false;
  constructor() {
    super('The system is unavailable right now. Try again in a minute.');
  }
}

/**
 * 500 and anything else unexpected. The API's own message is deliberately discarded: an unexpected
 * exception's text can carry connection strings or SQL.
 */
export class ServerError extends ApiError {
  readonly showable = false;
  constructor(readonly status: number) {
    super('Something went wrong on our side. Try again, and if it keeps happening let the office know.');
  }
}

/** The request never got an HTTP response — offline, DNS, CORS preflight refused. */
export class NetworkError extends ApiError {
  readonly status = 0;
  readonly showable = false;
  constructor() {
    super('Can’t reach the server. Check the connection and try again.');
  }
}

/** The session could not be renewed. State has been cleared and the app sent to sign-in. */
export class SessionExpiredError extends ApiError {
  readonly status = 401;
  readonly showable = false;
  constructor() {
    super('Your session has ended. Sign in again.');
  }
}

/** The text to show a person for any error — the API's own words only where they were written for staff. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return new ServerError(0).message;
}
