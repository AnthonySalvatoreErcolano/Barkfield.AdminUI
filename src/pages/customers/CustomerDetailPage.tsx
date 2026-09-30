// Customer detail (PAGES.md §2): contact, delivery details, the Square link, and tabs for pets,
// subscriptions and deliveries — each tab its own call, each gated on its own permission.
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { errorMessage } from '../../api/errors';
import { SubscriptionStatus } from '../../api/generated/enums';
import type { CustomerDetail } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { DeliveryStatusBadge, PaymentStatusBadge, SubscriptionStatusBadge } from '../../app/statusBadges';
import { useToast } from '../../app/toast';
import { formatDay, formatInstant, formatMoney, formatPhone, formatTime, plural } from '../../lib/format';
import { Can, useApi, useSession } from '../../session/SessionProvider';
import { Alert, Badge, Breadcrumbs, Button, Card, Chip, DataTable, DetailField, Dialog, Muted, Pagination, Tabs } from '../../ui';
import { NextDelivery } from '../subscriptions/SubscriptionsListPage';
import { DeliveryDetailsDialog } from './DeliveryDetailsDialog';
import { customerKeys } from './keys';

/** Passed in navigation state after a save whose Square half did not go through. */
export interface CustomerDetailState {
  squareError?: string | null;
}



export function CustomerDetailPage() {
  const { customerId = '' } = useParams();
  const api = useApi();
  const { data, error, refetch } = useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn: ({ signal }) => api.customers.get(customerId, signal),
  });
  if (error) return <LoadError error={error} onRetry={() => refetch()} what="this customer" />;
  if (!data) return <p style={{ color: 'var(--text-muted)' }}>Loading…</p>;
  return <CustomerView customer={data} />;
}

