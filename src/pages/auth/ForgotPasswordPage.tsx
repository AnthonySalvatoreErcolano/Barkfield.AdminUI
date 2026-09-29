import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { errorMessage, RateLimitError } from '../../api/errors';
import { AuthCard } from '../../app/layout';
import { useApi } from '../../session/SessionProvider';
import { Alert, Button, Input } from '../../ui';

export function ForgotPasswordPage() {
  const api = useApi();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<{ message: string; rateLimited: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.auth.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setError({ message: errorMessage(err), rateLimited: err instanceof RateLimitError });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Reset your password"
      lede={sent ? undefined : 'Enter the email you sign in with and we’ll send you a link to choose a new password.'}
      footer={<Link to="/login">Back to sign-in</Link>}
    >
      {sent ? (
        // Worded the same whether or not the account exists, so the page cannot reveal who has one.
        <Alert tone="success" title="Check your email">
          If there’s an account for <strong>{email.trim()}</strong>, a reset link is on its way.
        </Alert>
      ) : (
        <form className="auth__form" onSubmit={submit} noValidate>
          {error ? <Alert tone={error.rateLimited ? 'warning' : 'danger'}>{error.message}</Alert> : null}
          <Input label="Email" type="email" autoComplete="username" required autoFocus value={email} onChange={e => setEmail(e.target.value)} />
          <Button type="submit" size="lg" fullWidth disabled={busy || !email.trim()}>{busy ? 'Sending…' : 'Send reset link'}</Button>
        </form>
      )}
      {/* API-CONTEXT §6: the API logs the token instead of mailing it until an email transport is chosen. */}
      <Alert tone="info" style={{ marginTop: 16 }}>
        Reset emails aren’t switched on yet. If you’re locked out, ask a manager to help you back in.
      </Alert>
    </AuthCard>
  );
}
