// The save path for every edit form: re-read, reconcile, save; on a 409, re-read and reconcile again.
// Never auto-retries — when the data moved, the user sees it and saves again themselves.
import { useCallback, useRef, useState } from 'react';
import { ConflictError } from '../api/errors';
import { reconcile, type FormValues } from '../lib/reconcile';

export interface StaleNotice<V extends FormValues> {
  message: string;
  changedByOthers: Array<keyof V & string>;
  overwritten: Partial<V>;
}

export type GuardedResult<V extends FormValues, R> =
  | { status: 'saved'; result: R }
  /** The record moved. Put `merged` into the form and show `notice`; the user saves again. */
  | { status: 'stale'; merged: V; notice: StaleNotice<V> };

// Our wording, not the API's: its 409 message says to reload, and by the time this shows we already have.
const MOVED = 'Someone else changed this while you were editing. Their changes are shown below — check them, then save again.';
const OVERLAPPED = 'Someone else saved this at the same moment. Nothing on this form was affected — save again when ready.';

export function useGuardedSave<V extends FormValues, R>(options: {
  /** The record's values when the form opened. */
  initial: V;
  /** Fetch the record now, as form values. */
  reread: () => Promise<V>;
  save: (values: V) => Promise<R>;
}) {
  const baseline = useRef(options.initial);
  const [notice, setNotice] = useState<StaleNotice<V> | null>(null);
  const opts = useRef(options);
  opts.current = options;

  const submit = useCallback(async (mine: V): Promise<GuardedResult<V, R>> => {
    const settle = (fresh: V): GuardedResult<V, R> => {
      const r = reconcile(baseline.current, fresh, mine);
      baseline.current = fresh;
      const n = { message: r.changedByOthers.length ? MOVED : OVERLAPPED, changedByOthers: r.changedByOthers, overwritten: r.overwritten };
      setNotice(n);
      return { status: 'stale', merged: r.merged, notice: n };
    };

    const before = await opts.current.reread();
    if (reconcile(baseline.current, before, mine).changedByOthers.length) return settle(before);

    try {
      const result = await opts.current.save(mine);
      baseline.current = mine;
      setNotice(null);
      return { status: 'saved', result };
    } catch (error) {
      if (!(error instanceof ConflictError)) throw error;
      // Two writes overlapped on the server. The re-read shows what changed, if it touched this form.
      return settle(await opts.current.reread());
    }
  }, []);

  return { submit, notice, dismissNotice: () => setNotice(null) };
}
