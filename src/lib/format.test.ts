import { formatDay, formatMoney, formatPhone, formatTime, toApiTime, toInputTime } from './format';

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
