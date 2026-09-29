// New customer, in two steps. First look for them — in our own list and in Square's directory — so staff
// link an existing Square profile (with its card on file) instead of creating a duplicate. Then the form.
import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { errorMessage, ValidationError } from '../../api/errors';
import type { CustomerListItem, SquareCandidate } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { useToast } from '../../app/toast';
import { formatPhone } from '../../lib/format';
import { useApi } from '../../session/SessionProvider';
import { Alert, Breadcrumbs, Button, Card, Input, Radio } from '../../ui';
import { CustomerForm, EMPTY_CUSTOMER, toCustomerRequest, validateCustomer, type CustomerFormValues } from './CustomerForm';
import type { CustomerDetailState } from './CustomerDetailPage';
import { customerKeys } from './keys';

const NEW_PROFILE = 'new';

interface Found {
  existing: CustomerListItem | null;
  square: SquareCandidate[];
}

export function NewCustomerPage() {
  const navigate = useNavigate();
  const [found, setFound] = useState<(Found & { email: string; phone: string }) | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="New customer">
        <Breadcrumbs style={{ marginBottom: 14 }} onNavigate={navigate} items={[{ label: 'Customers', href: '/customers' }, { label: 'New customer' }]} />
      </PageHeader>
      <div style={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FindStep onFound={f => { setFound(f); setPicked(f.square.length ? null : NEW_PROFILE); }} locked={picked !== null && !!found} onReset={() => { setFound(null); setPicked(null); }} />
        {found && !found.existing && picked === null ? (
          <PickSquareStep candidates={found.square} onPick={setPicked} />
        ) : null}
        {found && !found.existing && picked !== null ? (
          <DetailsStep
            key={picked}
            squareProfile={found.square.find(s => s.squareCustomerId === picked) ?? null}
            email={found.email}
            phone={found.phone}
            onBack={found.square.length ? () => setPicked(null) : undefined}
          />
        ) : null}
      </div>
    </div>
  );
}

function FindStep({ onFound, locked, onReset }: { onFound: (f: Found & { email: string; phone: string }) => void; locked: boolean; onReset: () => void }) {
  const api = useApi();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<CustomerListItem | null>(null);

  const search = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    setExisting(null);
    try {
      const [ours, square] = await Promise.all([
        api.customers.list({ Email: email.trim(), IncludeInactive: true, PageSize: 1 }),
        api.customers.searchSquare({ email: email.trim(), phoneNumber: phone.trim() || null }),
      ]);
      const match = ours.items[0] ?? null;
      setExisting(match);
      onFound({ existing: match, square, email: email.trim(), phone: phone.trim() });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card eyebrow="Step 1" title="Look them up first">
      <form onSubmit={search} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          Many auto-ship customers already shop in the store. Checking Square first links their existing profile — and the card they have on file — instead of making a duplicate.
        </p>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <Input label="Email" type="email" value={email} onChange={e => { setEmail(e.target.value); onReset(); }} disabled={locked} autoFocus />
          <Input label="Phone (optional)" type="tel" value={phone} onChange={e => { setPhone(e.target.value); onReset(); }} disabled={locked} />
          {locked
            ? <Button variant="secondary" onClick={onReset}>Change</Button>
            : <Button type="submit" iconLeft="search" disabled={busy || !email.trim()}>{busy ? 'Searching…' : 'Search'}</Button>}
        </div>
        {existing ? (
          <Alert tone="warning" title={existing.isActive ? 'Already a customer' : 'An archived customer uses this email'}
            action={<Link to={`/customers/${existing.id}`}>Open {existing.fullName ?? existing.firstName}</Link>}>
            {existing.isActive
              ? `${existing.fullName} already has this email. Open their record instead of adding them again.`
              : `${existing.fullName} was archived. Restore them rather than creating a duplicate — their history comes back with them.`}
          </Alert>
        ) : null}
      </form>
    </Card>
  );
}

function PickSquareStep({ candidates, onPick }: { candidates: SquareCandidate[]; onPick: (id: string) => void }) {
  const [choice, setChoice] = useState<string>(candidates.length === 1 ? candidates[0]!.squareCustomerId : '');
  return (
    <Card eyebrow="Step 2" title={candidates.length === 1 ? 'Found in Square' : `${candidates.length} matches in Square`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {candidates.map(c => (
          <Radio key={c.squareCustomerId} name="square" value={c.squareCustomerId} checked={choice === c.squareCustomerId} onChange={setChoice}
            label={`${c.firstName} ${c.lastName}`}
            description={[c.email, c.phoneNumber ? formatPhone(c.phoneNumber) : null, `Square ID ${c.squareCustomerId}`].filter(Boolean).join(' · ')} />
        ))}
        <Radio name="square" value={NEW_PROFILE} checked={choice === NEW_PROFILE} onChange={setChoice}
          label="None of these — create a new Square profile" description="Only if you’re sure they aren’t already in Square." />
        <div><Button disabled={!choice} onClick={() => onPick(choice)}>Continue</Button></div>
      </div>
    </Card>
  );
}

function DetailsStep({ squareProfile, email, phone, onBack }: { squareProfile: SquareCandidate | null; email: string; phone: string; onBack?: () => void }) {
  const api = useApi();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<CustomerFormValues>({
    ...EMPTY_CUSTOMER,
    email: squareProfile?.email ?? email,
    phoneNumber: squareProfile?.phoneNumber ?? phone,
    firstName: squareProfile?.firstName ?? '',
    lastName: squareProfile?.lastName ?? '',
  });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const onSubmit = async () => {
    setTried(true);
    if (Object.keys(validateCustomer(values)).length) return;
    setBusy(true);
    setFormError(null);
    setServerErrors({});
    try {
      const result = await api.customers.create({ ...toCustomerRequest(values), squareCustomerId: squareProfile?.squareCustomerId ?? null });
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      if (result.squareSynced) toast({ title: 'Customer added', message: squareProfile ? 'Linked to their Square profile.' : 'A Square profile was created for them.' });
      navigate(`/customers/${result.customerId}`, { replace: true, state: result.squareSynced ? undefined : { squareError: result.squareError } satisfies CustomerDetailState });
    } catch (err) {
      if (err instanceof ValidationError && Object.keys(err.fieldErrors).length) setServerErrors(err.fieldErrors);
      else setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card eyebrow={onBack ? 'Step 3' : 'Step 2'} title="Their details">
      <CustomerForm
        values={values} onChange={setValues} onSubmit={onSubmit} onCancel={() => navigate('/customers')}
        submitLabel="Add customer" busy={busy} errors={tried ? validateCustomer(values) : {}} serverErrors={serverErrors} formError={formError}
        intro={
          <Alert tone="info" action={onBack ? <Button size="sm" variant="ghost" onClick={onBack}>Change</Button> : undefined}>
            {squareProfile
              ? <>Will link to Square profile <strong>{squareProfile.squareCustomerId}</strong> ({squareProfile.firstName} {squareProfile.lastName}).</>
              : 'Nothing matched in Square, so a new Square profile will be created when you save.'}
          </Alert>
        }
      />
    </Card>
  );
}
