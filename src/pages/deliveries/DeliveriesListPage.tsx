// The deliveries worklist (PAGES.md §6): one row per delivery, answering "which orders still need
// work?". It counts unresolved and blocked lines but never shows a line — those two numbers are the
// work, and the lines are worked on the procurement board or the delivery detail.
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DeliveryStatus, FulfillmentMethod, ProcurementStatus } from '../../api/generated/enums';
import type { DeliveryListItem, DeliveryListQuery } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { SearchInput, useListParams } from '../../app/lists';
import { DeliveryStatusBadge, FULFILLMENT_LABEL, PaymentStatusBadge } from '../../app/statusBadges';
import { addDays, todayIso } from '../../lib/dates';
import { formatDay, formatMoney, plural } from '../../lib/format';
import { Can, useApi } from '../../session/SessionProvider';
import { Badge, Button, Card, Chip, DataTable, Input, Pagination, Select, type DataTableColumn } from '../../ui';
import { deliveryKeys } from './keys';

const PAGE_SIZE = 50;
const num = (v: string) => (v === '' ? undefined : Number(v));

/** The work on a delivery, as the worklist states it: what is left, what is stuck, or that it is done. */
export function WorkCell({ d }: { d: Pick<DeliveryListItem, 'unresolvedLineCount' | 'blockedLineCount' | 'isReadyToPack' | 'status' | 'isClosed'> }) {
  if (d.isClosed) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  if (d.status !== DeliveryStatus.Scheduled) return <Badge tone="success">Packed</Badge>;
  if (d.isReadyToPack) return <Badge tone="success" dot>Ready to pack</Badge>;
  return (
    <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
      {d.blockedLineCount > 0 ? <Badge tone="danger" dot>{d.blockedLineCount} blocked</Badge> : null}
      <Badge tone="neutral">{plural(d.unresolvedLineCount, 'line')} to resolve</Badge>
    </span>
  );
}

