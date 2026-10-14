// Users list (PAGES.md §9). Paged, searched and sorted on the server; filter by role; deactivated
// accounts hidden unless asked for.
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { UserListItem } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { SearchInput, useListParams } from '../../app/lists';
import { formatInstant, plural } from '../../lib/format';
import { Can, useApi, useSession } from '../../session/SessionProvider';
import { Badge, Button, Card, Chip, DataTable, Muted, Pagination, type DataTableColumn } from '../../ui';
import { userKeys } from './keys';

const PAGE_SIZE = 25;

export function UsersListPage() {
  const api = useApi();
  const navigate = useNavigate();
  const { user: me } = useSession();
  const list = useListParams('/api/users');
  const inactive = list.flag('inactive');
  const roleId = list.value('role');

  const roles = useQuery({ queryKey: userKeys.roles, queryFn: () => api.users.roles(), staleTime: Infinity });
  const query = {
    searchTerm: list.search || undefined,
    roleId: roleId || undefined,
    includeInactive: inactive || undefined,
    sortBy: list.sort.key,
    sortDescending: list.sort.dir === 'desc',
    pageNumber: list.page,
    pageSize: PAGE_SIZE,
  };
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: userKeys.list(query),
    queryFn: ({ signal }) => api.users.list(query, signal),
    placeholderData: keepPreviousData,
  });

  const columns: DataTableColumn<UserListItem>[] = [
    {
      key: 'name', header: 'Name', sortable: list.isSortable('name'),
      render: u => (
        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          {u.name}
          {u.id === me.id ? <Badge tone="info">You</Badge> : null}
          {!u.isActive ? <Badge tone="neutral">Deactivated</Badge> : null}
        </div>
      ),
    },
    { key: 'email', header: 'Email', sortable: list.isSortable('email'), render: u => u.email },
    {
      key: 'roles', header: 'Roles',
      render: u => (
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {u.roles || <Muted>None</Muted>}
          {u.isAdmin ? <Badge tone="brand">Admin</Badge> : null}
        </span>
      ),
    },
    { key: 'createdAt', header: 'Added', sortable: list.isSortable('createdAt'), render: u => formatInstant(u.createdAt) },
  ];

  const roleName = roles.data?.find(r => r.id === roleId)?.name;
  return (
    <div>
      <PageHeader
        title="Users"
        actions={<Can call="POST /api/users"><Button variant="accent" iconLeft="plus" onClick={() => navigate('/users/new')}>New user</Button></Can>}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <SearchInput value={list.search} onChange={list.setSearch} label="Search users" placeholder="Search by name or email" />
        <div style={{ flex: 1 }} />
        {(roles.data ?? []).map(r => (
          <Chip key={r.id} selected={r.id === roleId} onClick={() => list.setValues({ role: r.id === roleId ? null : r.id })}>{r.name}</Chip>
        ))}
        <Chip selected={inactive} onClick={() => list.setFlag('inactive', !inactive)}>Include deactivated</Chip>
      </div>
      {error && !data ? <LoadError error={error} onRetry={() => refetch()} what="users" /> : (
        <Card flush style={{ opacity: isFetching && !isPending ? 0.7 : 1, transition: 'opacity var(--duration-fast)' }}>
          <DataTable
            rows={data?.items ?? []}
            rowKey={u => u.id}
            columns={columns}
            sort={list.sort}
            onSortChange={list.setSort}
            onRowClick={u => navigate(`/users/${u.id}`)}
            empty={isPending ? 'Loading users…' : list.search ? `No users match “${list.search}”.` : roleName ? `Nobody holds the ${roleName} role.` : 'No users.'}
          />
          {data && data.totalCount > PAGE_SIZE ? (
            <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <Pagination page={data.pageNumber} pageCount={data.totalPages ?? 1} total={data.totalCount} pageSize={data.pageSize} onChange={list.setPage} />
            </div>
          ) : null}
        </Card>
      )}
      {data ? (
        <p style={{ marginTop: 12, fontSize: 13.5, color: 'var(--text-muted)' }}>
          {plural(data.totalCount, 'user')}{roleName ? ` with the ${roleName} role` : ''}{inactive ? ', including deactivated' : ''}.
        </p>
      ) : null}
    </div>
  );
}
