// Dispatch board (PAGES.md §8). Routes are built in Routific, not here: this sends the day's packed
// deliveries over as orders, shows what came back, and pulls out the ones that shouldn't go.
//
// The top of the screen is built around `stage`. Two states matter most:
//   - SentAwaitingRoutes: everything's gone and no route is back yet. Without saying so, the screen
//     looks like nothing happened and someone sends the day twice — Routific would book them twice.
//   - PulledBack: a dispatcher withdrew a route to re-plan it. The plan on screen is stale and staff may
//     be loading against it. The loudest thing on the page.
import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CredentialError, errorMessage } from '../../api/errors';
import { DeliveryStatus, DispatchStage, PaymentStatus } from '../../api/generated/enums';
import type { DeliveryListItem, DispatchBoard, DispatchSendResult, RouteListItem } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { DeliveryStatusBadge, PaymentStatusBadge } from '../../app/statusBadges';
import { useListParams } from '../../app/lists';
import { useToast } from '../../app/toast';
import { addDays, todayIso } from '../../lib/dates';
import { formatDay, plural } from '../../lib/format';
import { Can, useApi } from '../../session/SessionProvider';
import { Alert, Badge, Button, Card, Chip, DataTable, Dialog, Input, Muted } from '../../ui';
import { deliveryKeys } from '../deliveries/keys';
import { dispatchKeys } from './keys';

const timeOf = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '');

export function DispatchPage() {
  const api = useApi();
  const navigate = useNavigate();
  const list = useListParams('/api/deliveries');
  const date = list.value('date', todayIso());
  const setDate = (d: string) => list.setValues({ date: d === todayIso() ? null : d });

  const { data: board, error, refetch, isFetching } = useQuery({
    queryKey: dispatchKeys.board(date),
    queryFn: ({ signal }) => api.dispatch.board(date, signal),
    // While routes are expected back from Routific (by webhook), keep looking.
    refetchInterval: q => (q.state.data && ([DispatchStage.SentAwaitingRoutes, DispatchStage.PartiallySent, DispatchStage.RoutesPublished, DispatchStage.PulledBack] as number[])
      .includes(q.state.data.stage as number) ? 30_000 : false),
  });

  return (
    <div>
      <PageHeader title="Dispatch"
        actions={<Button variant="ghost" iconLeft="refresh-cw" onClick={() => refetch()} disabled={isFetching}>{isFetching ? 'Checking…' : 'Refresh'}</Button>} />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <Input type="date" size="sm" label="Day" value={date} onChange={e => { if (e.target.value) setDate(e.target.value); }} style={{ width: 170 }} />
        <Chip selected={date === todayIso()} onClick={() => setDate(todayIso())}>Today</Chip>
        <Chip selected={date === addDays(todayIso(), 1)} onClick={() => setDate(addDays(todayIso(), 1))}>Tomorrow</Chip>
      </div>
      {error && !board ? <LoadError error={error} onRetry={() => refetch()} what="the dispatch board" />
        : !board ? <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
        : <Board board={board} date={date} onOpenRoute={r => navigate(`/dispatch/routes/${r.id}`)} />}
    </div>
  );
}

