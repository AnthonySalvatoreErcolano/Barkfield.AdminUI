// The procurement board (PAGES.md §6): buying stock across many deliveries at once. Two passes over the
// same range:
//   - By product (the default): one row per product — pendingQuantity is what goes on the supplier order,
//     sorted most-to-order first, with the shortage's reach (customers, deliveries) beside it.
//   - By line: flat lines, customer → subscription → product, for receiving and allocating. Substitution
//     lives here, because it is for one customer.
// The delivery's procurementStatus is shown read-only: the API derives it from the lines.
import { useState, type Key } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { LineOrderStatus, LineOrderStatusNames, ProcurementStatus } from '../../api/generated/enums';
import type { ProcurementLine, ProcurementProduct, ProcurementQuery } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { SearchInput, useListParams } from '../../app/lists';
import { FULFILLMENT_LABEL, LineStatusBadge, ProcurementBadge } from '../../app/statusBadges';
import { addDays, dayOf, todayIso } from '../../lib/dates';
import { formatDay, plural } from '../../lib/format';
import { useSession } from '../../session/SessionProvider';
import { useApi } from '../../session/SessionProvider';
import { Alert, Badge, Button, buttonClass, Card, Chip, DataTable, DropdownMenu, Icon, Input, Pagination, Select, Tabs, type DataTableColumn } from '../../ui';
import { LineActionDialog } from '../deliveries/LineDialogs';
import { BulkDecisionDialog } from './BulkDecisionDialog';
import { procurementKeys } from './keys';
import { ProductActionDialog, type ProductAction } from './ProductActionDialog';
import { useBoardWrites } from './useBoardWrites';

type View = 'products' | 'lines';
const num = (v: string) => (v === '' ? undefined : Number(v));

export function ProcurementPage() {
  const navigate = useNavigate();
  const { canCall } = useSession();
  const canPack = canCall('POST /api/procurement/lines/status');
  const writes = useBoardWrites();
  // Sort keys differ per view; the list hook validates against the view's own endpoint.
  const productsList = useListParams('/api/procurement/products');
  const linesList = useListParams('/api/procurement/lines');
  const view: View = productsList.value('view') === 'lines' ? 'lines' : 'products';
  const list = view === 'products' ? productsList : linesList;

  const today = todayIso();
  const from = list.value('from', today);
  const to = list.value('to', addDays(today, 6));
  const range: ProcurementQuery = {
    from, to,
    orderStatus: num(list.value('status')) as ProcurementQuery['orderStatus'],
    procurementStatus: num(list.value('dstate')) as ProcurementQuery['procurementStatus'],
    fulfillmentMethod: num(list.value('method')) as ProcurementQuery['fulfillmentMethod'],
    includeClosed: list.flag('closed') || undefined,
    searchTerm: list.search || undefined,
  };
  const productId = list.value('product') || undefined;
  const productName = list.value('pname');

  return (
    <div>
      <PageHeader title="Procurement" />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <Input size="sm" type="date" label="From" value={from} onChange={e => e.target.value && list.setValues({ from: e.target.value, to: to < e.target.value ? e.target.value : to })} style={{ width: 150 }} />
        <Input size="sm" type="date" label="To" value={to} min={from} onChange={e => e.target.value && list.setValues({ to: e.target.value })} style={{ width: 150 }} />
        <Chip selected={from === today && to === addDays(today, 6)} onClick={() => list.setValues({ from: null, to: null })}>Next 7 days</Chip>
        <Chip selected={from === today && to === today} onClick={() => list.setValues({ from: today, to: today })}>Today</Chip>
        <div style={{ flex: 1 }} />
        <Tabs variant="pill" value={view} onChange={v => list.setValues({ view: v === 'lines' ? 'lines' : null, sort: null, dir: null, product: null, pname: null })}
          tabs={[{ id: 'products', label: 'By product' }, { id: 'lines', label: 'By line' }]} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <SearchInput value={list.search} onChange={list.setSearch} label="Search procurement" placeholder="Search product, customer or subscription" />
        <Select size="sm" aria-label="Line status" value={list.value('status')} onChange={e => list.setValues({ status: e.target.value || null })} style={{ width: 170 }}
          options={[{ value: '', label: 'Any line status' }, ...Object.entries(LineOrderStatusNames).map(([value, label]) => ({ value, label: label.replace(/([a-z])([A-Z])/g, '$1 $2') }))]} />
        {/* The delivery's rolled-up state — a different question from the line's own status. */}
        <Select size="sm" aria-label="Delivery state" value={list.value('dstate')} onChange={e => list.setValues({ dstate: e.target.value || null })} style={{ width: 190 }}
          options={[{ value: '', label: 'Any delivery state' }, { value: String(ProcurementStatus.NotStarted), label: 'Delivery not started' }, { value: String(ProcurementStatus.InProgress), label: 'Delivery in progress' }, { value: String(ProcurementStatus.Blocked), label: 'Delivery blocked' }, { value: String(ProcurementStatus.Ready), label: 'Delivery ready' }]} />
        <Select size="sm" aria-label="Method" value={list.value('method')} onChange={e => list.setValues({ method: e.target.value || null })} style={{ width: 160 }}
          options={[{ value: '', label: 'Any method' }, ...Object.entries(FULFILLMENT_LABEL).map(([value, label]) => ({ value, label }))]} />
        <div style={{ flex: 1 }} />
        <Chip selected={list.flag('closed')} onClick={() => list.setFlag('closed', !list.flag('closed'))}>Include delivered</Chip>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {writes.problem ? <Alert tone="danger" onClose={writes.dismiss}>{writes.problem}</Alert> : null}
        {writes.outcome ? (
          <Alert tone="warning" onClose={writes.dismiss}
            title={`${writes.outcome.what}: ${writes.outcome.applied} applied, ${plural(writes.outcome.failures.length, 'line')} didn’t take`}>
            The rest were saved. These need another look:
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {writes.outcome.failures.map((f, i) => <li key={i}><strong>{f.customerName}</strong> — {f.productName}: {f.reason}</li>)}
            </ul>
          </Alert>
        ) : null}
      </div>

      {view === 'products'
        ? <ProductsView range={range} list={productsList} canPack={canPack} writes={writes}
            onOpenLines={p => list.setValues({ view: 'lines', product: p.productId, pname: p.productName, sort: null, dir: null })} />
        : <LinesView range={{ ...range, productId }} list={linesList} canPack={canPack} writes={writes}
            productFilter={productId ? { name: productName, clear: () => list.setValues({ product: null, pname: null }) } : null}
            onOpenDelivery={id => navigate(`/deliveries/${id}`)} />}
    </div>
  );
}

