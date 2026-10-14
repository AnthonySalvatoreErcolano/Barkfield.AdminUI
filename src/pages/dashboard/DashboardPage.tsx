// Dashboard (PAGES.md §1). There is no dashboard endpoint, so it is composed from five reads — the most
// PAGES.md allows before asking the API side for one:
//   1. this week's open deliveries   → today's list, and what's blocked on stock this week  (delivery:view)
//   2. cards needing attention        → the alert at the top                                (billing:view)
//   3. subscriptions due today        → anything still to generate                          (delivery:view)
//   4. this week's procurement        → units still to order                                (delivery:view)
//   5. today's dispatch board         → its ready-made status line                          (dispatch:view)
// Each tile asks only if you hold its permission, and fails on its own without taking the page down.
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ProcurementStatus } from '../../api/generated/enums';
import type { DeliveryListItem } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { PaymentStatusBadge } from '../../app/statusBadges';
import { addDays, dayOf, todayIso } from '../../lib/dates';
import { plural } from '../../lib/format';
import { useApi, useSession } from '../../session/SessionProvider';
import { Alert, Button, Card, DataTable, Muted, StatCard, type IconName } from '../../ui';
import { billingKeys } from '../billing/keys';
import { WorkCell } from '../deliveries/DeliveriesListPage';
import { deliveryKeys } from '../deliveries/keys';
import { procurementKeys } from '../procurement/keys';

