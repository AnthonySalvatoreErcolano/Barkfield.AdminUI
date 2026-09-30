// New subscription (PAGES.md §5). It starts as a new sign-up: add what goes in the box, then activate it.
import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { errorMessage, ValidationError } from '../../api/errors';
import { FrequencyUnit, FulfillmentMethod } from '../../api/generated/enums';
import type { CustomerListItem } from '../../api/ports';
import { describeFrequency, FrequencyField, frequencyError, type FrequencyValue } from '../../app/FrequencyField';
import { PageHeader } from '../../app/layout';
import { FULFILLMENT_LABEL } from '../../app/statusBadges';
import { useToast } from '../../app/toast';
import { addDays, todayIso, toApiDay } from '../../lib/dates';
import { useApi } from '../../session/SessionProvider';
import { Alert, Breadcrumbs, Button, Card, Input, Select } from '../../ui';
import { cx, injectStyles } from '../../ui/injectStyles';
import { customerKeys } from '../customers/keys';
import { subscriptionKeys } from './keys';

const CSS = [
'.pick{border:1px solid var(--border-default);border-radius:var(--radius-md);max-height:220px;overflow-y:auto}',
'.pick__row{display:flex;justify-content:space-between;gap:12px;width:100%;padding:9px 12px;border:0;border-bottom:1px solid var(--border-subtle);background:transparent;font:inherit;font-size:14.5px;text-align:left;cursor:pointer}',
'.pick__row:last-child{border-bottom:0}.pick__row:hover{background:var(--surface-hover)}',
].join('');

export function NewSubscriptionPage() {
  injectStyles('oneoff', CSS);
  const api = useApi();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const presetId = params.get('customerId');
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<Pick<CustomerListItem, 'id' | 'fullName' | 'city'> | null>(null);
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<FrequencyValue>({ interval: '4', unit: FrequencyUnit.Weeks });
  const [first, setFirst] = useState(addDays(todayIso(), 7));
  const [method, setMethod] = useState<number>(FulfillmentMethod.LocalDelivery);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const preset = useQuery({ queryKey: customerKeys.detail(presetId ?? ''), queryFn: () => api.customers.get(presetId!), enabled: !!presetId });
  const customer = picked ?? (preset.data ? { id: preset.data.id, fullName: preset.data.fullName, city: preset.data.city } : null);
  const customers = useQuery({
    queryKey: customerKeys.list({ searchTerm: search || undefined, pageSize: 8 }),
    queryFn: ({ signal }) => api.customers.list({ searchTerm: search.trim() || undefined, pageSize: 8 }, signal),
    enabled: !customer,
  });

  const errors = {
    customer: !customer ? 'Choose the customer.' : undefined,
    frequency: frequencyError(frequency),
    first: !first ? 'Choose the first delivery day.' : first < todayIso() ? 'The first delivery can’t be in the past.' : undefined,
    name: name.trim().length > 100 ? 'Keep the name under 100 characters.' : undefined,
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (Object.values(errors).some(Boolean) || !customer) return;
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      const id = await api.subscriptions.create({
        customerId: customer.id, name: name.trim() || null, frequencyInterval: Number(frequency.interval),
        frequencyUnit: frequency.unit as FrequencyUnit, firstDeliveryDate: toApiDay(first), fulfillmentMethod: method as FulfillmentMethod,
      });
      await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast({ title: 'Subscription created', message: 'Add what goes in the box, then activate it.' });
      navigate(`/subscriptions/${id}`, { replace: true });
    } catch (err) {
      if (err instanceof ValidationError && Object.keys(err.fieldErrors).length) setFieldErrors(err.fieldErrors);
      else setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="New subscription">
        <Breadcrumbs style={{ marginBottom: 14 }} onNavigate={navigate} items={[{ label: 'Subscriptions', href: '/subscriptions' }, { label: 'New subscription' }]} />
      </PageHeader>
      <form onSubmit={submit} noValidate style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card title="Who">
          {customer ? (
            <Alert tone="info" action={<Button size="sm" variant="ghost" onClick={() => { setPicked(null); setSearch(''); if (presetId) navigate('/subscriptions/new', { replace: true }); }}>Change</Button>}>
              For <strong>{customer.fullName}</strong>{customer.city ? ` in ${customer.city}` : ' — no address on file, so pickup or shipping only'}.
            </Alert>
          ) : (
            <div>
              <Input label="Customer" iconLeft="search" placeholder="Search by name, email or phone" value={search} onChange={e => setSearch(e.target.value)}
                autoFocus error={tried ? errors.customer : undefined} />
              <div className="pick" role="listbox" aria-label="Customer results" style={{ marginTop: 8 }}>
                {(customers.data?.items ?? []).map(c => (
                  <button key={c.id} type="button" role="option" aria-selected={false} className={cx('pick__row')} onClick={() => setPicked(c)}>
                    <span><strong>{c.fullName}</strong> <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.email}</span></span>
                    <span style={{ color: 'var(--text-muted)' }}>{c.city ?? 'No address'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
        <Card title="How often, and from when">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FrequencyField value={frequency} onChange={setFrequency} error={tried ? errors.frequency ?? fieldErrors.frequencyInterval?.[0] : undefined} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Input type="date" label="First delivery" min={todayIso()} value={first} onChange={e => setFirst(e.target.value)}
                error={tried ? errors.first : undefined} hint={!errors.frequency && first ? `Then ${describeFrequency(frequency)}.` : undefined} />
              <Select label="Method" value={String(method)} onChange={e => setMethod(Number(e.target.value))}
                options={Object.entries(FULFILLMENT_LABEL).map(([value, label]) => ({ value, label }))} />
            </div>
            <Input label="Name (optional)" value={name} onChange={e => setName(e.target.value)} maxLength={100}
              hint={`Worth it when a customer has more than one — otherwise it shows as “${describeFrequency(frequency)}”.`} error={tried ? errors.name : fieldErrors.name?.[0]} />
          </div>
        </Card>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div style={{ display: 'flex', gap: 10 }}>
          <Button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create subscription'}</Button>
          <Button variant="ghost" onClick={() => navigate(-1)} disabled={busy}>Cancel</Button>
        </div>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>It starts as a new sign-up. Nothing ships until you’ve added products and activated it.</p>
      </form>
    </div>
  );
}
