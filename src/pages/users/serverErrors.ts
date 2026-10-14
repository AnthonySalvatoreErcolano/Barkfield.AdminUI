// The API's refusals of a user form, as field errors where they belong to a field.
import { ValidationError } from '../../api/errors';

/**
 * Field errors to show under the inputs, or null to show the error above the form. A taken email is the
 * service's own check — a 400 with only a message — so it is placed under Email by its wording.
 */
export function serverErrorsOf(err: unknown): Record<string, string[]> | null {
  if (!(err instanceof ValidationError)) return null;
  if (Object.keys(err.fieldErrors).length) return err.fieldErrors;
  if (/\bemail\b/i.test(err.message)) return { email: [err.message] };
  return null;
}
