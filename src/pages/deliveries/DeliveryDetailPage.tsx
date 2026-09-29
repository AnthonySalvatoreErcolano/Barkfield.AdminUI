// Delivery detail (PAGES.md §6): everything about one order — its lines and their procurement state,
// packing, the contents, scheduling, payment and proof of delivery.
//
// Contents freeze once paid: add / remove / quantity / substitute are disabled on contentsAreLocked
// rather than left for the user to discover as a 400. Shorting stays open, and flags a refund.
import { useEffect, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DeliveryLineSource, DeliveryStatus, FulfillmentMethod, LineOrderStatus } from '../../api/generated/enums';
import type { DeliveryDetail, DeliveryLine } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { DeliveryStatusBadge, FULFILLMENT_LABEL, LineStatusBadge, PaymentStatusBadge, ProcurementBadge } from '../../app/statusBadges';
import { formatDay, formatInstant, formatMoney, formatPhone, formatTime, plural } from '../../lib/format';
import { Can, useApi, useSession } from '../../session/SessionProvider';
import { Alert, Badge, Breadcrumbs, Button, buttonClass, Card, DataTable, DropdownMenu, Icon, IconButton, Input, Tooltip, type DataTableColumn, type DropdownItem } from '../../ui';
import { deliveryKeys } from './keys';
import { AddLineDialog, LineActionDialog } from './LineDialogs';
import { CancelDialog, DeliveredDialog, FailedDialog, NotesDialog, StopDialog, type ManageDialog } from './ManageDialogs';
import { useDeliveryWrites } from './useDeliveryWrites';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15 }}>{children}</div>
    </div>
  );
}

const muted = (text: string) => <span style={{ color: 'var(--text-muted)' }}>{text}</span>;
const LOCKED = 'Paid — the contents are fixed. Refund or adjust the payment in Square first.';

export function DeliveryDetailPage() {
  const { deliveryId = '' } = useParams();
  const api = useApi();
  const { data, error, refetch } = useQuery({
    queryKey: deliveryKeys.detail(deliveryId),
    queryFn: ({ signal }) => api.deliveries.get(deliveryId, signal),
  });
  if (error && !data) return <LoadError error={error} onRetry={() => refetch()} what="this delivery" />;
  if (!data) return <p style={{ color: 'var(--text-muted)' }}>Loading…</p>;
  return <DeliveryView delivery={data} />;
}

