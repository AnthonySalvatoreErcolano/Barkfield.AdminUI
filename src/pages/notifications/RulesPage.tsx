// Rules — the home of the notification centre. Each rule is the API's own sentence plus two independent
// switches: on/off (does it react at all) and dry run (record what it would send, send nothing).
//
// The page leads staff down the intended path rather than offering one "activate" button:
//   Off → turn on (it starts in dry run) → read what it would have sent → go live.
// A new rule is always born off and in dry run; that's the API's rule, and mail can't be unsent.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api/errors';
import { NotificationAudience, NotificationStatus, NotificationTier } from '../../api/generated/enums';
import type { CreateNotificationRule, NotificationRule, NotificationTrigger } from '../../api/ports';
import { LoadError } from '../../app/LoadError';
import { useToast } from '../../app/toast';
import { Can, useApi, useSession } from '../../session/SessionProvider';
import { Alert, Badge, Button, Card, Dialog, Input, Muted, Select, Switch } from '../../ui';
import { notificationKeys } from './keys';
import { humanize, readableSummary, RuleStateBadge, triggerLabel } from './labels';

export function RulesPage() {
  const api = useApi();
  const [creating, setCreating] = useState(false);
  const rules = useQuery({ queryKey: notificationKeys.rules, queryFn: () => api.notifications.rules() });
  const settings = useQuery({ queryKey: notificationKeys.settings, queryFn: () => api.notifications.settings() });

  if (rules.error) return <LoadError error={rules.error} onRetry={() => rules.refetch()} what="the rules" />;
  const list = [...(rules.data ?? [])].sort((a, b) => Number(b.willSend) - Number(a.willSend) || Number(b.isEnabled) - Number(a.isEnabled) || a.name.localeCompare(b.name));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <p style={{ margin: 0, flex: 1, fontSize: 14, color: 'var(--text-muted)' }}>
          A new rule starts <strong>off</strong> and in <strong>dry run</strong>. Turn it on, read what it would have sent in the outbox, then go live.
        </p>
        <Can call="POST /api/notifications/rules"><Button variant="accent" iconLeft="plus" onClick={() => setCreating(true)}>New rule</Button></Can>
      </div>
      {!rules.data ? <Muted>Loading…</Muted>
        : !list.length ? <Card><Muted>No rules yet.</Muted></Card>
        : list.map(r => <RuleCard key={r.id} rule={r} canSendInternal={settings.data?.canSendInternal ?? true} />)}
      {creating ? <NewRuleDialog onClose={() => setCreating(false)} canSendInternal={settings.data?.canSendInternal ?? true} /> : null}
    </div>
  );
}

/** One rule, its state and its controls. Also heads the rule's own page (without the Open button). */
export function RuleCard({ rule: r, canSendInternal, onRulePage }: { rule: NotificationRule; canSendInternal: boolean; onRulePage?: boolean }) {
  const navigate = useNavigate();
  const { canCall } = useSession();
  const [goingLive, setGoingLive] = useState(false);
  const [confirmOn, setConfirmOn] = useState(false);
  const toggle = useRuleToggles(r);
  const canManage = canCall('PUT /api/notifications/rules/{ruleId}/enabled');
  const internal = r.audience === NotificationAudience.Internal;
  // Switching on a rule that's already out of dry run sends from that moment — so it asks first.
  const onToggle = (on: boolean) => (on && !r.isDryRun ? setConfirmOn(true) : toggle.mutate({ enabled: on }));

  return (
    <Card>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {onRulePage ? <strong style={{ fontSize: 16 }}>{r.name}</strong> : <Link to={`/notifications/rules/${r.id}`} style={{ fontWeight: 700, fontSize: 16 }}>{r.name}</Link>}
            <RuleStateBadge rule={r} />
            {internal ? <Badge tone="info">To the shop</Badge> : null}
          </div>
          <div style={{ fontSize: 14.5 }}>{readableSummary(r.summary)}</div>
          {internal && !canSendInternal ? (
            <div style={{ fontSize: 13.5, color: 'var(--status-warning-fg)' }}>No shop address is set, so this rule writes nothing. Add one in Settings.</div>
          ) : null}
          <NextStep rule={r} />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {canManage ? (
            <>
              <Switch label="On" checked={r.isEnabled} disabled={toggle.isPending}
                onChange={onToggle} aria-label={`${r.name} is on`} />
              {r.isEnabled && r.isDryRun ? <Button size="sm" onClick={() => setGoingLive(true)} disabled={toggle.isPending}>Go live…</Button> : null}
              {r.willSend ? <Button size="sm" variant="secondary" onClick={() => toggle.mutate({ dryRun: true })} disabled={toggle.isPending}>Back to dry run</Button> : null}
            </>
          ) : null}
          {onRulePage ? null : <Button size="sm" variant="ghost" iconRight="chevron-right" onClick={() => navigate(`/notifications/rules/${r.id}`)}>Open</Button>}
        </div>
      </div>
      {goingLive ? <GoLiveDialog rule={r} onClose={() => setGoingLive(false)} /> : null}
      {confirmOn ? (
        <Dialog open size="sm" onClose={toggle.isPending ? undefined : () => setConfirmOn(false)} title={`Turn on “${r.name}” and send?`}
          footer={<>
            <Button variant="ghost" onClick={() => toggle.mutate({ enabled: true, dryRun: true }, { onSuccess: () => setConfirmOn(false) })} disabled={toggle.isPending}>Turn on in dry run</Button>
            <Button onClick={() => toggle.mutate({ enabled: true }, { onSuccess: () => setConfirmOn(false) })} disabled={toggle.isPending}>Turn on and send</Button>
          </>}>
          <p style={{ margin: 0 }}>This rule isn’t in dry run, so it starts sending as soon as it’s on. <strong>An email can’t be unsent.</strong></p>
        </Dialog>
      ) : null}
    </Card>
  );
}

