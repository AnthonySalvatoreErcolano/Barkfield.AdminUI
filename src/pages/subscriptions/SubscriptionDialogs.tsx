// Dialogs for the subscription screen. Each runs one write through the page's serial writer.
import { useState } from 'react';
import { FulfillmentMethod } from '../../api/generated/enums';
import type { Product, SubscriptionDetail } from '../../api/ports';
import { describeFrequency, FrequencyField, frequencyError, type FrequencyValue } from '../../app/FrequencyField';
import { ProductPicker } from '../../app/ProductPicker';
import { FULFILLMENT_LABEL } from '../../app/statusBadges';
import type { WriteOutcome } from '../../app/useSerialWrites';
import { WriteDialog } from '../../app/WriteDialog';
import { addDays, dayOf, todayIso } from '../../lib/dates';
import { formatDay } from '../../lib/format';
import { useApi } from '../../session/SessionProvider';
import { Alert, Checkbox, Input, Radio, Select } from '../../ui';

type Run = (write: () => Promise<void>, success?: { title: string; message?: string }) => Promise<WriteOutcome>;
interface Props { sub: SubscriptionDetail; run: Run; onClose: () => void }

export function FrequencyDialog({ sub, run, onClose }: Props) {
  const api = useApi();
  const [value, setValue] = useState<FrequencyValue>({ interval: String(sub.frequencyInterval), unit: sub.frequencyUnit });
  const [recalc, setRecalc] = useState(true);
  const [tried, setTried] = useState(false);
  const error = frequencyError(value);
  return (
    <WriteDialog title="How often it ships" submitLabel="Save" onClose={onClose}
      onSubmit={async () => {
        setTried(true);
        if (error) return 'invalid';
        return run(() => api.subscriptions.changeFrequency(sub.id, { frequencyInterval: Number(value.interval), frequencyUnit: value.unit as SubscriptionDetail['frequencyUnit'], recalculateNextDelivery: recalc }),
          { title: 'Frequency changed', message: `Now ${describeFrequency(value)}.` });
      }}>
      <FrequencyField value={value} onChange={setValue} error={tried ? error : undefined} />
      <Checkbox checked={recalc} onChange={setRecalc} label="Move the next delivery to fit"
        description={`Counted from ${sub.lastDeliveryDate ? `the last delivery (${formatDay(sub.lastDeliveryDate)})` : 'today'}. Leave unticked to keep ${formatDay(sub.nextDeliveryDate)}.`} />
    </WriteDialog>
  );
}

export function RescheduleDialog({ sub, run, onClose }: Props) {
  const api = useApi();
  const [date, setDate] = useState(dayOf(sub.nextDeliveryDate) < todayIso() ? todayIso() : dayOf(sub.nextDeliveryDate));
  const [tried, setTried] = useState(false);
  const error = !date ? 'Choose a day.' : date < todayIso() ? 'The next delivery can’t be in the past.' : undefined;
  return (
    <WriteDialog title="Move the next delivery" size="sm" submitLabel="Move it" onClose={onClose}
      description="Only the next one moves. After that it carries on at its usual frequency from the new date."
      onSubmit={async () => { setTried(true); if (error) return 'invalid'; return run(() => api.subscriptions.reschedule(sub.id, date), { title: 'Next delivery moved', message: formatDay(date, 'long') }); }}>
      <Input type="date" label="Next delivery" min={todayIso()} value={date} onChange={e => setDate(e.target.value)} error={tried ? error : undefined} style={{ maxWidth: 220 }} />
    </WriteDialog>
  );
}

export function PauseDialog({ sub, run, onClose }: Props) {
  const api = useApi();
  const [kind, setKind] = useState<'date' | 'open'>('date');
  const [until, setUntil] = useState(addDays(todayIso(), 28));
  const [tried, setTried] = useState(false);
  const error = kind === 'date' && (!until || until <= todayIso()) ? 'A pause has to end on a future date.' : undefined;
  return (
    <WriteDialog title={`Pause ${sub.displayName ?? 'this subscription'}?`} submitLabel="Pause" onClose={onClose}
      description="Nothing ships while it’s paused."
      onSubmit={async () => {
        setTried(true);
        if (error) return 'invalid';
        return run(() => api.subscriptions.pause(sub.id, kind === 'date' ? until : null),
          { title: 'Paused', message: kind === 'date' ? `Resumes ${formatDay(until, 'long')}.` : 'Until someone resumes it.' });
      }}>
      <Radio name="pause" value="date" checked={kind === 'date'} onChange={() => setKind('date')} label="Until a date"
        description="It restarts on that date — the next delivery is that day." />
      {kind === 'date' ? <Input type="date" label="Resume on" min={addDays(todayIso(), 1)} value={until} onChange={e => setUntil(e.target.value)} error={tried ? error : undefined} style={{ marginLeft: 28, maxWidth: 220 }} /> : null}
      <Radio name="pause" value="open" checked={kind === 'open'} onChange={() => setKind('open')} label="Until someone resumes it"
        description="No end date. When it’s resumed, the next delivery is worked out from that day." />
    </WriteDialog>
  );
}

