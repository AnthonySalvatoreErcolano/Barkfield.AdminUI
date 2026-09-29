import React from 'react';
import { IconButton } from '../core/IconButton.jsx';
import { injectStyles } from '../core/useStyles.js';

const CSS = [
'.br-pag{display:flex;align-items:center;justify-content:space-between;gap:16px;font-family:var(--font-body);font-size:14px;color:var(--text-muted);padding:12px 20px}',
'.br-pag__pages{display:flex;align-items:center;gap:4px}',
'.br-pag__n{min-width:30px;height:30px;padding:0 6px;border-radius:var(--radius-sm);border:1px solid transparent;background:transparent;font-family:var(--font-display);font-weight:700;font-size:13px;color:var(--text-secondary);cursor:pointer;padding-top:2px}',
'.br-pag__n:hover{background:var(--surface-hover);color:var(--text-brand)}',
'.br-pag__n--on{background:var(--teal-500);color:var(--cream-300)}',
'.br-pag__n--on:hover{background:var(--teal-600);color:var(--cream-300)}',
'.br-pag__gap{padding:0 4px}'
].join('');

function range(page, count) {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, '…', count];
  if (page >= count - 3) return [1, '…', count - 4, count - 3, count - 2, count - 1, count];
  return [1, '…', page - 1, page, page + 1, '…', count];
}

export function Pagination({ page, pageCount, onChange, total, pageSize, style }) {
  injectStyles('pagination', CSS);
  const from = total ? (page - 1) * pageSize + 1 : null;
  const to = total ? Math.min(total, page * pageSize) : null;
  return (
    <nav className="br-pag" style={style} aria-label="Pagination">
      <span>{total ? 'Showing ' + from + '–' + to + ' of ' + total.toLocaleString() : 'Page ' + page + ' of ' + pageCount}</span>
      <div className="br-pag__pages">
        <IconButton icon="chevron-left" label="Previous page" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)} />
        {range(page, pageCount).map((n, i) => n === '…'
          ? <span key={'g' + i} className="br-pag__gap">…</span>
          : <button key={n} type="button" className={'br-pag__n' + (n === page ? ' br-pag__n--on' : '')} aria-current={n === page ? 'page' : undefined} onClick={() => onChange(n)}>{n}</button>)}
        <IconButton icon="chevron-right" label="Next page" size="sm" disabled={page >= pageCount} onClick={() => onChange(page + 1)} />
      </div>
    </nav>
  );
}
