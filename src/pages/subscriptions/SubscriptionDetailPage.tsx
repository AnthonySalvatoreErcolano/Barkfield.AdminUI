// Subscription detail (PAGES.md §5): the schedule panel, standing items, rotation groups, add-ons, and
// what the next few boxes will hold.
//   - Frequency is a number plus a unit. A pause is dated or open, and the screen says which.
//   - Cancel is permanent, confirmed as such.
//   - A rotation group is an ordered ring: reorderable, with "next up" marked and a jump-to for a
//     customer who asks for something out of turn. It can be paused on its own.
//   - Add-ons are one-offs for the next delivery — said plainly, or they get used for standing items.
import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SubscriptionStatus } from '../../api/generated/enums';
import type { RotationGroup, SubscriptionDetail } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { QuantityEditor } from '../../app/QuantityEditor';
import { FULFILLMENT_LABEL, SubscriptionStatusBadge } from '../../app/statusBadges';
import { useSerialWrites } from '../../app/useSerialWrites';
import { WriteDialog } from '../../app/WriteDialog';
import { formatDay, formatInstant, formatMoney, plural } from '../../lib/format';
import { useApi, useSession } from '../../session/SessionProvider';
import { Alert, Badge, Breadcrumbs, Button, buttonClass, Card, DataTable, DetailField, DropdownMenu, Icon, IconButton, Muted, Tooltip, type DataTableColumn } from '../../ui';
import { customerKeys } from '../customers/keys';
import { deliveryKeys } from '../deliveries/keys';
import { subscriptionKeys } from './keys';
import { AddProductDialog, CancelDialog, FrequencyDialog, GroupNameDialog, MethodDialog, PauseDialog, RenameDialog, RescheduleDialog } from './SubscriptionDialogs';

type Dialog =
  | { kind: 'frequency' | 'reschedule' | 'pause' | 'cancel' | 'rename' | 'method' | 'add-item' | 'add-addon' | 'add-group' }
  | { kind: 'rename-group' | 'add-rotation-item' | 'remove-group'; group: RotationGroup };

export function SubscriptionDetailPage() {
  const { subscriptionId = '' } = useParams();
  const api = useApi();
  const { data, error, refetch } = useQuery({
    queryKey: subscriptionKeys.detail(subscriptionId),
    queryFn: ({ signal }) => api.subscriptions.get(subscriptionId, signal),
  });
  if (error && !data) return <LoadError error={error} onRetry={() => refetch()} what="this subscription" />;
  if (!data) return <p style={{ color: 'var(--text-muted)' }}>Loading…</p>;
  return <SubscriptionView sub={data} />;
}

