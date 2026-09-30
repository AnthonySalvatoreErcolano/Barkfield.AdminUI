// Customers list (PAGES.md §2). Paged, searched and sorted on the server; archived customers hidden
// unless asked for.
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { SearchInput, useListParams } from '../../app/lists';
import { formatPhone, plural } from '../../lib/format';
import { Can, useApi } from '../../session/SessionProvider';
import { Badge, Button, Card, Chip, DataTable, Pagination, type DataTableColumn } from '../../ui';
import type { CustomerListItem } from '../../api/ports';
import { customerKeys } from './keys';

const PAGE_SIZE = 25;

export function CustomersListPage() {
  const api = useApi();
  const navigate = useNavigate();
  const list = useListParams('/api/customers');
  const archived = list.flag('archived');
  const unlinked = list.flag('unlinked');

  const query = {
    searchTerm: list.search || undefined,
    includeInactive: archived || undefined,
    hasSquareAccount: unlinked ? false : undefined,
    sortBy: list.sort.key,
    sortDescending: list.sort.dir === 'desc',
    pageNumber: list.page,
    pageSize: PAGE_SIZE,
  };
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: customerKeys.list(query),
    queryFn: ({ signal }) => api.customers.list(query, signal),
    placeholderData: keepPreviousData,
  });

  const columns: DataTableColumn<CustomerListItem>[] = [
    {
      key: 'name', header: 'Customer', sortable: list.isSortable('name'),
      render: c => (
        <div>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            {c.fullName ?? `${c.firstName} ${c.lastName}`}
            {!c.isActive ? <Badge tone="neutral">Archived</Badge> : null}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.email}</div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', sortable: list.isSortable('phone'), render: c => formatPhone(c.phoneNumber) },
    { key: 'city', header: 'Town', sortable: list.isSortable('city'), render: c => c.city ?? <span style={{ color: 'var(--text-muted)' }}>No address</span> },
    { key: 'pets', header: 'Pets', align: 'right', render: c => c.petCount },
    { key: 'subs', header: 'Active subscriptions', align: 'right', render: c => c.activeSubscriptionCount },
    { key: 'square', header: 'Square', render: c => c.isSyncedToSquare ? <Badge tone="success">Linked</Badge> : <Badge tone="warning" dot>Not linked</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        actions={<Can call="POST /api/customers"><Button variant="accent" iconLeft="plus" onClick={() => navigate('/customers/new')}>New customer</Button></Can>}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <SearchInput value={list.search} onChange={list.setSearch} label="Search customers" placeholder="Search by name, email or phone" />
        <div style={{ flex: 1 }} />
        <Chip selected={unlinked} onClick={() => list.setFlag('unlinked', !unlinked)} icon="triangle-alert">Not linked to Square</Chip>
        <Chip selected={archived} onClick={() => list.setFlag('archived', !archived)}>Include archived</Chip>
      </div>
      {error && !data ? <LoadError error={error} onRetry={() => refetch()} what="customers" /> : (
        <Card flush style={{ opacity: isFetching && !isPending ? 0.7 : 1, transition: 'opacity var(--duration-fast)' }}>
          <DataTable
            rows={data?.items ?? []}
            rowKey={c => c.id}
            columns={columns}
            sort={list.sort}
            onSortChange={list.setSort}
            onRowClick={c => navigate(`/customers/${c.id}`)}
            empty={isPending ? 'Loading customers…' : list.search ? `No customers match “${list.search}”.` : 'No customers yet.'}
          />
          {data && data.totalCount > 0 ? (
            <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <Pagination page={data.pageNumber} pageCount={data.totalPages ?? 1} total={data.totalCount} pageSize={data.pageSize} onChange={list.setPage} />
            </div>
          ) : null}
        </Card>
      )}
      {data ? <p style={{ marginTop: 12, fontSize: 13.5, color: 'var(--text-muted)' }}>{plural(data.totalCount, 'customer')}{archived ? ', including archived' : ''}.</p> : null}
    </div>
  );
}
