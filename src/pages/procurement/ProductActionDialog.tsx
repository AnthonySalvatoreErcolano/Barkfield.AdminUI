// Acting on a whole product row of the ordering pass: mark it ordered, mark it out of stock, or receive
// all of it. Each fetches the matching lines in the range, shows exactly what will change, and sends one
// batch.
//
// "Receive all of this product" is the one bulk receive the board offers, on purpose: you are standing
// at that pallet and handled those units. Receiving claims a physical fact, so it is never offered for
// an arbitrary selection across the page.
import { useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { LineOrderStatus } from '../../api/generated/enums';
import type { ProcurementLine, ProcurementProduct, ProcurementQuery } from '../../api/ports';
import { formatDay, plural } from '../../lib/format';
import { useApi } from '../../session/SessionProvider';
import { Alert, Button, Dialog, Input } from '../../ui';
import { procurementKeys } from './keys';
import type { RowLabel, useBoardWrites } from './useBoardWrites';

export type ProductAction = 'ordered' | 'out-of-stock' | 'receive';

const SPEC: Record<ProductAction, { title: (p: string) => string; statuses: number[]; target: number; button: string }> = {
  // Only lines nobody has acted on yet: re-marking an ordered line "ordered" would overwrite its PO note.
  ordered: { title: p => `Mark ${p} ordered`, statuses: [LineOrderStatus.Pending], target: LineOrderStatus.Ordered, button: 'Mark ordered' },
  'out-of-stock': { title: p => `${p} is out of stock`, statuses: [LineOrderStatus.Pending, LineOrderStatus.Ordered], target: LineOrderStatus.OutOfStock, button: 'Mark out of stock' },
  // Ordered lines, and part-received ones (receiving them in full takes the rest).
  receive: { title: p => `Receive all ${p}`, statuses: [LineOrderStatus.Ordered, LineOrderStatus.PartiallyReceived], target: LineOrderStatus.Received, button: 'Receive all' },
};

/** Every line of one product in the range with one of these statuses — paged through, up to the batch limit. */
async function linesFor(api: ReturnType<typeof useApi>, base: ProcurementQuery, productId: string, statuses: number[]) {
  const out: ProcurementLine[] = [];
  for (const status of statuses) {
    for (let page = 1; out.length < 500; page++) {
      const r = await api.procurement.lines({ ...base, productId, orderStatus: status as ProcurementQuery['orderStatus'], pageNumber: page, pageSize: 200 });
      out.push(...r.items);
      if (!r.hasNextPage) break;
    }
  }
  return out.slice(0, 500);
}

export function ProductActionDialog({ product, action, range, writes, onClose }: {
  product: ProcurementProduct;
  action: ProductAction;
  range: ProcurementQuery;
  writes: ReturnType<typeof useBoardWrites>;
  onClose: () => void;
}) {
  const api = useApi();
  const spec = SPEC[action];
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const base: ProcurementQuery = { from: range.from, to: range.to, includeClosed: range.includeClosed, fulfillmentMethod: range.fulfillmentMethod };
  const { data: lines, error } = useQuery({
    queryKey: procurementKeys.forProduct(product.productId, action, base),
    queryFn: () => linesFor(api, base, product.productId, spec.statuses),
    staleTime: 0,
  });

  const units = (lines ?? []).reduce((s, l) => s + (l.quantity - (l.orderStatus === LineOrderStatus.PartiallyReceived ? l.quantityReceived : 0)), 0);
  const customers = new Set((lines ?? []).map(l => l.customerId)).size;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!lines?.length) return;
    setBusy(true);
    const labels = new Map<string, RowLabel>(lines.map(l => [l.lineId, { customerName: l.customerName, productName: l.productName }]));
    // Receiving in full: quantityReceived omitted, which the API reads as the whole line.
    const ok = await writes.runBatch(spec.button, lines.map(l => ({ deliveryId: l.deliveryId, lineId: l.lineId, status: spec.target as LineOrderStatus, note: note.trim() || null })), labels);
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Dialog open size="md" onClose={busy ? undefined : onClose} title={spec.title(product.productName)}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="product-action" variant={action === 'out-of-stock' ? 'danger' : 'primary'} disabled={busy || !lines?.length}>
          {busy ? 'Saving…' : lines?.length ? `${spec.button} (${plural(lines.length, 'line')})` : spec.button}
        </Button>
      </>}>
      <form id="product-action" onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error ? <Alert tone="danger">Couldn’t load the lines for this product.</Alert> : null}
        {!lines ? <p style={{ margin: 0, color: 'var(--text-muted)' }}>Finding the lines…</p>
          : !lines.length ? <Alert tone="info">Nothing to change — no {action === 'ordered' ? 'pending' : action === 'receive' ? 'ordered' : 'open'} lines of this product in the range.</Alert>
          : <>
            <p style={{ margin: 0 }}>
              <strong>{plural(units, 'unit')}</strong> across {plural(lines.length, 'delivery', 'deliveries')} for {plural(customers, 'customer')},
              {' '}{formatDay(lines.map(l => l.scheduledFor).sort()[0])}{lines.length > 1 ? ` onward` : ''}.
            </p>
            {action === 'receive' ? (
              <Alert tone="warning" title="Only if they’re all in your hands">
                Receiving says these units physically arrived. If any didn’t, receive those lines one at a time on the line view instead —
                a wrong “received” becomes a customer missing food the system says came in.
              </Alert>
            ) : null}
            {action === 'out-of-stock' ? (
              <Alert tone="warning">Each of these deliveries will be blocked from packing until someone decides — substitute, send without it, or wait.</Alert>
            ) : null}
            {action !== 'receive' ? (
              <Input label="Note (optional)" value={note} onChange={e => setNote(e.target.value)} maxLength={500}
                placeholder={action === 'ordered' ? 'e.g. PO 4471' : 'e.g. Supplier out until next week'} />
            ) : null}
          </>}
      </form>
    </Dialog>
  );
}
