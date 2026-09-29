// Generate deliveries (PAGES.md §6). The preview is the important half: what generation would create
// for the day and every reason a subscription would be passed over — overdue ones included — so nothing
// is discovered afterwards. Partial success is normal; the result is a list, not a pass/fail.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api/errors';
import type { DueSubscription, GenerationResult } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { FULFILLMENT_LABEL } from '../../app/statusBadges';
import { addDays, todayIso } from '../../lib/dates';
import { formatDay, plural } from '../../lib/format';
import { Can, useApi } from '../../session/SessionProvider';
import { Alert, Badge, Breadcrumbs, Button, Card, Chip, DataTable, Input } from '../../ui';
import { customerKeys } from '../customers/keys';
import { deliveryKeys } from './keys';

export function GenerateDeliveriesPage() {
  const api = useApi();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = todayIso();
  const [date, setDate] = useState(today);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const preview = useQuery({
    queryKey: deliveryKeys.due(date),
    queryFn: () => api.deliveries.due(date),
    enabled: !!date,
  });
  const generate = useMutation({
    mutationFn: () => api.deliveries.generate(date),
    onSuccess: async r => {
      setResult(r);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: deliveryKeys.all }),
        queryClient.invalidateQueries({ queryKey: customerKeys.all }),
      ]);
    },
  });

  // Will-create first, then the real skips, then ones already created for the day. The last are not a
  // problem — listing them first would bury the skips that need someone's attention.
  const rank = (d: DueSubscription) => (d.willGenerate ? 0 : d.alreadyGenerated ? 2 : 1);
  const due = [...(preview.data ?? [])].sort((a, b) => rank(a) - rank(b) || a.customerName.localeCompare(b.customerName));
  const willCreate = due.filter(d => d.willGenerate);
  const skipped = due.filter(d => !d.willGenerate && !d.alreadyGenerated);
  const already = due.filter(d => d.alreadyGenerated);

  return (
    <div>
      <PageHeader title="Generate deliveries">
        <Breadcrumbs style={{ marginBottom: 14 }} onNavigate={navigate} items={[{ label: 'Deliveries', href: '/deliveries' }, { label: 'Generate' }]} />
      </PageHeader>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input type="date" label="Delivery day" value={date} onChange={e => { setDate(e.target.value); setResult(null); generate.reset(); }} style={{ width: 180 }} />
        <Chip selected={date === today} onClick={() => { setDate(today); setResult(null); }}>Today</Chip>
        <Chip selected={date === addDays(today, 1)} onClick={() => { setDate(addDays(today, 1)); setResult(null); }}>Tomorrow</Chip>
      </div>

      {result ? <ResultCard result={result} date={date} /> : null}
      {generate.error ? <Alert tone="danger" title="Generation didn’t run" style={{ marginBottom: 16 }}>{errorMessage(generate.error)}</Alert> : null}

      {preview.error ? <LoadError error={preview.error} onRetry={() => preview.refetch()} what="the preview" /> : (
        <Card flush
          title={preview.isPending ? 'Checking…' : `${formatDay(date, 'long')}: ${plural(willCreate.length, 'delivery', 'deliveries')} to create`}
          eyebrow="Preview"
          actions={!result ? (
            <Can call="POST /api/deliveries/generate">
              <Button disabled={!willCreate.length || generate.isPending} onClick={() => generate.mutate()}>
                {generate.isPending ? 'Creating…' : willCreate.length ? `Create ${plural(willCreate.length, 'delivery', 'deliveries')}` : 'Nothing to create'}
              </Button>
            </Can>
          ) : undefined}>
          {skipped.length ? (
            <div style={{ padding: '0 20px 12px' }}>
              <Alert tone="warning">{plural(skipped.length, 'subscription')} will be passed over — the reasons are in the list, so nothing is missed.{already.length ? ` ${plural(already.length, 'other')} already ${already.length === 1 ? 'has' : 'have'} a delivery for this day.` : ''}</Alert>
            </div>
          ) : null}
          <DataTable<DueSubscription>
            rows={due} rowKey={d => d.subscriptionId}
            empty={preview.isPending ? 'Loading…' : 'Nothing is due for this day.'}
            columns={[
              { key: 'customer', header: 'Customer', render: d => <div><div style={{ fontWeight: 600 }}>{d.customerName}</div><div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{d.subscriptionName ?? 'Unnamed subscription'}</div></div> },
              {
                key: 'due', header: 'Due',
                render: d => d.alreadyGenerated ? <span style={{ color: 'var(--text-muted)' }}>Created</span> : <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  {formatDay(d.nextDeliveryDate)}
                  {d.isOverdue ? <Badge tone="warning">Overdue</Badge> : null}
                  {d.resumingFromPause ? <Badge tone="info">Pause ends</Badge> : null}
                </span>,
              },
              { key: 'method', header: 'Method', render: d => FULFILLMENT_LABEL[d.fulfillmentMethod] },
              { key: 'lines', header: 'Lines', align: 'right', render: d => d.scheduledLineCount },
              {
                key: 'outcome', header: 'Outcome',
                render: d => d.willGenerate
                  ? <Badge tone="success" dot>Will create</Badge>
                  : <span style={{ color: d.alreadyGenerated ? 'var(--text-muted)' : 'var(--status-warning-fg)', fontSize: 14 }}>{d.skipReason}</span>,
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
}

function ResultCard({ result, date }: { result: GenerationResult; date: string }) {
  // Counted from the lists, which the contract always includes; the count fields are optional.
  const created = result.createdDeliveryIds.length;
  const resumed = result.resumedFromPause.length;
  return (
    <Card title={`Created ${plural(created, 'delivery', 'deliveries')}`} eyebrow="Done" style={{ marginBottom: 16 }}
      actions={<Link to={`/deliveries?from=${date}&to=${date}`}>Open the day’s worklist</Link>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0 }}>
          {plural(result.considered, 'subscription')} considered · {created} created · {result.skipped.length} skipped
          {resumed ? ` · ${resumed} resumed from a pause` : ''}.
        </p>
        {resumed ? (
          <Alert tone="info" title="Back from a pause">
            {plural(resumed, 'subscription')} restarted today because their pause ended — worth a glance, since their orders are going out again.
          </Alert>
        ) : null}
        {result.skipped.length ? (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>Skipped</div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {result.skipped.map(s => <li key={s.subscriptionId}><strong>{s.customerName}</strong> ({s.subscriptionName}): {s.reason}</li>)}
            </ul>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
