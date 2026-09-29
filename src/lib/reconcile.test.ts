import { reconcile } from './reconcile';

const baseline = { phone: '111', notes: 'old', city: 'Northport' };

it('is a no-op when nobody else changed anything', () => {
  const r = reconcile(baseline, baseline, { ...baseline, notes: 'mine' });
  expect(r.changedByOthers).toEqual([]);
  expect(r.merged.notes).toBe('mine');
});

it('takes their change and keeps my edit to a different field', () => {
  const r = reconcile(baseline, { ...baseline, phone: '222' }, { ...baseline, notes: 'mine' });
  expect(r.changedByOthers).toEqual(['phone']);
  expect(r.merged).toEqual({ phone: '222', notes: 'mine', city: 'Northport' });
  expect(r.overwritten).toEqual({});
});

it('when we both changed the same field, shows theirs and remembers mine for re-entry', () => {
  const r = reconcile(baseline, { ...baseline, phone: '222' }, { ...baseline, phone: '333' });
  expect(r.merged.phone).toBe('222');
  expect(r.overwritten).toEqual({ phone: '333' });
});

it('does not report a clash when we both made the same change', () => {
  const r = reconcile(baseline, { ...baseline, phone: '222' }, { ...baseline, phone: '222' });
  expect(r.changedByOthers).toEqual(['phone']);
  expect(r.overwritten).toEqual({});
});