function CustomerView({ customer }: { customer: CustomerDetail }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { canCall } = useSession();
  const squareError = (location.state as CustomerDetailState | null)?.squareError;
  const [editingDelivery, setEditingDelivery] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const name = customer.fullName ?? `${customer.firstName} ${customer.lastName}`;

  type TabId = 'pets' | 'subscriptions' | 'deliveries';
  const tabs = [
    { id: 'pets' as const, label: 'Pets', count: customer.pets.length, allowed: true },
    { id: 'subscriptions' as const, label: 'Subscriptions', allowed: canCall('GET /api/customers/{customerId}/subscriptions') },
    { id: 'deliveries' as const, label: 'Deliveries', allowed: canCall('GET /api/customers/{customerId}/deliveries') },
  ].filter(t => t.allowed);
  const [tab, setTab] = useState<TabId>('pets');

  return (
    <div>
      <PageHeader
        title={name}
        actions={<>
          <Can call="PUT /api/customers/{customerId}">
            <Button variant="secondary" iconLeft="pencil" onClick={() => navigate(`/customers/${customer.id}/edit`)} disabled={!customer.isActive}>Edit customer</Button>
          </Can>
          {customer.isActive
            ? <Can call="DELETE /api/customers/{customerId}"><Button variant="danger" onClick={() => setConfirmArchive(true)}>Archive</Button></Can>
            : <Can call="POST /api/customers/{customerId}/reactivate"><RestoreButton customer={customer} /></Can>}
        </>}
      >
        <Breadcrumbs style={{ marginBottom: 14 }} onNavigate={navigate} items={[{ label: 'Customers', href: '/customers' }, { label: name }]} />
      </PageHeader>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: -12, marginBottom: 20, flexWrap: 'wrap' }}>
        {customer.isActive ? <Badge tone="success" dot>Active</Badge> : <Badge tone="neutral" dot>Archived</Badge>}
        {customer.isSyncedToSquare ? <Badge tone="success">Linked to Square</Badge> : <Badge tone="warning" dot>Not linked to Square</Badge>}
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Customer since {formatInstant(customer.createdAt)}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {!customer.isActive ? (
          <Alert tone="info">Archived customers are hidden from lists. Their history is kept, and restoring brings everything back.</Alert>
        ) : null}
        {!customer.isSyncedToSquare || squareError ? <SquareLinkAlert customer={customer} saveError={squareError} /> : null}
        {!customer.hasAddress ? (
          <Alert tone="warning" title="No delivery address">Local deliveries can’t be generated for {customer.firstName} until an address is added. Pickup and shipping still work.</Alert>
        ) : !customer.isGeocoded ? (
          <Alert tone="warning" title="Address couldn’t be located">The address didn’t geocode, so Routific can’t put this stop on a route. Check the street and ZIP.</Alert>
        ) : null}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <Card title="Contact">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <DetailField label="Email"><a href={`mailto:${customer.email}`}>{customer.email}</a></DetailField>
              <DetailField label="Phone">{customer.phoneNumber ? <a href={`tel:${customer.phoneNumber}`}>{formatPhone(customer.phoneNumber)}</a> : <Muted>None</Muted>}</DetailField>
              <DetailField label="Address">
                {customer.hasAddress
                  ? <>{customer.street}<br />{customer.city}, {customer.state} {customer.zipCode}</>
                  : <Muted>None</Muted>}
              </DetailField>
              <DetailField label="Notes">{customer.notes ?? <Muted>None</Muted>}</DetailField>
            </div>
          </Card>
          {tabs.length ? (
            <div>
              <Tabs value={tab} onChange={setTab} tabs={tabs} style={{ marginBottom: 16 }} />
              {tab === 'pets' ? <PetsTab customer={customer} /> : null}
              {tab === 'subscriptions' ? <SubscriptionsTab customerId={customer.id} /> : null}
              {tab === 'deliveries' ? <DeliveriesTab customerId={customer.id} /> : null}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="Delivery details" eyebrow="For the driver"
            actions={<Can call="PUT /api/customers/{customerId}/delivery-details">
              <Button variant="ghost" size="sm" iconLeft="pencil" aria-label="Edit delivery details" onClick={() => setEditingDelivery(true)} disabled={!customer.isActive}>Edit</Button>
            </Can>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <DetailField label="Access notes">{customer.accessNotes ?? <Muted>None</Muted>}</DetailField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <DetailField label="Time at the door">{plural(customer.serviceDurationMinutes, 'minute')}</DetailField>
                <DetailField label="Preferred window">
                  {customer.preferredWindowStart && customer.preferredWindowEnd
                    ? `${formatTime(customer.preferredWindowStart)}–${formatTime(customer.preferredWindowEnd)}`
                    : <Muted>Any time</Muted>}
                </DetailField>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>Read live at dispatch — changes reach tonight’s run.</p>
            </div>
          </Card>
          <Card tone="cream" title="Card on file" eyebrow="Square">
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>
              Cards are kept in Square, never here. To add or change {customer.firstName}’s card, open their profile in Square
              {customer.squareCustomerId ? <> (ID <strong>{customer.squareCustomerId}</strong>)</> : null}.
            </p>
          </Card>
        </div>
      </div>

      <DeliveryDetailsDialog customer={customer} open={editingDelivery} onClose={() => setEditingDelivery(false)} />
      <ArchiveDialog customer={customer} open={confirmArchive} onClose={() => setConfirmArchive(false)} />
    </div>
  );
}

function SquareLinkAlert({ customer, saveError }: { customer: CustomerDetail; saveError?: string | null }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const sync = useMutation({
    mutationFn: () => api.customers.syncSquare(customer.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      navigate('.', { replace: true, state: null }); // clear the save's Square error
      toast({ title: 'Linked to Square' });
    },
  });
  return (
    <Alert tone="warning" title={customer.isSyncedToSquare ? 'The last save didn’t reach Square' : 'Not linked to Square'}
      action={<Can call="POST /api/customers/{customerId}/sync-square">
        <Button size="sm" variant="secondary" iconLeft="refresh-cw" disabled={sync.isPending} onClick={() => sync.mutate()}>
          {sync.isPending ? 'Linking…' : 'Try the Square link again'}
        </Button>
      </Can>}>
      {customer.firstName}’s details are saved here{customer.isSyncedToSquare ? ', but Square still has the old ones' : ', but there’s no Square profile to charge'}.
      {saveError ? <> Square said: “{saveError}”</> : null}
      {sync.error ? <div style={{ marginTop: 6, color: 'var(--status-danger-fg)' }}>{errorMessage(sync.error)}</div> : null}
    </Alert>
  );
}

function ArchiveDialog({ customer, open, onClose }: { customer: CustomerDetail; open: boolean; onClose: () => void }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { canCall } = useSession();
  const subs = useQuery({
    queryKey: customerKeys.subscriptions(customer.id),
    queryFn: () => api.customers.subscriptions(customer.id),
    enabled: open && canCall('GET /api/customers/{customerId}/subscriptions'),
  });
  // The endpoint leaves canceled subscriptions out by default, so everything returned is still running.
  const running = subs.data?.filter(s => s.status !== SubscriptionStatus.Canceled) ?? [];
  const archive = useMutation({
    mutationFn: () => api.customers.archive(customer.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast({ title: `${customer.firstName} archived`, message: 'Restore them any time from their record.' });
      onClose();
    },
  });
  return (
    <Dialog open={open} onClose={archive.isPending ? undefined : onClose} size="sm" title={`Archive ${customer.firstName}?`}
      description="They’ll be hidden from lists. Nothing is deleted — their history stays, and you can restore them."
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={archive.isPending}>Keep</Button>
        <Button variant="danger" onClick={() => archive.mutate()} disabled={archive.isPending}>{archive.isPending ? 'Archiving…' : 'Archive'}</Button>
      </>}>
      {running.length ? (
        <Alert tone="warning" title="Subscriptions keep running">
          Archiving doesn’t pause or cancel their {plural(running.length, 'subscription')}. Deal with those first if the deliveries should stop.
        </Alert>
      ) : null}
      {archive.error ? <Alert tone="danger" style={{ marginTop: 12 }}>{errorMessage(archive.error)}</Alert> : null}
    </Dialog>
  );
}

