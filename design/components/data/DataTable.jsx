import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { Checkbox } from '../forms/Checkbox.jsx';
import { injectStyles } from '../core/useStyles.js';

const CSS = [
'.br-table-wrap{width:100%;overflow-x:auto}',
'.br-table{width:100%;border-collapse:separate;border-spacing:0;font-family:var(--font-body);font-size:14.5px;color:var(--text-primary)}',
'.br-table th{position:sticky;top:0;background:var(--surface-sunken);text-align:left;font-family:var(--font-display);font-weight:700;font-size:11.5px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--tan-700);padding:0 14px;height:38px;border-bottom:1px solid var(--border-default);white-space:nowrap;padding-top:1px}',
'.br-table th:first-child,.br-table td:first-child{padding-left:20px}',
'.br-table th:last-child,.br-table td:last-child{padding-right:20px}',
'.br-table th.br-sortable{cursor:pointer;user-select:none}',
'.br-table th.br-sortable:hover{color:var(--teal-600)}',
'.br-table th .br-th{display:inline-flex;align-items:center;gap:4px}',
'.br-table td{padding:0 14px;height:52px;border-bottom:1px solid var(--border-subtle);vertical-align:middle;font-variant-numeric:tabular-nums}',
'.br-table--compact td{height:40px;font-size:14px}',
'.br-table tbody tr{transition:background var(--duration-fast) var(--ease-out)}',
'.br-table tbody tr:hover td{background:var(--surface-hover)}',
'.br-table tbody tr.br-clickable{cursor:pointer}',
'.br-table tbody tr.br-selected td{background:var(--surface-selected)}',
'.br-table tbody tr:last-child td{border-bottom:0}',
'.br-table .br-sel{width:44px;padding-right:0}',
'.br-table__empty{padding:40px 20px;text-align:center;color:var(--text-muted);font-family:var(--font-body)}'
].join('');

export function DataTable({ columns, rows, rowKey = 'id', selectable, selected = [], onSelectChange, onRowClick, sort, onSortChange, density = 'default', empty = 'Nothing here yet.', style }) {
  injectStyles('datatable', CSS);
  const keys = rows.map(r => r[rowKey]);
  const allOn = selectable && keys.length > 0 && keys.every(k => selected.includes(k));
  const someOn = selectable && !allOn && keys.some(k => selected.includes(k));
  const toggleAll = () => onSelectChange && onSelectChange(allOn ? [] : keys);
  const toggle = k => onSelectChange && onSelectChange(selected.includes(k) ? selected.filter(x => x !== k) : selected.concat([k]));
  const clickSort = col => {
    if (!col.sortable || !onSortChange) return;
    const dir = sort && sort.key === col.key && sort.dir === 'asc' ? 'desc' : 'asc';
    onSortChange({ key: col.key, dir });
  };
  return (
    <div className="br-table-wrap" style={style}>
      <table className={'br-table' + (density === 'compact' ? ' br-table--compact' : '')}>
        <thead>
          <tr>
            {selectable ? <th className="br-sel"><Checkbox checked={allOn} indeterminate={someOn} onChange={toggleAll} aria-label="Select all" /></th> : null}
            {columns.map(c => {
              const active = sort && sort.key === c.key;
              return (
                <th key={c.key} className={c.sortable ? 'br-sortable' : ''} style={{ width: c.width, textAlign: c.align || 'left' }} onClick={() => clickSort(c)}>
                  <span className="br-th">{c.header}{c.sortable ? <Icon name={active ? (sort.dir === 'asc' ? 'arrow-up' : 'arrow-down') : 'arrow-up-down'} size={12} strokeWidth={2.25} style={{ opacity: active ? 1 : .45 }} /> : null}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={columns.length + (selectable ? 1 : 0)} className="br-table__empty">{empty}</td></tr> : rows.map(r => {
            const k = r[rowKey];
            const on = selectable && selected.includes(k);
            return (
              <tr key={k} className={[onRowClick ? 'br-clickable' : '', on ? 'br-selected' : ''].join(' ')} onClick={onRowClick ? () => onRowClick(r) : undefined}>
                {selectable ? <td className="br-sel" onClick={e => e.stopPropagation()}><Checkbox checked={on} onChange={() => toggle(k)} aria-label="Select row" /></td> : null}
                {columns.map(c => <td key={c.key} style={{ textAlign: c.align || 'left' }}>{c.render ? c.render(r) : r[c.key]}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
