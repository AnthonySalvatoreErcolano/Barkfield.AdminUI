// One rule: rename it, change its email, preview it against a real delivery, send a test, delete it.
//
// The preview is the check before anything goes live. An unresolved placeholder — anything the template
// asked for that this delivery couldn't fill — is left visible in the text on purpose, and listed above
// it, because it's a typo nobody notices until a customer does.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { errorMessage } from '../../api/errors';
import { NotificationTier } from '../../api/generated/enums';
import type { NotificationPreview, NotificationRule } from '../../api/ports';
import { LoadError } from '../../app/LoadError';
import { useToast } from '../../app/toast';
import { addDays, todayIso } from '../../lib/dates';
import { formatDay } from '../../lib/format';
import { Can, useApi, useSession } from '../../session/SessionProvider';
import { Alert, Breadcrumbs, Button, Card, Dialog, Input, Muted, Select } from '../../ui';
import { notificationKeys } from './keys';
import { RuleCard } from './RulesPage';

export function RuleDetailPage() {
  const { ruleId = '' } = useParams();
  const api = useApi();
  const navigate = useNavigate();
  const rule = useQuery({ queryKey: notificationKeys.rule(ruleId), queryFn: () => api.notifications.rule(ruleId) });
  const settings = useQuery({ queryKey: notificationKeys.settings, queryFn: () => api.notifications.settings() });
  if (rule.error) return <LoadError error={rule.error} onRetry={() => rule.refetch()} what="this rule" />;
  if (!rule.data) return <Muted>Loading…</Muted>;
  const r = rule.data;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Breadcrumbs onNavigate={navigate} items={[{ label: 'Rules', href: '/notifications' }, { label: r.name }]} />
      <RuleCard rule={r} canSendInternal={settings.data?.canSendInternal ?? true} onRulePage />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: 16, alignItems: 'start' }}>
        <RuleSettings key={`${r.id}-${r.revision}`} rule={r} />
        <PreviewCard rule={r} />
      </div>
    </div>
  );
}