function RestoreButton({ customer }: { customer: CustomerDetail }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const restore = useMutation({
    mutationFn: () => api.customers.restore(customer.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast({ title: `${customer.firstName} restored` });
    },
    onError: err => toast({ tone: 'danger', title: 'Couldn’t restore', message: errorMessage(err) }),
  });
  return <Button iconLeft="refresh-cw" onClick={() => restore.mutate()} disabled={restore.isPending}>{restore.isPending ? 'Restoring…' : 'Restore'}</Button>;
}

function PetsTab({ customer }: { customer: CustomerDetail }) {
  if (!customer.pets.length) return <Card><p style={{ margin: 0, color: 'var(--text-muted)' }}>No pets on file.</p></Card>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
      {customer.pets.map(p => (
        <Card key={p.id} tone="cream" title={p.name}>
          <div style={{ fontSize: 14.5, color: 'var(--ink-700)', marginBottom: p.allergies.length ? 10 : 0 }}>
            {[p.breed, p.petTypeName === 'Dog' || !p.petTypeName ? null : p.petTypeName, p.ageYears != null ? `${p.ageYears} yrs` : null].filter(Boolean).join(' · ')}
          </div>
          {p.allergies.length ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {p.allergies.map(a => <Chip key={a.id} variant="tag" size="sm">{a.allergyName}</Chip>)}
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

function SubscriptionsTab({ customerId }: { customerId: string }) {
  const api = useApi();
  const navigate = useNavigate();
  const [showCanceled, setShowCanceled] = useState(false);
  const { data, error, refetch } = useQuery({
    queryKey: [...customerKeys.subscriptions(customerId), showCanceled],
    queryFn: () => api.customers.subscriptions(customerId, showCanceled),
    placeholderData: keepPreviousData,
  });
  if (error) return <LoadError error={error} onRetry={() => refetch()} what="subscriptions" />;
  return (
    <Card flush title={data ? plural(data.length, 'subscription') : 'Subscriptions'}
      actions={<>
        <Chip size="sm" selected={showCanceled} onClick={() => setShowCanceled(!showCanceled)}>Include canceled</Chip>
        <Can call="POST /api/subscriptions"><Button size="sm" variant="secondary" iconLeft="plus" onClick={() => navigate(`/subscriptions/new?customerId=${customerId}`)}>New subscription</Button></Can>
      </>}>
      <DataTable
        rows={data ?? []} rowKey={s => s.id}
        onRowClick={s => navigate(`/subscriptions/${s.id}`)}
        empty={data ? 'No subscriptions.' : 'Loading…'}
        columns={[
          // A customer can have several on different cycles, so the name always shows.
          { key: 'name', header: 'Subscription', render: s => <strong>{s.displayName ?? s.name}</strong> },
          { key: 'freq', header: 'Every', render: s => s.frequencyLabel ?? '—' },
          { key: 'next', header: 'Next delivery', render: s => <NextDelivery s={s} /> },
          { key: 'status', header: 'Status', render: s => <SubscriptionStatusBadge status={s.status} /> },
        ]}
      />
    </Card>
  );
}

function DeliveriesTab({ customerId }: { customerId: string }) {
  const api = useApi();
  const [page, setPage] = useState(1);
  const { data, error, refetch } = useQuery({
    queryKey: customerKeys.deliveries(customerId, page),
    queryFn: () => api.customers.deliveries(customerId, { pageNumber: page, pageSize: 10 }),
    placeholderData: keepPreviousData,
  });
  if (error) return <LoadError error={error} onRetry={() => refetch()} what="deliveries" />;
  return (
    <Card flush>
      <DataTable
        rows={data?.items ?? []} rowKey={d => d.id}
        empty={data ? 'No deliveries yet.' : 'Loading…'}
        columns={[
          { key: 'date', header: 'Day', render: d => formatDay(d.scheduledFor) },
          { key: 'sub', header: 'Subscription', render: d => d.isOneOff ? 'One-off' : d.subscriptionDisplayName ?? d.subscriptionName },
          { key: 'status', header: 'Status', render: d => <DeliveryStatusBadge status={d.status} /> },
          { key: 'paid', header: 'Payment', render: d => <PaymentStatusBadge status={d.paymentStatus} /> },
          {
            key: 'total', header: 'Amount', align: 'right',
            // What Square took can legitimately differ from our estimate — show both when it does.
            render: d => d.amountCharged != null && d.amountCharged !== d.total
              ? <span title="Square prices from its live catalog, so the charge can differ from our estimate.">{formatMoney(d.amountCharged)} <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>est. {formatMoney(d.total)}</span></span>
              : formatMoney(d.amountCharged ?? d.total),
          },
        ]}
      />
      {data && data.totalPages && data.totalPages > 1 ? (
        <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <Pagination page={page} pageCount={data.totalPages} total={data.totalCount} pageSize={data.pageSize} onChange={setPage} />
        </div>
      ) : null}
    </Card>
  );
}