function Board({ board, date, onOpenRoute }: { board: DispatchBoard; date: string; onOpenRoute: (r: RouteListItem) => void }) {
  const navigate = useNavigate();
  const [sending, setSending] = useState<{ ids: string[] | null } | null>(null);
  const [result, setResult] = useState<DispatchSendResult | null>(null);
  const [withdrawing, setWithdrawing] = useState<DeliveryListItem | null>(null);
  const [credentialError, setCredentialError] = useState<string | null>(null);

  const rows = board.deliveries;
  const unsentPacked = rows.filter(d => !d.sentToRoutingAt && d.status === DeliveryStatus.Packed);
  const unpacked = rows.filter(d => !d.sentToRoutingAt && d.status === DeliveryStatus.Scheduled);
  const firstSend = board.sentCount === 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {credentialError ? (
        <Alert tone="danger" title="Routific refused our credentials" onClose={() => setCredentialError(null)}>
          {credentialError} Sending won’t work until an administrator issues a new Routific token — trying again won’t help.
        </Alert>
      ) : null}

      <StageBanner board={board} date={date}
        action={<Can call="POST /api/dispatch/send">
          {unsentPacked.length ? (
            <Button variant={firstSend ? 'accent' : 'secondary'} iconLeft="route"
              onClick={() => setSending({ ids: firstSend ? null : unsentPacked.map(d => d.id) })}>
              {firstSend ? `Send ${plural(unsentPacked.length, 'packed delivery', 'packed deliveries')} for routing` : `Send the ${plural(unsentPacked.length, 'newly packed one', 'newly packed ones')}`}
            </Button>
          ) : null}
        </Can>} />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 14.5 }}>
        <Count label="Local deliveries" value={board.deliveryCount} />
        <Count label="Sent to Routific" value={board.sentCount} />
        <Count label="Not packed yet" value={board.notYetPackedCount} warn={board.notYetPackedCount > 0 && board.sentCount > 0} />
        <Count label="Unpaid" value={board.unpaidCount} warn={board.unpaidCount > 0} />
        <Count label="Card refused" value={board.paymentFailedCount} danger={board.paymentFailedCount > 0} onClick={board.paymentFailedCount ? () => navigate(`/billing?date=${date}`) : undefined} />
      </div>

      {board.routes.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {board.routes.map(r => <RouteCard key={r.id} route={r} onOpen={() => onOpenRoute(r)} />)}
        </div>
      ) : null}

      <Card title={`Deliveries on ${formatDay(date, 'long')}`} flush>
        <DataTable rows={rows} rowKey={d => d.id} onRowClick={d => navigate(`/deliveries/${d.id}`)}
          empty="No local deliveries this day. Pickup and shipped orders don’t go through dispatch."
          columns={[
            { key: 'customer', header: 'Customer', render: d => <div><div style={{ fontWeight: 600 }}>{d.customerName}</div><div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{d.deliveryCity ?? 'No town'}</div></div> },
            { key: 'box', header: 'Box', render: d => <DeliveryStatusBadge status={d.status} /> },
            {
              key: 'payment', header: 'Payment',
              render: d => <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                <PaymentStatusBadge status={d.paymentStatus} />
                {d.paymentStatus === PaymentStatus.Failed ? <span style={{ fontSize: 12.5, color: 'var(--status-danger-fg)' }}>Fix the card or pull them</span> : null}
              </span>,
            },
            {
              key: 'routing', header: 'Routific',
              render: d => d.sentToRoutingAt ? <span>Sent {timeOf(d.sentToRoutingAt)}</span>
                : d.isClosed ? <Muted>—</Muted>
                : d.status === DeliveryStatus.Packed ? <Badge tone="warning">Not sent</Badge>
                : <Muted>Waiting to be packed</Muted>,
            },
            {
              key: 'actions', header: '', align: 'right', width: 130,
              render: d => <span onClick={e => e.stopPropagation()}><Can call="POST /api/dispatch/send">
                {d.sentToRoutingAt && !d.isClosed
                  ? <Button size="sm" variant="ghost" onClick={() => setWithdrawing(d)}>Withdraw</Button>
                  : !d.sentToRoutingAt && d.status === DeliveryStatus.Packed && !firstSend
                    ? <Button size="sm" variant="ghost" onClick={() => setSending({ ids: [d.id] })}>Send</Button>
                    : null}
              </Can></span>,
            },
          ]} />
      </Card>
      {unpacked.length && firstSend ? (
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
          Only packed boxes go to Routific. {plural(unpacked.length, 'delivery isn’t', 'deliveries aren’t')} packed yet — send them once they are.
        </p>
      ) : null}

      {sending ? (
        <SendDialog date={date} board={board} ids={sending.ids} onClose={() => setSending(null)}
          onDone={r => { setSending(null); setResult(r); }}
          onCredentialError={m => { setSending(null); setCredentialError(m); }} />
      ) : null}
      {result ? <SendResultDialog result={result} onClose={() => setResult(null)} /> : null}
      {withdrawing ? <WithdrawDialog delivery={withdrawing} routesPublished={board.routes.some(r => !r.isClosed)} onClose={() => setWithdrawing(null)}
        onCredentialError={m => { setWithdrawing(null); setCredentialError(m); }} /> : null}
    </div>
  );
}