function RuleSettings({ rule: r }: { rule: NotificationRule }) {
  const api = useApi();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canCall } = useSession();
  const canManage = canCall('PUT /api/notifications/rules/{ruleId}/name');
  const templates = useQuery({ queryKey: notificationKeys.templates, queryFn: () => api.notifications.templates() });
  const [name, setName] = useState(r.name);
  const [templateId, setTemplateId] = useState(r.templateId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // The revision this form opened on: a colleague's change since is refused, not overwritten.
  const [openedRevision] = useState(r.revision);

  const save = useMutation({
    mutationFn: async () => {
      let revision = openedRevision;
      if (name.trim() !== r.name) { await api.notifications.renameRule(r.id, name.trim(), revision); revision++; }
      if (templateId !== r.templateId) await api.notifications.changeRuleTemplate(r.id, templateId, revision);
    },
    onSuccess: () => toast({ title: 'Rule saved' }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
  const remove = useMutation({
    mutationFn: () => api.notifications.deleteRule(r.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast({ title: `${r.name} deleted`, message: 'Emails it already wrote stay in the outbox.' });
      navigate('/notifications');
    },
  });
  const changed = name.trim() !== r.name || templateId !== r.templateId;
  const usable = (templates.data ?? []).filter(t => t.tier !== NotificationTier.System || t.id === r.templateId);

  return (
    <Card title="The rule">
      <form noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={e => { e.preventDefault(); if (changed && name.trim()) save.mutate(); }}>
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} disabled={!canManage} error={!name.trim() ? 'Give the rule a name.' : undefined} />
        <Select label="Sends" value={templateId} onChange={e => setTemplateId(e.target.value)} disabled={!canManage}
          hint="Change the wording itself under Templates."
          options={usable.map(t => ({ value: t.id, label: t.name }))} />
        {save.error ? <Alert tone="danger">{errorMessage(save.error)}</Alert> : null}
        {canManage ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <Button type="submit" disabled={!changed || !name.trim() || save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
            <div style={{ flex: 1 }} />
            <Can call="DELETE /api/notifications/rules/{ruleId}"><Button variant="danger" onClick={() => setConfirmDelete(true)}>Delete rule</Button></Can>
          </div>
        ) : null}
      </form>
      {confirmDelete ? (
        <Dialog open size="sm" onClose={remove.isPending ? undefined : () => setConfirmDelete(false)} title={`Delete “${r.name}”?`}
          description="It stops reacting straight away. Emails it has already written stay in the outbox."
          footer={<>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={remove.isPending}>Keep</Button>
            <Button variant="danger" onClick={() => remove.mutate()} disabled={remove.isPending}>{remove.isPending ? 'Deleting…' : 'Delete'}</Button>
          </>}>
          {r.isEnabled ? <Alert tone="info">To stop it for now without losing it, just switch it off instead.</Alert> : null}
          {remove.error ? <Alert tone="danger" style={{ marginTop: 12 }}>{errorMessage(remove.error)}</Alert> : null}
        </Dialog>
      ) : null}
    </Card>
  );
}

function PreviewCard({ rule: r }: { rule: NotificationRule }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user, canCall } = useSession();
  const [deliveryId, setDeliveryId] = useState('');
  const [testTo, setTestTo] = useState('');

  // Recent and upcoming deliveries to render against — the most recent first.
  const query = { scheduledFrom: addDays(todayIso(), -30), scheduledTo: addDays(todayIso(), 14), includeClosed: true, pageSize: 100, sortBy: 'scheduledFor', sortDescending: true };
  const deliveries = useQuery({
    queryKey: ['deliveries', 'list', query], queryFn: () => api.deliveries.list(query),
    enabled: canCall('GET /api/deliveries'),
  });
  const preview = useQuery({
    queryKey: [...notificationKeys.rule(r.id), 'preview', deliveryId, r.templateId, r.revision],
    queryFn: () => api.notifications.preview(r.id, deliveryId),
    enabled: !!deliveryId,
  });
  const test = useMutation({
    mutationFn: () => api.notifications.test(r.id, deliveryId, testTo.trim() || undefined),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast({ title: 'Test queued', message: `To ${testTo.trim() || user.email}. It’s in the outbox marked [TEST].` });
    },
  });

  return (
    <Card title="What it says" eyebrow="Preview">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Select label="Show it for a real delivery" value={deliveryId} onChange={e => setDeliveryId(e.target.value)}
          options={[{ value: '', label: deliveries.isPending ? 'Loading deliveries…' : 'Choose a delivery…' },
            ...(deliveries.data?.items ?? []).map(d => ({ value: d.id, label: `${d.customerName} — ${formatDay(d.scheduledFor)}` }))]} />
        {!deliveryId ? <Muted>Pick a delivery to see exactly what that customer would get.</Muted>
          : preview.error ? <Alert tone="danger">{errorMessage(preview.error)}</Alert>
          : !preview.data ? <Muted>Rendering…</Muted>
          : <PreviewText preview={preview.data} />}
        {deliveryId ? (
          <Can call="POST /api/notifications/rules/{ruleId}/test">
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14, display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <Input label="Send a test to" type="email" value={testTo} onChange={e => setTestTo(e.target.value)} placeholder={user.email}
                hint="Leave blank to send it to yourself." style={{ flex: 1, minWidth: 220 }} />
              <Button variant="secondary" style={{ marginTop: 26 }} onClick={() => test.mutate()} disabled={test.isPending}>{test.isPending ? 'Sending…' : 'Send test'}</Button>
            </div>
            {test.error ? <Alert tone="danger">{errorMessage(test.error)}</Alert> : null}
          </Can>
        ) : null}
      </div>
    </Card>
  );
}

function PreviewText({ preview: p }: { preview: NotificationPreview }) {
  const missing = p.unresolvedPlaceholders ?? [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {missing.length ? (
        <Alert tone="danger" title={`${missing.length === 1 ? 'One placeholder' : `${missing.length} placeholders`} couldn’t be filled`}>
          {missing.map(m => <code key={m} style={{ marginRight: 8 }}>{`{{${m}}}`}</code>)}
          <div style={{ marginTop: 6 }}>The customer would see {missing.length === 1 ? 'it' : 'them'} exactly like this. Check the spelling in the template, or try a delivery where that detail exists — a substitute, a receipt, a refused card.</div>
        </Alert>
      ) : <Alert tone="success">Every placeholder filled.</Alert>}
      <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-card)' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', fontSize: 14 }}>
          <div><span style={{ color: 'var(--text-muted)' }}>To:</span> {p.toName} &lt;{p.toEmail}&gt;</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Subject:</span> <strong>{p.subject}</strong></div>
        </div>
        <div style={{ padding: '12px 14px', whiteSpace: 'pre-wrap', fontSize: 14.5, lineHeight: 1.55 }}>{p.bodyText}</div>
      </div>
    </div>
  );
}
