// DataTable, Pagination — ported from design/components/data.
// DataTable renders the rows it is given and reports sort clicks; it never sorts. Lists here are paged
// server-side, so the caller turns a sort change into a `sortBy` request (see src/api/sortKeys.ts).
import type { CSSProperties, Key, ReactNode } from 'react';
import { Icon, IconButton } from './core';
import { Checkbox } from './forms';
import { cx, injectStyles } from './injectStyles';

const TABLE_CSS = [
'.br-table-wrap{width:100%;overflow-x:auto}',
'.br-table{width:100%;border-collapse:separate;border-spacing:0;font-family:var(--font-body);font-size:14.5px;color:var(--text-primary)}',
'.br-table th{position:sticky;top:0;background:var(--surface-sunken);text-align:left;font-family:var(--font-display);font-weight:700;font-size:11.5px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--tan-700);padding:0 14px;height:38px;border-bottom:1px solid var(--border-default);white-space:nowrap;padding-top:1px}',
'.br-table th:first-child,.br-table td:first-child{padding-left:20px}',
'.br-table th:last-child,.br-table td:last-child{padding-right:20px}',
'.br-table th.br-sortable{cursor:pointer;user-select:none}',
'.br-table th.br-sortable:hover{color:var(--teal-600)}',
'.br-table th .br-th{display:inline-flex;align-items:center;gap:4px}',
'.br-table th button.br-th{border:0;background:none;padding:0;font:inherit;letter-spacing:inherit;text-transform:inherit;color:inherit;cursor:pointer}',
'.br-table th button.br-th:focus-visible{outline:none;box-shadow:var(--focus-ring);border-radius:var(--radius-xs)}',
'.br-table td{padding:0 14px;height:52px;border-bottom:1px solid var(--border-subtle);vertical-align:middle;font-variant-numeric:tabular-nums}',
'.br-table--compact td{height:40px;font-size:14px}',
'.br-table tbody tr{transition:background var(--duration-fast) var(--ease-out)}',
'.br-table tbody tr:hover td{background:var(--surface-hover)}',
'.br-table tbody tr.br-clickable{cursor:pointer}',
'.br-table tbody tr.br-selected td{background:var(--surface-selected)}',
'.br-table tbody tr:last-child td{border-bottom:0}',
'.br-table .br-sel{width:44px;padding-right:0}',
'.br-table__empty{padding:40px 20px;text-align:center;color:var(--text-muted);font-family:var(--font-body)}',
].join('');

export interface DataTableColumn<Row> {
  key: string;
  header: ReactNode;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  /** Only for columns whose key is an accepted sortBy key for the endpoint. */
  sortable?: boolean;
  render?: (row: Row) => ReactNode;
}

export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

export interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => Key;
  selectable?: boolean;
  selected?: Key[];
  onSelectChange?: (keys: Key[]) => void;
  onRowClick?: (row: Row) => void;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  density?: 'default' | 'compact';
  empty?: ReactNode;
  style?: CSSProperties;
}