function StageBanner({ board, date, action }: { board: DispatchBoard; date: string; action: ReactNode }) {
  const stage = board.stage as number;
  const sentAt = board.firstSentAt ? timeOf(board.firstSentAt) : null;
  switch (stage) {
    case DispatchStage.PulledBack:
      return (
        <Alert tone="danger" title="Stop loading — a route was pulled back for re-planning" action={action}>
          {board.statusLine} A dispatcher is changing it in Routific. Anything already in the van may be on the wrong route; wait for the new plan
          before loading more.
        </Alert>
      );
    case DispatchStage.SentAwaitingRoutes:
      return (
        <Alert tone="info" title={`Sent${sentAt ? ` at ${sentAt}` : ''} — waiting for a route`} action={action}>
          {board.statusLine} Everything packed has gone to Routific; a dispatcher builds and publishes the route there, and it appears here on its own.
          <strong> Don’t send the day again</strong> — Routific would book each customer twice.
        </Alert>
      );
    case DispatchStage.PartiallySent:
      return (
        <Alert tone="warning" title="Some deliveries haven’t gone yet" action={action}>
          {board.statusLine} Send the rest once they’re packed. Already-sent ones are skipped, never sent twice — so don’t worry about pressing Send again.
        </Alert>
      );
    case DispatchStage.RoutesPublished:
      return (
        <Alert tone="success" title="Route published" action={action}>
          {board.statusLine} Load the van from the load list.
          {board.unsentCount ? ` ${plural(board.unsentCount, 'delivery isn’t', 'deliveries aren’t')} on it — Routific won’t add orders to a published route, so sending more means the dispatcher re-plans.` : ''}
        </Alert>
      );
    case DispatchStage.ReadyToSend:
      // The API's line counts with the send's own test, so it never promises a send the button would skip.
      return (
        <Alert tone="info" title={board.readyToSendCount ? `Ready to send ${date === todayIso() ? 'today' : formatDay(date)}` : 'Waiting for boxes to be packed'}
          action={board.readyToSendCount ? action : null}>
          {board.statusLine} Only packed boxes go to Routific.
        </Alert>
      );
    default:
      return <Alert tone="info" title="Nothing to dispatch">{board.statusLine}</Alert>;
  }
}

function Count({ label, value, warn, danger, onClick }: { label: string; value: number; warn?: boolean; danger?: boolean; onClick?: () => void }) {
  const color = danger ? 'var(--status-danger-fg)' : warn ? 'var(--status-warning-fg)' : 'var(--text-primary)';
  const body = <><strong style={{ fontSize: 18, color, fontVariantNumeric: 'tabular-nums' }}>{value}</strong> <span style={{ color: 'var(--text-muted)' }}>{label}</span></>;
  const style = { padding: '8px 14px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)' };
  return onClick
    ? <button type="button" onClick={onClick} style={{ ...style, cursor: 'pointer', font: 'inherit' }}>{body}</button>
    : <span style={style}>{body}</span>;
}

function RouteCard({ route: r, onOpen }: { route: RouteListItem; onOpen: () => void }) {
  return (
    <Card tone={r.wasPulledBack ? 'default' : 'brand'} eyebrow={r.driverName ? `Driver: ${r.driverName}` : 'No driver yet'}
      title={<span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>{r.name}{r.wasPulledBack ? <Badge tone="danger" dot>Pulled back</Badge> : null}</span>}>
      <div style={{ fontSize: 14.5, marginBottom: 12, color: r.wasPulledBack ? undefined : 'var(--teal-100)' }}>
        {r.loadedStopCount} of {plural(r.stopCount, 'stop')} loaded
        {r.adHocStopCount ? ` (${r.adHocStopCount} added in Routific)` : ''}
        {r.publishedAt ? ` · published ${timeOf(r.publishedAt)}` : ''}
      </div>
      <Button variant={r.wasPulledBack ? 'secondary' : 'cream'} size="sm" iconLeft="list" onClick={onOpen}>Open load list</Button>
    </Card>
  );
}

