// Billing (PAGES.md §7). Staff run the day's charges, so billing:charge is not a manager-only control.
//
// A declined card is a 200 with the outcome in the body. So "charge the day" is rendered as a worklist of
// people to ring, not as success or failure. Square prices the order: we send discount ids and show
// Square's amountCharged; the discount percentages are labels, never used in a sum here. Refunds are
// made by hand in Square — this screen only makes sure one is noticed.
import { useState, type ReactNode } from 'react';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { errorMessage } from '../../api/errors';
import { ChargeAttentionReason, ChargeOutcome, DeliveryStatus, PaymentStatus, ProcurementStatus } from '../../api/generated/enums';
import type { BatchChargeResult, ChargeAttentionItem, ChargeResult, DeliveryListItem, DeliveryListQuery } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { useListParams } from '../../app/lists';
import { PaymentStatusBadge, ProcurementBadge } from '../../app/statusBadges';
import { useToast } from '../../app/toast';
import { addDays, todayIso } from '../../lib/dates';
import { formatDay, formatMoney, plural } from '../../lib/format';
import { Can, useApi, useSession } from '../../session/SessionProvider';
import { Alert, Badge, Button, Card, Chip, DataTable, Input, Muted, Tabs, type DataTableColumn } from '../../ui';
import { customerKeys } from '../customers/keys';
import { deliveryKeys } from '../deliveries/keys';
import { ConfirmChargeDialog, DiscountsDialog } from './BillingDialogs';
import { billingKeys } from './keys';

const CHARGE_KEY = ['billing-charge'];

/** What to tell staff about a refusal. PAYMENT_METHOD_ERROR is the one that means "ring them". */
function refusalAdvice(code: string | null | undefined): string | null {
  if (code === 'PAYMENT_METHOD_ERROR') return 'The card needs fixing — ring them.';
  if (code === 'NO_CARD_ON_FILE') return 'No card on file — ring them to add one in Square.';
  return null;
}

export function BillingPage() {
  const list = useListParams('/api/deliveries');
  const tab = list.value('tab') === 'attention' ? 'attention' : 'day';
  const date = list.value('date', todayIso());
  const api = useApi();
  const attentionRange = { from: addDays(todayIso(), -60), to: addDays(todayIso(), 14) };
  const attention = useQuery({
    queryKey: billingKeys.attention(attentionRange.from, attentionRange.to),
    queryFn: () => api.billing.needsAttention(attentionRange),
  });

  return (
    <div>
      <PageHeader title="Billing" />
      <Tabs value={tab} onChange={t => list.setValues({ tab: t === 'attention' ? 'attention' : null })} style={{ marginBottom: 20 }}
        tabs={[{ id: 'day', label: 'Charge the day' }, { id: 'attention', label: 'Needs attention', count: attention.data?.length ?? null }]} />
      {tab === 'day'
        ? <ChargeDay date={date} onDate={d => list.setValues({ date: d === todayIso() ? null : d })} />
        : <NeedsAttention query={attention} />}
    </div>
  );
}

