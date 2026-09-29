(() => {
const { Card, Chip, Tabs, Badge, Button, IconButton } = window.BarkfieldRoadDesignSystem_ed681c;

const ROUTE = { A: 'var(--teal-500)', B: 'var(--terracotta-500)', C: 'var(--tan-500)', P: 'var(--ink-500)' };

function Schedule({ toast }) {
  const D = window.BR_DATA;
  const [routes, setRoutes] = React.useState(['A', 'B', 'C', 'P']);
  const [view, setView] = React.useState('week');
  const toggle = r => setRoutes(routes.includes(r) ? routes.filter(x => x !== r) : routes.concat([r]));
  return (
    <div>
      <PageHeader eyebrow="Sep 29 – Oct 4" title="Delivery schedule" actions={<>
        <IconButton icon="chevron-left" label="Previous week" variant="secondary" /><IconButton icon="chevron-right" label="Next week" variant="secondary" />
        <Button size="sm" iconLeft="printer" variant="secondary" onClick={() => toast('Pick list sent to printer')}>Pick list</Button></>} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {[['A', 'Route A'], ['B', 'Route B'], ['C', 'Route C'], ['P', 'Store pickup']].map(([r, l]) =>
          <Chip key={r} selected={routes.includes(r)} onClick={() => toggle(r)}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: routes.includes(r) ? 'var(--cream-300)' : ROUTE[r], marginRight: 2, marginTop: -2, verticalAlign: 'middle' }}></span>{l}</Chip>)}
        <div style={{ flex: 1 }}></div>
        <Tabs variant="pill" value={view} onChange={setView} tabs={[{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }, { id: 'list', label: 'List' }]} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 12 }}>
        {D.week.map((d, i) => {
          const stops = d.stops.filter(s => routes.includes(s.r));
          const today = i === 0;
          return (
            <div key={d.day} style={{ background: 'var(--surface-card)', border: '1px solid ' + (today ? 'var(--teal-500)' : 'var(--border-default)'), borderRadius: 'var(--radius-md)', minHeight: 420, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid var(--border-subtle)', background: today ? 'var(--teal-500)' : 'transparent', borderRadius: '5px 5px 0 0' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: today ? 'var(--tan-300)' : 'var(--tan-700)' }}>{d.day}{today ? ' · Today' : ''}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, color: today ? 'var(--cream-300)' : 'var(--teal-500)', letterSpacing: '.01em' }}>{d.date}</div>
              </div>
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {stops.map(s => (
                  <div key={s.n} style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: s.hold ? 'var(--status-danger-bg)' : 'var(--surface-sunken)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: ROUTE[s.r], flexShrink: 0 }}></span><span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{s.n}</span></div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{s.t}</div>
                    {s.hold ? <Badge tone="danger">On hold</Badge> : null}
                  </div>
                ))}
                {stops.length === 0 ? <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: 8 }}>No stops on selected routes.</div> : null}
              </div>
              <div style={{ marginTop: 'auto', padding: '8px 12px', borderTop: '1px solid var(--border-subtle)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: 'var(--text-secondary)' }}>{stops.length} stop{stops.length === 1 ? '' : 's'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
window.Schedule = Schedule;
})();