export function CancelDialog({ sub, run, onClose }: Props) {
  const api = useApi();
  return (
    <WriteDialog title="Cancel this subscription for good?" size="sm" submitLabel="Cancel permanently" danger onClose={onClose}
      description={`${sub.customerName}’s “${sub.displayName ?? 'subscription'}” stops, and it can’t be restarted.`}
      onSubmit={() => run(() => api.subscriptions.cancel(sub.id), { title: 'Subscription canceled' })}>
      <Alert tone="warning" title="This is permanent">
        If {sub.customerName.split(' ')[0]} comes back, they get a new subscription. To stop deliveries for a while, pause it instead.
      </Alert>
    </WriteDialog>
  );
}

export function RenameDialog({ sub, run, onClose }: Props) {
  const api = useApi();
  const [name, setName] = useState(sub.name ?? '');
  return (
    <WriteDialog title="Name" size="sm" submitLabel="Save" onClose={onClose}
      onSubmit={async () => name.trim().length > 100 ? 'invalid' : run(() => api.subscriptions.rename(sub.id, name.trim() || null), { title: 'Name saved' })}>
      <Input label="Name" value={name} onChange={e => setName(e.target.value)} maxLength={100} autoFocus
        hint={`Leave blank and it shows as “${sub.frequencyLabel}”.`} />
    </WriteDialog>
  );
}

export function MethodDialog({ sub, run, onClose }: Props) {
  const api = useApi();
  const [method, setMethod] = useState<number>(sub.fulfillmentMethod);
  return (
    <WriteDialog title="How it gets to them" size="sm" submitLabel="Save" onClose={onClose}
      onSubmit={() => run(() => api.subscriptions.changeFulfillment(sub.id, method as FulfillmentMethod), { title: 'Method changed', message: FULFILLMENT_LABEL[method] })}>
      <Select label="Method" value={String(method)} onChange={e => setMethod(Number(e.target.value))}
        options={Object.entries(FULFILLMENT_LABEL).map(([value, label]) => ({ value, label }))} />
      {method === FulfillmentMethod.LocalDelivery ? <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>Local delivery needs an address on the customer’s record, or generation skips it.</p> : null}
    </WriteDialog>
  );
}

/** Pick a product and a quantity (and, for an add-on, a note). */
export function AddProductDialog({ title, description, withNote, onSubmit, onClose }: {
  title: string;
  description?: string;
  withNote?: boolean;
  onSubmit: (product: Product, quantity: number, note: string | null) => Promise<WriteOutcome>;
  onClose: () => void;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const q = Number(quantity);
  const qtyError = !Number.isInteger(q) || q < 1 ? 'At least 1.' : undefined;
  return (
    <WriteDialog title={title} description={description} submitLabel="Add" onClose={onClose} disabled={!product}
      onSubmit={async () => { setTried(true); if (!product || qtyError) return 'invalid'; return onSubmit(product, q, note.trim() || null); }}>
      <ProductPicker value={product} onChange={setProduct} />
      <Input label="Quantity" type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} error={tried ? qtyError : undefined} style={{ maxWidth: 160 }} />
      {withNote ? <Input label="Note (optional)" value={note} onChange={e => setNote(e.target.value)} maxLength={500} placeholder="e.g. It’s Biscuit’s birthday" /> : null}
    </WriteDialog>
  );
}

export function GroupNameDialog({ title, initial, onSubmit, onClose }: { title: string; initial?: string; onSubmit: (name: string) => Promise<WriteOutcome>; onClose: () => void }) {
  const [name, setName] = useState(initial ?? '');
  const [tried, setTried] = useState(false);
  const error = !name.trim() ? 'Give it a name.' : name.trim().length > 100 ? 'Under 100 characters.' : undefined;
  return (
    <WriteDialog title={title} size="sm" submitLabel="Save" onClose={onClose}
      onSubmit={async () => { setTried(true); if (error) return 'invalid'; return onSubmit(name.trim()); }}>
      <Input label="Name" value={name} onChange={e => setName(e.target.value)} maxLength={100} autoFocus placeholder="e.g. Protein rotation" error={tried ? error : undefined} />
    </WriteDialog>
  );
}