function ChargeDay({ date, onDate }: { date: string; onDate: (date: string) => void }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { canCall } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [discountsFor, setDiscountsFor] = useState<DeliveryListItem | null>(null);
  const [run, setRun] = useState<BatchChargeResult | null>(null);
  const [single, setSingle] = useState<ChargeResult | null>(null);
  const charging = useIsMutating({ mutationKey: CHARGE_KEY }) > 0;

  const query: DeliveryListQuery = { scheduledFrom: date, scheduledTo: date, sortBy: 'customer', pageSize: 200 };
  const day = useQuery({ queryKey: deliveryKeys.list(query), queryFn: ({ signal }) => api.deliveries.list(query, signal) });
  const rows = day.data?.items ?? [];
  const ready = rows.filter(d => d.procurementStatus === ProcurementStatus.Ready && d.paymentStatus !== PaymentStatus.Paid);
  const notReady = rows.filter(d => d.procurementStatus !== ProcurementStatus.Ready && d.paymentStatus !== PaymentStatus.Paid);
  const paid = rows.filter(d => d.paymentStatus === PaymentStatus.Paid);

  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: deliveryKeys.all }),
    queryClient.invalidateQueries({ queryKey: billingKeys.all }),
    queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  ]);
  // Charges are money: never retried, one at a time, and the whole day is one request.
  const chargeAll = useMutation({ mutationKey: CHARGE_KEY, mutationFn: () => api.billing.chargeAll(date), onSuccess: r => { setRun(r); setSingle(null); }, onSettled: refresh });
  const chargeOne = useMutation({
    mutationKey: CHARGE_KEY,
    mutationFn: (id: string) => api.billing.charge(id),
    onSuccess: r => { setSingle(r); if (r.isPaid) toast({ title: `${r.customerName} charged`, message: r.message ?? undefined }); },
    onSettled: refresh,
  });

  const columns: DataTableColumn<DeliveryListItem>[] = [
    {
      key: 'customer', header: 'Customer',
      render: d => <div>
        <Link to={`/deliveries/${d.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.customerName}</Link>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{d.isOneOff ? 'One-off delivery' : d.subscriptionDisplayName ?? d.subscriptionName}</div>
      </div>,
    },
    { key: 'ready', header: 'Box', render: d => d.status !== DeliveryStatus.Scheduled && !d.isClosed ? <Badge tone="success">Packed</Badge> : <ProcurementBadge status={d.procurementStatus} /> },
    { key: 'payment', header: 'Payment', render: d => <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><PaymentStatusBadge status={d.paymentStatus} />{d.paymentFailureCode ? <Muted>{d.paymentFailureCode}</Muted> : null}</span> },
    { key: 'estimate', header: 'Our estimate', align: 'right', render: d => formatMoney(d.total) },
    {
      key: 'charged', header: 'Square charged', align: 'right',
      render: d => d.amountCharged == null ? <Muted>—</Muted>
        : <span title={d.amountCharged !== d.total ? 'Square prices from its live catalog and applies the discounts, so this can differ from our estimate.' : undefined}>
          <strong>{formatMoney(d.amountCharged)}</strong>
        </span>,
    },
    {
      key: 'actions', header: '', align: 'right', width: 210,
      render: d => canCall('POST /api/deliveries/{deliveryId}/charge') ? (
        <span style={{ display: 'inline-flex', gap: 6 }}>
          <Button size="sm" variant="ghost" disabled={charging || d.hasPaid || d.isClosed} onClick={() => setDiscountsFor(d)}
            aria-label={`Discounts for ${d.customerName}`} title={d.hasPaid ? 'Discounts can’t be changed once paid.' : undefined}>Discounts</Button>
          <Button size="sm" variant="secondary" disabled={charging || d.hasPaid || d.procurementStatus !== ProcurementStatus.Ready}
            onClick={() => chargeOne.mutate(d.id)} aria-label={`Charge ${d.customerName}`}
            title={d.procurementStatus !== ProcurementStatus.Ready ? 'Not ready — procurement has to be settled before charging.' : undefined}>
            {d.paymentStatus === PaymentStatus.Failed ? 'Retry charge' : 'Charge'}
          </Button>
        </span>
      ) : null,
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <Input type="date" size="sm" label="Delivery day" value={date} onChange={e => { if (e.target.value) { onDate(e.target.value); setRun(null); setSingle(null); } }} style={{ width: 170 }} />
        <Chip selected={date === todayIso()} onClick={() => { onDate(todayIso()); setRun(null); }}>Today</Chip>
        <Chip selected={date === addDays(todayIso(), 1)} onClick={() => { onDate(addDays(todayIso(), 1)); setRun(null); }}>Tomorrow</Chip>
        <div style={{ flex: 1 }} />
        <Can call="POST /api/deliveries/charge-all">
          <Button iconLeft="credit-card" disabled={charging || ready.length === 0} onClick={() => setConfirming(true)}>
            {chargeAll.isPending ? 'Charging… keep this page open' : ready.length ? `Charge ${plural(ready.length, 'ready delivery', 'ready deliveries')}` : 'Nothing ready to charge'}
          </Button>
        </Can>
      </div>

      {day.data ? (
        <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)' }}>
          {plural(rows.length, 'delivery', 'deliveries')} on {formatDay(date, 'long')}: {ready.length} ready to charge · {paid.length} paid
          {notReady.length ? ` · ${notReady.length} not ready yet (procurement has to be settled first)` : ''}.
        </p>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {chargeAll.error ? <Alert tone="danger" title="The charge run didn’t go through">{errorMessage(chargeAll.error)} Check the list below before trying again — some may already be charged.</Alert> : null}
        {chargeOne.error ? <Alert tone="danger" title="That charge didn’t go through" onClose={() => chargeOne.reset()}>{errorMessage(chargeOne.error)}</Alert> : null}
        {single && !single.isPaid ? <SingleResult result={single} onClose={() => setSingle(null)} /> : null}
        {run ? <RunResult run={run} onClose={() => setRun(null)} /> : null}
      </div>

      {day.error && !day.data ? <LoadError error={day.error} onRetry={() => day.refetch()} what="the day’s deliveries" /> : (
        <Card flush>
          <DataTable rows={rows} rowKey={d => d.id} columns={columns} empty={day.isPending ? 'Loading…' : 'No open deliveries on this day.'} />
        </Card>
      )}

      {confirming ? <ConfirmChargeDialog date={date} ready={ready} onClose={() => setConfirming(false)} onConfirm={() => { setConfirming(false); chargeAll.mutate(); }} /> : null}
      {discountsFor ? (
        <DiscountsDialog delivery={discountsFor} onClose={() => setDiscountsFor(null)}
          onSaved={() => { toast({ title: 'Discounts saved', message: discountsFor.customerName }); setDiscountsFor(null); void refresh(); }} />
      ) : null}
    </>
  );
}

function SingleResult({ result, onClose }: { result: ChargeResult; onClose: () => void }) {
  const notAttempted = result.outcome === ChargeOutcome.NotAttempted;
  return (
    <Alert tone={notAttempted ? 'warning' : 'danger'} onClose={onClose}
      title={notAttempted ? `${result.customerName} wasn’t charged` : `${result.customerName}’s card was ${result.outcome === ChargeOutcome.Failed ? 'not charged — Square error' : 'declined'}`}>
      {result.message}{result.errorCode ? <> (<code>{result.errorCode}</code>)</> : null} {refusalAdvice(result.errorCode)}
    </Alert>
  );
}

/** The result of charging the day: a worklist, most urgent first. Figures are Square's, as reported. */
function RunResult({ run, onClose }: { run: BatchChargeResult; onClose: () => void }) {
  const ring = run.attempted.filter(a => a.outcome === ChargeOutcome.Declined || a.outcome === ChargeOutcome.Failed);
  const notAttempted = run.attempted.filter(a => a.outcome === ChargeOutcome.NotAttempted);
  const paid = run.attempted.filter(a => a.outcome === ChargeOutcome.Paid);
  return (
    <Card eyebrow={`Charged ${formatDay(run.deliveryDate)}`} title={`${paid.length} paid — ${formatMoney(run.totalCharged ?? 0)} taken by Square`}
      actions={<Button size="sm" variant="ghost" onClick={onClose}>Dismiss</Button>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {ring.length ? (
          <Section title={`Ring ${plural(ring.length, 'customer')}`} tone="danger">
            {ring.map(r => (
              <li key={r.deliveryId}>
                <Link to={`/deliveries/${r.deliveryId}`}><strong>{r.customerName}</strong></Link> — {r.message ?? 'Refused.'}
                {r.errorCode ? <> <code>{r.errorCode}</code></> : null}{refusalAdvice(r.errorCode) ? <> {refusalAdvice(r.errorCode)}</> : null}
                {r.outcome === ChargeOutcome.Failed ? <Muted> Square error — worth retrying later.</Muted> : null}
              </li>
            ))}
          </Section>
        ) : <Alert tone="success">No cards were refused.</Alert>}
        {notAttempted.length ? (
          <Section title={`Not charged (${notAttempted.length})`} tone="warning">
            {notAttempted.map(r => <li key={r.deliveryId}><Link to={`/deliveries/${r.deliveryId}`}><strong>{r.customerName}</strong></Link> — {r.message}</li>)}
          </Section>
        ) : null}
        {run.skipped.length ? (
          <details>
            <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>Skipped ({run.skipped.length}) — already paid or not ready</summary>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{run.skipped.map(s => <li key={s.deliveryId}>{s.customerName}: {s.reason}</li>)}</ul>
          </details>
        ) : null}
        {paid.length ? (
          <details>
            <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>Paid ({paid.length})</summary>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{paid.map(p => <li key={p.deliveryId}>{p.customerName}: {p.message ?? formatMoney(p.amountCharged)}</li>)}</ul>
          </details>
        ) : null}
      </div>
    </Card>
  );
}

function Section({ title, tone, children }: { title: string; tone: 'danger' | 'warning'; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: tone === 'danger' ? 'var(--status-danger-fg)' : 'var(--status-warning-fg)', marginBottom: 6 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</ul>
    </div>
  );
}

function NeedsAttention({ query }: { query: ReturnType<typeof useQuery<ChargeAttentionItem[]>> }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { canCall } = useSession();
  const charging = useIsMutating({ mutationKey: CHARGE_KEY }) > 0;
  const [result, setResult] = useState<ChargeResult | null>(null);
  const retry = useMutation({
    mutationKey: CHARGE_KEY,
    mutationFn: (id: string) => api.billing.charge(id),
    onSuccess: r => { setResult(r.isPaid ? null : r); if (r.isPaid) toast({ title: `${r.customerName} charged`, message: r.message ?? undefined }); },
    onSettled: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: billingKeys.all }),
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all }),
    ]),
  });

  if (query.error && !query.data) return <LoadError error={query.error} onRetry={() => query.refetch()} what="the attention list" />;
  const items = query.data ?? [];
  const columns: DataTableColumn<ChargeAttentionItem>[] = [
    { key: 'customer', header: 'Customer', render: i => <Link to={`/deliveries/${i.deliveryId}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{i.customerName}</Link> },
    { key: 'day', header: 'Delivery', render: i => formatDay(i.scheduledFor) },
    { key: 'reason', header: 'Why', render: i => i.reason === ChargeAttentionReason.RefundOwed ? <Badge tone="warning">Refund owed</Badge> : <Badge tone="danger" dot>Card refused</Badge> },
    {
      key: 'detail', header: 'Detail',
      render: i => <span>{i.detail}{i.reason === ChargeAttentionReason.PaymentFailed && refusalAdvice(i.detail.split(':')[0]) ? <Muted> {refusalAdvice(i.detail.split(':')[0])}</Muted> : null}</span>,
    },
    { key: 'attempts', header: 'Attempts', align: 'right', render: i => i.attemptCount },
    {
      key: 'action', header: '', align: 'right', width: 150,
      render: i => i.reason === ChargeAttentionReason.RefundOwed
        ? <Muted>Refund in Square</Muted>
        : canCall('POST /api/deliveries/{deliveryId}/charge')
          ? <Button size="sm" variant="secondary" disabled={charging} onClick={() => retry.mutate(i.deliveryId)} aria-label={`Retry charge for ${i.customerName}`}>Retry charge</Button>
          : null,
    },
  ];
  return (
    <>
      <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)' }}>
        Cards that were refused, and paid deliveries that came up short. Refunds are done by hand in Square — nothing here issues one.
      </p>
      {retry.error ? <Alert tone="danger" style={{ marginBottom: 12 }} title="That charge didn’t go through">{errorMessage(retry.error)}</Alert> : null}
      {result ? <div style={{ marginBottom: 12 }}><SingleResult result={result} onClose={() => setResult(null)} /></div> : null}
      <Card flush>
        <DataTable rows={items} rowKey={i => i.deliveryId} columns={columns} empty={query.isPending ? 'Loading…' : 'Nothing needs attention.'} />
      </Card>
    </>
  );
}