function SubscriptionView({ sub }: { sub: SubscriptionDetail }) {
  const api = useApi();
  const navigate = useNavigate();
  const { canCall } = useSession();
  const canManage = canCall('PUT /api/subscriptions/{subscriptionId}/frequency');
  const writes = useSerialWrites({
    key: ['subscription', sub.id],
    invalidate: [subscriptionKeys.all, customerKeys.all, deliveryKeys.all],
    noun: 'subscription',
  });
  const { run, busy, problem, clearProblem } = writes;
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = () => setDialog(null);

  const canceled = sub.status === SubscriptionStatus.Canceled;
  const paused = sub.status === SubscriptionStatus.Paused;
  const isNew = sub.status === SubscriptionStatus.NewSignUp;
  const editable = canManage && !canceled;
  const name = sub.displayName ?? sub.name ?? 'Subscription';

  return (
    <div>
      <PageHeader
        title={name}
        eyebrow={<Link to={`/customers/${sub.customerId}`} style={{ color: 'inherit' }}>{sub.customerName}</Link>}
        actions={editable ? <>
          {isNew ? (
            sub.hasNothingScheduled
              ? <Tooltip content="Add a product or a rotation first" placement="bottom"><Button disabled>Activate</Button></Tooltip>
              : <Button iconLeft="play" disabled={busy} onClick={() => run(() => api.subscriptions.activate(sub.id), { title: 'Activated', message: `First delivery ${formatDay(sub.nextDeliveryDate, 'long')}.` })}>Activate</Button>
          ) : null}
          {paused ? <Button iconLeft="play" disabled={busy} onClick={() => run(() => api.subscriptions.resume(sub.id), { title: 'Resumed' })}>Resume</Button> : null}
          {sub.status === SubscriptionStatus.Active ? <>
            <Button variant="secondary" iconLeft="skip-forward" disabled={busy} onClick={() => run(() => api.subscriptions.skip(sub.id), { title: 'Next delivery skipped' })}>Skip next</Button>
            <Button variant="secondary" iconLeft="pause" disabled={busy} onClick={() => setDialog({ kind: 'pause' })}>Pause</Button>
          </> : null}
          <DropdownMenu align="right" triggerLabel="More actions"
            trigger={<span className={buttonClass('secondary')}>More <Icon name="chevron-down" size={16} /></span>}
            items={[
              { label: 'Rename', icon: 'pencil', onSelect: () => setDialog({ kind: 'rename' }) },
              { label: 'Change how it gets to them', icon: 'truck', onSelect: () => setDialog({ kind: 'method' }) },
              ...(paused ? [] : [{ label: 'Pause', icon: 'pause' as const, onSelect: () => setDialog({ kind: 'pause' }) }]),
              { divider: true },
              { label: 'Cancel subscription…', icon: 'trash-2', danger: true, onSelect: () => setDialog({ kind: 'cancel' }) },
            ]} />
        </> : undefined}
      >
        <Breadcrumbs style={{ marginBottom: 14 }} onNavigate={navigate} items={[{ label: 'Subscriptions', href: '/subscriptions' }, { label: name }]} />
      </PageHeader>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: -12, marginBottom: 20, flexWrap: 'wrap' }}>
        <SubscriptionStatusBadge status={sub.status} />
        <Badge tone="neutral">{sub.frequencyLabel}</Badge>
        <Badge tone="neutral">{FULFILLMENT_LABEL[sub.fulfillmentMethod]}</Badge>
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Signed up {formatInstant(sub.signUpDate)}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {problem ? <Alert tone={problem.tone} title={problem.title} onClose={clearProblem}>{problem.message}</Alert> : null}
        {canceled ? <Alert tone="info" title="Canceled — this is permanent">It won’t ship again. A returning customer gets a new subscription.</Alert> : null}
        {isNew ? <Alert tone="info" title="Not active yet">{sub.hasNothingScheduled ? 'Add what goes in the box, then activate it.' : 'When it’s activated, the first delivery is ' + formatDay(sub.nextDeliveryDate, 'long') + '.'}</Alert> : null}
        {paused ? (
          sub.isPauseExpired
            ? <Alert tone="warning" title={`The pause ended ${formatDay(sub.pausedUntil)}`}>It picks up again the next time deliveries are generated — or resume it now.</Alert>
            : sub.pausedUntil
              ? <Alert tone="info" title={`Paused until ${formatDay(sub.pausedUntil, 'long')}`}>A dated pause: it restarts on that day, and the next delivery is that day.</Alert>
              : <Alert tone="info" title="Paused — no end date">It stays paused until someone resumes it. Then the next delivery is worked out from that day.</Alert>
        ) : null}
        {!canceled && !isNew && sub.hasNothingScheduled ? <Alert tone="warning" title="Nothing to ship">No standing items and no active rotation — generation will pass it over.</Alert> : null}
        {sub.discontinuedProductNames?.length ? (
          <Alert tone="warning" title="Discontinued products">{sub.discontinuedProductNames?.join(', ')} can’t be added to a delivery any more. Swap them for something current.</Alert>
        ) : null}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <ItemsCard sub={sub} editable={editable} busy={busy} run={run} onAdd={() => setDialog({ kind: 'add-item' })} />
          {sub.rotationGroups.map(g => (
            <RotationCard key={g.id} sub={sub} group={g} editable={editable} busy={busy} run={run}
              onRename={() => setDialog({ kind: 'rename-group', group: g })} onAdd={() => setDialog({ kind: 'add-rotation-item', group: g })}
              onRemove={() => setDialog({ kind: 'remove-group', group: g })} />
          ))}
          {editable ? (
            <div><Button variant="secondary" iconLeft="repeat" disabled={busy} onClick={() => setDialog({ kind: 'add-group' })}>Add a rotation</Button></div>
          ) : null}
          <AddOnsCard sub={sub} editable={editable} busy={busy} run={run} onAdd={() => setDialog({ kind: 'add-addon' })} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ScheduleCard sub={sub} editable={editable} busy={busy} onEdit={kind => setDialog({ kind })} />
          {!canceled ? <UpcomingCard sub={sub} /> : null}
        </div>
      </div>

      {dialog?.kind === 'frequency' ? <FrequencyDialog sub={sub} run={run} onClose={close} /> : null}
      {dialog?.kind === 'reschedule' ? <RescheduleDialog sub={sub} run={run} onClose={close} /> : null}
      {dialog?.kind === 'pause' ? <PauseDialog sub={sub} run={run} onClose={close} /> : null}
      {dialog?.kind === 'cancel' ? <CancelDialog sub={sub} run={run} onClose={close} /> : null}
      {dialog?.kind === 'rename' ? <RenameDialog sub={sub} run={run} onClose={close} /> : null}
      {dialog?.kind === 'method' ? <MethodDialog sub={sub} run={run} onClose={close} /> : null}
      {dialog?.kind === 'add-item' ? (
        <AddProductDialog title="Add a standing item" description="Goes in every box." onClose={close}
          onSubmit={(p, q) => run(() => api.subscriptions.addItem(sub.id, { productId: p.id, quantity: q }), { title: `${p.name} added` })} />
      ) : null}
      {dialog?.kind === 'add-addon' ? (
        <AddProductDialog title="Add a one-off extra" withNote onClose={close}
          description="Next delivery only — it’s used up when that delivery is made. For something every time, add a standing item instead."
          onSubmit={(p, q, note) => run(() => api.subscriptions.addAddOn(sub.id, { productId: p.id, quantity: q, note }), { title: `${p.name} added to the next box` })} />
      ) : null}
      {dialog?.kind === 'add-group' ? (
        <GroupNameDialog title="New rotation" onClose={close} onSubmit={n => run(() => api.subscriptions.addRotationGroup(sub.id, n), { title: 'Rotation added', message: 'Now add the products it cycles through.' })} />
      ) : null}
      {dialog?.kind === 'rename-group' ? (
        <GroupNameDialog title="Rename rotation" initial={dialog.group.name} onClose={close}
          onSubmit={n => run(() => api.subscriptions.renameRotationGroup(sub.id, dialog.group.id, n), { title: 'Rotation renamed' })} />
      ) : null}
      {dialog?.kind === 'add-rotation-item' ? (
        <AddProductDialog title={`Add to ${dialog.group.name}`} description="It joins the end of the rotation." onClose={close}
          onSubmit={(p, q) => run(() => api.subscriptions.addRotationItem(sub.id, dialog.group.id, { productId: p.id, quantity: q }), { title: `${p.name} added to ${dialog.group.name}` })} />
      ) : null}
      {dialog?.kind === 'remove-group' ? (
        <WriteDialog title={`Remove ${dialog.group.name}?`} size="sm" danger submitLabel="Remove rotation" onClose={close}
          description="Its products stop coming. To stop it for a while instead, pause the rotation."
          onSubmit={() => run(() => api.subscriptions.removeRotationGroup(sub.id, dialog.group.id), { title: 'Rotation removed' })} />
      ) : null}
    </div>
  );
}

