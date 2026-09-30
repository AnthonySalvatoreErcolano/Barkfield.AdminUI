// An inline quantity: edit, then Enter or leave the field to save. Anything that isn't a whole number
// of at least 1 snaps back rather than being sent.
import { useEffect, useState } from 'react';
import { Input } from '../ui';

export function QuantityEditor({ value, label, disabled, onSave }: { value: number; label: string; disabled?: boolean; onSave: (quantity: number) => unknown }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const q = Number(text);
  const commit = () => { if (Number.isInteger(q) && q >= 1 && q !== value) void onSave(q); else setText(String(value)); };
  return (
    <Input size="sm" type="number" min={1} value={text} disabled={disabled} aria-label={label}
      onChange={e => setText(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
      style={{ width: 76, marginLeft: 'auto' }} />
  );
}
