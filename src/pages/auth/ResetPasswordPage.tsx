// The page a reset link lands on: /reset-password?email=<email>&token=<token>
// The API side needs this route to build the link (API-CONTEXT §6).
import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { errorMessage, RateLimitError, ValidationError } from '../../api/errors';
import { AuthCard } from '../../app/layout';
import { useApi } from '../../session/SessionProvider';
import { Alert, Button, Input } from '../../ui';

/** The API's own minimum (ResetPasswordRequest.newPassword minLength). Checked here only to save a round trip. */
export const MIN_PASSWORD_LENGTH = 12;

export function ResetPasswordPage() {
  const api = useApi();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<{ message: string; rateLimited: boolean } | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <AuthCard title="Reset link needed" footer={<Link to="/forgot-password">Request a new link</Link>}>
        <Alert tone="warning">This page needs the link from your reset email. Open the link again, or request a new one.</Alert>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title="Password changed" footer={<Link to="/login">Go to sign-in</Link>}>
        <Alert tone="success">Your new password is set. You’ve been signed out everywhere — sign in again with the new one.</Alert>
      </AuthCard>
    );
  }

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== password;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (password.length < MIN_PASSWORD_LENGTH || password !== confirm || !email.trim()) return;
    setBusy(true);
    setError(null);
    setFieldError(undefined);
    try {
      await api.auth.resetPassword({ email: email.trim(), resetToken: token, newPassword: password });
      setDone(true);
    } catch (err) {
      if (err instanceof ValidationError && err.fieldErrors.newPassword) setFieldError(err.fieldErrors.newPassword[0]);
      else setError({ message: errorMessage(err), rateLimited: err instanceof RateLimitError });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Choose a new password" lede={`At least ${MIN_PASSWORD_LENGTH} characters.`}
      footer={<Link to="/login">Back to sign-in</Link>}>
      <form className="auth__form" onSubmit={submit} noValidate>
        {error ? <Alert tone={error.rateLimited ? 'warning' : 'danger'}>{error.message}</Alert> : null}
        {!params.get('email') ? (
          <Input label="Email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} />
        ) : (
          // Keep the username in the form so password managers save the new password against it.
          <input type="hidden" autoComplete="username" value={email} readOnly />
        )}
        <Input label="New password" type="password" autoComplete="new-password" required autoFocus
          value={password} onChange={e => setPassword(e.target.value)}
          error={fieldError ?? ((touched || tooShort) && password.length < MIN_PASSWORD_LENGTH ? `Use at least ${MIN_PASSWORD_LENGTH} characters.` : undefined)} />
        <Input label="Confirm new password" type="password" autoComplete="new-password" required
          value={confirm} onChange={e => setConfirm(e.target.value)}
          error={(touched || mismatch) && confirm !== password ? 'The passwords don’t match.' : undefined} />
        <Button type="submit" size="lg" fullWidth disabled={busy}>{busy ? 'Saving…' : 'Set new password'}</Button>
      </form>
    </AuthCard>
  );
}