type Run = ReturnType<typeof useSerialWrites>['run'];

/** 'every 4 weeks' → 'Every 4 weeks' (sentence case, as the brand writes staff copy). */
const sentence = (text: string | null | undefined) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : '');

function ScheduleCard({ sub, editable, busy, onEdit }: { sub: SubscriptionDetail; editable: boolean; busy: boolean; onEdit: (kind: 'frequency' | 'reschedule' | 'method' | 'rename') => void }) {
  const edit = (kind: 'frequency' | 'reschedule' | 'method' | 'rename', what: string) =>
    editable ? <Button size="sm" variant="ghost" disabled={busy} onClick={() => onEdit(kind)} aria-label={`Change ${what}`}>Change</Button> : null;
  const row = (label: string, value: ReactNode, action: ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
      <DetailField label={label}>{value}</DetailField>{action}
    </div>
  );
  const next = sub.status === SubscriptionStatus.Canceled ? <Muted>—</Muted>
    : sub.status === SubscriptionStatus.Paused ? <Muted>{sub.pausedUntil ? `Resumes ${formatDay(sub.pausedUntil, 'long')}` : 'Paused — no end date'}</Muted>
    : formatDay(sub.nextDeliveryDate, 'long');
  return (
    <Card title="Schedule">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {row('Delivers', sentence(sub.frequencyLabel), edit('frequency', 'how often it ships'))}
        {row('Next delivery', next, sub.status === SubscriptionStatus.Paused ? null : edit('reschedule', 'the next delivery'))}
        {row('Last delivery', sub.lastDeliveryDate ? formatDay(sub.lastDeliveryDate, 'long') : <Muted>None yet</Muted>, null)}
        {row('How it gets to them', FULFILLMENT_LABEL[sub.fulfillmentMethod], edit('method', 'how it gets to them'))}
        {row('Name', sub.name ?? <Muted>None — shows as “{sub.frequencyLabel}”</Muted>, edit('rename', 'the name'))}
      </div>
    </Card>
  );
}

