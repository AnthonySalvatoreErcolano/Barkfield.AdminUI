// My account (PAGES.md §0): who you are, and changing your own password.
import { useState, type FormEvent, type ReactNode } from 'react';
import { errorMessage, ValidationError } from '../api/errors';
import { PageHeader } from '../app/layout';
import { useToast } from '../app/toast';
import { useApi, useSession } from '../session/SessionProvider';
import { Alert, Badge, Button, Card, Input } from '../ui';
import { MIN_PASSWORD_LENGTH } from './auth/ResetPasswordPage';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15 }}>{children}</div>
    </div>
  );
}

export function AccountPage() {
  const { user } = useSession();
  return (
    <div>
      <PageHeader eyebrow="Signed in" title="My account" />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        <Card title="You">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Name">{user.name}</Field>
            <Field label="Email">{user.email}</Field>
            <Field label="Roles">
              <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                {user.roles.length ? user.roles.map(r => <Badge key={r.id} tone="brand">{r.name}</Badge>) : '—'}
              </span>
            </Field>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
              Roles are set by a manager on the Users screen. What each role can do is fixed in the system, not here.
            </p>
          </div>
        </Card>
        <ChangePasswordCard />
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const api = useApi();
  const { user } = useSession();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const tooShort = next.length < MIN_PASSWORD_LENGTH;
  const mismatch = confirm !== next;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!current || tooShort || mismatch) return;
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      await api.users.changePassword({ currentPassword: current, newPassword: next });
      setCurrent(''); setNext(''); setConfirm(''); setTouched(false);
      toast({ title: 'Password changed', message: 'Use the new one next time you sign in.' });
    } catch (err) {
      if (err instanceof ValidationError && Object.keys(err.fieldErrors).length) setFieldErrors(err.fieldErrors);
      else setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Change password">
      <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <input type="hidden" autoComplete="username" value={user.email} readOnly />
        <Input label="Current password" type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)}
          error={fieldErrors.currentPassword?.[0] ?? (touched && !current ? 'Enter your current password.' : undefined)} />
        <Input label="New password" type="password" autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          error={fieldErrors.newPassword?.[0] ?? (touched && tooShort ? `Use at least ${MIN_PASSWORD_LENGTH} characters.` : undefined)} />
        <Input label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)}
          error={touched && mismatch ? 'The passwords don’t match.' : undefined} />
        <div><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</Button></div>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
          You’ll stay signed in here and on any other device you’re using.
        </p>
      </form>
    </Card>
  );
}
