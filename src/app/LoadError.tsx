// What a screen shows when a read fails. The wording comes from the typed error — the API's own only
// where it was written for staff (never a 500's).
import { CredentialError, errorMessage, NotFoundError, UnavailableError } from '../api/errors';
import { Alert, Button } from '../ui';

export function LoadError({ error, onRetry, what = 'this' }: { error: unknown; onRetry?: () => void; what?: string }) {
  if (error instanceof CredentialError) {
    // An expired Square/Routific token: retrying will never work, so no retry button.
    return <Alert tone="danger" title="Needs an administrator">{error.message}</Alert>;
  }
  if (error instanceof NotFoundError) {
    return <Alert tone="warning" title="Not found">{error.message}</Alert>;
  }
  return (
    <Alert
      tone={error instanceof UnavailableError ? 'warning' : 'danger'}
      title={`Couldn’t load ${what}`}
      action={onRetry ? <Button size="sm" variant="secondary" iconLeft="refresh-cw" onClick={onRetry}>Try again</Button> : undefined}
    >
      {errorMessage(error)}
    </Alert>
  );
}