function ItemsCard({ sub, editable, busy, run, onAdd }: { sub: SubscriptionDetail; editable: boolean; busy: boolean; run: Run; onAdd: () => void }) {
  const api = useApi();
  const columns: DataTableColumn<SubscriptionDetail['items'][number]>[] = [
    { key: 'product', header: 'Product', render: i => <span>{i.productName}{!i.productIsActive ? <> <Badge tone="warning">Discontinued</Badge></> : null}</span> },
    { key: 'qty', header: 'Qty', align: 'right', render: i => editable ? <QuantityEditor value={i.quantity} label={`Quantity of ${i.productName}`} disabled={busy} onSave={q => run(() => api.subscriptions.changeItemQuantity(sub.id, i.productId, q), { title: 'Quantity changed' })} /> : i.quantity },
    { key: 'price', header: 'Each', align: 'right', render: i => formatMoney(i.unitPrice) },
    { key: 'total', header: 'Line', align: 'right', render: i => formatMoney(i.lineTotal) },
    ...(editable ? [{ key: 'remove', header: '', width: 50, align: 'right' as const, render: (i: SubscriptionDetail['items'][number]) => <IconButton icon="trash-2" size="sm" label={`Remove ${i.productName}`} disabled={busy} onClick={() => run(() => api.subscriptions.removeItem(sub.id, i.productId), { title: `${i.productName} removed` })} /> }] : []),
  ];
  return (
    <Card flush title="Every box" eyebrow="Standing items"
      actions={editable ? <Button size="sm" variant="secondary" iconLeft="plus" disabled={busy} onClick={onAdd}>Add product</Button> : undefined}>
      <DataTable rows={sub.items} rowKey={i => i.id} columns={columns} density="compact" empty="No standing items." />
    </Card>
  );
}

