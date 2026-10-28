// Settings — the master switch, quiet hours, the daily cap per customer and the shop's own address; the
// reminder sweep; and addresses that must never be written to.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '../../api/errors';
import { SuppressionReason } from '../../api/generated/enums';
import type { NotificationSettings, NotificationSuppression } from '../../api/ports';
import { LoadError } from '../../app/LoadError';
import { useToast } from '../../app/toast';
import { formatDay, formatInstant } from '../../lib/format';
import { Can, useApi, useSession } from '../../session/SessionProvider';
import { Alert, Button, Card, Checkbox, DataTable, Input, Muted, Select, Switch } from '../../ui';
import { notificationKeys } from './keys';

export function SettingsPage() {
  const api = useApi();
  const settings = useQuery({ queryKey: notificationKeys.settings, queryFn: () => api.notifications.settings() });
  if (settings.error) return <LoadError error={settings.error} onRetry={() => settings.refetch()} what="the settings" />;
  if (!settings.data) return <Muted>Loading…</Muted>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
      <SendingCard key={settings.data.updatedAt ?? 'never'} settings={settings.data} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <RemindersCard settings={settings.data} />
        <SuppressionsCard />
      </div>
    </div>
  );
}

const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;
const HOURS = [{ value: '', label: 'No quiet hours' }, ...Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: hourLabel(h) }))];

