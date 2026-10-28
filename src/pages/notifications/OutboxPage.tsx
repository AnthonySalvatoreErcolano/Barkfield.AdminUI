// The outbox — the queue and the permanent log in one. This is where "was the customer told, and what
// did it say?" gets answered, so every entry opens to its full text.
//
// Two statuses ask for a person, and the action is the same though the reasons are opposite:
//   Failed — the transport couldn't send it. Retry.
//   Held for review — deliberately not sent: a substitution to a household with an allergic pet. The
//   system can't tell whether the substitute is safe, so a person reads it and releases it, or doesn't.
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { errorMessage } from '../../api/errors';
import { NotificationStatus } from '../../api/generated/enums';
import type { OutboxEntry, OutboxQuery } from '../../api/ports';
import { LoadError } from '../../app/LoadError';
import { useToast } from '../../app/toast';
import { formatInstant, plural } from '../../lib/format';
import { Can, useApi } from '../../session/SessionProvider';
import { Alert, Button, Card, Chip, DataTable, DetailField, Dialog, Input, Muted, Pagination, Select } from '../../ui';
import { notificationKeys } from './keys';
import { OUTBOX_FILTERS, OutboxStatusBadge } from './labels';

const PAGE_SIZE = 25;

export function OutboxPage() {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState<OutboxEntry | null>(null);
  const set = (patch: Record<string, string | null>) => setParams(prev => {
    const next = new URLSearchParams(prev);
    for (const [k, v] of Object.entries(patch)) { if (v) next.set(k, v); else next.delete(k); }
    if (!('page' in patch)) next.delete('page');
    return next;
  }, { replace: true });

  const status = params.get('status');
  const query: OutboxQuery = {
    status: status ? (Number(status) as OutboxQuery['status']) : undefined,
    ruleId: params.get('rule') || undefined,
    customerId: params.get('customer') || undefined,
    queuedFrom: params.get('from') || undefined,
    queuedTo: params.get('to') || undefined,
    pageNumber: Number(params.get('page')) || 1,
    pageSize: PAGE_SIZE,
  };
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: notificationKeys.outbox(query),
    queryFn: ({ signal }) => api.notifications.outbox(query, signal),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000, // the worker sends in the background
  });
  const rules = useQuery({ queryKey: notificationKeys.rules, queryFn: () => api.notifications.rules() });
  const drain = useMutation({
    mutationFn: () => api.notifications.drain(),
    onSuccess: r => toast({
      title: r.didNothing ? 'Nothing was waiting to send' : `Sent ${r.sent}`,
      message: r.didNothing ? undefined : [r.failed ? `${r.failed} failed` : null, r.suppressed ? `${r.suppressed} to blocked addresses` : null].filter(Boolean).join(' · ') || undefined,
    }),
    onError: err => toast({ tone: 'danger', title: 'Couldn’t send now', message: errorMessage(err) }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });

  const ruleName = rules.data?.find(r => r.id === query.ruleId)?.name;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {OUTBOX_FILTERS.map(f => (
          <Chip key={f.label} selected={(status ?? null) === (f.value === null ? null : String(f.value))} onClick={() => set({ status: f.value === null ? null : String(f.value) })}>{f.label}</Chip>
        ))}
        <div style={{ flex: 1 }} />
        <Can call="POST /api/notifications/queue/drain">
          <Button size="sm" variant="secondary" iconLeft="mail" onClick={() => drain.mutate()} disabled={drain.isPending}>{drain.isPending ? 'Sending…' : 'Send waiting emails now'}</Button>
        </Can>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Select label="Rule" size="sm" value={query.ruleId ?? ''} onChange={e => set({ rule: e.target.value || null })} style={{ minWidth: 260 }}
          options={[{ value: '', label: 'Any rule (and tests)' }, ...(rules.data ?? []).map(r => ({ value: r.id, label: r.name }))]} />
        <Input label="Written from" size="sm" type="date" value={query.queuedFrom ?? ''} onChange={e => set({ from: e.target.value || null })} style={{ width: 170 }} />
        <Input label="to" size="sm" type="date" value={query.queuedTo ?? ''} onChange={e => set({ to: e.target.value || null })} style={{ width: 170 }} />
        {query.customerId ? <Chip selected onRemove={() => set({ customer: null })}>One customer</Chip> : null}
      </div>
      {status === String(NotificationStatus.Skipped) && ruleName ? (
        <Alert tone="info">What “{ruleName}” would have sent while in dry run. Read these before taking it live.</Alert>
      ) : null}
      {error && !data ? <LoadError error={error} onRetry={() => refetch()} what="the outbox" /> : (
        <Card flush style={{ opacity: isFetching && !isPending ? 0.7 : 1, transition: 'opacity var(--duration-fast)' }}>
          <DataTable rows={data?.items ?? []} rowKey={e => e.id} onRowClick={setOpen}
            empty={isPending ? 'Loading…' : 'Nothing here.'}
            columns={[
              { key: 'when', header: 'Written', render: e => <span style={{ whiteSpace: 'nowrap' }}>{formatInstant(e.queuedAt, true)}</span> },
              { key: 'to', header: 'To', render: e => <div><div style={{ fontWeight: 600 }}>{e.customerName ?? e.toName}</div><div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{e.toEmail}</div></div> },
              { key: 'subject', header: 'Subject', render: e => <div><div>{e.subject}</div><div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{e.ruleName ?? (e.subject.startsWith('[TEST]') ? 'Test send' : 'No rule')}</div></div> },
              { key: 'status', header: 'Status', render: e => <OutboxStatusBadge entry={e} /> },
            ]} />
          {data && data.totalCount > PAGE_SIZE ? (
            <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <Pagination page={data.pageNumber} pageCount={data.totalPages ?? 1} total={data.totalCount} pageSize={data.pageSize} onChange={p => set({ page: String(p) })} />
            </div>
          ) : null}
        </Card>
      )}
      {data ? <Muted>{plural(data.totalCount, 'email')}.</Muted> : null}
      {open ? <EntryDialog entry={open} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}

function EntryDialog({ entry: e, onClose }: { entry: OutboxEntry; onClose: () => void }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const retry = useMutation({
    mutationFn: () => api.notifications.retry(e.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast({ title: e.isHeldForReview ? 'Released — it will send shortly' : 'Back in the queue', message: 'It goes out on the next pass.' });
      onClose();
    },
  });
  return (
    <Dialog open size="md" onClose={retry.isPending ? undefined : onClose} title={e.subject}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={retry.isPending}>Close</Button>
        {e.needsAttention ? (
          <Can call="POST /api/notifications/outbox/{entryId}/retry">
            <Button onClick={() => retry.mutate()} disabled={retry.isPending}>{retry.isPending ? 'Saving…' : e.isHeldForReview ? 'It’s safe — send it' : 'Retry'}</Button>
          </Can>
        ) : null}
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {e.isHeldForReview ? (
          <Alert tone="warning" title="Held — a pet in this household has recorded allergies">
            Read it, and check the substitute against the pet’s allergies on the customer’s page. Send it only if the substitute is safe.
            {e.customerId ? <> <Link to={`/customers/${e.customerId}`} onClick={onClose}>Open the customer</Link></> : null}
          </Alert>
        ) : e.status === NotificationStatus.Failed ? (
          <Alert tone="danger" title={`Couldn’t be sent after ${plural(e.attempts, 'try', 'tries')}`}>{e.lastError ?? 'No reason given.'}</Alert>
        ) : e.status === NotificationStatus.Skipped ? (
          <Alert tone="info">Not sent — written while its rule was in dry run, or while sending was switched off. Not an error.</Alert>
        ) : e.status === NotificationStatus.Suppressed ? (
          <Alert tone="info">Not sent — this address is blocked (unsubscribed or bouncing). See Settings → Blocked addresses.</Alert>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <DetailField label="Status"><OutboxStatusBadge entry={e} /></DetailField>
          <DetailField label="To">{e.toName ? `${e.toName} — ` : ''}{e.toEmail}</DetailField>
          <DetailField label="Written">{formatInstant(e.queuedAt, true)}</DetailField>
          <DetailField label={e.sentAt ? 'Sent' : e.isWaiting ? 'Sends at' : 'Due'}>{formatInstant(e.sentAt ?? e.sendAfter, true)}</DetailField>
          <DetailField label="Rule">{e.ruleName ?? <Muted>{e.subject.startsWith('[TEST]') ? 'A test send' : 'None'}</Muted>}</DetailField>
          <DetailField label="About">
            {e.customerId ? <Link to={`/customers/${e.customerId}`} onClick={onClose}>{e.customerName ?? 'The customer'}</Link> : null}
            {e.customerId && e.deliveryId ? ' · ' : null}
            {e.deliveryId ? <Link to={`/deliveries/${e.deliveryId}`} onClick={onClose}>the delivery</Link> : null}
            {!e.customerId && !e.deliveryId ? <Muted>—</Muted> : null}
          </DetailField>
        </div>
        <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', whiteSpace: 'pre-wrap', fontSize: 14.5, lineHeight: 1.55, maxHeight: 320, overflow: 'auto' }}>
          {e.bodyText}
        </div>
        {retry.error ? <Alert tone="danger">{errorMessage(retry.error)}</Alert> : null}
      </div>
    </Dialog>
  );
}
