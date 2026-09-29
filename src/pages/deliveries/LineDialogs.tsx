// Dialogs for working a delivery's lines: the procurement decision on one line (delivery:pack), and
// adding a product (delivery:manage). Only decisions that make sense are offered.
import { useState, type FormEvent } from 'react';
import { LineOrderStatus } from '../../api/generated/enums';
import type { DeliveryDetail, LineAction, Product } from '../../api/ports';
import { ProductPicker } from '../../app/ProductPicker';
import { LineStatusBadge } from '../../app/statusBadges';
import { plural } from '../../lib/format';
import { useApi } from '../../session/SessionProvider';
import { Alert, Button, Dialog, Input, Radio } from '../../ui';
import type { WriteOutcome } from './useDeliveryWrites';

type Choice = 'ordered' | 'received-all' | 'received-some' | 'out-of-stock' | 'substitute' | 'short' | 'reset';

/** The line being decided on, from wherever the screen has it (a delivery, or a procurement board row). */
export interface LineTarget {
  productId: string;
  productName: string;
  quantity: number;
  quantityReceived: number;
  orderStatus: number;
  statusNote?: string | null;
  /** Paid, so the contents are fixed. Undefined when the screen doesn't know (the board has no payment state). */
  locked?: boolean;
}

export function LineActionDialog({ target: line, onClose, submit }: {
  target: LineTarget;
  onClose: () => void;
  submit: (action: LineAction) => Promise<WriteOutcome>;
}) {
  const [choice, setChoice] = useState<Choice | ''>('');
  const [received, setReceived] = useState(String(line.quantityReceived || ''));
  const [note, setNote] = useState('');
  const [substitute, setSubstitute] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = line.locked === true;
  const receivedCount = Number(received);

  const action = (): LineAction | null => {
    switch (choice) {
      case 'ordered': return { kind: 'ordered', note };
      case 'received-all': return { kind: 'received', note };
      case 'received-some':
        return Number.isInteger(receivedCount) && receivedCount >= 0 && receivedCount < line.quantity
          ? { kind: 'received', quantityReceived: receivedCount, note } : null;
      case 'out-of-stock': return { kind: 'out-of-stock', note };
      case 'substitute': return substitute ? { kind: 'substitute', substituteProductId: substitute.id, note } : null;
      case 'short': return { kind: 'short', note };
      case 'reset': return { kind: 'reset', note };
      default: return null;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const a = action();
    if (!a) {
      setError(choice === 'received-some' ? `Enter how many arrived — fewer than ${line.quantity}. For all of them, choose “All ${line.quantity} arrived”.`
        : choice === 'substitute' ? 'Pick the product going in the box instead.' : 'Choose what happened.');
      return;
    }
    setBusy(true);
    setError(null);
    const outcome = await submit(a);
    setBusy(false);
    if (outcome.ok || outcome.conflict) onClose();
    else setError(outcome.message);
  };

  const option = (value: Choice, label: string, description?: string, disabled = false) => (
    <Radio name="line-action" value={value} checked={choice === value} onChange={v => { setChoice(v); setError(null); }} label={label} description={description} disabled={disabled} />
  );

  return (
    <Dialog open size="md" onClose={busy ? undefined : onClose} title={`Update ${line.productName}`}
      description={<>Quantity {line.quantity}. Currently <LineStatusBadge status={line.orderStatus} />{line.statusNote ? ` — ${line.statusNote}` : ''}</>}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="line-action" disabled={busy || !choice}>{busy ? 'Saving…' : 'Save'}</Button>
      </>}>
      <form id="line-action" onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {option('ordered', 'Ordered from the supplier', 'Add the PO number in the note if you have one.')}
        {option('received-all', line.quantity === 1 ? 'It arrived' : `All ${line.quantity} arrived`)}
        {line.quantity > 1 ? option('received-some', 'Only some arrived', 'The line stays open for the rest, so nobody forgets to order the shortfall.') : null}
        {choice === 'received-some' ? (
          <Input label="How many arrived" type="number" min={0} max={line.quantity - 1} value={received} onChange={e => setReceived(e.target.value)}
            suffix={`of ${line.quantity}`} style={{ marginLeft: 28, maxWidth: 220 }} />
        ) : null}
        {option('out-of-stock', 'Out of stock', 'Blocks packing until someone decides: substitute, short it, or wait.')}
        {option('substitute', 'Send something else instead', locked
          ? 'Not after payment — a substitute has its own price, which would change what they paid for.'
          : line.locked === undefined ? 'For this customer only. Refused if they’ve already paid — a substitute has its own price.'
          : 'For this customer only — the substitute carries its own price.', locked)}
        {choice === 'substitute' ? <div style={{ marginLeft: 28 }}><ProductPicker label="Substitute" value={substitute} onChange={setSubstitute} excludeId={line.productId} /></div> : null}
        {option('short', 'Send without it', line.locked === true
          ? 'They’ve already paid, so this flags the delivery for a refund in Square.'
          : line.locked === false ? 'They won’t be charged for it.'
          : 'They won’t be charged for it — or, if they’ve already paid, the delivery is flagged for a refund.')}
        {line.orderStatus !== LineOrderStatus.Pending ? option('reset', 'Undo — back to pending', 'For a mis-click.') : null}
        <Input label="Note (optional)" value={note} onChange={e => setNote(e.target.value)} maxLength={500} placeholder="e.g. PO 4471, or why" />
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </form>
    </Dialog>
  );
}

export function AddLineDialog({ delivery, onClose, run }: {
  delivery: DeliveryDetail;
  onClose: () => void;
  run: (write: () => Promise<void>, success?: { title: string; message?: string }) => Promise<WriteOutcome>;
}) {
  const api = useApi();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const existing = product ? delivery.lines.find(l => l.productId === product.id) : undefined;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (!product) { setError('Pick a product.'); return; }
    if (!Number.isInteger(qty) || qty < 1) { setError('Quantity must be at least 1.'); return; }
    setBusy(true);
    const outcome = await run(() => api.deliveries.addLine(delivery.id, { productId: product.id, quantity: qty }), { title: `${product.name} added` });
    setBusy(false);
    if (outcome.ok || outcome.conflict) onClose();
    else setError(outcome.message);
  };

  return (
    <Dialog open size="md" onClose={busy ? undefined : onClose} title="Add a product" description={`To ${delivery.customerName}’s delivery only — the subscription is unchanged.`}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="add-line" disabled={busy || !product}>{busy ? 'Adding…' : 'Add'}</Button>
      </>}>
      <form id="add-line" onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ProductPicker value={product} onChange={setProduct} />
        <Input label="Quantity" type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} style={{ maxWidth: 160 }} />
        {existing ? (
          <Alert tone="info">Already on this delivery ({plural(existing.quantity, 'unit')}). Adding more raises that line’s quantity and starts its procurement again.</Alert>
        ) : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </form>
    </Dialog>
  );
}
