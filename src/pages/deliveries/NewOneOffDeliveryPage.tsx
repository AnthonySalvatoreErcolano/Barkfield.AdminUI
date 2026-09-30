// One-off delivery (PAGES.md §6): a delivery with no subscription behind it, for a customer who is in
// the system but not on that day's run.
import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { errorMessage } from '../../api/errors';
import { FulfillmentMethod } from '../../api/generated/enums';
import type { CustomerListItem, Product } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { ProductPicker } from '../../app/ProductPicker';
import { FULFILLMENT_LABEL } from '../../app/statusBadges';
import { useToast } from '../../app/toast';
import { addDays, todayIso, toApiDay } from '../../lib/dates';
import { formatMoney } from '../../lib/format';
import { useApi } from '../../session/SessionProvider';
import { Alert, Breadcrumbs, Button, Card, IconButton, Input, Select, Textarea } from '../../ui';
import { cx, injectStyles } from '../../ui/injectStyles';
import { customerKeys } from '../customers/keys';
import { deliveryKeys } from './keys';

const CSS = [
'.pick{border:1px solid var(--border-default);border-radius:var(--radius-md);max-height:220px;overflow-y:auto}',
'.pick__row{display:flex;justify-content:space-between;gap:12px;width:100%;padding:9px 12px;border:0;border-bottom:1px solid var(--border-subtle);background:transparent;font:inherit;font-size:14.5px;text-align:left;cursor:pointer}',
'.pick__row:last-child{border-bottom:0}.pick__row:hover{background:var(--surface-hover)}.pick__row--on{background:var(--surface-selected)}',
].join('');

interface Line { product: Product; quantity: number }