export function DashboardPage() {
  const api = useApi();
  const navigate = useNavigate();
  const { canCall } = useSession();
  const today = todayIso();
  const weekEnd = addDays(today, 6);

  const canDeliveries = canCall('GET /api/deliveries');
  const weekQuery = { scheduledFrom: today, scheduledTo: weekEnd, includeClosed: false, pageSize: 200, sortBy: 'scheduledFor' };
  const week = useQuery({
    queryKey: deliveryKeys.list(weekQuery),
    queryFn: ({ signal }) => api.deliveries.list(weekQuery, signal),
    enabled: canDeliveries,
  });
  const attention = useQuery({
    queryKey: billingKeys.attention('', ''),
    queryFn: () => api.billing.needsAttention({}),
    enabled: canCall('GET /api/deliveries/needs-attention'),
  });
  const due = useQuery({
    queryKey: deliveryKeys.due(today),
    queryFn: () => api.deliveries.due(today),
    enabled: canCall('GET /api/deliveries/due'),
  });
  const orderQuery = { from: today, to: weekEnd, pageSize: 200 };
  const toOrder = useQuery({
    queryKey: procurementKeys.products(orderQuery),
    queryFn: ({ signal }) => api.procurement.products(orderQuery, signal),
    enabled: canCall('GET /api/procurement/products'),
  });
  const dispatch = useQuery({
    queryKey: ['dispatch', 'board', today],
    queryFn: ({ signal }) => api.dispatch.board(today, signal),
    enabled: canCall('GET /api/dispatch'),
  });

  const weekRows = week.data?.items ?? [];
  const todays = weekRows.filter(d => dayOf(d.scheduledFor) === today);
  const blocked = weekRows.filter(d => d.procurementStatus === ProcurementStatus.Blocked);
  const readyToPack = todays.filter(d => d.isReadyToPack).length;
  const toGenerate = (due.data ?? []).filter(d => d.willGenerate);
  const pendingUnits = (toOrder.data?.items ?? []).reduce((s, p) => s + p.pendingQuantity, 0);
  const pendingProducts = (toOrder.data?.items ?? []).filter(p => p.pendingQuantity > 0);
  const refused = (attention.data ?? []).filter(a => a.reasonName === 'PaymentFailed');
  const refunds = (attention.data ?? []).filter(a => a.reasonName === 'RefundOwed');

  return (
    <div>
      <PageHeader title="Dashboard" />

      {attention.data?.length ? (
        <Alert tone="danger" style={{ marginBottom: 20 }}
          title={[refused.length ? plural(refused.length, 'card') + ' refused' : null, refunds.length ? plural(refunds.length, 'refund') + ' owed' : null].filter(Boolean).join(' · ')}
          action={<Button size="sm" variant="secondary" onClick={() => navigate('/billing')}>Review</Button>}>
          {refused.length ? <>{names(refused.map(a => a.customerName))} — ring them to fix the card in Square. </> : null}
          {refunds.length ? <>{names(refunds.map(a => a.customerName))} paid for something that didn’t go — refund in Square.</> : null}
        </Alert>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 20 }}>
        {canDeliveries ? (
          <Tile label="Today’s deliveries" icon="package" to={`/deliveries?from=${today}&to=${today}`} loading={week.isPending} error={week.isError}
            value={todays.length} caption={todays.length ? `${readyToPack} ready to pack` : 'Nothing scheduled'} />
        ) : null}
        {due.isEnabled ? (
          <Tile label="Still to generate" icon="repeat" to="/deliveries/generate" loading={due.isPending} error={due.isError}
            value={toGenerate.length} caption={toGenerate.length ? 'due today, no delivery yet' : 'Today is generated'} warn={toGenerate.length > 0} />
        ) : null}
        {toOrder.isEnabled ? (
          <Tile label="Still to order" icon="shopping-bag" to={`/procurement?from=${today}&to=${weekEnd}`} loading={toOrder.isPending} error={toOrder.isError}
            value={pendingUnits} caption={pendingUnits ? `${plural(pendingProducts.length, 'product')} this week` : 'All ordered this week'} />
        ) : null}
        {canDeliveries ? (
          <Tile label="Blocked on stock" icon="triangle-alert" to={`/deliveries?from=${today}&to=${weekEnd}&procurement=${ProcurementStatus.Blocked}`}
            loading={week.isPending} error={week.isError} value={blocked.length} warn={blocked.length > 0}
            caption={blocked.length ? 'need a decision this week' : 'Nothing blocked'} />
        ) : null}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: canDeliveries ? 'minmax(0,2fr) minmax(0,1fr)' : '1fr', gap: 16, alignItems: 'start' }}>
        {canDeliveries ? (
          <Card title="Today’s deliveries" flush
            actions={<Button variant="ghost" size="sm" iconRight="chevron-right" onClick={() => navigate('/deliveries')}>All deliveries</Button>}>
            <DataTable rows={todays} rowKey={d => d.id} onRowClick={d => navigate(`/deliveries/${d.id}`)}
              empty={week.isPending ? 'Loading…' : week.isError ? 'Couldn’t load today’s deliveries.' : 'No deliveries today.'}
              columns={[
                { key: 'customer', header: 'Customer', render: (d: DeliveryListItem) => <div><div style={{ fontWeight: 600 }}>{d.customerName}</div><div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{d.isOneOff ? 'One-off delivery' : d.subscriptionDisplayName ?? d.subscriptionName}</div></div> },
                { key: 'work', header: 'Work', render: d => <WorkCell d={d} /> },
                { key: 'payment', header: 'Payment', render: d => <PaymentStatusBadge status={d.paymentStatus} /> },
              ]} />
          </Card>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {dispatch.isEnabled ? (
            <Card tone="brand" eyebrow="Today’s dispatch" title={dispatch.data ? plural(dispatch.data.deliveryCount, 'local stop') : 'Dispatch'}>
              <div style={{ fontSize: 14.5, color: 'var(--teal-100)', marginBottom: 14 }}>
                {dispatch.data?.statusLine ?? (dispatch.isError ? 'Couldn’t load the dispatch board.' : 'Loading…')}
                {dispatch.data?.notYetPackedCount ? <> {plural(dispatch.data.notYetPackedCount, 'box', 'boxes')} still to pack.</> : null}
              </div>
              <Button variant="cream" size="sm" iconLeft="route" onClick={() => navigate('/dispatch')}>Open dispatch</Button>
            </Card>
          ) : null}
          {toOrder.isEnabled ? (
            <Card title="To order" eyebrow="This week"
              actions={pendingProducts.length ? <Button variant="ghost" size="sm" iconRight="chevron-right" onClick={() => navigate(`/procurement?from=${today}&to=${weekEnd}`)}>Procurement</Button> : null}>
              {pendingProducts.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14.5 }}>
                  {[...pendingProducts].sort((a, b) => b.pendingQuantity - a.pendingQuantity).slice(0, 6).map(p => (
                    <div key={p.productId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span>{p.productName}</span><strong style={{ fontVariantNumeric: 'tabular-nums' }}>{p.pendingQuantity}</strong>
                    </div>
                  ))}
                  {pendingProducts.length > 6 ? <Muted>and {plural(pendingProducts.length - 6, 'more product')}</Muted> : null}
                </div>
              ) : <Muted>{toOrder.isPending ? 'Loading…' : toOrder.isError ? 'Couldn’t load procurement.' : 'Everything for this week is ordered.'}</Muted>}
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** "Dana, Bo and 3 others". */
function names(list: string[]) {
  const unique = [...new Set(list)];
  if (unique.length <= 2) return unique.join(' and ');
  return `${unique.slice(0, 2).join(', ')} and ${plural(unique.length - 2, 'other')}`;
}

/** A stat card that opens the screen behind the number. */
function Tile({ label, icon, to, value, caption, loading, error, warn }: {
  label: string; icon: IconName; to: string; value: number; caption: ReactNode; loading: boolean; error: boolean; warn?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(to)} aria-label={`${label}: ${loading ? 'loading' : error ? 'couldn’t load' : value}`}
      style={{ all: 'unset', cursor: 'pointer', display: 'block', borderRadius: 'var(--radius-md)' }} className="dash-tile">
      <StatCard label={label} icon={icon} value={loading ? '…' : error ? '—' : value}
        caption={error ? 'Couldn’t load' : loading ? ' ' : caption}
        style={warn && !loading && !error ? { borderColor: 'var(--status-warning-fg)' } : undefined} />
    </button>
  );
}
