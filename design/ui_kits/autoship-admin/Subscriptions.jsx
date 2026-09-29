(() => {
const { Card, DataTable, Pagination, Badge, Chip, Button, IconButton, Select, Tooltip } = window.BarkfieldRoadDesignSystem_ed681c;

function Subscriptions({ onOpen, toast }) {
  const D = window.BR_DATA;
  const [filter, setFilter] = React.useState('all');
  const [sel, setSel] = React.useState([]);
  const [sort, setSort] = React.useState({ key: 'name', dir: 'asc' });
  const [page, setPage] = React.useState(1);
  const counts = { all: D.subs.length, Active: 0, Paused: 0, 'Past due': 0, Cancelled: 0 };
  D.subs.forEach(s => counts[s.status]++);
  let rows = filter === 'all' ? D.subs : D.subs.filter(s => s.status === filter);
  rows = rows.slice().sort((a, b) => { const x = a[sort.key], y = b[sort.key]; return (x > y ? 1 : x < y ? -1 : 0) * (sort.dir === 'asc' ? 1 : -1); });
  return (
    <div>
      <PageHeader title="Subscriptions" actions={<><Button variant="secondary" size="sm" iconLeft="download">Export CSV</Button></>} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['all', 'All'], ['Active', 'Active'], ['Paused', 'Paused'], ['Past due', 'Past due'], ['Cancelled', 'Cancelled']].map(([id, l]) =>
          <Chip key={id} selected={filter === id} onClick={() => { setFilter(id); setSel([]); }} count={counts[id]}>{l}</Chip>)}
        <div style={{ flex: 1 }}></div>
        <Select size="sm" defaultValue="all" style={{ width: 150 }} options={[{ value: 'all', label: 'All routes' }, 'Route A', 'Route B', 'Route C']} />
        <Select size="sm" defaultValue="any" style={{ width: 160 }} options={[{ value: 'any', label: 'Any frequency' }, 'Every 2 weeks', 'Every 4 weeks', 'Every 6 weeks']} />
      </div>
      <Card flush>
        {sel.length ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px 12px', marginTop: -2 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--teal-600)' }}>{sel.length} selected</span>
            <Button size="sm" variant="secondary" iconLeft="skip-forward" onClick={() => { toast('Skipped next delivery for ' + sel.length + ' subscription' + (sel.length > 1 ? 's' : '')); setSel([]); }}>Skip next</Button>
            <Button size="sm" variant="secondary" iconLeft="route">Move route</Button>
            <Button size="sm" variant="ghost" onClick={() => setSel([])}>Clear</Button>
          </div>
        ) : null}
        <DataTable selectable selected={sel} onSelectChange={setSel} sort={sort} onSortChange={setSort} rows={rows} onRowClick={onOpen} columns={[
          { key: 'name', header: 'Customer', sortable: true, render: r => <div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 13, color: 'var(--text-muted)' }}>#{r.id} · {r.town}</div></div> },
          { key: 'pup', header: 'Pup', render: r => <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}><span>{r.pup}</span>{r.tags.length ? <Chip variant="tag" size="sm">{r.tags[0]}</Chip> : null}</div> },
          { key: 'plan', header: 'Plan', render: r => <span>{r.plan}<span style={{ color: 'var(--text-muted)' }}> · {r.size}</span></span> },
          { key: 'freq', header: 'Every', sortable: true, render: r => r.freq + ' wks' },
          { key: 'next', header: 'Next delivery', render: r => r.next },
          { key: 'status', header: 'Status', render: r => <Badge tone={D.tone[r.status]} dot>{r.status}</Badge> },
          { key: 'total', header: 'Per box', align: 'right', sortable: true, render: r => r.total ? '$' + r.total.toFixed(2) : '—' },
          { key: 'x', header: '', width: 84, render: r => <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
            <Tooltip content="Skip next delivery"><IconButton icon="skip-forward" label="Skip next" size="sm" onClick={() => toast('Skipped ' + r.pup + '’s next delivery')} /></Tooltip>
            <IconButton icon="ellipsis" label="More" size="sm" /></div> }
        ]} />
        <div style={{ borderTop: '1px solid var(--border-subtle)' }}><Pagination page={page} pageCount={52} total={1284} pageSize={25} onChange={setPage} /></div>
      </Card>
    </div>
  );
}
window.Subscriptions = Subscriptions;
})();