export function DataTable<Row>({ columns, rows, rowKey, selectable, selected = [], onSelectChange, onRowClick, sort, onSortChange, density = 'default', empty = 'Nothing here yet.', style }: DataTableProps<Row>) {
  injectStyles('datatable', TABLE_CSS);
  const keys = rows.map(rowKey);
  const allOn = !!selectable && keys.length > 0 && keys.every(k => selected.includes(k));
  const someOn = !!selectable && !allOn && keys.some(k => selected.includes(k));
  const toggleAll = () => onSelectChange?.(allOn ? [] : keys);
  const toggle = (k: Key) => onSelectChange?.(selected.includes(k) ? selected.filter(x => x !== k) : [...selected, k]);
  const clickSort = (col: DataTableColumn<Row>) => {
    if (!col.sortable || !onSortChange) return;
    const dir = sort?.key === col.key && sort.dir === 'asc' ? 'desc' : 'asc';
    onSortChange({ key: col.key, dir });
  };
  return (
    <div className="br-table-wrap" style={style}>
      <table className={cx('br-table', density === 'compact' && 'br-table--compact')}>
        <thead>
          <tr>
            {selectable ? <th className="br-sel"><Checkbox checked={allOn} indeterminate={someOn} onChange={toggleAll} aria-label="Select all" /></th> : null}
            {columns.map(c => {
              const active = sort?.key === c.key;
              const icon = active ? (sort.dir === 'asc' ? 'arrow-up' : 'arrow-down') : 'arrow-up-down';
              return (
                <th key={c.key} className={c.sortable ? 'br-sortable' : undefined} style={{ width: c.width, textAlign: c.align ?? 'left' }}
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {c.sortable ? (
                    <button type="button" className="br-th" onClick={() => clickSort(c)}>
                      {c.header}<Icon name={icon} size={12} strokeWidth={2.25} style={{ opacity: active ? 1 : 0.45 }} />
                    </button>
                  ) : <span className="br-th">{c.header}</span>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={columns.length + (selectable ? 1 : 0)} className="br-table__empty">{empty}</td></tr>
            : rows.map((r, i) => {
              const k = keys[i]!;
              const on = !!selectable && selected.includes(k);
              return (
                <tr key={k} className={cx(onRowClick && 'br-clickable', on && 'br-selected')} onClick={onRowClick ? () => onRowClick(r) : undefined}>
                  {selectable ? <td className="br-sel" onClick={e => e.stopPropagation()}><Checkbox checked={on} onChange={() => toggle(k)} aria-label="Select row" /></td> : null}
                  {columns.map(c => <td key={c.key} style={{ textAlign: c.align ?? 'left' }}>{c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? '')}</td>)}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

const PAGINATION_CSS = [
'.br-pag{display:flex;align-items:center;justify-content:space-between;gap:16px;font-family:var(--font-body);font-size:14px;color:var(--text-muted);padding:12px 20px}',
'.br-pag__pages{display:flex;align-items:center;gap:4px}',
'.br-pag__n{min-width:30px;height:30px;padding:0 6px;border-radius:var(--radius-sm);border:1px solid transparent;background:transparent;font-family:var(--font-display);font-weight:700;font-size:13px;color:var(--text-secondary);cursor:pointer;padding-top:2px}',
'.br-pag__n:hover{background:var(--surface-hover);color:var(--text-brand)}',
'.br-pag__n--on{background:var(--teal-500);color:var(--cream-300)}',
'.br-pag__n--on:hover{background:var(--teal-600);color:var(--cream-300)}',
'.br-pag__gap{padding:0 4px}',
].join('');

function range(page: number, count: number): Array<number | '…'> {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, '…', count];
  if (page >= count - 3) return [1, '…', count - 4, count - 3, count - 2, count - 1, count];
  return [1, '…', page - 1, page, page + 1, '…', count];
}

export interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  total?: number;
  pageSize?: number;
  style?: CSSProperties;
}

export function Pagination({ page, pageCount, onChange, total, pageSize = 25, style }: PaginationProps) {
  injectStyles('pagination', PAGINATION_CSS);
  const from = total ? (page - 1) * pageSize + 1 : null;
  const to = total ? Math.min(total, page * pageSize) : null;
  return (
    <nav className="br-pag" style={style} aria-label="Pagination">
      <span>{total ? `Showing ${from}–${to} of ${total.toLocaleString()}` : `Page ${page} of ${Math.max(pageCount, 1)}`}</span>
      <div className="br-pag__pages">
        <IconButton icon="chevron-left" label="Previous page" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)} />
        {range(page, pageCount).map((n, i) => n === '…'
          ? <span key={'g' + i} className="br-pag__gap">…</span>
          : <button key={n} type="button" className={cx('br-pag__n', n === page && 'br-pag__n--on')} aria-current={n === page ? 'page' : undefined} onClick={() => onChange(n)}>{n}</button>)}
        <IconButton icon="chevron-right" label="Next page" size="sm" disabled={page >= pageCount} onClick={() => onChange(page + 1)} />
      </div>
    </nav>
  );
}
