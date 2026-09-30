// Subscriptions list (PAGES.md §5). A customer can hold several on different cycles, so the subscription's
// name — or the composed label the API gives an unnamed one — always shows beside the customer.
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { SubscriptionStatus } from '../../api/generated/enums';
import type { SubscriptionListItem, SubscriptionListQuery } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { SearchInput, useListParams } from '../../app/lists';
import { FULFILLMENT_LABEL, SubscriptionStatusBadge } from '../../app/statusBadges';
import { formatDay, plural } from '../../lib/format';
import { Can, useApi } from '../../session/SessionProvider';
import { Badge, Button, Card, Chip, DataTable, Muted, Pagination, type DataTableColumn } from '../../ui';
import { subscriptionKeys } from './keys';

const PAGE_SIZE = 50;

/** When it next ships, said the way the status means it. */
export function NextDelivery({ s }: { s: Pick<SubscriptionListItem, 'status' | 'nextDeliveryDate' | 'pausedUntil' | 'isPauseExpired'> }) {
  if (s.status === SubscriptionStatus.Canceled) return <Muted>—</Muted>;
  if (s.status === SubscriptionStatus.Paused) {
    if (s.isPauseExpired) return <Badge tone="warning">Pause ended {formatDay(s.pausedUntil)}</Badge>;
    return <Muted>{s.pausedUntil ? `Paused until ${formatDay(s.pausedUntil)}` : 'Paused — no end date'}</Muted>;
  }
  return <>{formatDay(s.nextDeliveryDate)}{s.status === SubscriptionStatus.NewSignUp ? <Muted> (once activated)</Muted> : null}</>;
}

const STATUS_CHIPS: Array<[string, number | null]> = [['All', null], ['New sign-ups', SubscriptionStatus.NewSignUp], ['Active', SubscriptionStatus.Active], ['Paused', SubscriptionStatus.Paused], ['Canceled', SubscriptionStatus.Canceled]];

export function SubscriptionsListPage() {
  const api = useApi();
  const navigate = useNavigate();
  const list = useListParams('/api/subscriptions');
  const status = list.value('status');
  const pauseEnded = list.flag('pauseEnded');

  const query: SubscriptionListQuery = {
    searchTerm: list.search || undefined,
    status: status === '' ? undefined : Number(status) as SubscriptionListQuery['status'],
    pauseExpired: pauseEnded || undefined,
    sortBy: list.sort.key,
    sortDescending: list.sort.dir === 'desc',
    pageNumber: list.page,
    pageSize: PAGE_SIZE,
  };
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: subscriptionKeys.list(query),
    queryFn: ({ signal }) => api.subscriptions.list(query, signal),
    placeholderData: keepPreviousData,
  });

  const columns: DataTableColumn<SubscriptionListItem>[] = [
    {
      key: 'name', header: 'Subscription', sortable: true,
      render: s => <div>
        <div style={{ fontWeight: 600 }}>{s.displayName ?? s.name}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.customerName}</div>
      </div>,
    },
    { key: 'freq', header: 'Every', render: s => s.frequencyLabel },
    { key: 'nextDelivery', header: 'Next delivery', sortable: true, render: s => <NextDelivery s={s} /> },
    { key: 'status', header: 'Status', sortable: true, render: s => <SubscriptionStatusBadge status={s.status} /> },
    { key: 'method', header: 'Method', render: s => FULFILLMENT_LABEL[s.fulfillmentMethod] },
    {
      key: 'contents', header: 'In each box',
      render: s => <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {s.itemCount || s.rotationGroupCount ? <span>{[s.itemCount ? plural(s.itemCount, 'item') : '', s.rotationGroupCount ? plural(s.rotationGroupCount, 'rotation') : ''].filter(Boolean).join(' · ')}</span> : <Muted>Nothing yet</Muted>}
        {s.pendingAddOnCount ? <Badge tone="info">+{plural(s.pendingAddOnCount, 'add-on')}</Badge> : null}
        {s.inactiveProductCount ? <Badge tone="warning">{plural(s.inactiveProductCount, 'discontinued product')}</Badge> : null}
      </span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Subscriptions"
        actions={<Can call="POST /api/subscriptions"><Button variant="accent" iconLeft="plus" onClick={() => navigate('/subscriptions/new')}>New subscription</Button></Can>} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <SearchInput value={list.search} onChange={list.setSearch} label="Search subscriptions" placeholder="Search by customer or subscription name" />
        <div style={{ flex: 1 }} />
        {STATUS_CHIPS.map(([label, value]) => (
          <Chip key={label} selected={value === null ? status === '' : status === String(value)} onClick={() => list.setValues({ status: value === null ? null : String(value) })}>{label}</Chip>
        ))}
        <Chip selected={pauseEnded} icon="calendar-clock" onClick={() => list.setFlag('pauseEnded', !pauseEnded)}>Pause ended</Chip>
      </div>
      {error && !data ? <LoadError error={error} onRetry={() => refetch()} what="subscriptions" /> : (
        <Card flush style={{ opacity: isFetching && !isPending ? 0.7 : 1, transition: 'opacity var(--duration-fast)' }}>
          <DataTable rows={data?.items ?? []} rowKey={s => s.id} columns={columns} sort={list.sort} onSortChange={list.setSort}
            onRowClick={s => navigate(`/subscriptions/${s.id}`)}
            empty={isPending ? 'Loading subscriptions…' : 'No subscriptions match.'} />
          {data && (data.totalPages ?? 1) > 1 ? (
            <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <Pagination page={data.pageNumber} pageCount={data.totalPages ?? 1} total={data.totalCount} pageSize={data.pageSize} onChange={list.setPage} />
            </div>
          ) : null}
        </Card>
      )}
      {data ? <p style={{ marginTop: 12, fontSize: 13.5, color: 'var(--text-muted)' }}>{plural(data.totalCount, 'subscription')}{status === '' ? ' (canceled ones hidden)' : ''}.</p> : null}
    </div>
  );
}