function DeliveryView({ delivery: d }: { delivery: DeliveryDetail }) {
  const api = useApi();
  const navigate = useNavigate();
  const { canCall } = useSession();
  const { run, busy, problem, clearProblem } = useDeliveryWrites(d.id);
  const [lineDialog, setLineDialog] = useState<DeliveryLine | null>(null);
  const [adding, setAdding] = useState(false);
  const [manage, setManage] = useState<ManageDialog>(null);

  const open = !d.isClosed;
  const canPack = open && d.status === DeliveryStatus.Scheduled;
  const canWorkLines = open && canCall('POST /api/deliveries/{deliveryId}/lines/{lineId}/ordered');
  const canEditContents = open && canCall('POST /api/deliveries/{deliveryId}/lines');
  const unresolved = d.lines.filter(l => !l.isResolved).length;

  const manageItems: DropdownItem[] = [
    { label: 'Edit notes', icon: 'notebook-pen', onSelect: () => setManage('notes') },
    ...(open ? [
      { label: 'Window and time at the door', icon: 'clock', onSelect: () => setManage('stop') } as DropdownItem,
      { divider: true } as DropdownItem,
      { label: 'Mark delivered by hand', icon: 'circle-check', onSelect: () => setManage('delivered') } as DropdownItem,
      { label: 'Mark failed', icon: 'circle-x', onSelect: () => setManage('failed') } as DropdownItem,
      { label: 'Cancel delivery', icon: 'trash-2', danger: true, onSelect: () => setManage('cancel') } as DropdownItem,
    ] : []),
  ];

  return (
    <div>
      <PageHeader
        title={d.customerName}
        eyebrow={`${formatDay(d.scheduledFor, 'long')} · ${d.isOneOff ? 'One-off delivery' : d.subscriptionName ?? 'Unnamed subscription'}`}
        actions={<>
          {canPack ? (
            <Can call="POST /api/deliveries/{deliveryId}/pack">
              {d.isReadyToPack
                ? <Button iconLeft="package" disabled={busy} onClick={() => run(() => api.deliveries.pack(d.id), { title: 'Packed', message: `${d.customerName}’s box is ready to go.` })}>Mark packed</Button>
                : <Tooltip content={`${plural(unresolved, 'line')} still to resolve`} placement="bottom"><Button iconLeft="package" disabled>Mark packed</Button></Tooltip>}
            </Can>
          ) : null}
          {canCall('PUT /api/deliveries/{deliveryId}/notes') ? (
            <DropdownMenu align="right" triggerLabel="More actions"
              trigger={<span className={buttonClass('secondary')}>More <Icon name="chevron-down" size={16} /></span>}
              items={manageItems} />
          ) : null}
        </>}
      >
        <Breadcrumbs style={{ marginBottom: 14 }} onNavigate={navigate}
          items={[{ label: 'Deliveries', href: '/deliveries' }, { label: d.customerName }]} />
      </PageHeader>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: -12, marginBottom: 20, flexWrap: 'wrap' }}>
        <DeliveryStatusBadge status={d.status} />
        {canPack ? <ProcurementBadge status={d.procurementStatus} /> : null}
        <PaymentStatusBadge status={d.paymentStatus} />
        <Badge tone="neutral">{FULFILLMENT_LABEL[d.fulfillmentMethod]}</Badge>
        <Link to={`/customers/${d.customerId}`} style={{ fontSize: 14, marginLeft: 6 }}>Customer record</Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {problem ? <Alert tone={problem.tone} title={problem.title} onClose={clearProblem}>{problem.message}</Alert> : null}
        <StatusAlerts d={d} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.75fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        <LinesCard d={d} busy={busy} canWorkLines={canWorkLines} canEditContents={canEditContents} run={run}
          onLine={setLineDialog} onAdd={() => setAdding(true)} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <StopCard d={d} />
          <PaymentCard d={d} />
          {d.notes ? <Card title="Notes"><p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{d.notes}</p></Card> : null}
          {d.hasProofOfDelivery || d.driverNotes ? <ProofCard d={d} /> : null}
        </div>
      </div>

      {lineDialog ? (
        <LineActionDialog
          target={{ ...lineDialog, locked: d.contentsAreLocked }}
          onClose={() => setLineDialog(null)}
          submit={action => run(() => api.deliveries.lineAction(d.id, lineDialog.id, action), { title: `${lineDialog.productName} updated` })}
        />
      ) : null}
      {adding ? <AddLineDialog delivery={d} run={run} onClose={() => setAdding(false)} /> : null}
      {manage === 'notes' ? <NotesDialog delivery={d} run={run} onClose={() => setManage(null)} /> : null}
      {manage === 'stop' ? <StopDialog delivery={d} run={run} onClose={() => setManage(null)} /> : null}
      {manage === 'delivered' ? <DeliveredDialog delivery={d} run={run} onClose={() => setManage(null)} /> : null}
      {manage === 'failed' ? <FailedDialog delivery={d} run={run} onClose={() => setManage(null)} /> : null}
      {manage === 'cancel' ? <CancelDialog delivery={d} run={run} onClose={() => setManage(null)} /> : null}
    </div>
  );
}

function StatusAlerts({ d }: { d: DeliveryDetail }) {
  const alerts: ReactNode[] = [];
  if (d.isClosed) {
    alerts.push(
      <Alert key="closed" tone={d.status === DeliveryStatus.Failed ? 'danger' : 'info'} title={d.status === DeliveryStatus.Delivered ? `Delivered ${formatInstant(d.completedAt)}` : d.status === DeliveryStatus.Failed ? 'Delivery failed' : 'Canceled'}>
        {d.status === DeliveryStatus.Failed && d.failureReason ? `${d.failureReason} ` : ''}This delivery is closed and can’t be changed.
      </Alert>,
    );
  }
  if (d.paymentFailed) {
    alerts.push(
      <Alert key="declined" tone="danger" title="Card declined">
        {d.paymentFailureCode === 'PAYMENT_METHOD_ERROR'
          ? <>The card on file needs fixing — ring {d.customerName}{d.customerPhoneNumber ? <> on <a href={`tel:${d.customerPhoneNumber}`}>{formatPhone(d.customerPhoneNumber)}</a></> : null}.</>
          : <>Square said: {d.paymentFailureReason ?? 'no reason given'}{d.paymentFailureCode ? <> (<code>{d.paymentFailureCode}</code>)</> : null}.</>}
      </Alert>,
    );
  }
  if (d.needsRefundAttention) {
    // One alert, not two: after a post-payment short, the charge/estimate difference IS the refund.
    // The figure is the API's chargeVariance, not arithmetic done here.
    alerts.push(
      <Alert key="refund" tone="warning" title="Refund owed">
        A line was shorted after {d.customerName} paid. Square charged {formatMoney(d.amountCharged)}; the box is now worth {formatMoney(d.total)}
        {d.chargeVariance ? <> — a difference of {formatMoney(d.chargeVariance)}</> : null}. Refunds are done by hand in Square — nothing here issues one.
      </Alert>,
    );
  } else if (d.chargeVariance && d.chargeVariance !== 0) {
    alerts.push(
      <Alert key="variance" tone="info" title={`Square charged ${formatMoney(d.amountCharged)} — our estimate was ${formatMoney(d.total)}`}>
        Square prices from its own live catalog, so the charge can differ from the prices snapshotted here. Square’s figure is the real one.
      </Alert>,
    );
  }
  if (!d.isClosed && d.status === DeliveryStatus.Scheduled && !d.isReadyToPack && d.packingBlockers?.length) {
    alerts.push(
      <Alert key="blockers" tone={d.lines.some(l => l.isBlocking) ? 'warning' : 'info'} title="Not ready to pack">
        Still to resolve: {d.packingBlockers?.join(', ')}.
      </Alert>,
    );
  }
  return <>{alerts}</>;
}

