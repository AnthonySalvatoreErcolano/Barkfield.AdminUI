// A staff account's fields, shared by create and edit: name, email, the roles to hold (from the fixed
// set GET /api/roles returns), and the admin flag. The password appears only on create — after that a
// user changes their own from Account. Limits are the request models' own; the API is the authority.
//
// Values are strings so the edit form goes through the same re-read-and-reconcile save as every other
// form: roleIds is the sorted ids joined with commas, isAdmin is 'yes' or ''.
import type { FormEvent } from 'react';
import type { Role, UserDetail } from '../../api/ports';
import type { StaleNotice } from '../../app/useGuardedSave';
import { Alert, Badge, Button, Checkbox, Input, Switch } from '../../ui';

export type UserFormValues = { name: string; email: string; password: string; roleIds: string; isAdmin: string };

export const EMPTY_USER: UserFormValues = { name: '', email: '', password: '', roleIds: '', isAdmin: '' };

const LABELS: Record<keyof UserFormValues, string> = { name: 'Name', email: 'Email', password: 'Password', roleIds: 'Roles', isAdmin: 'Administrator' };

export const MIN_PASSWORD = 12;

export const roleIdsOf = (v: Pick<UserFormValues, 'roleIds'>) => (v.roleIds ? v.roleIds.split(',') : []);
const joinRoleIds = (ids: string[]) => [...new Set(ids)].sort().join(',');

export function toUserForm(u: UserDetail): UserFormValues {
  return { name: u.name, email: u.email, password: '', roleIds: joinRoleIds(u.roles.map(r => r.id)), isAdmin: u.isAdmin ? 'yes' : '' };
}

export function toUserRequest(v: UserFormValues) {
  return { name: v.name.trim(), email: v.email.trim(), roleIds: roleIdsOf(v), isAdmin: v.isAdmin === 'yes' };
}

export function validateUser(v: UserFormValues, mode: 'create' | 'edit'): Partial<Record<keyof UserFormValues, string>> {
  const errors: Partial<Record<keyof UserFormValues, string>> = {};
  if (!v.name.trim()) errors.name = 'Enter a name.';
  else if (v.name.trim().length > 200) errors.name = 'Keep this under 200 characters.';
  if (!v.email.trim()) errors.email = 'Enter an email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errors.email = 'That doesn’t look like an email address.';
  else if (v.email.trim().length > 256) errors.email = 'Keep this under 256 characters.';
  if (mode === 'create' && v.password.length < MIN_PASSWORD) errors.password = `At least ${MIN_PASSWORD} characters.`;
  if (mode === 'create' && v.password.length > 128) errors.password = 'Keep this under 128 characters.';
  // A user with no role can do nothing; the API refuses it.
  if (!v.roleIds) errors.roleIds = 'Choose at least one role.';
  return errors;
}

