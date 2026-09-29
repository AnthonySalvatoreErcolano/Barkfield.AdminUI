// Date-only values (a delivery day) as 'YYYY-MM-DD' strings in the shop's local calendar. Kept as
// strings end to end so no timezone conversion can move a day: a query sends '2026-09-29', a body sends
// '2026-09-29T00:00:00Z', and what comes back is read with formatDay(), which ignores the time.

/** Today in the viewer's local calendar. */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const t = new Date(Date.UTC(y!, m! - 1, d! + days));
  return t.toISOString().slice(0, 10);
}

/** For a request body's date-only field: midnight UTC, which the API reads by its date part. */
export function toApiDay(iso: string): string {
  return iso.slice(0, 10) + 'T00:00:00Z';
}

/** A delivery-day value from the API, as 'YYYY-MM-DD'. */
export function dayOf(value: string): string {
  return value.slice(0, 10);
}