/** Where this rule is on the path, in one line, with the link that takes the next step. */
function NextStep({ rule: r }: { rule: NotificationRule }) {
  const dryRunOutput = `/notifications/outbox?rule=${r.id}&status=${NotificationStatus.Skipped}`;
  const style = { fontSize: 13.5, color: 'var(--text-muted)' };
  if (r.willSend) return <div style={style}>Sending. <Link to={`/notifications/outbox?rule=${r.id}`}>See what it has sent</Link></div>;
  if (r.isEnabled) return <div style={style}>Dry run — writing emails but sending none. <Link to={dryRunOutput}>Read what it would have sent</Link>, then go live.</div>;
  return <div style={style}>{r.isDryRun ? 'Off. Turn it on to start a dry run.' : 'Off — and out of dry run, so turning it on sends straight away.'}</div>;
}

function useRuleToggles(r: NotificationRule) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: { enabled?: boolean; dryRun?: boolean }) => {
      if (change.enabled !== undefined) await api.notifications.setRuleEnabled(r.id, change.enabled);
      if (change.dryRun !== undefined) await api.notifications.setRuleDryRun(r.id, change.dryRun);
    },
    onSuccess: (_d, change) => toast({
      title: change.dryRun === false ? `${r.name} is live` : change.dryRun ? `${r.name} is back in dry run` : change.enabled ? `${r.name} is on` : `${r.name} is off`,
      message: change.enabled && r.isDryRun ? 'Dry run — it records what it would send and sends nothing.' : undefined,
    }),
    onError: err => toast({ tone: 'danger', title: 'Couldn’t change the rule', message: errorMessage(err) }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function GoLiveDialog({ rule: r, onClose }: { rule: NotificationRule; onClose: () => void }) {
  const api = useApi();
  const toggle = useRuleToggles(r);
  const { data: s } = useQuery({ queryKey: notificationKeys.settings, queryFn: () => api.notifications.settings() });
  const internal = r.audience === NotificationAudience.Internal;
  return (
    <Dialog open size="sm" onClose={toggle.isPending ? undefined : onClose} title={`Go live with “${r.name}”?`}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={toggle.isPending}>Not yet</Button>
        <Button onClick={() => toggle.mutate({ dryRun: false }, { onSuccess: onClose })} disabled={toggle.isPending}>{toggle.isPending ? 'Saving…' : 'Go live'}</Button>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0 }}>
          From now on — {readableSummary(r.summary).replace(/^When/, 'when')} — and it goes to {internal ? 'the shop' : 'the customer'}. <strong>An email can’t be unsent.</strong>
        </p>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
          Read what it would have sent first, in the outbox under <Link to={`/notifications/outbox?rule=${r.id}&status=${NotificationStatus.Skipped}`} onClick={onClose}>Dry run</Link>.
        </p>
        {s && !s.transportIsReal ? <Alert tone="info">No email service is connected yet, so nothing will actually reach an inbox until one is.</Alert> : null}
        {toggle.error ? <Alert tone="danger">{errorMessage(toggle.error)}</Alert> : null}
      </div>
    </Dialog>
  );
}