function SendingCard({ settings: s }: { settings: NotificationSettings }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { canCall } = useSession();
  const canManage = canCall('PUT /api/notifications/settings');
  const [on, setOn] = useState(s.isSendingEnabled);
  const [start, setStart] = useState(s.quietHoursStartLocal == null ? '' : String(s.quietHoursStartLocal));
  const [end, setEnd] = useState(s.quietHoursEndLocal == null ? '' : String(s.quietHoursEndLocal));
  const [cap, setCap] = useState(String(s.maxPerCustomerPerDay ?? 0));
  const [internal, setInternal] = useState(s.internalRecipientEmail ?? '');

  const quietError = (start === '') !== (end === '') ? 'Choose both a start and an end, or neither.' : undefined;
  const capNumber = Number(cap);
  const capError = cap === '' || !Number.isInteger(capNumber) || capNumber < 0 ? 'A whole number, 0 or more.' : undefined;
  const emailError = internal.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(internal.trim()) ? 'That doesn’t look like an email address.' : undefined;

  const save = useMutation({
    mutationFn: () => api.notifications.saveSettings({
      isSendingEnabled: on, quietHoursStartLocal: start === '' ? null : Number(start), quietHoursEndLocal: end === '' ? null : Number(end),
      maxPerCustomerPerDay: capNumber, internalRecipientEmail: internal.trim() || null,
    }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: notificationKeys.all }); toast({ title: 'Settings saved' }); },
  });

  return (
    <Card title="Sending">
      <form noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        onSubmit={e => { e.preventDefault(); if (!quietError && !capError && !emailError) save.mutate(); }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Switch label="Send emails" checked={on} onChange={setOn} disabled={!canManage} />
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
            The master switch. Off, rules still write their emails but none are sent — handy if something’s going out that shouldn’t.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Select label="Quiet from" value={start} onChange={e => setStart(e.target.value)} options={HOURS} disabled={!canManage} error={quietError} />
          <Select label="Until" value={end} onChange={e => setEnd(e.target.value)} options={HOURS} disabled={!canManage} />
        </div>
        <p style={{ margin: '-8px 0 0', fontSize: 13.5, color: 'var(--text-muted)' }}>Emails written during quiet hours wait and go out when they end.</p>
        <Input label="Most emails one customer gets in a day" type="number" min={0} value={cap} onChange={e => setCap(e.target.value)} disabled={!canManage}
          error={capError} hint="0 means no limit." style={{ maxWidth: 260 }} />
        <Input label="The shop’s address, for internal emails" type="email" value={internal} onChange={e => setInternal(e.target.value)} disabled={!canManage}
          error={emailError} placeholder="e.g. orders@barkfieldroad.com"
          hint="Where rules addressed to the shop write — a refused card, stock blocking a delivery. Leave blank and those rules write nothing." />
        {save.error ? <Alert tone="danger">{errorMessage(save.error)}</Alert> : null}
        {canManage ? <div><Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save settings'}</Button></div> : null}
        {s.updatedAt ? <Muted>Last changed {formatInstant(s.updatedAt, true)}.</Muted> : null}
      </form>
    </Card>
  );
}

function RemindersCard({ settings: s }: { settings: NotificationSettings }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [force, setForce] = useState(false);
  const sweep = useMutation({
    mutationFn: () => api.notifications.sweep(force),
    onSuccess: r => toast({
      // Not a failure: "already ran today" is the normal answer.
      title: r.alreadyRanToday ? 'Reminders already ran today' : r.queued ? `${r.queued} reminder${r.queued === 1 ? '' : 's'} written` : 'No reminders were due',
      message: r.alreadyRanToday ? 'Tick “run again” to run it anyway — no one gets a second reminder for the same delivery.' : undefined,
    }),
    onError: err => toast({ tone: 'danger', title: 'Couldn’t run reminders', message: errorMessage(err) }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
  return (
    <Card title="Reminders">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 14.5 }}>
          “Days before the next delivery” rules are checked once a day, automatically.
          {s.lastSweepDate ? <> Last checked <strong>{formatDay(s.lastSweepDate, 'long')}</strong>.</> : ' Not checked yet.'}
        </p>
        <Can call="POST /api/notifications/reminders/sweep">
          <Checkbox checked={force} onChange={setForce} label="Run again even if it already ran today" description="Safe — each subscription still gets one reminder per delivery." />
          <div><Button variant="secondary" onClick={() => sweep.mutate()} disabled={sweep.isPending}>{sweep.isPending ? 'Checking…' : 'Check for reminders now'}</Button></div>
        </Can>
      </div>
    </Card>
  );
}

const REASONS: Array<{ value: number; label: string }> = [
  { value: SuppressionReason.Manual, label: 'Asked not to be emailed' },
  { value: SuppressionReason.Unsubscribed, label: 'Unsubscribed' },
  { value: SuppressionReason.HardBounce, label: 'Address doesn’t exist (bounced)' },
  { value: SuppressionReason.Complaint, label: 'Marked as spam' },
];
const reasonLabel = (r: number) => REASONS.find(x => x.value === r)?.label ?? 'Blocked';

function SuppressionsCard() {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { canCall } = useSession();
  const list = useQuery({ queryKey: notificationKeys.suppressions, queryFn: () => api.notifications.suppressions() });
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState(String(SuppressionReason.Manual));
  const [note, setNote] = useState('');
  const refresh = () => queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  const add = useMutation({
    mutationFn: () => api.notifications.suppress({ email: email.trim(), reason: Number(reason) as never, note: note.trim() || null }),
    onSuccess: async () => { await refresh(); toast({ title: `${email.trim()} blocked` }); setEmail(''); setNote(''); },
  });
  const remove = useMutation({
    mutationFn: (s: NotificationSuppression) => api.notifications.unsuppress(s.id),
    onSuccess: async (_r, s) => { await refresh(); toast({ title: `${s.email} can be emailed again` }); },
    onError: err => toast({ tone: 'danger', title: 'Couldn’t unblock', message: errorMessage(err) }),
  });
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <Card title="Blocked addresses" flush>
      <div style={{ padding: '0 20px 12px', fontSize: 13.5, color: 'var(--text-muted)' }}>Nothing is ever sent to these — automatic or not.</div>
      {list.error ? <div style={{ padding: 20 }}><Alert tone="danger">Couldn’t load blocked addresses.</Alert></div> : (
        <DataTable rows={list.data ?? []} rowKey={s => s.id} density="compact" empty={list.isPending ? 'Loading…' : 'None.'}
          columns={[
            { key: 'email', header: 'Address', render: s => <div><div>{s.email}</div>{s.note ? <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{s.note}</div> : null}</div> },
            { key: 'reason', header: 'Why', render: s => reasonLabel(s.reason) },
            {
              key: 'x', header: '', align: 'right',
              render: s => canCall('DELETE /api/notifications/suppressions/{suppressionId}')
                ? <Button size="sm" variant="ghost" onClick={() => remove.mutate(s)} disabled={remove.isPending}>Unblock</Button> : null,
            },
          ]} />
      )}
      <Can call="POST /api/notifications/suppressions">
        <form noValidate style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--border-subtle)' }}
          onSubmit={e => { e.preventDefault(); if (emailOk) add.mutate(); }}>
          <Input label="Block an address" size="sm" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Select size="sm" label="Why" value={reason} onChange={e => setReason(e.target.value)} options={REASONS.map(r => ({ value: String(r.value), label: r.label }))} />
            <Input size="sm" label="Note (optional)" value={note} onChange={e => setNote(e.target.value)} />
          </div>
          {add.error ? <Alert tone="danger">{errorMessage(add.error)}</Alert> : null}
          <div><Button size="sm" type="submit" disabled={!emailOk || add.isPending}>{add.isPending ? 'Blocking…' : 'Block'}</Button></div>
        </form>
      </Can>
    </Card>
  );
}
