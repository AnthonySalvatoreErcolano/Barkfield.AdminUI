// One decision applied to several selected lines, sent as one batch. Ordering, out of stock, shorting
// and substituting are decisions, and bulk is right for them. Receiving is deliberately not offered
// here: it claims a physical fact, so it is done per line, or per product at the pallet.
import { useState, type FormEvent } from 'react';
import { LineOrderStatus } from '../../api/generated/enums';
import type { ProcurementLine, Product } from '../../api/ports';
import { ProductPicker } from '../../app/ProductPicker';
import { plural } from '../../lib/format';
import { Alert, Button, Dialog, Input, Radio } from '../../ui';
import type { RowLabel, useBoardWrites } from './useBoardWrites';

type Choice = 'ordered' | 'out-of-stock' | 'short' | 'substitute' | 'reset';

const STATUS: Record<Choice, number> = {
  ordered: LineOrderStatus.Ordered, 'out-of-stock': LineOrderStatus.OutOfStock, short: LineOrderStatus.Shorted,
  substitute: LineOrderStatus.Substituted, reset: LineOrderStatus.Pending,
};

export function BulkDecisionDialog({ lines, writes, onClose, onDone }: {
  lines: ProcurementLine[];
  writes: ReturnType<typeof useBoardWrites>;
  onClose: () => void;
  onDone: () => void;
}) {
  const [choice, setChoice] = useState<Choice | ''>('');
  const [note, setNote] = useState('');
  const [substitute, setSubstitute] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const deliveries = new Set(lines.map(l => l.deliveryId)).size;
  const products = new Set(lines.map(l => l.productId));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!choice) { setError('Choose what to do.'); return; }
    if (choice === 'substitute' && !substitute) { setError('Pick the product going in instead.'); return; }
    setBusy(true);
    const labels = new Map<string, RowLabel>(lines.map(l => [l.lineId, { customerName: l.customerName, productName: l.productName }]));
    const ok = await writes.runBatch(
      { ordered: 'Marked ordered', 'out-of-stock': 'Marked out of stock', short: 'Marked to send without', substitute: 'Substituted', reset: 'Back to pending' }[choice],
      lines.map(l => ({
        deliveryId: l.deliveryId, lineId: l.lineId, status: STATUS[choice] as LineOrderStatus, note: note.trim() || null,
        substituteProductId: choice === 'substitute' ? substitute!.id : null,
      })),
      labels,
    );
    setBusy(false);
    if (ok) onDone();
  };

  const option = (value: Choice, label: string, description?: string) => (
    <Radio name="bulk" value={value} checked={choice === value} onChange={v => { setChoice(v); setError(null); }} label={label} description={description} />
  );

  return (
    <Dialog open size="md" onClose={busy ? undefined : onClose} title={`Update ${plural(lines.length, 'line')}`}
      description={`Across ${plural(deliveries, 'delivery', 'deliveries')}. Sent as one request, so lines on the same delivery can’t trip over each other.`}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="bulk-decision" disabled={busy || !choice}>{busy ? 'Saving…' : 'Apply'}</Button>
      </>}>
      <form id="bulk-decision" onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {option('ordered', 'Ordered from the supplier', 'Add the PO number in the note.')}
        {option('out-of-stock', 'Out of stock', 'Blocks each delivery from packing until someone decides.')}
        {option('substitute', 'Send something else instead', products.size > 1
          ? 'Everyone selected gets the same replacement. Refused for anyone who has already paid.'
          : 'Refused for anyone who has already paid — a substitute has its own price.')}
        {choice === 'substitute' ? <div style={{ marginLeft: 28 }}><ProductPicker label="Substitute" value={substitute} onChange={setSubstitute} /></div> : null}
        {option('short', 'Send without it', 'They won’t be charged for it — or, if they’ve paid, a refund is flagged.')}
        {option('reset', 'Undo — back to pending')}
        <Alert tone="info">To record what arrived, use a single line’s Update, or “Receive all” on the product view — receiving isn’t offered for a selection.</Alert>
        <Input label="Note (optional)" value={note} onChange={e => setNote(e.target.value)} maxLength={500} />
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </form>
    </Dialog>
  );
}