function ProductsView({ range, list, canPack, writes, onOpenLines }: {
  range: ProcurementQuery; list: ReturnType<typeof useListParams<'/api/procurement/products'>>; canPack: boolean;
  writes: ReturnType<typeof useBoardWrites>; onOpenLines: (p: ProcurementProduct) => void;
}) {
  const api = useApi();
  const [acting, setActing] = useState<{ product: ProcurementProduct; action: ProductAction } | null>(null);
  // The API's sortDescending flips each key's natural order (most-to-order first for pending), so the
  // first click on any column gives its natural order.
  const query: ProcurementQuery = { ...range, sortBy: list.sort.key, sortDescending: list.sort.dir === 'desc', pageNumber: list.page, pageSize: 50 };
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: procurementKeys.products(query),
    queryFn: ({ signal }) => api.procurement.products(query, signal),
    placeholderData: keepPreviousData,
  });
  const soon = addDays(todayIso(), 1);

  const columns: DataTableColumn<ProcurementProduct>[] = [
    { key: 'product', header: 'Product', sortable: true, render: p => <span style={{ fontWeight: 600 }}>{p.productName}</span> },
    {
      key: 'pending', header: 'To order', align: 'right', sortable: true,
      render: p => p.pendingQuantity ? <strong style={{ fontSize: 16, color: 'var(--teal-600)' }}>{p.pendingQuantity}</strong> : <span style={{ color: 'var(--text-muted)' }}>0</span>,
    },
    { key: 'ordered', header: 'Ordered', align: 'right', render: p => p.orderedQuantity || <span style={{ color: 'var(--text-muted)' }}>0</span> },
    { key: 'received', header: 'In hand', align: 'right', render: p => p.receivedQuantity || <span style={{ color: 'var(--text-muted)' }}>0</span> },
    { key: 'total', header: 'Needed', align: 'right', sortable: true, render: p => p.totalQuantity },
    { key: 'blocked', header: 'Out of stock', render: p => p.blockedLineCount ? <Badge tone="danger" dot>{plural(p.blockedLineCount, 'line')}</Badge> : null },
    { key: 'customers', header: 'Reach', sortable: true, render: p => <span style={{ whiteSpace: 'nowrap' }}>{plural(p.customerCount, 'customer')} · {plural(p.deliveryCount, 'delivery', 'deliveries')}</span> },
    {
      key: 'earliest', header: 'First needed', sortable: true,
      render: p => <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', whiteSpace: 'nowrap' }}>
        {formatDay(p.earliestScheduledFor)}{!p.isSettled && dayOf(p.earliestScheduledFor) <= soon ? <Badge tone="warning">Soon</Badge> : null}
      </span>,
    },
    {
      key: 'actions', header: '', width: 70, align: 'right',
      render: p => (
        <span onClick={e => e.stopPropagation()}>
          <DropdownMenu align="right" triggerLabel={`Actions for ${p.productName}`}
            trigger={<span className={buttonClass('ghost', 'sm')}><Icon name="ellipsis" size={16} /></span>}
            items={[
              { label: 'View its lines', icon: 'list', onSelect: () => onOpenLines(p) },
              ...(canPack ? [
                { divider: true as const },
                { label: `Mark ${p.pendingQuantity} ordered…`, icon: 'shopping-bag' as const, disabled: !p.pendingQuantity || writes.busy, onSelect: () => setActing({ product: p, action: 'ordered' }) },
                { label: 'Receive all…', icon: 'package' as const, disabled: writes.busy, onSelect: () => setActing({ product: p, action: 'receive' }) },
                { label: 'Out of stock…', icon: 'triangle-alert' as const, danger: true, disabled: p.isSettled || writes.busy, onSelect: () => setActing({ product: p, action: 'out-of-stock' }) },
              ] : []),
            ]} />
        </span>
      ),
    },
  ];

  const totalPending = data?.items.reduce((s, p) => s + p.pendingQuantity, 0) ?? 0;

  if (error && !data) return <LoadError error={error} onRetry={() => refetch()} what="the ordering view" />;
  return (
    <>
      <Card flush style={{ opacity: isFetching && !isPending ? 0.7 : 1, transition: 'opacity var(--duration-fast)' }}>
        <DataTable rows={data?.items ?? []} rowKey={p => p.productId} columns={columns}
          sort={{ key: list.sort.key, dir: list.sort.dir }} onSortChange={list.setSort} onRowClick={onOpenLines}
          empty={isPending ? 'Loading…' : 'Nothing needed in this range.'} />
        {data && (data.totalPages ?? 1) > 1 ? (
          <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <Pagination page={data.pageNumber} pageCount={data.totalPages ?? 1} total={data.totalCount} pageSize={data.pageSize} onChange={list.setPage} />
          </div>
        ) : null}
      </Card>
      {data ? <p style={{ marginTop: 12, fontSize: 13.5, color: 'var(--text-muted)' }}>{plural(data.totalCount, 'product')} · {totalPending} units still to order on this page.</p> : null}
      {acting ? <ProductActionDialog product={acting.product} action={acting.action} range={range} writes={writes} onClose={() => setActing(null)} /> : null}
    </>
  );
}

