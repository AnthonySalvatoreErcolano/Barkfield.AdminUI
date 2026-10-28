// Templates — what an email says. Plain text with {{placeholders}}, not an HTML editor.
//
// Which placeholders a template may use depends on what triggers it, so they're offered per trigger from
// the API's catalogue rather than from a list baked in here. Built-in templates can be reworded but not
// deleted, and neither can one a rule still uses; the API says which.
import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '../../api/errors';
import { NotificationTier } from '../../api/generated/enums';
import type { CreateNotificationTemplate, NotificationTemplate, NotificationTrigger } from '../../api/ports';
import { LoadError } from '../../app/LoadError';
import { useToast } from '../../app/toast';
import { plural } from '../../lib/format';
import { Can, useApi, useSession } from '../../session/SessionProvider';
import { Alert, Badge, Button, Card, Chip, Dialog, Input, Muted, Select, Textarea } from '../../ui';
import { notificationKeys } from './keys';
import { humanize, triggerLabel } from './labels';

export function TemplatesPage() {
  const api = useApi();
  const templates = useQuery({ queryKey: notificationKeys.templates, queryFn: () => api.notifications.templates() });
  const [selected, setSelected] = useState<string | 'new' | null>(null);
  if (templates.error) return <LoadError error={templates.error} onRetry={() => templates.refetch()} what="the templates" />;
  const list = templates.data ?? [];
  const current = selected === 'new' ? null : list.find(t => t.id === (selected ?? list[0]?.id)) ?? null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 0.8fr) minmax(0, 2fr)', gap: 16, alignItems: 'start' }}>
      <Card flush>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {list.map(t => (
            <button key={t.id} type="button" onClick={() => setSelected(t.id)}
              style={{
                all: 'unset', cursor: 'pointer', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
                background: current?.id === t.id && selected !== 'new' ? 'var(--teal-50)' : undefined,
              }}>
              <div style={{ fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {t.name}
                {t.tier === NotificationTier.Marketing ? <Badge tone="brand">Marketing</Badge> : null}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {t.ruleCount ? `Used by ${plural(t.ruleCount, 'rule')}` : 'Not used by any rule'}{t.isSystem ? ' · built in' : ''}
              </div>
            </button>
          ))}
          <Can call="POST /api/notifications/templates">
            <div style={{ padding: 12 }}><Button size="sm" variant="secondary" iconLeft="plus" onClick={() => setSelected('new')} fullWidth>New template</Button></div>
          </Can>
        </div>
      </Card>
      {!templates.data ? <Muted>Loading…</Muted>
        : selected === 'new' ? <TemplateEditor key="new" onSaved={id => setSelected(id)} />
        : current ? <TemplateEditor key={`${current.id}-${current.revision}`} template={current} onSaved={() => undefined} onDeleted={() => setSelected(null)} />
        : <Card><Muted>No templates yet.</Muted></Card>}
    </div>
  );
}

