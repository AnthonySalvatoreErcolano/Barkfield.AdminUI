// Products list (PAGES.md §4). The catalog mirrors Square, which owns names and prices, so nothing is
// created or edited here: products are added from Square and kept current by syncing — best run before
// a billing day, since prices change at the point of sale without anything telling us.
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api/errors';
import type { CatalogSyncResult, Product } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { SearchInput, useListParams } from '../../app/lists';
import { formatInstant, formatMoney, plural } from '../../lib/format';
import { Can, useApi } from '../../session/SessionProvider';
import { Alert, Badge, Button, Card, Chip, DataTable, Dialog, Muted, Pagination, type DataTableColumn } from '../../ui';
import { productKeys } from './keys';

const PAGE_SIZE = 25;

export function ProductsListPage() {
  const api = useApi();
  const navigate = useNavigate();
  const list = useListParams('/api/products');
  const inactive = list.flag('inactive');
  const [syncing, setSyncing] = useState(false);

  const query = {
    searchTerm: list.search || undefined,
    includeInactive: inactive || undefined,
    sortBy: list.sort.key,
    sortDescending: list.sort.dir === 'desc',
    pageNumber: list.page,
    pageSize: PAGE_SIZE,
  };
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: productKeys.list(query),
    queryFn: ({ signal }) => api.products.list(query, signal),
    placeholderData: keepPreviousData,
  });

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'name', header: 'Product', sortable: list.isSortable('name'),
      render: p => (
        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          {p.name}
          {!p.isActive ? <Badge tone="neutral">Discontinued</Badge> : null}
        </div>
      ),
    },
    { key: 'sku', header: 'SKU', sortable: list.isSortable('sku'), render: p => p.sku ?? <Muted>None</Muted> },
    { key: 'price', header: 'Price', align: 'right', sortable: list.isSortable('price'), render: p => formatMoney(p.price) },
    {
      key: 'usage', header: 'On subscriptions', align: 'right',
      render: p => p.subscriptionUsageCount ? plural(p.subscriptionUsageCount, 'line') : <Muted>None</Muted>,
    },
    { key: 'lastSyncedAt', header: 'Last synced', sortable: list.isSortable('lastSyncedAt'), render: p => p.lastSyncedAt ? formatInstant(p.lastSyncedAt) : <Muted>Never</Muted> },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        actions={<Can call="POST /api/products/import">
          <Button variant="secondary" iconLeft="refresh-cw" onClick={() => setSyncing(true)}>Sync with Square</Button>
          <Button variant="accent" iconLeft="plus" onClick={() => navigate('/products/add')}>Add from Square</Button>
        </Can>}
      />
      <p style={{ margin: '-12px 0 18px', color: 'var(--text-muted)', fontSize: 14.5 }}>
        Names and prices come from Square — change them there, then sync. Customers are billed the price shown here.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <SearchInput value={list.search} onChange={list.setSearch} label="Search products" placeholder="Search by name or SKU" />
        <div style={{ flex: 1 }} />
        <Chip selected={inactive} onClick={() => list.setFlag('inactive', !inactive)}>Include discontinued</Chip>
      </div>
      {error && !data ? <LoadError error={error} onRetry={() => refetch()} what="products" /> : (
        <Card flush style={{ opacity: isFetching && !isPending ? 0.7 : 1, transition: 'opacity var(--duration-fast)' }}>
          <DataTable
            rows={data?.items ?? []}
            rowKey={p => p.id}
            columns={columns}
            sort={list.sort}
            onSortChange={list.setSort}
            onRowClick={p => navigate(`/products/${p.id}`)}
            empty={isPending ? 'Loading products…' : list.search ? `No products match “${list.search}”. It may not be added from Square yet.` : 'No products yet — add them from Square.'}
          />
          {data && data.totalCount > PAGE_SIZE ? (
            <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <Pagination page={data.pageNumber} pageCount={data.totalPages ?? 1} total={data.totalCount} pageSize={data.pageSize} onChange={list.setPage} />
            </div>
          ) : null}
        </Card>
      )}
      {data ? <p style={{ marginTop: 12, fontSize: 13.5, color: 'var(--text-muted)' }}>{plural(data.totalCount, 'product')}{inactive ? ', including discontinued' : ''}.</p> : null}
      {syncing ? <SyncAllDialog onClose={() => setSyncing(false)} /> : null}
    </div>
  );
}

/** Confirm, run, then show what moved. Nothing Square has lost is removed — it is listed for a person to decide. */
function SyncAllDialog({ onClose }: { onClose: () => void }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const sync = useMutation({
    mutationFn: () => api.products.syncAll(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
  const result = sync.data;
  return (
    <Dialog open size="md" onClose={sync.isPending ? undefined : onClose} title={result ? 'Synced with Square' : 'Sync every product with Square?'}
      description={result ? undefined : 'Each active product takes its current name, price and SKU from Square. Run it before a billing day so customers are charged today’s prices.'}
      footer={result
        ? <Button onClick={onClose}>Done</Button>
        : <>
          <Button variant="ghost" onClick={onClose} disabled={sync.isPending}>Cancel</Button>
          <Button onClick={() => sync.mutate()} disabled={sync.isPending}>{sync.isPending ? 'Syncing…' : sync.error ? 'Try again' : 'Sync now'}</Button>
        </>}>
      {sync.error ? <Alert tone="danger">{errorMessage(sync.error)}</Alert> : null}
      {result ? <SyncSummary result={result} /> : null}
    </Dialog>
  );
}

function SyncSummary({ result }: { result: CatalogSyncResult }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0 }}>
        Checked {plural(result.checked, 'product')}: <strong>{result.updated} updated</strong>, {result.unchanged} already current.
      </p>
      {result.missingCount ? (
        <Alert tone="warning" title={`${plural(result.missingCount, 'product')} Square no longer prices`}>
          Left as they were — their price here is unchanged, and subscriptions still include them. Check each in Square: give it a fixed price
          again, or discontinue it here.
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{result.missing.map(n => <li key={n}>{n}</li>)}</ul>
        </Alert>
      ) : <Alert tone="success">Everything matches Square.</Alert>}
    </div>
  );
}