/** A password to read out or paste — no look-alike characters. */
export function suggestPassword() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const chars = [...bytes].map(b => alphabet[b % alphabet.length]).join('');
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}-${chars.slice(12)}`;
}

interface UserFormProps {
  mode: 'create' | 'edit';
  values: UserFormValues;
  onChange: (values: UserFormValues) => void;
  roles: Role[];
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  busy: boolean;
  errors: Partial<Record<keyof UserFormValues, string>>;
  serverErrors?: Record<string, string[]>;
  formError?: string | null;
  stale?: StaleNotice<UserFormValues> | null;
  /** Editing your own account: changes to your access are spelled out. */
  isSelf?: boolean;
}

export function UserForm({ mode, values, onChange, roles, onSubmit, onCancel, submitLabel, busy, errors, serverErrors = {}, formError, stale, isSelf }: UserFormProps) {
  const set = (key: keyof UserFormValues) => (e: { target: { value: string } }) => onChange({ ...values, [key]: e.target.value });
  const held = roleIdsOf(values);
  const toggleRole = (id: string, on: boolean) => onChange({ ...values, roleIds: joinRoleIds(on ? [...held, id] : held.filter(x => x !== id)) });
  const roleName = (id: string) => roles.find(r => r.id === id)?.name ?? 'an unknown role';

  const hintFor = (key: keyof UserFormValues, fallback?: string) => {
    const yours = stale?.overwritten[key];
    if (yours !== undefined) return `Just changed by someone else. You had: “${key === 'roleIds' ? roleIdsOf({ roleIds: yours }).map(roleName).join(', ') || 'none' : yours || '(blank)'}”`;
    return stale?.changedByOthers.includes(key) ? 'Just changed by someone else.' : fallback;
  };
  const describe = (key: keyof UserFormValues) =>
    key === 'roleIds' ? held.map(roleName).join(', ') || 'none' : key === 'isAdmin' ? (values.isAdmin ? 'on' : 'off') : `“${values[key] || '(blank)'}”`;

  const submit = (e: FormEvent) => { e.preventDefault(); onSubmit(); };
  const roleError = serverErrors.roleIds?.[0] ?? errors.roleIds;

  return (
    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {stale ? (
        <Alert tone="warning" title="This user changed while you were editing">
          {stale.message}
          {stale.changedByOthers.length ? (
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {stale.changedByOthers.map(k => <li key={k}>{LABELS[k]} is now {describe(k)}</li>)}
            </ul>
          ) : null}
        </Alert>
      ) : null}
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Input label="Name" value={values.name} onChange={set('name')} autoComplete="off" error={serverErrors.name?.[0] ?? errors.name} hint={hintFor('name')} />
        <Input label="Email" type="email" value={values.email} onChange={set('email')} autoComplete="off"
          error={serverErrors.email?.[0] ?? errors.email} hint={hintFor('email', 'They sign in with this.')} />
      </div>
      {mode === 'create' ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Input label="Password" value={values.password} onChange={set('password')} autoComplete="new-password" style={{ flex: 1 }}
            error={serverErrors.password?.[0] ?? errors.password}
            hint={`At least ${MIN_PASSWORD} characters. No email goes out — give it to them yourself; they can change it under Account.`} />
          <Button variant="secondary" style={{ marginTop: 26 }} onClick={() => onChange({ ...values, password: suggestPassword() })}>Suggest one</Button>
        </div>
      ) : null}

      <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Styled as the inputs' labels above it (their CSS is already on the page). */}
        <legend className="br-field__label" style={{ padding: 0, marginBottom: 4 }}>Roles</legend>
        <p style={{ margin: '0 0 4px', fontSize: 13.5, color: 'var(--text-muted)' }}>
          {hintFor('roleIds') ?? 'What each role allows is set in the database. Built-in roles are relied on by the app.'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {roles.map(r => (
            <Checkbox key={r.id} checked={held.includes(r.id)} onChange={on => toggleRole(r.id, on)}
              label={<span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>{r.name}{r.isSystemRole ? <Badge tone="neutral">Built in</Badge> : null}</span>}
              description={r.description || undefined} />
          ))}
        </div>
        {roleError ? <div role="alert" style={{ color: 'var(--status-danger-fg)', fontSize: 13.5 }}>{roleError}</div> : null}
      </fieldset>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Switch label="Administrator" checked={values.isAdmin === 'yes'} onChange={on => onChange({ ...values, isAdmin: on ? 'yes' : '' })} />
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
          {hintFor('isAdmin') ?? 'Bypasses every permission check, whatever their roles say. Kept separate from roles on purpose — give it sparingly.'}
        </p>
      </div>

      {isSelf ? (
        <Alert tone="warning" title="This is your own account">
          If you take away your own administrator flag or the role that lets you manage users, you won’t be able to undo it — another administrator would have to.
        </Alert>
      ) : null}

      <div style={{ display: 'flex', gap: 10 }}>
        <Button type="submit" disabled={busy}>{busy ? 'Saving…' : submitLabel}</Button>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button>
      </div>
    </form>
  );
}