/** What will go and what won't, before anything is pushed — Routific can't take a send back cleanly. */
function SendDialog({ date, board, ids, onClose, onDone, onCredentialError }: {
  date: string; board: DispatchBoard; ids: string[] | null; onClose: () => void;
  onDone: (r: DispatchSendResult) => void; onCredentialError: (message: string) => void;
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const send = useMutation({
    mutationFn: () => api.dispatch.send(date, ids ?? undefined),
    onSuccess: onDone,
    onError: err => { if (err instanceof CredentialError) onCredentialError(err.message); },
    onSettled: () => Promise.all([queryClient.invalidateQueries({ queryKey: dispatchKeys.all }), queryClient.invalidateQueries({ queryKey: deliveryKeys.all })]),
  });
  const going = board.deliveries.filter(d => !d.sentToRoutingAt && d.status === DeliveryStatus.Packed && (!ids || ids.includes(d.id)));
  const unpaid = going.filter(d => d.paymentStatus !== PaymentStatus.Paid);
  const notGoing = ids ? [] : board.deliveries.filter(d => !d.sentToRoutingAt && d.status === DeliveryStatus.Scheduled);

  return (
    <Dialog open size="md" onClose={send.isPending ? undefined : onClose}
      title={going.length === 1 && ids ? `Send ${going[0]!.customerName} to Routific?` : `Send ${plural(going.length, 'delivery', 'deliveries')} to Routific?`}
      description="Each becomes an order for the dispatcher to route. Already-sent deliveries are skipped, never sent twice."
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={send.isPending}>Cancel</Button>
        <Button iconLeft="route" onClick={() => send.mutate()} disabled={send.isPending || !going.length}>{send.isPending ? 'Sending…' : 'Send'}</Button>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 14.5 }}>{going.map(d => d.customerName).join(', ')}</div>
        {unpaid.length ? (
          <Alert tone="warning" title={`${plural(unpaid.length, 'of them hasn’t', 'of them haven’t')} paid`}>
            They go anyway — cards are often fixed before the van leaves. Withdraw any that aren’t: {unpaid.map(d => d.customerName).join(', ')}.
          </Alert>
        ) : null}
        {notGoing.length ? <Alert tone="info">Not packed, so not going: {notGoing.map(d => d.customerName).join(', ')}. Send them once they’re packed.</Alert> : null}
        {ids && board.routes.some(r => !r.isClosed) ? (
          <Alert tone="warning">A route is already published. Routific won’t put new orders on it — the dispatcher will have to re-plan.</Alert>
        ) : null}
        {send.error && !(send.error instanceof CredentialError) ? <Alert tone="danger">{errorMessage(send.error)} Nothing was sent twice — check the board before trying again.</Alert> : null}
      </div>
    </Dialog>
  );
}

/** All four outcomes, each named by customer. Partial failure is normal. */
function SendResultDialog({ result, onClose }: { result: DispatchSendResult; onClose: () => void }) {
  return (
    <Dialog open size="md" onClose={onClose} title={result.sentCount ? `Sent ${plural(result.sentCount, 'delivery', 'deliveries')} to Routific` : 'Nothing new was sent'}
      footer={<Button onClick={onClose}>Done</Button>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0 }}>
          <strong>{result.sentCount} sent</strong> · {result.alreadySentCount} already there (left alone) · {result.failures.length} refused · {result.skipped.length} skipped
        </p>
        {result.failures.length ? (
          <Alert tone="danger" title={`Routific refused ${plural(result.failures.length, 'order')}`}>
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{result.failures.map(f => <li key={f.deliveryId}><strong>{f.customerName}</strong> — {f.reason}</li>)}</ul>
          </Alert>
        ) : null}
        {result.skipped.length ? (
          <Alert tone="info" title={`Skipped ${plural(result.skipped.length, 'delivery', 'deliveries')}`}>
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{result.skipped.map(s => <li key={s.deliveryId}><strong>{s.customerName}</strong> — {s.reason}</li>)}</ul>
          </Alert>
        ) : null}
        {result.sentCount ? <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>The route appears here once a dispatcher publishes it in Routific.</p> : null}
      </div>
    </Dialog>
  );
}

function WithdrawDialog({ delivery, routesPublished, onClose, onCredentialError }: {
  delivery: DeliveryListItem; routesPublished: boolean; onClose: () => void; onCredentialError: (message: string) => void;
}) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const withdraw = useMutation({
    mutationFn: () => api.dispatch.withdraw(delivery.id),
    onSuccess: () => {
      toast({ title: `${delivery.customerName} withdrawn from Routific`, message: 'They can be sent again later.' });
      onClose();
    },
    onError: err => { if (err instanceof CredentialError) onCredentialError(err.message); },
    // A 409 here means the order did come out of Routific but this record still looks sent — the
    // reload shows that, and the message says to withdraw again.
    onSettled: () => Promise.all([queryClient.invalidateQueries({ queryKey: dispatchKeys.all }), queryClient.invalidateQueries({ queryKey: deliveryKeys.all })]),
  });
  return (
    <Dialog open size="sm" onClose={withdraw.isPending ? undefined : onClose} title={`Withdraw ${delivery.customerName}?`}
      description="Their order comes out of Routific. The delivery stays here, packed, and can be sent again."
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={withdraw.isPending}>Keep it</Button>
        <Button variant="danger" onClick={() => withdraw.mutate()} disabled={withdraw.isPending}>{withdraw.isPending ? 'Withdrawing…' : 'Withdraw'}</Button>
      </>}>
      {routesPublished ? <Alert tone="warning">If they’re on the published route, take their box off the van.</Alert> : null}
      {withdraw.error && !(withdraw.error instanceof CredentialError) ? <Alert tone="danger" style={{ marginTop: 12 }}>{errorMessage(withdraw.error)}</Alert> : null}
    </Dialog>
  );
}

