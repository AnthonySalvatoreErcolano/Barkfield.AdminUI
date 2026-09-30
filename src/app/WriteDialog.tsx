// The shell for a dialog that performs one write: submit runs it, the dialog closes on success or on a
// conflict (the page shows the reloaded record), and a validation message stays inside the dialog.
import { useState, type FormEvent, type ReactNode } from 'react';
import { Alert, Button, Dialog } from '../ui';
import type { WriteOutcome } from './useSerialWrites';

export function WriteDialog({ title, description, submitLabel, danger, onSubmit, onClose, children, size = 'md', disabled }: {
  title: string;
  description?: ReactNode;
  submitLabel: string;
  danger?: boolean;
  /** 'invalid' = client-side validation failed; the dialog stays open and shows the field errors. */
  onSubmit: () => Promise<WriteOutcome | 'invalid'>;
  onClose: () => void;
  children?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
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
        <Button variant="ghost" onClick={onClose} disabled={busy}>{danger ? 'Keep it' : 'Cancel'}</Button>
        <Button type="submit" form="write-dialog" variant={danger ? 'danger' : 'primary'} disabled={busy || disabled}>{busy ? 'Saving…' : submitLabel}</Button>
      </>}>
      <form id="write-dialog" onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </form>
    </Dialog>
  );
}
