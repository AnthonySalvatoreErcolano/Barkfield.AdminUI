// How often a subscription ships: a number plus a unit — every N days, weeks or months. Two inputs, not
// a fixed dropdown of cadences (PAGES.md §5). The unit is sent as the integer enum.
import { FrequencyUnit } from '../api/generated/enums';
import { Input, Select } from '../ui';
import { injectStyles } from '../ui/injectStyles';

const CSS = [
'.freq{display:flex;flex-direction:column;gap:6px}',
'.freq__row{display:flex;align-items:flex-end;gap:10px}',
'.freq__every{font-family:var(--font-body);font-size:15px;color:var(--text-secondary);padding-bottom:9px}',
].join('');

export interface FrequencyValue {
  interval: string;
  unit: number;
}

export function frequencyError(v: FrequencyValue): string | undefined {
  const n = Number(v.interval);
  if (v.interval.trim() === '' || !Number.isInteger(n) || n < 1) return 'A whole number, 1 or more.';
  if (n > 365) return 'That’s longer than a year — check the number.';
  return undefined;
}

/** "every week", "every 3 weeks" — the same wording the API uses for an unnamed subscription. */
export function describeFrequency(v: FrequencyValue) {
  const n = Number(v.interval);
  const name = v.unit === FrequencyUnit.Days ? 'day' : v.unit === FrequencyUnit.Months ? 'month' : 'week';
  return n === 1 ? `every ${name}` : `every ${Number.isFinite(n) ? n : '?'} ${name}s`;
}

export function FrequencyField({ value, onChange, error, label = 'Delivers' }: { value: FrequencyValue; onChange: (v: FrequencyValue) => void; error?: string; label?: string }) {
  injectStyles('frequency', CSS);
  const plural = Number(value.interval) !== 1;
  return (
    <div className="freq" role="group" aria-label={label}>
      <div className="freq__row">
        <span className="freq__every">Every</span>
        <Input label={label === 'Delivers' ? 'Number' : `${label} — number`} type="number" min={1} value={value.interval}
          onChange={e => onChange({ ...value, interval: e.target.value })} style={{ width: 110 }} error={error} />
        <Select label="Unit" value={String(value.unit)} onChange={e => onChange({ ...value, unit: Number(e.target.value) })} style={{ width: 150 }}
          options={[
            { value: FrequencyUnit.Days, label: plural ? 'days' : 'day' },
            { value: FrequencyUnit.Weeks, label: plural ? 'weeks' : 'week' },
            { value: FrequencyUnit.Months, label: plural ? 'months' : 'month' },
          ]} />
      </div>
    </div>
  );
}
