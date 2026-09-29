(() => {
const { Card, Badge, Chip, Button, Tabs, Breadcrumbs, DataTable, Dialog, Radio, Switch, Select, Alert, Checkbox } = window.BarkfieldRoadDesignSystem_ed681c;

function Field({ label, children }) {
  return <div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div><div style={{ fontSize: 15 }}>{children}</div></div>;
}

function CustomerDetail({ sub, onBack, toast }) {
  const D = window.BR_DATA;
  const [tab, setTab] = React.useState('overview');
  const [status, setStatus] = React.useState(sub.status);
  const [dlg, setDlg] = React.useState(false);
  const [hold, setHold] = React.useState('1m');
  const [sms, setSms] = React.useState(true);
  const pause = () => { setStatus('Paused'); setDlg(false); toast(sub.pup + '’s autoship paused', 'Resumes ' + (hold === '2w' ? 'Oct 16' : hold === '1m' ? 'Oct 30' : 'when you resume it') + '.'); };
  return (
    <div>
      <PageHeader title={sub.name} actions={<>
        <Button variant="secondary" size="sm" iconLeft="skip-forward" disabled={status !== 'Active'} onClick={() => toast('Next delivery skipped', sub.pup + '’s box moves to Oct 30.')}>Skip next</Button>
        {status === 'Paused'
          ? <Button size="sm" iconLeft="play" onClick={() => { setStatus('Active'); toast('Autoship resumed'); }}>Resume</Button>
          : <Button size="sm" iconLeft="pause" disabled={status === 'Cancelled'} onClick={() => setDlg(true)}>Pause autoship</Button>}
      </>}>
        <Breadcrumbs items={[{ label: 'Subscriptions', onClick: onBack }, { label: sub.name }]} style={{ marginBottom: 14 }} />
      </PageHeader>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: -12, marginBottom: 20 }}>
        <Badge tone={D.tone[status]} dot>{status}</Badge>
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Subscription #{sub.id} · Customer since {sub.since}</span>
      </div>
      <Tabs value={tab} onChange={setTab} style={{ marginBottom: 20 }} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'orders', label: 'Orders', count: D.orders.length }, { id: 'pups', label: 'Pups', count: 1 }, { id: 'notes', label: 'Notes' }]} />
      {status === 'Past due' ? <Alert tone="danger" title="Card declined" style={{ marginBottom: 16 }} action={<Button size="sm" variant="secondary" iconLeft="mail" onClick={() => toast('Update link sent', 'Emailed to ' + sub.email)}>Send update link</Button>}>Visa ending 4242 was declined on Sep 26. Next delivery is on hold until payment is updated.</Alert> : null}
      {tab === 'orders' ? (
        <Card flush title="Order history">
          <DataTable rows={D.orders} columns={[
            { key: 'id', header: 'Order', render: r => <strong>{r.id}</strong> }, { key: 'date', header: 'Date' }, { key: 'items', header: 'Items' },
            { key: 'status', header: 'Status', render: r => <Badge tone={r.status === 'Delivered' ? 'success' : 'neutral'}>{r.status}</Badge> },
            { key: 'total', header: 'Total', align: 'right', render: r => '$' + r.total.toFixed(2) }]} />
        </Card>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card eyebrow="Autoship plan" title={sub.plan} actions={<Button variant="ghost" size="sm" iconLeft="pencil">Edit</Button>}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 16, marginBottom: 18 }}>
              <Field label="Size">{sub.size}</Field><Field label="Every">{sub.freq} weeks</Field>
              <Field label="Next delivery">{status === 'Active' || status === 'Past due' ? sub.next : '—'}</Field><Field label="Per box">{'$' + sub.total.toFixed(2)}</Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
              <Select label="Delivery route" defaultValue={sub.route} options={[{ value: 'A', label: 'Route A — Northport / Centerport' }, { value: 'B', label: 'Route B — Huntington / Commack' }, { value: 'C', label: 'Route C — Syosset / Greenlawn' }]} />
              <Select label="Window" defaultValue="am" options={[{ value: 'am', label: 'Morning · 9–12' }, { value: 'pm', label: 'Afternoon · 1–4' }]} />
            </div>
          </Card>
          <Card title="Upcoming" eyebrow="Next 3 boxes">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {['Thu, Oct 2', 'Thu, Oct 30', 'Thu, Nov 27'].map((d, i) => (
                <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderTop: i ? '1px solid var(--border-subtle)' : 0 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--cream-200)', color: 'var(--teal-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 15 }}>{d.split(' ')[2]}</div>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{d}</div><div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{sub.plan} · {sub.size}{i === 0 ? ' + Pumpkin Bites' : ''}</div></div>
                  <Badge tone={status === 'Paused' ? 'warning' : i === 0 && status === 'Past due' ? 'danger' : 'info'}>{status === 'Paused' ? 'Paused' : i === 0 && status === 'Past due' ? 'On hold' : 'Scheduled'}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card tone="cream" eyebrow="Pup" title={sub.pup}>
            <div style={{ fontSize: 14.5, color: 'var(--ink-700)', marginBottom: 12 }}>{sub.breed} · 6 yrs · 68 lb</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{sub.tags.concat(['Loves pumpkin']).map(t => <Chip key={t} variant="tag" size="sm">{t}</Chip>)}</div>
          </Card>
          <Card title="Contact">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Email"><a href="#">{sub.email}</a></Field>
              <Field label="Phone">{sub.phone}</Field>
              <Field label="Address">14 Laurel Hill Rd, {sub.town}, NY</Field>
              <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Switch label="SMS reminder 2 days before" checked={sms} onChange={setSms} />
                <Checkbox label="Leave at side gate" checked onChange={() => {}} />
              </div>
            </div>
          </Card>
        </div>
      </div>)}
      <Dialog open={dlg} onClose={() => setDlg(false)} title={'Pause ' + sub.pup + '’s autoship?'} description={'Deliveries stop until the pause ends. ' + sub.name.split(' ')[0] + ' gets an email confirmation.'}
        footer={<><Button variant="ghost" onClick={() => setDlg(false)}>Keep active</Button><Button onClick={pause}>Pause autoship</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[['2w', '2 weeks', 'Resumes Oct 16'], ['1m', '1 month', 'Resumes Oct 30'], ['open', 'Until resumed manually']].map(([v, l, d]) => <Radio key={v} name="hold" value={v} label={l} description={d} checked={hold === v} onChange={setHold} />)}
        </div>
      </Dialog>
    </div>
  );
}
window.CustomerDetail = CustomerDetail;
})();
