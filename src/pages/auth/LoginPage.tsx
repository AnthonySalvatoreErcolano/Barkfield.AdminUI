import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { apiMode } from '../../api';
import { errorMessage, RateLimitError } from '../../api/errors';
import { FAKE_PASSWORD } from '../../api/fake';
import { AuthCard } from '../../app/layout';
import { useSession } from '../../session/SessionProvider';
import { Alert, Button, Input } from '../../ui';

export interface LoginLocationState {
  from?: string;
}

export function LoginPage() {
  const { state, signIn } = useSession();
  const location = useLocation();
  const from = (location.state as LoginLocationState | null)?.from ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{ message: string; rateLimited: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  if (state.status === 'signedIn') return <Navigate to={from} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      // Navigation happens on the re-render above, once the session is signed in.
    } catch (err) {
      setError({ message: errorMessage(err), rateLimited: err instanceof RateLimitError });
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  const expired = state.status === 'signedOut' && state.reason === 'expired';

  return (
    <AuthCard
      title="Staff sign-in"
      lede="Autoship Admin"
      footer={<Link to="/forgot-password">Forgot your password?</Link>}
    >
      <form className="auth__form" onSubmit={submit} noValidate>
        {expired && !error ? <Alert tone="info">Your session ended. Sign in again to carry on where you were.</Alert> : null}
        {error ? <Alert tone={error.rateLimited ? 'warning' : 'danger'}>{error.message}</Alert> : null}
        <Input label="Email" type="email" autoComplete="username" required autoFocus
          value={email} onChange={e => setEmail(e.target.value)} />
        <Input label="Password" type="password" autoComplete="current-password" required
          value={password} onChange={e => setPassword(e.target.value)} />
        <Button type="submit" size="lg" fullWidth disabled={busy || !email.trim() || !password}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
        {apiMode === 'fake' ? (
          <Alert tone="warning" title="Fake data">
            Sign in as <strong>admin@barkfield.test</strong> or <strong>staff@barkfield.test</strong>, password <strong>{FAKE_PASSWORD}</strong>.
          </Alert>
        ) : null}
      </form>
    </AuthCard>
  );
}
