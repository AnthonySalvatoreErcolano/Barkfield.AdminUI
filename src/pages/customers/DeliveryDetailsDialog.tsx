// The driver-facing stop details (PAGES.md §2): access notes, time at the door, preferred window.
// Its own form, apart from contact details, because it feeds routing — and it is read live at dispatch.
import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { errorMessage, ValidationError } from '../../api/errors';
import type { CustomerDetail } from '../../api/ports';
import { useToast } from '../../app/toast';
import { useGuardedSave } from '../../app/useGuardedSave';
import { toApiTime, toInputTime } from '../../lib/format';
import { useApi } from '../../session/SessionProvider';
import { Alert, Button, Dialog, Input, Textarea } from '../../ui';
import { customerKeys } from './keys';

type Values = { accessNotes: string; serviceDurationMinutes: string; windowStart: string; windowEnd: string };

const LABELS: Record<keyof Values, string> = {
  accessNotes: 'Access notes', serviceDurationMinutes: 'Time at the door', windowStart: 'Window from', windowEnd: 'Window until',
};

const toValues = (c: CustomerDetail): Values => ({
  accessNotes: c.accessNotes ?? '',
  serviceDurationMinutes: String(c.serviceDurationMinutes),
  windowStart: toInputTime(c.preferredWindowStart),
  windowEnd: toInputTime(c.preferredWindowEnd),
});

function validate(v: Values): Partial<Record<keyof Values, string>> {
  const e: Partial<Record<keyof Values, string>> = {};
  const minutes = Number(v.serviceDurationMinutes);
  if (v.serviceDurationMinutes.trim() === '' || !Number.isInteger(minutes) || minutes < 0 || minutes > 480) e.serviceDurationMinutes = 'Between 0 and 480 minutes.';
  if (v.windowStart && !v.windowEnd) e.windowEnd = 'Add an end time, or clear both.';
  if (!v.windowStart && v.windowEnd) e.windowStart = 'Add a start time, or clear both.';
  if (v.windowStart && v.windowEnd && v.windowEnd <= v.windowStart) e.windowEnd = 'Must be after the start.';
  if (v.accessNotes.length > 1000) e.accessNotes = 'Keep this under 1,000 characters.';
  return e;
}

export function DeliveryDetailsDialog({ customer, open, onClose }: { customer: CustomerDetail; open: boolean; onClose: () => void }) {
  // Re-mount per opening, so the form always starts from the record as it is now.
  return open ? <DeliveryDetailsForm customer={customer} onClose={onClose} /> : null;
}

function DeliveryDetailsForm({ customer, onClose }: { customer: CustomerDetail; onClose: () => void }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const initial = toValues(customer);
  const [values, setValues] = useState(initial);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const { submit, notice } = useGuardedSave({
    initial,
    reread: async () => toValues(await api.customers.get(customer.id)),
    save: v => api.customers.updateDeliveryDetails(customer.id, {
      accessNotes: v.accessNotes.trim() || null,
      serviceDurationMinutes: Number(v.serviceDurationMinutes),
      preferredWindowStart: toApiTime(v.windowStart),
      preferredWindowEnd: toApiTime(v.windowEnd),
    }),
  });

  const errors = tried ? validate(values) : {};
  const set = (k: keyof Values) => (e: { target: { value: string } }) => setValues({ ...values, [k]: e.target.value });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (Object.keys(validate(values)).length) return;
    setBusy(true);
    setFormError(null);
    setServerErrors({});
    try {
      const outcome = await submit(values);
      await queryClient.invalidateQueries({ queryKey: customerKeys.detail(customer.id) });
      if (outcome.status === 'stale') { setValues(outcome.merged); return; }
      toast({ title: 'Delivery details saved', message: 'They apply from the next dispatch, including tonight’s.' });
      onClose();
    } catch (err) {
      if (err instanceof ValidationError && Object.keys(err.fieldErrors).length) setServerErrors(err.fieldErrors);
      else setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const hint = (k: keyof Values, fallback?: string) =>
    notice?.overwritten[k] !== undefined ? `Just changed by someone else. You had: “${notice.overwritten[k] || '(blank)'}”`
      : notice?.changedByOthers.includes(k) ? 'Just changed by someone else.' : fallback;

  return (
    <Dialog open size="lg" onClose={busy ? undefined : onClose} title="Delivery details"
      description={`What the driver sees for ${customer.firstName}’s stop.`}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="delivery-details" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
      </>}>
      <form id="delivery-details" onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Alert tone="info">
          These are read <strong>live</strong> when the day is sent for routing — a gate code changed this morning applies to tonight’s run.
        </Alert>
        {notice ? (
          <Alert tone="warning" title="Changed while you were editing">
            {notice.message}
            {notice.changedByOthers.length ? <> Changed: {notice.changedByOthers.map(k => LABELS[k]).join(', ')}.</> : null}
          </Alert>
        ) : null}
        {formError ? <Alert tone="danger">{formError}</Alert> : null}
        <Textarea label={LABELS.accessNotes} rows={3} value={values.accessNotes} onChange={set('accessNotes')}
          placeholder="Gate codes, where to leave the box, dogs in the yard…"
          hint={hint('accessNotes', 'Sent to the driver as stop instructions.')} error={serverErrors.accessNotes?.[0] ?? errors.accessNotes} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <Input label={LABELS.serviceDurationMinutes} type="number" min={0} max={480} suffix="min" value={values.serviceDurationMinutes}
            onChange={set('serviceDurationMinutes')} hint={hint('serviceDurationMinutes', 'How long the stop takes.')}
            error={serverErrors.serviceDurationMinutes?.[0] ?? errors.serviceDurationMinutes} />
          <Input label={LABELS.windowStart} type="time" value={values.windowStart} onChange={set('windowStart')}
            hint={hint('windowStart', 'Optional.')} error={serverErrors.preferredWindowStart?.[0] ?? errors.windowStart} />
          <Input label={LABELS.windowEnd} type="time" value={values.windowEnd} onChange={set('windowEnd')}
            hint={hint('windowEnd')} error={serverErrors.preferredWindowEnd?.[0] ?? errors.windowEnd} />
        </div>
      </form>
    </Dialog>
  );
}
