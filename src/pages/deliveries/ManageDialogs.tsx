// delivery:manage dialogs — scheduling and outcomes. Marking delivered by hand is an override (pickup,
// shipped order, or a Routific confirmation that never came), worded so it is not mistaken for the
// normal way a delivery completes.
import { useState, type FormEvent, type ReactNode } from 'react';
import type { DeliveryDetail } from '../../api/ports';
import { dayOf, todayIso, toApiDay } from '../../lib/dates';
import { formatDay, toApiTime, toInputTime } from '../../lib/format';
import { useApi } from '../../session/SessionProvider';
import { Alert, Button, Dialog, Input, Textarea } from '../../ui';
import type { WriteOutcome } from './useDeliveryWrites';

type Run = (write: () => Promise<void>, success?: { title: string; message?: string }) => Promise<WriteOutcome>;

export type ManageDialog = 'notes' | 'stop' | 'delivered' | 'failed' | 'cancel' | null;

interface Props {
  delivery: DeliveryDetail;
  onClose: () => void;
  run: Run;
}

/** Shared shell: submit runs the write, closes on success or conflict, keeps a 400 in the dialog. */
function WriteDialog({ title, description, submitLabel, danger, onSubmit, onClose, children, size = 'md' }: {
  title: string; description?: ReactNode; submitLabel: string; danger?: boolean;
  onSubmit: () => Promise<WriteOutcome | 'invalid'>; onClose: () => void; children?: ReactNode; size?: 'sm' | 'md';
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const outcome = await onSubmit();
    setBusy(false);
    if (outcome === 'invalid') return;
    if (outcome.ok || outcome.conflict) onClose();
    else setError(outcome.message);
  };
  return (
    <Dialog open size={size} onClose={busy ? undefined : onClose} title={title} description={description}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="manage-dialog" variant={danger ? 'danger' : 'primary'} disabled={busy}>{busy ? 'Saving…' : submitLabel}</Button>
      </>}>
      <form id="manage-dialog" onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </form>
    </Dialog>
  );
}

export function NotesDialog({ delivery, onClose, run }: Props) {
  const api = useApi();
  const [notes, setNotes] = useState(delivery.notes ?? '');
  return (
    <WriteDialog title="Delivery notes" description="For staff, about this delivery only." submitLabel="Save" onClose={onClose}
      onSubmit={() => run(() => api.deliveries.updateNotes(delivery.id, notes.trim() || null), { title: 'Notes saved' })}>
      <Textarea label="Notes" rows={4} value={notes} onChange={e => setNotes(e.target.value)} autoFocus />
    </WriteDialog>
  );
}

export function StopDialog({ delivery, onClose, run }: Props) {
  const api = useApi();
  const [start, setStart] = useState(toInputTime(delivery.requestedWindowStart));
  const [end, setEnd] = useState(toInputTime(delivery.requestedWindowEnd));
  const [minutes, setMinutes] = useState(delivery.serviceDurationMinutesOverride == null ? '' : String(delivery.serviceDurationMinutesOverride));
  const [tried, setTried] = useState(false);
  const startError = !start && end ? 'Add a start time, or clear both.' : undefined;
  const endError = start && !end ? 'Add an end time, or clear both.' : start && end && end <= start ? 'Must be after the start.' : undefined;
  const windowError = startError ?? endError;
  const m = Number(minutes);
  const minutesError = minutes !== '' && (!Number.isInteger(m) || m < 0 || m > 480) ? 'Between 0 and 480 minutes, or blank.' : undefined;

  const windowChanged = start !== toInputTime(delivery.requestedWindowStart) || end !== toInputTime(delivery.requestedWindowEnd);
  const minutesChanged = minutes !== (delivery.serviceDurationMinutesOverride == null ? '' : String(delivery.serviceDurationMinutesOverride));

  return (
    <WriteDialog title="Window and time at the door" submitLabel="Save" onClose={onClose}
      description={`For this delivery only. ${delivery.customerName}’s usual details are on their customer record.`}
      onSubmit={async () => {
        setTried(true);
        if (windowError || minutesError) return 'invalid';
        // Two endpoints; sent one after the other, never together, so they cannot collide.
        if (windowChanged) {
          const r = await run(() => api.deliveries.setWindow(delivery.id, { start: toApiTime(start), end: toApiTime(end) }));
          if (!r.ok) return r;
        }
        if (minutesChanged) {
          const r = await run(() => api.deliveries.setServiceDuration(delivery.id, minutes === '' ? null : m));
          if (!r.ok) return r;
        }
        return { ok: true };
      }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Input label="Window from" type="time" value={start} onChange={e => setStart(e.target.value)} error={tried ? startError : undefined} />
        <Input label="Window until" type="time" value={end} onChange={e => setEnd(e.target.value)} error={tried || (start && end) ? endError : undefined} />
      </div>
      <Input label="Time at the door" type="number" min={0} max={480} suffix="min" value={minutes} onChange={e => setMinutes(e.target.value)}
        hint={`Blank uses their usual ${delivery.serviceDurationMinutes} minutes.`} error={tried ? minutesError : undefined} style={{ maxWidth: 240 }} />
    </WriteDialog>
  );
}

export function DeliveredDialog({ delivery, onClose, run }: Props) {
  const api = useApi();
  const [day, setDay] = useState(dayOf(delivery.scheduledFor) > todayIso() ? todayIso() : dayOf(delivery.scheduledFor));
  return (
    <WriteDialog title="Mark delivered by hand" submitLabel="Mark delivered" onClose={onClose} size="sm"
      description="Local deliveries are normally completed by Routific on their own. Use this for a pickup, a shipped order, or a delivery whose confirmation never arrived."
      onSubmit={() => run(() => api.deliveries.markDelivered(delivery.id, toApiDay(day)), { title: 'Marked delivered' })}>
      <Input label="Delivered on" type="date" value={day} max={todayIso()} onChange={e => setDay(e.target.value)} style={{ maxWidth: 200 }} />
    </WriteDialog>
  );
}

export function FailedDialog({ delivery, onClose, run }: Props) {
  const api = useApi();
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  return (
    <WriteDialog title="Mark as failed" submitLabel="Mark failed" danger onClose={onClose} size="sm"
      description={`${delivery.customerName}’s ${formatDay(delivery.scheduledFor)} delivery didn’t happen. This closes it.`}
      onSubmit={async () => {
        setTried(true);
        if (!reason.trim()) return 'invalid';
        return run(() => api.deliveries.markFailed(delivery.id, reason.trim()), { title: 'Marked failed' });
      }}>
      <Textarea label="What happened" rows={3} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} autoFocus
        placeholder="e.g. Nobody home and no safe place to leave it" error={tried && !reason.trim() ? 'Say what happened — it’s kept on the record.' : undefined} />
    </WriteDialog>
  );
}

export function CancelDialog({ delivery, onClose, run }: Props) {
  const api = useApi();
  return (
    <WriteDialog title="Cancel this delivery?" submitLabel="Cancel delivery" danger onClose={onClose} size="sm"
      description={`${delivery.customerName}’s ${formatDay(delivery.scheduledFor)} delivery will be closed. Their subscription carries on as normal.`}
      onSubmit={() => run(() => api.deliveries.cancel(delivery.id), { title: 'Delivery canceled' })}>
      {delivery.hasPaid ? (
        <Alert tone="warning" title="Already paid">Canceling doesn’t refund them. Refunds are done by hand in Square.</Alert>
      ) : null}
    </WriteDialog>
  );
}