function LinesView({ range, list, canPack, writes, productFilter, onOpenDelivery }: {
  range: ProcurementQuery; list: ReturnType<typeof useListParams<'/api/procurement/lines'>>; canPack: boolean;
  writes: ReturnType<typeof useBoardWrites>; productFilter: { name: string; clear: () => void } | null; onOpenDelivery: (id: string) => void;
}) {
  const api = useApi();
  const [selected, setSelected] = useState<Key[]>([]);
  const [bulk, setBulk] = useState(false);
  const [single, setSingle] = useState<ProcurementLine | null>(null);
  const query: ProcurementQuery = { ...range, sortBy: list.sort.key, sortDescending: list.sort.dir === 'desc', pageNumber: list.page, pageSize: 100 };
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: procurementKeys.lines(query),
    queryFn: ({ signal }) => api.procurement.lines(query, signal),
    placeholderData: keepPreviousData,
  });
  const rows = data?.items ?? [];
  // Selection is only ever what is on screen: a filter or page change clears it.
  const queryKey = JSON.stringify(query);
  const [selectionFor, setSelectionFor] = useState(queryKey);
  if (selectionFor !== queryKey) { setSelectionFor(queryKey); setSelected([]); }
  const chosen = rows.filter(l => selected.includes(l.lineId));

  const columns: DataTableColumn<ProcurementLine>[] = [
    {
      key: 'customer', header: 'Customer', sortable: true,
      render: l => (
        <div>
          <Link to={`/deliveries/${l.deliveryId}`} onClick={e => e.stopPropagation()} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.customerName}</Link>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{l.isOneOff ? 'One-off' : l.subscriptionDisplayName ?? l.subscriptionName}</div>
        </div>
      ),
    },
    { key: 'scheduledFor', header: 'Day', sortable: true, render: l => <span style={{ whiteSpace: 'nowrap' }}>{formatDay(l.scheduledFor)}</span> },
    {
      key: 'product', header: 'Product', sortable: true,
      render: l => l.orderStatus === LineOrderStatus.Substituted
        ? <span><span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{l.productName}</span> → {l.substitutedWithProductName}</span>
        : <span style={{ textDecoration: l.orderStatus === LineOrderStatus.Shorted ? 'line-through' : undefined }}>{l.productName}</span>,
    },
    { key: 'quantity', header: 'Qty', align: 'right', sortable: true, render: l => l.quantity },
    { key: 'got', header: 'Received', align: 'right', render: l => l.orderStatus === LineOrderStatus.PartiallyReceived || l.orderStatus === LineOrderStatus.Received ? `${l.quantityReceived} of ${l.quantity}` : <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'status', header: 'Line', sortable: true, render: l => <LineStatusBadge status={l.orderStatus} /> },
    { key: 'delivery', header: 'Delivery', render: l => <ProcurementBadge status={l.deliveryProcurementStatus} /> },
    ...(canPack ? [{
      key: 'update', header: '', width: 90, align: 'right' as const,
      render: (l: ProcurementLine) => <span onClick={e => e.stopPropagation()}><Button size="sm" variant="secondary" disabled={writes.busy} onClick={() => setSingle(l)} aria-label={`Update ${l.productName} for ${l.customerName}`}>Update</Button></span>,
    }] : []),
  ];

  if (error && !data) return <LoadError error={error} onRetry={() => refetch()} what="the line view" />;
  return (
    <>
      {productFilter ? (
        <div style={{ marginBottom: 12 }}>
          <Chip selected onRemove={productFilter.clear}>{productFilter.name || 'One product'}</Chip>
        </div>
      ) : null}
      <Card flush style={{ opacity: isFetching && !isPending ? 0.7 : 1, transition: 'opacity var(--duration-fast)' }}>
        {canPack && chosen.length ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-selected)' }}>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--teal-600)' }}>{plural(chosen.length, 'line')} selected</strong>
            <Button size="sm" onClick={() => setBulk(true)} disabled={writes.busy}>Update selected…</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
          </div>
        ) : null}
        <DataTable rows={rows} rowKey={l => l.lineId} columns={columns} density="compact"
          selectable={canPack} selected={selected} onSelectChange={setSelected}
          sort={{ key: list.sort.key, dir: list.sort.dir }} onSortChange={list.setSort}
          onRowClick={l => onOpenDelivery(l.deliveryId)}
          empty={isPending ? 'Loading…' : 'No lines match.'} />
        {data && (data.totalPages ?? 1) > 1 ? (
          <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <Pagination page={data.pageNumber} pageCount={data.totalPages ?? 1} total={data.totalCount} pageSize={data.pageSize} onChange={list.setPage} />
          </div>
        ) : null}
      </Card>
      {data ? <p style={{ marginTop: 12, fontSize: 13.5, color: 'var(--text-muted)' }}>{plural(data.totalCount, 'line')}{data.totalCount > rows.length ? ` (${rows.length} on this page)` : ''}.</p> : null}
      {bulk ? <BulkDecisionDialog lines={chosen} writes={writes} onClose={() => setBulk(false)} onDone={() => { setBulk(false); setSelected([]); }} /> : null}
      {single ? (
        <LineActionDialog
          target={{ productId: single.productId, productName: single.productName, quantity: single.quantity, quantityReceived: single.quantityReceived, orderStatus: single.orderStatus }}
          onClose={() => setSingle(null)}
          submit={action => writes.runSingle(single.deliveryId, single.lineId, action, { customerName: single.customerName, productName: single.productName })}
        />
      ) : null}
    </>
  );
}
