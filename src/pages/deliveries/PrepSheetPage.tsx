// The prep sheet (PAGES.md §6): a printable pick list, one entry per delivery, carried around the
// stockroom. A date range, because a prep day covers more than one delivery day. Shorted lines stay on
// it, struck through, so nothing looks lost. It has no line ids, so nothing on it is actionable.
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadError } from '../../app/LoadError';
import { FULFILLMENT_LABEL } from '../../app/statusBadges';
import { todayIso } from '../../lib/dates';
import { formatDay, formatPhone, plural } from '../../lib/format';
import { useApi } from '../../session/SessionProvider';
import { Breadcrumbs, Button, Input } from '../../ui';
import { injectStyles } from '../../ui/injectStyles';
import { deliveryKeys } from './keys';

const CSS = [
'.sheet__day{font-family:var(--font-display);font-weight:900;font-size:18px;letter-spacing:var(--tracking-display);text-transform:uppercase;color:var(--teal-500);margin:24px 0 10px;border-bottom:2px solid var(--teal-500);padding-bottom:4px}',
'.sheet__grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}',
'.sheet__box{background:var(--surface-card);border:1px solid var(--border-strong);border-radius:var(--radius-md);padding:12px 14px;break-inside:avoid}',
'.sheet__who{font-family:var(--font-display);font-weight:800;font-size:15px}',
'.sheet__meta{font-size:13px;color:var(--text-muted);margin:2px 0 8px}',
'.sheet__line{display:flex;gap:8px;align-items:baseline;padding:4px 0;border-top:1px dashed var(--border-default);font-size:14.5px}',
'.sheet__tick{width:14px;height:14px;border:1.5px solid var(--ink-500);border-radius:2px;flex-shrink:0;transform:translateY(2px)}',
'.sheet__qty{font-weight:700;min-width:28px}',
'.sheet__line--short{color:var(--text-muted);text-decoration:line-through}',
'@media print{.br-side,.app__top,.no-print{display:none!important}.app{height:auto;display:block}.app__scroll{overflow:visible}.app__content{padding:0;max-width:none}body,.app{background:#fff}.sheet__box{border-color:#999}}',
].join('');

export function PrepSheetPage() {
  injectStyles('prep-sheet', CSS);
  const api = useApi();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const from = params.get('from') ?? todayIso();
  const to = params.get('to') ?? from;
  const { data, error, refetch } = useQuery({
    queryKey: deliveryKeys.sheet(from, to),
    queryFn: () => api.deliveries.sheet({ from, to }),
  });

  const byDay = new Map<string, NonNullable<typeof data>>();
  for (const d of data ?? []) {
    const key = d.scheduledFor.slice(0, 10);
    byDay.set(key, [...(byDay.get(key) ?? []), d]);
  }

  return (
    <div>
      <div className="no-print">
        <Breadcrumbs style={{ marginBottom: 14 }} onNavigate={navigate} items={[{ label: 'Deliveries', href: '/deliveries' }, { label: 'Prep sheet' }]} />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          <Input type="date" size="sm" label="From" value={from} onChange={e => setParams({ from: e.target.value, to: to < e.target.value ? e.target.value : to })} style={{ width: 160 }} />
          <Input type="date" size="sm" label="To" value={to} min={from} onChange={e => setParams({ from, to: e.target.value })} style={{ width: 160 }} />
          <div style={{ flex: 1 }} />
          <Button iconLeft="printer" onClick={() => window.print()} disabled={!data?.length}>Print</Button>
        </div>
      </div>
      <h1 style={{ font: 'var(--type-h1)', letterSpacing: 'var(--tracking-display)', textTransform: 'uppercase', color: 'var(--teal-500)', margin: '8px 0 0' }}>
        Prep sheet
      </h1>
      <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
        {from === to ? formatDay(from, 'long') : `${formatDay(from)} – ${formatDay(to)}`}{data ? ` · ${plural(data.length, 'delivery', 'deliveries')}` : ''}
      </p>
      {error ? <LoadError error={error} onRetry={() => refetch()} what="the prep sheet" /> : null}
      {data && !data.length ? <p style={{ color: 'var(--text-muted)' }}>No deliveries in this range.</p> : null}
      {[...byDay.entries()].map(([day, entries]) => (
        <section key={day}>
          <div className="sheet__day">{formatDay(day, 'long')} · {plural(entries.length, 'box', 'boxes')}</div>
          <div className="sheet__grid">
            {entries.map(d => (
              <div key={d.deliveryId} className="sheet__box">
                <div className="sheet__who">{d.customerName}</div>
                <div className="sheet__meta">
                  {FULFILLMENT_LABEL[d.fulfillmentMethod]}{d.deliveryStreet ? ` · ${d.deliveryStreet}, ${d.deliveryCity}` : ''}
                  {d.phoneNumber ? ` · ${formatPhone(d.phoneNumber)}` : ''}{d.subscriptionName ? <><br />{d.subscriptionName}</> : null}
                </div>
                {d.lines.map((l, i) => (
                  <div key={i} className={'sheet__line' + (l.isShorted ? ' sheet__line--short' : '')}>
                    <span className="sheet__tick" aria-hidden />
                    <span className="sheet__qty">{l.quantity}×</span>
                    <span>{l.packingName ?? l.productName}{l.substitutedWithProductName ? <span style={{ color: 'var(--text-muted)' }}> (instead of {l.productName})</span> : null}{l.isShorted ? ' — not going' : ''}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
