// Billing dialogs: choosing a delivery's discounts, and confirming a day's charge run.
import { useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { errorMessage } from '../../api/errors';
import type { DeliveryListItem, SquareDiscount } from '../../api/ports';
import { formatDay, formatMoney, plural } from '../../lib/format';
import { useApi } from '../../session/SessionProvider';
import { Alert, Button, Checkbox, Dialog } from '../../ui';
import { deliveryKeys } from '../deliveries/keys';
import { billingKeys } from './keys';

/** How Square describes a discount. A label for choosing — never used in a calculation. */
export function discountLabel(d: Pick<SquareDiscount, 'name' | 'percentage' | 'amount'>) {
  if (d.percentage != null) return `${d.name} — ${d.percentage}% off`;
  if (d.amount != null) return `${d.name} — ${formatMoney(d.amount)} off`;
  return d.name;
}

export function DiscountsDialog({ delivery, onClose, onSaved }: { delivery: DeliveryListItem; onClose: () => void; onSaved: () => void }) {
  const api = useApi();
  const catalog = useQuery({ queryKey: billingKeys.discounts, queryFn: () => api.billing.discounts(), staleTime: 5 * 60_000 });
  const current = useQuery({ queryKey: deliveryKeys.detail(delivery.id), queryFn: () => api.deliveries.get(delivery.id) });
  const [chosen, setChosen] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = chosen ?? current.data?.discounts.map(d => d.squareDiscountId) ?? [];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.billing.selectDiscounts(delivery.id, selected);
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open size="md" onClose={busy ? undefined : onClose} title="Discounts"
      description={`For ${delivery.customerName}’s ${formatDay(delivery.scheduledFor)} delivery. Square applies them and works out the total when it charges.`}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="discounts" disabled={busy || !catalog.data || !current.data}>{busy ? 'Saving…' : 'Save'}</Button>
      </>}>
      <form id="discounts" onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {catalog.error ? <Alert tone="danger" title="Couldn’t load Square’s discounts">{errorMessage(catalog.error)}</Alert> : null}
        {!catalog.data || !current.data ? <p style={{ margin: 0, color: 'var(--text-muted)' }}>Loading…</p>
          : catalog.data.length === 0 ? <Alert tone="info">Square has no discounts set up.</Alert>
          : catalog.data.map(d => (
            <Checkbox key={d.id} label={discountLabel(d)} checked={selected.includes(d.id)}
              onChange={on => setChosen(on ? [...selected, d.id] : selected.filter(x => x !== d.id))} />
          ))}
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
          The estimate here won’t change — Square’s charge is the real figure, and it’s shown once they’re charged.
        </p>
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </form>
    </Dialog>
  );
}

export function ConfirmChargeDialog({ date, ready, onConfirm, onClose }: { date: string; ready: DeliveryListItem[]; onConfirm: () => void; onClose: () => void }) {
  return (
    <Dialog open size="sm" onClose={onClose} title={`Charge ${plural(ready.length, 'delivery', 'deliveries')}?`}
      description={`Every ready, unpaid delivery for ${formatDay(date, 'long')} is charged to the card on file in Square. These are real payments.`}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm}>Charge {plural(ready.length, 'delivery', 'deliveries')}</Button>
      </>}>
      <Alert tone="info">
        A declined card doesn’t stop the rest — you’ll get one list back of who to ring. Keep this page open until it finishes.
      </Alert>
    </Dialog>
  );
}
