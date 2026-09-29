(() => {
const { StatCard, Card, Badge, Button, DataTable, Alert } = window.BarkfieldRoadDesignSystem_ed681c;

function Dashboard({ onOpen, onNav }) {
  const D = window.BR_DATA;
  const today = D.subs.filter(s => s.next === 'Thu, Oct 2' || s.status === 'Past due');
  return (
    <div>
      <PageHeader eyebrow="Monday, September 29" title="Dashboard" actions={<Button variant="secondary" iconLeft="download" size="sm">Export week</Button>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 16, marginBottom: 20 }}>
        <StatCard label="Active autoships" value="1,284" delta="+38" trend="up" caption="this month" icon="repeat" />
        <StatCard label="Deliveries this week" value="186" caption="across 3 routes" icon="truck" />
        <StatCard label="Monthly recurring" value="$92.4k" delta="+4.1%" trend="up" caption="vs Aug" icon="circle-dollar-sign" />
        <StatCard label="Paused or past due" value="108" delta="+6" trend="down" caption="since last week" icon="pause" />
      </div>
      <Alert tone="danger" title="1 payment needs attention" style={{ marginBottom: 20 }} action={<Button size="sm" variant="secondary" onClick={() => onOpen(D.subs[1])}>Review</Button>}>
        Marcus Bell’s card was declined on Sep 26 — Friday’s Route B delivery is on hold.
      </Alert>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 16 }}>
        <Card title="Upcoming deliveries" flush actions={<Button variant="ghost" size="sm" iconRight="chevron-right" onClick={() => onNav('schedule')}>Full schedule</Button>}>
          <DataTable rows={today} onRowClick={onOpen} columns={[
            { key: 'name', header: 'Customer', render: r => <div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.pup} · {r.town}</div></div> },
            { key: 'plan', header: 'Order', render: r => r.plan + ' · ' + r.size },
            { key: 'route', header: 'Route', render: r => 'Route ' + r.route },
            { key: 'status', header: 'Status', render: r => <Badge tone={D.tone[r.status]} dot>{r.status === 'Active' ? 'Scheduled' : r.status}</Badge> }
          ]} />
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card tone="brand" eyebrow="Today’s route" title="Route A — 14 stops">
            <div style={{ fontSize: 14.5, color: 'var(--teal-100)', marginBottom: 14 }}>Leaves the shop at 8:30 AM · East Northport → Centerport</div>
            <Button variant="cream" size="sm" iconLeft="route" onClick={() => onNav('schedule')}>View route</Button>
          </Card>
          <Card title="Bakery add-ons" eyebrow="This week">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14.5 }}>
              {[['Pumpkin Bites', 42], ['Birthday Pupcakes', 7], ['Peanut Butter Bones', 31]].map(([n, q]) => (
                <div key={n} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{n}</span><strong style={{ fontVariantNumeric: 'tabular-nums' }}>{q}</strong></div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
window.Dashboard = Dashboard;
})();
