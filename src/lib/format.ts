// Display formatting that encodes the API's conventions (API-CONTEXT §5). Screens format through these,
// never ad hoc, because each rule here exists to stop a specific wrong-looking screen.

/**
 * A date-only concept (delivery day, schedule date, birthday). It arrives as UTC midnight; read the
 * date part and never shift it into the local zone — or a Tuesday delivery shows as Monday.
 */
export function formatDay(iso: string | null | undefined, style: 'short' | 'long' = 'short'): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const local = new Date(y!, m! - 1, d!);
  return local.toLocaleDateString('en-US', style === 'long'
    ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
    : { weekday: 'short', month: 'short', day: 'numeric' });
}

/** A real instant (createdAt, paymentAttemptedAt): UTC on the wire, shown in local time. */
export function formatInstant(iso: string | null | undefined, withTime = false): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return withTime
    ? d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** A wall-clock time at the customer's door ("HH:mm:ss", no zone). */
export function formatTime(value: string | null | undefined): string {
  if (!value) return '—';
  const [h, m] = value.split(':').map(Number);
  const suffix = h! >= 12 ? 'pm' : 'am';
  const hour = h! % 12 || 12;
  return m ? `${hour}:${String(m).padStart(2, '0')}${suffix}` : `${hour}${suffix}`;
}

/** "HH:mm" from an <input type="time"> → the API's "HH:mm:ss". Empty stays null. */
export function toApiTime(value: string): string | null {
  if (!value) return null;
  return value.length === 5 ? value + ':00' : value;
}

/** The API's "HH:mm:ss" → what an <input type="time"> accepts. */
export function toInputTime(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : '';
}

/**
 * Money exactly as the API sent it. Two decimals is the currency's own precision, not rounding for
 * display — a value with more digits is shown with them rather than silently changed.
 */
export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const digits = (String(value).split('.')[1] ?? '').length;
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: Math.max(2, digits) });
}

export function plural(n: number, one: string, many = one + 's') {
  return `${n} ${n === 1 ? one : many}`;
}

/** "(631) 555-0142" for a 10-digit US number; anything else as typed. */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return '—';
  const digits = value.replace(/\D/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : value;
}