/** Asks the trigger catalogue what a rule can be built on; the form changes shape for a scheduled kind. */
function NewRuleDialog({ onClose, canSendInternal }: { onClose: () => void; canSendInternal: boolean }) {
  const api = useApi();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const triggers = useQuery({ queryKey: notificationKeys.triggers, queryFn: () => api.notifications.triggers() });
  const templates = useQuery({ queryKey: notificationKeys.templates, queryFn: () => api.notifications.templates() });
  const [name, setName] = useState('');
  const [kind, setKind] = useState('');
  const [toStatus, setToStatus] = useState('');
  const [fromStatus, setFromStatus] = useState('');
  const [days, setDays] = useState('3');
  const [audience, setAudience] = useState(String(NotificationAudience.Customer));
  const [templateId, setTemplateId] = useState('');
  const [tried, setTried] = useState(false);

  const trigger: NotificationTrigger | undefined = triggers.data?.find(t => String(t.kind) === kind);
  const usable = (templates.data ?? []).filter(t => t.tier !== NotificationTier.System);
  const isEvent = trigger?.isEventTrigger ?? true;
  const daysNumber = Number(days);
  const errors = {
    name: !name.trim() ? 'Give the rule a name.' : name.trim().length > 120 ? 'Keep this under 120 characters.' : undefined,
    kind: !trigger ? 'Choose what it reacts to.' : undefined,
    toStatus: trigger && isEvent && !toStatus ? 'Choose the status it reacts to.' : undefined,
    fromStatus: fromStatus && fromStatus === toStatus ? 'Can’t be the same as the status it becomes.' : undefined,
    days: trigger && !isEvent && (days === '' || !Number.isInteger(daysNumber) || daysNumber < 0) ? 'A whole number of days, 0 or more.' : undefined,
    templateId: !templateId ? 'Choose the email it sends.' : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);
  const shown = (e?: string) => (tried ? e : undefined);

  const create = useMutation({
    mutationFn: () => api.notifications.createRule({
      name: name.trim(), templateId, triggerKind: Number(kind) as CreateNotificationRule['triggerKind'], audience: Number(audience) as CreateNotificationRule['audience'],
      toStatus: isEvent ? Number(toStatus) : null, fromStatus: isEvent && fromStatus ? Number(fromStatus) : null, offsetDays: isEvent ? null : daysNumber,
    }),
    onSuccess: async id => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      onClose();
      navigate(`/notifications/rules/${id}`);
    },
  });

  const statusOptions = (trigger?.statuses ?? []).map(s => ({ value: String(s.value), label: humanize(s.name) }));
  return (
    <Dialog open size="md" onClose={create.isPending ? undefined : onClose} title="New rule"
      description="It starts off and in dry run, so nothing is sent until you choose to go live."
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={create.isPending}>Cancel</Button>
        <Button type="submit" form="new-rule" disabled={create.isPending}>{create.isPending ? 'Creating…' : 'Create rule'}</Button>
      </>}>
      {triggers.error || templates.error ? <Alert tone="danger">Couldn’t load what rules can be built on.</Alert> : null}
      <form id="new-rule" noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        onSubmit={e => { e.preventDefault(); setTried(true); if (valid) create.mutate(); }}>
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tell the customer when a card is refused" error={shown(errors.name)} autoFocus />
        <Select label="When" value={kind} onChange={e => { setKind(e.target.value); setToStatus(''); setFromStatus(''); }} error={shown(errors.kind)}
          options={[{ value: '', label: 'Choose…' }, ...(triggers.data ?? []).map(t => ({ value: String(t.kind), label: triggerLabel(t.kind, t.kindName) }))]} />
        {trigger ? <p style={{ margin: '-6px 0 0', fontSize: 13.5, color: 'var(--text-muted)' }}>{trigger.description}</p> : null}
        {trigger && isEvent ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Select label="Becomes" value={toStatus} onChange={e => setToStatus(e.target.value)} error={shown(errors.toStatus)}
              options={[{ value: '', label: 'Choose…' }, ...statusOptions]} />
            <Select label="Only when coming from (optional)" value={fromStatus} onChange={e => setFromStatus(e.target.value)} error={errors.fromStatus}
              hint="Leave as “Any status” unless it matters where it came from."
              options={[{ value: '', label: 'Any status' }, ...statusOptions]} />
          </div>
        ) : null}
        {trigger && !isEvent ? (
          <Input label="Days before the next delivery" type="number" min={0} value={days} onChange={e => setDays(e.target.value)} error={shown(errors.days)} style={{ maxWidth: 220 }}
            hint="Checked once a day. Each subscription gets one reminder per delivery." />
        ) : null}
        <Select label="Send" value={templateId} onChange={e => setTemplateId(e.target.value)} error={shown(errors.templateId)}
          options={[{ value: '', label: 'Choose an email…' }, ...usable.map(t => ({ value: t.id, label: `${t.name}${t.tier === NotificationTier.Marketing ? ' (marketing)' : ''}` }))]} />
        <Select label="To" value={audience} onChange={e => setAudience(e.target.value)}
          options={[{ value: String(NotificationAudience.Customer), label: 'The customer' }, { value: String(NotificationAudience.Internal), label: 'The shop (internal)' }]} />
        {Number(audience) === NotificationAudience.Internal && !canSendInternal ? (
          <Alert tone="warning">No shop address is set in Settings, so an internal rule writes nothing until one is. It never falls back to the customer.</Alert>
        ) : null}
        {create.error ? <Alert tone="danger">{errorMessage(create.error)}</Alert> : null}
      </form>
    </Dialog>
  );
}