function TemplateEditor({ template: t, onSaved, onDeleted }: { template?: NotificationTemplate; onSaved: (id: string) => void; onDeleted?: () => void }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { canCall } = useSession();
  const canEdit = canCall(t ? 'PUT /api/notifications/templates/{templateId}' : 'POST /api/notifications/templates');
  const triggers = useQuery({ queryKey: notificationKeys.triggers, queryFn: () => api.notifications.triggers() });
  const rules = useQuery({ queryKey: notificationKeys.rules, queryFn: () => api.notifications.rules() });
  const [name, setName] = useState(t?.name ?? '');
  const [subject, setSubject] = useState(t?.subject ?? '');
  const [bodyText, setBodyText] = useState(t?.bodyText ?? '');
  const [tier, setTier] = useState(String(t?.tier ?? NotificationTier.Operational));
  const [tried, setTried] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [openedRevision] = useState(t?.revision);
  const body = useRef<HTMLTextAreaElement>(null);

  // Offer the placeholders of whatever drives this template — the first rule using it — or let staff pick.
  const usedBy = (rules.data ?? []).filter(r => r.templateId === t?.id);
  const [triggerKind, setTriggerKind] = useState<string>('');
  const trigger: NotificationTrigger | undefined = triggers.data?.find(x => String(x.kind) === (triggerKind || String(usedBy[0]?.triggerKind ?? triggers.data?.[0]?.kind)));
  const placeholders = [...new Set(trigger?.placeholders ?? [])];
  const used = new Set([...`${subject}\n${bodyText}`.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(m => m[1]!));
  const unknown = trigger ? [...used].filter(p => !placeholders.includes(p)) : [];

  const insert = (placeholder: string) => {
    const el = body.current;
    const token = `{{${placeholder}}}`;
    if (!el) { setBodyText(bodyText + token); return; }
    const [start, end] = [el.selectionStart ?? bodyText.length, el.selectionEnd ?? bodyText.length];
    setBodyText(bodyText.slice(0, start) + token + bodyText.slice(end));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + token.length, start + token.length); });
  };

  const errors = {
    name: !name.trim() ? 'Give it a name.' : undefined,
    subject: !subject.trim() ? 'Write a subject.' : undefined,
    bodyText: !bodyText.trim() ? 'Write the email.' : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);
  const save = useMutation({
    mutationFn: async () => {
      if (t) { await api.notifications.rewordTemplate(t.id, { name: name.trim(), subject: subject.trim(), bodyText }, openedRevision); return t.id; }
      return api.notifications.createTemplate({ name: name.trim(), subject: subject.trim(), bodyText, tier: Number(tier) as CreateNotificationTemplate['tier'] });
    },
    onSuccess: async id => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast({ title: t ? 'Template saved' : 'Template created' });
      onSaved(id);
    },
  });
  const remove = useMutation({
    mutationFn: () => api.notifications.deleteTemplate(t!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast({ title: `${t!.name} deleted` });
      setConfirmDelete(false);
      onDeleted?.();
    },
  });
  const marketing = Number(t?.tier ?? tier) === NotificationTier.Marketing;

  return (
    <Card title={t ? t.name : 'New template'} eyebrow={t?.isSystem ? 'Built in — can be reworded, not deleted' : undefined}>
      <form noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={e => { e.preventDefault(); setTried(true); if (valid) save.mutate(); }}>
        <div style={{ display: 'grid', gridTemplateColumns: t ? '1fr' : '1.6fr 1fr', gap: 14 }}>
          <Input label="Name" value={name} onChange={e => setName(e.target.value)} disabled={!canEdit} error={tried ? errors.name : undefined} hint="For staff — customers don’t see it." />
          {!t ? (
            <Select label="Kind" value={tier} onChange={e => setTier(e.target.value)}
              options={[{ value: String(NotificationTier.Operational), label: 'About an order' }, { value: String(NotificationTier.Marketing), label: 'Marketing' }]} />
          ) : null}
        </div>
        {marketing ? (
          <Alert tone="info">Marketing emails only go to customers who’ve agreed to them, and always carry an unsubscribe link — the system adds and enforces both.</Alert>
        ) : null}
        <Input label="Subject" value={subject} onChange={e => setSubject(e.target.value)} disabled={!canEdit} error={tried ? errors.subject : undefined} />
        <Textarea label="Email" ref={body} rows={10} value={bodyText} onChange={e => setBodyText(e.target.value)} disabled={!canEdit}
          error={tried ? errors.bodyText : undefined} style={{ fontFamily: 'inherit' }} />
        {canEdit ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <Select label="Insert details for" size="sm" value={triggerKind || String(trigger?.kind ?? '')} onChange={e => setTriggerKind(e.target.value)} style={{ minWidth: 260 }}
                options={(triggers.data ?? []).map(x => ({ value: String(x.kind), label: triggerLabel(x.kind, x.kindName) }))} />
              {usedBy.length ? <span style={{ fontSize: 13, color: 'var(--text-muted)', paddingBottom: 8 }}>Used by: {usedBy.map(r => r.name).join(', ')}</span> : null}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {placeholders.map(p => <Chip key={p} size="sm" icon="plus" onClick={() => insert(p)}>{humanize(p)}</Chip>)}
            </div>
            {unknown.length ? (
              <Alert tone="warning">
                {unknown.map(p => <code key={p} style={{ marginRight: 6 }}>{`{{${p}}}`}</code>)} {unknown.length === 1 ? 'isn’t' : 'aren’t'} available for this trigger, so {unknown.length === 1 ? 'it' : 'they'} would show exactly like that. Check the spelling.
              </Alert>
            ) : null}
          </div>
        ) : null}
        {save.error ? <Alert tone="danger">{errorMessage(save.error)}</Alert> : null}
        {canEdit ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : t ? 'Save' : 'Create template'}</Button>
            <div style={{ flex: 1 }} />
            {t && !t.isSystem ? (
              <Can call="DELETE /api/notifications/templates/{templateId}">
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>Delete</Button>
              </Can>
            ) : null}
          </div>
        ) : null}
      </form>
      {confirmDelete && t ? (
        <Dialog open size="sm" onClose={remove.isPending ? undefined : () => setConfirmDelete(false)} title={`Delete “${t.name}”?`}
          footer={<>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={remove.isPending}>Keep</Button>
            <Button variant="danger" onClick={() => remove.mutate()} disabled={remove.isPending}>{remove.isPending ? 'Deleting…' : 'Delete'}</Button>
          </>}>
          {t.ruleCount ? <Alert tone="warning">It’s used by {plural(t.ruleCount, 'rule')}. Change those rules to another email first.</Alert> : <p style={{ margin: 0 }}>Emails already written with it stay in the outbox.</p>}
          {remove.error ? <Alert tone="danger" style={{ marginTop: 12 }}>{errorMessage(remove.error)}</Alert> : null}
        </Dialog>
      ) : null}
    </Card>
  );
}
