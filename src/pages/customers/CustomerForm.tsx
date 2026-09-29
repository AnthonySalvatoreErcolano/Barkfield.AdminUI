// The customer's contact and address fields, shared by create and edit. Lengths are the spec's own
// maxLength values, checked here only to save a round trip — the API is the authority.
import type { FormEvent, ReactNode } from 'react';
import type { CustomerDetail, UpdateCustomer } from '../../api/ports';
import type { StaleNotice } from '../../app/useGuardedSave';
import { formatPhone } from '../../lib/format';
import { Alert, Button, Input, Textarea } from '../../ui';

export type CustomerFormValues = {
  firstName: string; lastName: string; email: string; phoneNumber: string;
  street: string; city: string; state: string; zipCode: string; notes: string;
};

export const EMPTY_CUSTOMER: CustomerFormValues = {
  firstName: '', lastName: '', email: '', phoneNumber: '', street: '', city: '', state: 'NY', zipCode: '', notes: '',
};

const LABELS: Record<keyof CustomerFormValues, string> = {
  firstName: 'First name', lastName: 'Last name', email: 'Email', phoneNumber: 'Phone',
  street: 'Street', city: 'Town', state: 'State', zipCode: 'ZIP', notes: 'Notes',
};

const MAX: Partial<Record<keyof CustomerFormValues, number>> = {
  firstName: 100, lastName: 100, email: 256, phoneNumber: 20, street: 200, city: 100, state: 50, zipCode: 20,
};

export function toCustomerForm(c: CustomerDetail): CustomerFormValues {
  return {
    firstName: c.firstName, lastName: c.lastName, email: c.email, phoneNumber: c.phoneNumber ?? '',
    street: c.street ?? '', city: c.city ?? '', state: c.state ?? '', zipCode: c.zipCode ?? '', notes: c.notes ?? '',
  };
}

const orNull = (s: string) => (s.trim() ? s.trim() : null);

export function toCustomerRequest(v: CustomerFormValues): UpdateCustomer {
  return {
    firstName: v.firstName.trim(), lastName: v.lastName.trim(), email: v.email.trim(),
    phoneNumber: orNull(v.phoneNumber), notes: orNull(v.notes),
    street: orNull(v.street), city: orNull(v.city), state: orNull(v.state), zipCode: orNull(v.zipCode),
  };
}

export function validateCustomer(v: CustomerFormValues): Partial<Record<keyof CustomerFormValues, string>> {
  const errors: Partial<Record<keyof CustomerFormValues, string>> = {};
  if (!v.firstName.trim()) errors.firstName = 'Enter a first name.';
  if (!v.lastName.trim()) errors.lastName = 'Enter a last name.';
  if (!v.email.trim()) errors.email = 'Enter an email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errors.email = 'That doesn’t look like an email address.';
  for (const [key, max] of Object.entries(MAX) as Array<[keyof CustomerFormValues, number]>) {
    if (v[key].trim().length > max) errors[key] ??= `Keep this under ${max} characters.`;
  }
  // Half an address is worse than none: it cannot be geocoded, so it cannot be routed.
  const hasSome = [v.street, v.city, v.zipCode].some(s => s.trim());
  if (hasSome && !v.street.trim()) errors.street ??= 'A delivery address needs a street.';
  if (hasSome && !v.city.trim()) errors.city ??= 'A delivery address needs a town.';
  return errors;
}

interface CustomerFormProps {
  values: CustomerFormValues;
  onChange: (values: CustomerFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  busy: boolean;
  /** Client-side errors, shown once the user has tried to submit. */
  errors: Partial<Record<keyof CustomerFormValues, string>>;
  /** Field errors from the API's model validation. */
  serverErrors?: Record<string, string[]>;
  formError?: string | null;
  stale?: StaleNotice<CustomerFormValues> | null;
  /** Shown above the fields — e.g. which Square profile this will link to. */
  intro?: ReactNode;
}

export function CustomerForm({ values, onChange, onSubmit, onCancel, submitLabel, busy, errors, serverErrors = {}, formError, stale, intro }: CustomerFormProps) {
  const set = (key: keyof CustomerFormValues) => (e: { target: { value: string } }) => onChange({ ...values, [key]: e.target.value });

  const field = (key: keyof CustomerFormValues, extra: { type?: string; autoComplete?: string; hint?: string } = {}) => {
    const changed = stale?.changedByOthers.includes(key);
    const yours = stale?.overwritten[key];
    const hint = yours !== undefined
      ? `Just changed by someone else. You had: “${yours || '(blank)'}”`
      : changed ? 'Just changed by someone else.' : extra.hint;
    return (
      <Input label={LABELS[key]} type={extra.type} autoComplete={extra.autoComplete} value={values[key]} onChange={set(key)}
        error={serverErrors[key]?.[0] ?? errors[key]} hint={hint} />
    );
  };

  const submit = (e: FormEvent) => { e.preventDefault(); onSubmit(); };

  return (
    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {intro}
      {stale ? (
        <Alert tone="warning" title="This customer changed while you were editing">
          {stale.message}
          {stale.changedByOthers.length ? (
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {stale.changedByOthers.map(k => (
                <li key={k}>{LABELS[k]} is now “{k === 'phoneNumber' ? formatPhone(values[k]) : values[k] || '(blank)'}”</li>
              ))}
            </ul>
          ) : null}
        </Alert>
      ) : null}
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {field('firstName', { autoComplete: 'off' })}
        {field('lastName', { autoComplete: 'off' })}
        {field('email', { type: 'email', autoComplete: 'off' })}
        {field('phoneNumber', { type: 'tel', autoComplete: 'off' })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr .6fr .8fr', gap: 16 }}>
        {field('street', { autoComplete: 'off', hint: 'Deliveries go here. Leave blank for pickup-only customers.' })}
        {field('city', { autoComplete: 'off' })}
        {field('state', { autoComplete: 'off' })}
        {field('zipCode', { autoComplete: 'off' })}
      </div>
      <Textarea label={LABELS.notes} rows={3} value={values.notes} onChange={set('notes')}
        hint="For staff. Driver instructions go in delivery details, not here." error={serverErrors.notes?.[0]} />
      <div style={{ display: 'flex', gap: 10 }}>
        <Button type="submit" disabled={busy}>{busy ? 'Saving…' : submitLabel}</Button>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button>
      </div>
    </form>
  );
}
