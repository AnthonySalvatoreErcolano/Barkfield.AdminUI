// The load list (PAGES.md §8): the sheet staff pack and load a van from.
//   - Stops arrive in LOADING order — the reverse of driving order — and are shown exactly as given. The
//     first one goes in first, at the back; the last is nearest the doors and is the first drop.
//   - A stop is a doorstep: two boxes for one door are one stop, each box ticked on its own.
//   - Quantities are what is actually going (quantityToLoad); a substitute is named by what's in the box.
//   - A pulled-back route is stale, and this is the screen staff are holding — so it says so, loudly.
//   - Ticks are optimistic; a failed one snaps back and says so.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { errorMessage } from '../../api/errors';
import { PaymentStatus } from '../../api/generated/enums';
import type { LoadList, LoadListDelivery, LoadListStop } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { PaymentStatusBadge } from '../../app/statusBadges';
import { useToast } from '../../app/toast';
import { injectStyles } from '../../ui/injectStyles';
import { formatDay, plural } from '../../lib/format';
import { useApi, useSession } from '../../session/SessionProvider';
import { Alert, Badge, Breadcrumbs, Button, Card, Checkbox, Muted } from '../../ui';
import { dispatchKeys } from './keys';

const PRINT_CSS = '@media print{.br-side,.app__top,.no-print{display:none!important}.app{height:auto;display:block}.app__scroll{overflow:visible}.app__content{padding:0;max-width:none}body,.app{background:#fff}.load-stop{break-inside:avoid}}';
const timeOf = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null);

export function LoadListPage() {
  injectStyles('load-list-print', PRINT_CSS);
  const { routeId = '' } = useParams();
  const api = useApi();
  const navigate = useNavigate();
  const { data, error, refetch } = useQuery({
    queryKey: dispatchKeys.loadList(routeId),
    queryFn: ({ signal }) => api.dispatch.loadList(routeId, signal),
    // Routific republishes on every change; keep the sheet current while it's open.
    refetchInterval: 30_000,
  });
  if (error && !data) return <LoadError error={error} onRetry={() => refetch()} what="the load list" />;
  if (!data) return <p style={{ color: 'var(--text-muted)' }}>Loading…</p>;

  // Ad-hoc stops can't be ticked yet (no row id on the stop), so progress counts doorsteps with boxes.
  // Drop this once the API puts routeStopIds on every stop.
  const doorsteps = data.stops.filter(s => !s.isAdHoc);
  const loaded = doorsteps.filter(s => s.isLoaded).length;
  const unpaid = data.unpaidStops ?? data.stops.filter(s => s.hasUnpaidDelivery);

  return (
    <div>
      <PageHeader title={`${data.routeName} load list`}
        actions={<span className="no-print"><Button iconLeft="printer" variant="secondary" onClick={() => window.print()}>Print</Button></span>}>
        <div className="no-print">
          <Breadcrumbs style={{ marginBottom: 14 }} onNavigate={navigate}
            items={[{ label: 'Dispatch', href: `/dispatch?date=${data.scheduledDate.slice(0, 10)}` }, { label: data.routeName }]} />
        </div>
      </PageHeader>
      <p style={{ margin: '-12px 0 16px', fontSize: 15 }}>
        {formatDay(data.scheduledDate, 'long')} · {data.driverName ? `Driver ${data.driverName}` : 'No driver yet'} ·{' '}
        <strong>{loaded} of {plural(doorsteps.length, 'doorstep')} loaded</strong> · {plural(data.totalUnits, 'item')} in all
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {data.isStale ? (
          <Alert tone="danger" title="This plan is out of date — stop loading">
            The dispatcher pulled this route back to re-plan it in Routific. What’s below is the last plan, not the current one; boxes already
            in the van may need to move. Ticks you make still count.
          </Alert>
        ) : null}
        {unpaid.length ? (
          <Alert tone="warning" title={`${plural(unpaid.length, 'stop')} not paid for`}>
            {unpaid.map(s => s.label).join(', ')} — fix the card before the van leaves, or have the box withdrawn on the dispatch screen.
          </Alert>
        ) : null}
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
          In loading order: <strong>1 goes in first</strong>, at the back. The last one is nearest the doors — it’s the first drop.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.stops.map(s => <StopCard key={`${s.externalStopId}-${s.sequenceOrder}`} stop={s} routeId={data.routeId} />)}
      </div>
    </div>
  );
}

