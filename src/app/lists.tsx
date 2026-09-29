// Shared pieces for paged, server-sorted lists. State lives in the URL so reload, back and shared links
// all land on the same page, search and sort.
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SORT_KEYS, type SortablePath, type SortKey } from '../api/sortKeys';
import { Input, type SortState } from '../ui';

export function useListParams<P extends SortablePath>(endpoint: P, defaults: { dir?: 'asc' | 'desc' } = {}) {
  const [params, setParams] = useSearchParams();
  const allowed = SORT_KEYS[endpoint];
  const rawSort = params.get('sort');
  // Only keys the endpoint accepts; anything else would be silently ignored by the API.
  const sortKey = ((allowed.keys as readonly string[]).includes(rawSort ?? '') ? rawSort : allowed.default) as SortKey<P>;

  const update = (patch: Record<string, string | number | boolean | null | undefined>, options: { replace?: boolean } = {}) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined || value === '' || value === false) next.delete(key);
        else next.set(key, String(value));
      }
      // Any change other than paging starts again from page 1.
      if (!('page' in patch)) next.delete('page');
      if (next.get('page') === '1') next.delete('page');
      return next;
    }, { replace: options.replace });
  };

  return {
    page: Math.max(1, Number(params.get('page')) || 1),
    search: params.get('q') ?? '',
    sort: { key: sortKey, dir: (params.get('dir') as 'asc' | 'desc' | null) ?? defaults.dir ?? 'asc' } satisfies SortState,
    flag: (name: string) => params.get(name) === '1',
    /** A free-form filter value (a date, a status number), or the fallback when absent. */
    value: (name: string, fallback = '') => params.get(name) ?? fallback,
    setPage: (page: number) => update({ page }),
    setSearch: (q: string) => update({ q }, { replace: true }),
    setSort: (s: SortState) => update({ sort: s.key === allowed.default ? null : s.key, dir: s.dir === (defaults.dir ?? 'asc') ? null : s.dir }),
    setFlag: (name: string, on: boolean) => update({ [name]: on ? '1' : null }),
    setValues: (values: Record<string, string | null>) => update(values),
    isSortable: (columnKey: string) => (allowed.keys as readonly string[]).includes(columnKey),
  };
}

/** A search box that reports after typing pauses, so each keystroke is not a request. */
export function SearchInput({ value, onChange, placeholder, label }: { value: string; onChange: (value: string) => void; placeholder: string; label: string }) {
  const [draft, setDraft] = useState(value);
  const latest = useRef(onChange);
  latest.current = onChange;
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (draft === value) return;
    const t = setTimeout(() => latest.current(draft.trim()), 300);
    return () => clearTimeout(t);
  }, [draft, value]);
  return (
    <Input iconLeft="search" size="sm" type="search" placeholder={placeholder} aria-label={label}
      value={draft} onChange={e => setDraft(e.target.value)} style={{ width: 320 }} />
  );
}