export function NewOneOffDeliveryPage() {
  injectStyles('oneoff', CSS);
  const api = useApi();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState<CustomerListItem | null>(null);
  const [date, setDate] = useState(addDays(todayIso(), 1));
  const [method, setMethod] = useState<number>(FulfillmentMethod.LocalDelivery);
  const [lines, setLines] = useState<Line[]>([]);
  const [picking, setPicking] = useState<Product | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customers = useQuery({
    queryKey: customerKeys.list({ searchTerm: search || undefined, pageSize: 8 }),
    queryFn: ({ signal }) => api.customers.list({ searchTerm: search.trim() || undefined, pageSize: 8 }, signal),
    enabled: !customer,
  });
  // Preselect from ?customerId= (e.g. arriving from a customer record).
  const preset = params.get('customerId');
  const presetQuery = useQuery({
    queryKey: customerKeys.detail(preset ?? ''),
    queryFn: () => api.customers.get(preset!),
    enabled: !!preset && !customer,
  });
  if (preset && !customer && presetQuery.data) {
    const c = presetQuery.data;
    setCustomer({ id: c.id, firstName: c.firstName, lastName: c.lastName, fullName: c.fullName, email: c.email, phoneNumber: c.phoneNumber, city: c.city,
      squareCustomerId: c.squareCustomerId, isSyncedToSquare: c.isSyncedToSquare, isActive: c.isActive, createdAt: c.createdAt, petCount: c.pets.length, activeSubscriptionCount: 0 });
  }

  const addLine = () => {
    if (!picking) return;
    setLines(ls => ls.some(l => l.product.id === picking.id)
      ? ls.map(l => l.product.id === picking.id ? { ...l, quantity: l.quantity + 1 } : l)
      : [...ls, { product: picking, quantity: 1 }]);
    setPicking(null);
  };

  const needsAddress = method === FulfillmentMethod.LocalDelivery && customer && !customer.city;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customer) { setError('Choose the customer.'); return; }
    if (!lines.length) { setError('Add at least one product — a delivery can’t be scheduled empty.'); return; }
    if (lines.some(l => !Number.isInteger(l.quantity) || l.quantity < 1)) { setError('Every quantity must be at least 1.'); return; }
    setBusy(true);
    setError(null);
    try {
      await api.deliveries.createOneOff({
        customerId: customer.id, scheduledFor: toApiDay(date), fulfillmentMethod: method as FulfillmentMethod,
        lines: lines.map(l => ({ productId: l.product.id, quantity: l.quantity })), notes: notes.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      toast({ title: 'One-off delivery scheduled', message: `${customer.fullName} on ${date}.` });
      navigate(`/deliveries?from=${date}&to=${date}&oneoff=1`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const total = lines.reduce((s, l) => s + l.product.price * l.quantity, 0);

  return (
    <div>
      <PageHeader title="One-off delivery">
        <Breadcrumbs style={{ marginBottom: 14 }} onNavigate={navigate} items={[{ label: 'Deliveries', href: '/deliveries' }, { label: 'One-off delivery' }]} />
      </PageHeader>
      <form onSubmit={submit} noValidate style={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card title="Who and when">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {customer ? (
              <Alert tone="info" action={<Button size="sm" variant="ghost" onClick={() => setCustomer(null)}>Change</Button>}>
                For <strong>{customer.fullName}</strong>{customer.city ? ` in ${customer.city}` : ' — no address on file'}.
              </Alert>
            ) : (
              <div>
                <Input label="Customer" iconLeft="search" placeholder="Search by name, email or phone" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
                <div className="pick" role="listbox" aria-label="Customer results" style={{ marginTop: 8 }}>
                  {(customers.data?.items ?? []).map(c => (
                    <button key={c.id} type="button" role="option" aria-selected={false} className={cx('pick__row')} onClick={() => setCustomer(c)}>
                      <span><strong>{c.fullName}</strong> <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.email}</span></span>
                      <span style={{ color: 'var(--text-muted)' }}>{c.city ?? 'No address'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input type="date" label="Delivery day" min={todayIso()} value={date} onChange={e => setDate(e.target.value)} />
              <Select label="Method" value={String(method)} onChange={e => setMethod(Number(e.target.value))}
                options={Object.entries(FULFILLMENT_LABEL).map(([value, label]) => ({ value, label }))} />
            </div>
            {needsAddress ? <Alert tone="warning">{customer!.fullName} has no address on file, so this can’t be a local delivery. Add an address to their record, or choose pickup.</Alert> : null}
          </div>
        </Card>

        <Card title="What’s going" flush>
          <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
            <ProductPicker value={picking} onChange={setPicking} />
            <Button variant="secondary" iconLeft="plus" disabled={!picking} onClick={addLine}>Add</Button>
          </div>
          {lines.length ? (
            <table className="br-table br-table--compact" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <tbody>
                {lines.map(l => (
                  <tr key={l.product.id}>
                    <td style={{ paddingLeft: 20 }}>{l.product.name}</td>
                    <td style={{ width: 110 }}>
                      <Input size="sm" type="number" min={1} aria-label={`Quantity of ${l.product.name}`} value={String(l.quantity)}
                        onChange={e => setLines(ls => ls.map(x => x.product.id === l.product.id ? { ...x, quantity: Number(e.target.value) } : x))} />
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatMoney(l.product.price * (l.quantity || 0))}</td>
                    <td style={{ width: 48, paddingRight: 20 }}>
                      <IconButton icon="trash-2" size="sm" label={`Remove ${l.product.name}`} onClick={() => setLines(ls => ls.filter(x => x.product.id !== l.product.id))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{ margin: 0, padding: '0 20px 16px', color: 'var(--text-muted)' }}>Nothing added yet.</p>}
          {lines.length ? <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', textAlign: 'right' }}>Estimated <strong>{formatMoney(total)}</strong> — Square prices it when charged.</div> : null}
        </Card>

        <Card title="Notes">
          <Textarea label="Notes (optional)" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </Card>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div style={{ display: 'flex', gap: 10 }}>
          <Button type="submit" disabled={busy || !!needsAddress}>{busy ? 'Scheduling…' : 'Schedule delivery'}</Button>
          <Button variant="ghost" onClick={() => navigate('/deliveries')} disabled={busy}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