function StopCard({ stop: s, routeId }: { stop: LoadListStop; routeId: string }) {
  const arrival = timeOf(s.plannedArrival);
  return (
    <div className="load-stop">
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '64px minmax(0,1fr)', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 34, lineHeight: 1, color: s.isLoaded ? 'var(--status-success-fg)' : 'var(--teal-500)' }}>{s.loadingPosition}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>drop {s.sequenceOrder}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: 17 }}>{s.label}</strong>
              {s.isAdHoc ? <Badge tone="neutral">Added in Routific</Badge> : s.isLoaded ? <Badge tone="success" dot>In the van</Badge> : null}
              {s.deliveries.length > 1 ? <Badge tone="info">{s.deliveries.length} boxes, one door</Badge> : null}
              {s.hasShortage ? <Badge tone="warning">Something short</Badge> : null}
            </div>
            <div style={{ fontSize: 14.5, color: 'var(--ink-700)' }}>{s.address}{arrival ? ` · around ${arrival}` : ''}</div>
            {s.accessNotes ? (
              <div style={{ background: 'var(--status-warning-bg)', color: 'var(--status-warning-fg)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: 14.5 }}>
                <strong>At the door:</strong> {s.accessNotes}
              </div>
            ) : null}
            {s.phoneNumbers?.length ? <div style={{ fontSize: 14 }}>{s.phoneNumbers.map(p => <a key={p} href={`tel:${p}`} style={{ marginRight: 12 }}>{p}</a>)}</div> : null}
            {s.isAdHoc
              ? <Muted>Nothing to load — the driver still stops here.</Muted>
              : s.deliveries.map(d => <BoxRow key={d.routeStopId} delivery={d} routeId={routeId} />)}
          </div>
        </div>
      </Card>
    </div>
  );
}

function BoxRow({ delivery: d, routeId }: { delivery: LoadListDelivery; routeId: string }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { canCall } = useSession();
  const key = dispatchKeys.loadList(routeId);

  const tick = useMutation({
    mutationFn: (loaded: boolean) => api.dispatch.setStopLoaded(routeId, d.routeStopId, loaded),
    onMutate: async loaded => {
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueryData<LoadList>(key);
      if (before) queryClient.setQueryData<LoadList>(key, withTick(before, d.routeStopId, loaded));
      return { before };
    },
    onError: (err, _loaded, ctx) => {
      if (ctx?.before) queryClient.setQueryData(key, ctx.before);
      toast({ tone: 'danger', title: `Couldn’t record ${d.customerName}’s box`, message: errorMessage(err) });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: dispatchKeys.all }),
  });

  return (
    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {canCall('PUT /api/dispatch/routes/{routeId}/stops/{routeStopId}/loaded')
          ? <Checkbox checked={d.isLoaded} onChange={on => tick.mutate(on)} aria-label={`${d.customerName}’s box is in the van`}
              label={<strong>{d.customerName}</strong>} description={d.subscriptionName ?? undefined} />
          : <span><strong>{d.customerName}</strong>{d.subscriptionName ? <span style={{ color: 'var(--text-muted)' }}> · {d.subscriptionName}</span> : null}{d.isLoaded ? <> <Badge tone="success">In the van</Badge></> : null}</span>}
        {d.paymentStatus !== PaymentStatus.Paid ? <PaymentStatusBadge status={d.paymentStatus} /> : null}
      </div>
      <ul style={{ margin: 0, paddingLeft: 30, display: 'flex', flexDirection: 'column', gap: 3, fontSize: 14.5 }}>
        {d.lines.map(l => (
          <li key={l.id} style={l.quantityToLoad === 0 ? { textDecoration: 'line-through', color: 'var(--text-muted)' } : undefined}>
            <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{l.quantityToLoad} ×</strong> {l.displayName}
            {l.wasSubstituted ? <span style={{ color: 'var(--text-muted)' }}> (instead of {l.productName})</span> : null}
            {l.quantityToLoad === 0 ? <span> — not going</span> : l.isShort ? <span style={{ color: 'var(--status-warning-fg)' }}> — {l.quantity} ordered</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The sheet with one box ticked in or out, and its doorstep's state recomputed — every box, not one. */
function withTick(list: LoadList, routeStopId: string, loaded: boolean): LoadList {
  const stops = list.stops.map(s => {
    if (!s.deliveries.some(d => d.routeStopId === routeStopId)) return s;
    const deliveries = s.deliveries.map(d => (d.routeStopId === routeStopId ? { ...d, isLoaded: loaded } : d));
    return { ...s, deliveries, isLoaded: deliveries.every(d => d.isLoaded) };
  });
  return { ...list, stops, loadedStopCount: stops.filter(s => s.isLoaded).length, isFullyLoaded: stops.length > 0 && stops.every(s => s.isLoaded) };
}
