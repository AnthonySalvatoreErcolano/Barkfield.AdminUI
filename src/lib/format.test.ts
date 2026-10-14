import { formatClock, formatDay, formatInstant, formatMoney, formatPhone, formatTime, parseInstant, toApiTime, toInputTime } from './format';

describe('formatDay', () => {
  it('reads the date part and never shifts it, whatever the local zone', () => {
    // 2026-09-29 is a Tuesday. new Date('2026-09-29T00:00:00Z') in New York would be Monday evening.
    expect(formatDay('2026-09-29T00:00:00Z')).toBe('Tue, Sep 29');
    expect(formatDay('2026-09-29T00:00:00')).toBe('Tue, Sep 29');
    expect(formatDay(null)).toBe('—');
  });
});

describe('times of day', () => {
  it('formats a door-side wall-clock time without a zone', () => {
    expect(formatTime('09:00:00')).toBe('9am');
    expect(formatTime('13:30:00')).toBe('1:30pm');
    expect(formatTime('00:15:00')).toBe('12:15am');
  });

  it('round-trips between the API and a time input', () => {
    expect(toApiTime('14:05')).toBe('14:05:00');
    expect(toApiTime('')).toBeNull();
    expect(toInputTime('14:05:00')).toBe('14:05');
  });
});

describe('formatMoney', () => {
  it('shows the amount as sent — extra precision is kept, not rounded away', () => {
    expect(formatMoney(89.99)).toBe('$89.99');
    expect(formatMoney(64.5)).toBe('$64.50');
    expect(formatMoney(12.345)).toBe('$12.345');
    expect(formatMoney(null)).toBe('—');
  });
});

it('formats US phone numbers and leaves anything else alone', () => {
  expect(formatPhone('6315550142')).toBe('(631) 555-0142');
  expect(formatPhone('+1 631 555 0142')).toBe('(631) 555-0142');
  expect(formatPhone('ext 12')).toBe('ext 12');
});

describe('date-only helpers', () => {
  it('adds days across month ends without drifting', async () => {
    const { addDays, toApiDay } = await import('./dates');
    expect(addDays('2026-09-29', 3)).toBe('2026-10-02');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09'); // US DST change
    expect(toApiDay('2026-09-29')).toBe('2026-09-29T00:00:00Z');
  });
});

describe('instants', () => {
  // Tests run in America/New_York (EDT in October, UTC−4).
  it('reads a zone-less API instant as UTC, not local time', () => {
    expect(formatClock('2026-10-14T18:59:39.197')).toBe('2:59 PM'); // the live sentToRoutingAt that read 6:59 PM
    expect(formatClock('2026-10-14T18:59:39Z')).toBe('2:59 PM');
    expect(formatClock('2026-10-14T14:59:39-04:00')).toBe('2:59 PM');
    expect(parseInstant('2026-10-15T02:30:00').toISOString()).toBe('2026-10-15T02:30:00.000Z');
    expect(formatInstant('2026-10-15T02:30:00')).toBe('Oct 14, 2026'); // late evening local, the day before
  });
});
