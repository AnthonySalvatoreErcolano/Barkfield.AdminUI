// Merging a form with a record that changed underneath it.
//
// The API cannot catch a stale form: writes carry no revision, so a save made on ten-minute-old data
// silently wins (API-CONTEXT §4). So forms re-read before saving, and after a 409. If someone else
// changed fields since the form opened, their values are taken and the user sees what moved — the
// user's own edits to other fields are kept. Nothing is ever saved over their change without the user
// looking at it first.

export type FormValues = Record<string, string>;

export interface Reconciled<V extends FormValues> {
  /** What the form should now show: their changes, plus the user's edits to fields they did not touch. */
  merged: V;
  /** Fields someone else changed since the form was opened. Empty = safe to save as-is. */
  changedByOthers: Array<keyof V & string>;
  /** Of those, the ones the user had also edited — their own value, so they can re-enter it. */
  overwritten: Partial<V>;
}

/**
 * @param baseline the record's values when the form was opened (or last reconciled)
 * @param fresh    the record's values now
 * @param mine     what the user has in the form
 */
export function reconcile<V extends FormValues>(baseline: V, fresh: V, mine: V): Reconciled<V> {
  const merged = { ...mine };
  const changedByOthers: Array<keyof V & string> = [];
  const overwritten: Partial<V> = {};
  for (const key of Object.keys(fresh) as Array<keyof V & string>) {
    if (fresh[key] === baseline[key]) continue;
    changedByOthers.push(key);
    const userEdited = mine[key] !== baseline[key];
    if (userEdited && mine[key] !== fresh[key]) overwritten[key] = mine[key];
    merged[key] = fresh[key];
  }
  return { merged, changedByOthers, overwritten };
}