export function DeliveriesListPage() {
  const api = useApi();
  const navigate = useNavigate();
  const list = useListParams('/api/deliveries');
  const today = todayIso();
  const from = list.value('from', today);
  const to = list.value('to', addDays(today, 6));
  const includeClosed = list.flag('closed');
  const oneOff = list.flag('oneoff');
  const status = list.value('status');
  const procurement = list.value('procurement');
  const method = list.value('method');
  const paid = list.value('paid');

  const query: DeliveryListQuery = {
    searchTerm: list.search || undefined,
    scheduledFrom: from || undefined,
    scheduledTo: to || undefined,
    status: num(status) as DeliveryListQuery['status'],
    procurementStatus: num(procurement) as DeliveryListQuery['procurementStatus'],
    fulfillmentMethod: num(method) as DeliveryListQuery['fulfillmentMethod'],
    hasPaid: paid === '' ? undefined : paid === '1',
    oneOffOnly: oneOff || undefined,
    includeClosed: includeClosed || undefined,
    sortBy: list.sort.key,
    sortDescending: list.sort.dir === 'desc',
    pageNumber: list.page,
    pageSize: PAGE_SIZE,
  };
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: deliveryKeys.list(query),
    queryFn: ({ signal }) => api.deliveries.list(query, signal),
    placeholderData: keepPreviousData,
  });

  const columns: DataTableColumn<DeliveryListItem>[] = [
    { key: 'scheduledFor', header: 'Day', sortable: true, render: d => <span style={{ whiteSpace: 'nowrap' }}>{formatDay(d.scheduledFor)}</span> },
    {
      key: 'customer', header: 'Customer', sortable: true,
      render: d => (
        <div>
          <div style={{ fontWeight: 600 }}>{d.customerName}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{d.isOneOff ? 'One-off delivery' : d.subscriptionDisplayName ?? d.subscriptionName}</div>
        </div>
      ),
    },
    { key: 'procurement', header: 'Work', sortable: true, render: d => <WorkCell d={d} /> },
    { key: 'status', header: 'Status', sortable: true, render: d => <DeliveryStatusBadge status={d.status} /> },
    { key: 'payment', header: 'Payment', render: d => <PaymentStatusBadge status={d.paymentStatus} /> },
    { key: 'method', header: 'Method', render: d => <span style={{ whiteSpace: 'nowrap' }}>{FULFILLMENT_LABEL[d.fulfillmentMethod]}{d.deliveryCity && d.fulfillmentMethod === FulfillmentMethod.LocalDelivery ? <span style={{ color: 'var(--text-muted)' }}> · {d.deliveryCity}</span> : null}</span> },
    { key: 'total', header: 'Total', align: 'right', sortable: true, render: d => formatMoney(d.amountCharged ?? d.total) },
  ];

  return (
    <div>
      <PageHeader
        title="Deliveries"
        actions={<>
          <Button variant="secondary" iconLeft="printer" onClick={() => navigate(`/deliveries/sheet?from=${from}&to=${to}`)}>Prep sheet</Button>
          <Can call="POST /api/deliveries/generate"><Button variant="secondary" iconLeft="calendar-clock" onClick={() => navigate('/deliveries/generate')}>Generate deliveries</Button></Can>
          <Can call="POST /api/deliveries"><Button variant="accent" iconLeft="plus" onClick={() => navigate('/deliveries/new')}>One-off delivery</Button></Can>
        </>}
      />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <Input size="sm" type="date" label="From" value={from} onChange={e => list.setValues({ from: e.target.value || null })} style={{ width: 150 }} />
        <Input size="sm" type="date" label="To" value={to} onChange={e => list.setValues({ to: e.target.value || null })} style={{ width: 150 }} />
        <Chip onClick={() => list.setValues({ from: today, to: today })} selected={from === today && to === today}>Today</Chip>
        <Chip onClick={() => list.setValues({ from: addDays(today, 1), to: addDays(today, 1) })} selected={from === addDays(today, 1) && to === from}>Tomorrow</Chip>
        <div style={{ flex: 1 }} />
        <SearchInput value={list.search} onChange={list.setSearch} label="Search deliveries" placeholder="Search by customer or subscription" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Chip selected={procurement === String(ProcurementStatus.Blocked)} icon="triangle-alert"
          onClick={() => list.setValues({ procurement: procurement === String(ProcurementStatus.Blocked) ? null : String(ProcurementStatus.Blocked) })}>Blocked</Chip>
        <Chip selected={procurement === String(ProcurementStatus.Ready)}
          onClick={() => list.setValues({ procurement: procurement === String(ProcurementStatus.Ready) ? null : String(ProcurementStatus.Ready) })}>Ready to pack</Chip>
        <Select size="sm" aria-label="Status" value={status} onChange={e => list.setValues({ status: e.target.value || null })} style={{ width: 170 }}
          options={[{ value: '', label: 'Any status' }, ...Object.entries({ Scheduled: 1, Packed: 2, Routed: 3, 'Out for delivery': 4, Delivered: 5, Failed: 6, Canceled: 7 }).map(([label, value]) => ({ value, label }))]} />
        <Select size="sm" aria-label="Method" value={method} onChange={e => list.setValues({ method: e.target.value || null })} style={{ width: 170 }}
          options={[{ value: '', label: 'Any method' }, ...Object.entries(FULFILLMENT_LABEL).map(([value, label]) => ({ value, label }))]} />
        <Select size="sm" aria-label="Payment" value={paid} onChange={e => list.setValues({ paid: e.target.value || null })} style={{ width: 150 }}
          options={[{ value: '', label: 'Paid or not' }, { value: '1', label: 'Paid' }, { value: '0', label: 'Not paid' }]} />
        <div style={{ flex: 1 }} />
        <Chip selected={oneOff} onClick={() => list.setFlag('oneoff', !oneOff)}>One-offs only</Chip>
        <Chip selected={includeClosed} onClick={() => list.setFlag('closed', !includeClosed)}>Include closed</Chip>
      </div>
      {error && !data ? <LoadError error={error} onRetry={() => refetch()} what="deliveries" /> : (
        <Card flush style={{ opacity: isFetching && !isPending ? 0.7 : 1, transition: 'opacity var(--duration-fast)' }}>
          <DataTable rows={data?.items ?? []} rowKey={d => d.id} columns={columns} sort={list.sort} onSortChange={list.setSort}
            onRowClick={d => navigate(`/deliveries/${d.id}`)}
            empty={isPending ? 'Loading deliveries…' : includeClosed ? 'No deliveries in this range.' : 'No open deliveries in this range. Closed ones are hidden — include them to see history.'} />
          {data && data.totalCount > PAGE_SIZE ? (
            <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <Pagination page={data.pageNumber} pageCount={data.totalPages ?? 1} total={data.totalCount} pageSize={data.pageSize} onChange={list.setPage} />
            </div>
          ) : null}
        </Card>
      )}
      {data ? <Summary items={data.items} total={data.totalCount} /> : null}
    </div>
  );
}

function Summary({ items, total }: { items: DeliveryListItem[]; total: number }) {
  const blocked = items.filter(d => d.blockedLineCount > 0).length;
  const ready = items.filter(d => d.isReadyToPack && d.status === DeliveryStatus.Scheduled).length;
  return (
    <p style={{ marginTop: 12, fontSize: 13.5, color: 'var(--text-muted)' }}>
      {plural(total, 'delivery', 'deliveries')}{total > items.length ? ` (${items.length} on this page)` : ''}
      {blocked ? ` · ${blocked} blocked on stock` : ''}{ready ? ` · ${ready} ready to pack` : ''}.
    </p>
  );
}