function RotationCard({ sub, group: g, editable, busy, run, onRename, onAdd, onRemove }: {
  sub: SubscriptionDetail; group: RotationGroup; editable: boolean; busy: boolean; run: Run;
  onRename: () => void; onAdd: () => void; onRemove: () => void;
}) {
  const api = useApi();
  const items = [...g.items].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const move = (index: number, by: -1 | 1) => {
    const order = items.map(i => i.id);
    const [moved] = order.splice(index, 1);
    order.splice(index + by, 0, moved!);
    return run(() => api.subscriptions.reorderRotation(sub.id, g.id, order), { title: 'Rotation reordered' });
  };
  return (
    <Card eyebrow="Rotation" title={g.name}
      actions={<span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
        {!g.isActive ? <Badge tone="warning">Paused</Badge> : null}
        {editable ? (
          <DropdownMenu align="right" triggerLabel={`Actions for ${g.name}`} trigger={<span className={buttonClass('ghost', 'sm')}><Icon name="ellipsis" size={16} /></span>}
            items={[
              { label: 'Add a product', icon: 'plus', onSelect: onAdd },
              { label: 'Rename', icon: 'pencil', onSelect: onRename },
              g.isActive
                ? { label: 'Pause this rotation', icon: 'pause', onSelect: () => { void run(() => api.subscriptions.pauseRotationGroup(sub.id, g.id), { title: `${g.name} paused`, message: 'The rest of the box still ships.' }); } }
                : { label: 'Resume this rotation', icon: 'play', onSelect: () => { void run(() => api.subscriptions.resumeRotationGroup(sub.id, g.id), { title: `${g.name} resumed` }); } },
              { divider: true },
              { label: 'Remove rotation…', icon: 'trash-2', danger: true, onSelect: onRemove },
            ]} />
        ) : null}
      </span>}>
      <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-secondary)' }}>
        {g.isActive ? 'One of these per delivery, in order, going round.' : 'Paused — nothing from this rotation ships until it’s resumed. The rest of the box is unaffected.'}
        {g.completedCycles ? ` ${plural(g.completedCycles, 'full round')} so far.` : ''}
      </p>
      {items.length === 0 ? <Muted>Empty — add the products it should cycle through.</Muted> : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }} aria-label={`${g.name} order`}>
          {items.map((item, index) => {
            const upNext = g.currentItem?.id === item.id;
            return (
              <li key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-md)',
                border: `1px solid ${upNext ? 'var(--teal-300)' : 'var(--border-subtle)'}`, background: upNext ? 'var(--surface-selected)' : 'var(--surface-card)',
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-muted)', width: 18, textAlign: 'right' }}>{index + 1}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  {item.productName}{!item.productIsActive ? <> <Badge tone="warning">Discontinued</Badge></> : null}
                  {upNext ? <> <Badge tone={g.isActive ? 'brand' : 'neutral'} dot>Next up</Badge></> : null}
                </span>
                {editable ? <QuantityEditor value={item.quantity} label={`Quantity of ${item.productName}`} disabled={busy}
                  onSave={q => run(() => api.subscriptions.changeRotationItemQuantity(sub.id, g.id, item.id, q), { title: 'Quantity changed' })} /> : <span>×{item.quantity}</span>}
                {editable ? <>
                  {!upNext ? <Button size="sm" variant="ghost" disabled={busy} aria-label={`Send ${item.productName} next`}
                    onClick={() => run(() => api.subscriptions.jumpTo(sub.id, g.id, item.id), { title: `${item.productName} goes next` })}>Send next</Button> : null}
                  <IconButton icon="chevron-up" size="sm" label={`Move ${item.productName} up`} disabled={busy || index === 0} onClick={() => move(index, -1)} />
                  <IconButton icon="chevron-down" size="sm" label={`Move ${item.productName} down`} disabled={busy || index === items.length - 1} onClick={() => move(index, 1)} />
                  <IconButton icon="trash-2" size="sm" label={`Remove ${item.productName} from ${g.name}`} disabled={busy}
                    onClick={() => run(() => api.subscriptions.removeRotationItem(sub.id, g.id, item.id), { title: `${item.productName} removed` })} />
                </> : null}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

function AddOnsCard({ sub, editable, busy, run, onAdd }: { sub: SubscriptionDetail; editable: boolean; busy: boolean; run: Run; onAdd: () => void }) {
  const api = useApi();
  return (
    <Card eyebrow="Next box only" title="One-off extras"
      actions={editable ? <Button size="sm" variant="secondary" iconLeft="plus" disabled={busy} onClick={onAdd}>Add extra</Button> : undefined}>
      <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-secondary)' }}>
        Used once — they ride on the next delivery and are gone after that. For something wanted every time, add a standing item instead.
      </p>
      {sub.pendingAddOns.length === 0 ? <Muted>No extras waiting.</Muted> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sub.pendingAddOns.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ flex: 1, minWidth: 0 }}>{a.productName}{a.note ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{a.note}</div> : null}</span>
              {editable ? <QuantityEditor value={a.quantity} label={`Quantity of ${a.productName}`} disabled={busy}
                onSave={q => run(() => api.subscriptions.changeAddOnQuantity(sub.id, a.id, q), { title: 'Quantity changed' })} /> : <span>×{a.quantity}</span>}
              <span style={{ width: 80, textAlign: 'right' }}>{formatMoney(a.lineTotal)}</span>
              {editable ? <IconButton icon="trash-2" size="sm" label={`Remove ${a.productName}`} disabled={busy}
                onClick={() => run(() => api.subscriptions.removeAddOn(sub.id, a.id), { title: `${a.productName} removed` })} /> : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function UpcomingCard({ sub }: { sub: SubscriptionDetail }) {
  const api = useApi();
  const cycles = 4;
  const { data, error } = useQuery({
    queryKey: subscriptionKeys.upcoming(sub.id, cycles),
    queryFn: () => api.subscriptions.upcoming(sub.id, cycles),
  });
  return (
    <Card title="Coming up" eyebrow={sub.status === SubscriptionStatus.Paused ? 'Once resumed' : sub.status === SubscriptionStatus.NewSignUp ? 'Once activated' : `Next ${cycles} boxes`}>
      {error ? <Muted>Couldn’t load the preview.</Muted> : !data ? <Muted>Loading…</Muted> : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {data.map((box, i) => (
            <div key={i} style={{ padding: '10px 0', borderTop: i ? '1px solid var(--border-subtle)' : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontWeight: 600 }}>
                <span>{sub.status === SubscriptionStatus.Paused ? `Box ${box.cycleNumber}` : formatDay(box.deliveryDate)}</span>
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 13.5 }}>{box.isEmpty ? 'Empty' : `about ${formatMoney(box.estimatedTotal)}`}</span>
              </div>
              {box.isEmpty ? <Muted>Nothing would ship.</Muted> : (
                <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 14 }}>
                  {box.lines.map((l, j) => (
                    <li key={j}>
                      {l.quantity}× {l.productName}
                      {l.source === 'Rotation' ? <Muted> · {l.sourceLabel ?? 'rotation'}</Muted> : null}
                      {l.source === 'AddOn' ? <> <Badge tone="info">one-off</Badge></> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Estimates at today’s prices — Square prices each box when it’s charged.</p>
        </div>
      )}
    </Card>
  );
}