function LinesCard({ d, busy, canWorkLines, canEditContents, run, onLine, onAdd }: {
  d: DeliveryDetail; busy: boolean; canWorkLines: boolean; canEditContents: boolean;
  run: ReturnType<typeof useDeliveryWrites>['run'];
  onLine: (line: DeliveryLine) => void; onAdd: () => void;
}) {
  const api = useApi();
  const locked = d.contentsAreLocked;
  const unresolved = d.lines.filter(l => !l.isResolved).length;
  const pending = d.lines.filter(l => l.orderStatus === LineOrderStatus.Pending).length;

  const columns: DataTableColumn<DeliveryLine>[] = [
    {
      key: 'product', header: 'Product',
      render: l => (
        <div>
          <div style={{ fontWeight: 600, textDecoration: l.orderStatus === LineOrderStatus.Shorted || l.orderStatus === LineOrderStatus.Substituted ? 'line-through' : undefined, color: l.orderStatus === LineOrderStatus.Shorted ? 'var(--text-muted)' : undefined }}>
            {l.productName}
          </div>
          {l.orderStatus === LineOrderStatus.Substituted ? <div style={{ fontSize: 13.5 }}>→ {l.substitutedWithProductName}</div> : null}
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {l.source === DeliveryLineSource.AddOn ? 'One-off add-on' : l.source === DeliveryLineSource.Rotation ? 'Rotation' : l.source === DeliveryLineSource.Manual ? 'Added by hand' : 'Standing item'}
            {l.statusNote ? ` · ${l.statusNote}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'qty', header: 'Qty', align: 'right',
      render: l => canEditContents && !locked
        ? <QuantityEditor line={l} disabled={busy} onSave={q => run(() => api.deliveries.changeQuantity(d.id, l.id, q), { title: 'Quantity changed', message: 'That line’s procurement starts again.' })} />
        : l.quantity,
    },
    {
      key: 'received', header: 'Received', align: 'right',
      render: l => l.orderStatus === LineOrderStatus.PartiallyReceived || l.orderStatus === LineOrderStatus.Received ? `${l.quantityReceived} of ${l.quantity}` : muted('—'),
    },
    { key: 'status', header: 'Status', render: l => <LineStatusBadge status={l.orderStatus} /> },
    { key: 'total', header: 'Line total', align: 'right', render: l => formatMoney(l.lineTotal) },
    {
      key: 'actions', header: '', width: 120, align: 'right',
      render: l => (
        <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
          {canWorkLines ? <Button size="sm" variant="secondary" disabled={busy} onClick={() => onLine(l)} aria-label={`Update ${l.productName}`}>Update</Button> : null}
          {canEditContents ? (
            <IconButton icon="trash-2" size="sm" label={locked ? LOCKED : `Remove ${l.productName}`} disabled={busy || locked || d.lines.length === 1}
              onClick={() => run(() => api.deliveries.removeLine(d.id, l.id), { title: `${l.productName} removed` })} />
          ) : null}
        </span>
      ),
    },
  ];

  return (
    <Card flush title="In the box"
      actions={<>
        {canWorkLines && unresolved > 0 && pending > 0 ? (
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => api.deliveries.orderAll(d.id), { title: 'All open lines marked ordered' })}>Mark all ordered</Button>
        ) : null}
        {canEditContents ? (
          locked
            ? <Tooltip content={LOCKED} placement="bottom"><Button size="sm" variant="secondary" iconLeft="plus" disabled>Add product</Button></Tooltip>
            : <Button size="sm" variant="secondary" iconLeft="plus" disabled={busy} onClick={onAdd}>Add product</Button>
        ) : null}
      </>}>
      {locked && !d.isClosed ? (
        <div style={{ padding: '0 20px 12px' }}>
          <Alert tone="info">Paid, so the contents are fixed. You can still record what arrived, mark it out of stock, or send it without an item.</Alert>
        </div>
      ) : null}
      <DataTable rows={d.lines} rowKey={l => l.id} columns={columns} density="compact" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', fontSize: 14.5 }}>
        <span style={{ color: 'var(--text-muted)' }}>{plural(d.totalUnits, 'unit')}</span>
        <span>Estimated total <strong>{formatMoney(d.total)}</strong></span>
      </div>
    </Card>
  );
}

function QuantityEditor({ line, disabled, onSave }: { line: DeliveryLine; disabled: boolean; onSave: (q: number) => Promise<unknown> }) {
  const [value, setValue] = useState(String(line.quantity));
  useEffect(() => setValue(String(line.quantity)), [line.quantity]);
  const q = Number(value);
  const valid = Number.isInteger(q) && q >= 1;
  const commit = () => { if (valid && q !== line.quantity) void onSave(q); else setValue(String(line.quantity)); };
  return (
    <Input size="sm" type="number" min={1} value={value} disabled={disabled} aria-label={`Quantity of ${line.productName}`}
      onChange={e => setValue(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
      style={{ width: 76, marginLeft: 'auto' }} />
  );
}

function StopCard({ d }: { d: DeliveryDetail }) {
  const local = d.fulfillmentMethod === FulfillmentMethod.LocalDelivery;
  return (
    <Card title={local ? 'The stop' : FULFILLMENT_LABEL[d.fulfillmentMethod]} eyebrow={local ? 'For the driver' : undefined}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {local ? <Field label="Address">{d.deliveryStreet ? <>{d.deliveryStreet}<br />{d.deliveryCity}, {d.deliveryState} {d.deliveryZipCode}</> : muted('None')}</Field> : null}
        <Field label="Phone">{d.customerPhoneNumber ? <a href={`tel:${d.customerPhoneNumber}`}>{formatPhone(d.customerPhoneNumber)}</a> : muted('None')}</Field>
        {local ? <>
          <Field label="Access notes">{d.accessNotes ?? muted('None')}</Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Window">{d.requestedWindowStart && d.requestedWindowEnd ? `${formatTime(d.requestedWindowStart)}–${formatTime(d.requestedWindowEnd)}` : muted('Any time')}</Field>
            <Field label="Time at the door">{plural(d.effectiveServiceDurationMinutes, 'minute')}{d.serviceDurationMinutesOverride != null ? muted(' (this delivery)') : null}</Field>
          </div>
          {d.sentToRoutingAt ? <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>Sent to Routific {formatInstant(d.sentToRoutingAt, true)}.</p> : null}
        </> : null}
      </div>
    </Card>
  );
}

function PaymentCard({ d }: { d: DeliveryDetail }) {
  return (
    <Card title="Payment" eyebrow="Square">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Charged">{d.amountCharged != null ? formatMoney(d.amountCharged) : muted('Not yet')}</Field>
          <Field label="Our estimate">{formatMoney(d.total)}</Field>
        </div>
        {d.paymentAttemptedAt ? <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>Last attempt {formatInstant(d.paymentAttemptedAt, true)} · {plural(d.paymentAttemptCount, 'attempt')}</p> : null}
        {d.squareReceiptUrl ? <a href={d.squareReceiptUrl} target="_blank" rel="noreferrer">Square receipt <Icon name="external-link" size={13} style={{ display: 'inline' }} /></a> : null}
        {d.discounts.length ? <Field label="Discounts">{d.discounts.map(x => x.label ?? x.name).join(', ')}</Field> : null}
      </div>
    </Card>
  );
}

function ProofCard({ d }: { d: DeliveryDetail }) {
  return (
    <Card title="Proof of delivery">
      {d.driverNotes ? <p style={{ margin: '0 0 12px' }}>“{d.driverNotes}”</p> : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {d.photos.map(p => <Photo key={p.routificPhotoUuid} deliveryId={d.id} uuid={p.routificPhotoUuid} />)}
      </div>
    </Card>
  );
}

/**
 * The photo endpoint needs our bearer token, so a plain <img src> cannot load it. Fetch the bytes
 * through the API client and show them from an object URL (PAGES.md §8).
 */
function Photo({ deliveryId, uuid }: { deliveryId: string; uuid: string }) {
  const api = useApi();
  const { data, error } = useQuery({
    queryKey: deliveryKeys.photo(deliveryId, uuid),
    queryFn: () => api.deliveries.photo(deliveryId, uuid),
    staleTime: Infinity,
  });
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!data) return;
    const u = URL.createObjectURL(data);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [data]);
  if (error) return <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Photo unavailable</span>;
  if (!url) return <div style={{ width: 120, height: 90, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }} />;
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt="Proof of delivery" width={120} height={90} style={{ objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }} />
    </a>
  );
}
