import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { injectStyles } from '../core/useStyles.js';

const CSS = [
'.br-chip{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:var(--radius-pill);border:1px solid var(--border-strong);background:var(--surface-card);color:var(--text-primary);font-family:var(--font-display);font-weight:600;font-size:13.5px;line-height:1;white-space:nowrap;transition:all var(--duration-fast) var(--ease-out);padding-top:1px}',
'button.br-chip{cursor:pointer}',
'button.br-chip:hover{border-color:var(--teal-300);background:var(--surface-hover)}',
'.br-chip:focus-visible{outline:none;box-shadow:var(--focus-ring)}',
'.br-chip--sm{height:24px;padding:0 9px;font-size:12.5px}',
'.br-chip--selected{background:var(--teal-500);border-color:var(--teal-500);color:var(--cream-300)}',
'button.br-chip--selected:hover{background:var(--teal-600);border-color:var(--teal-600)}',
'.br-chip--tag{background:var(--cream-100);border-color:var(--cream-400);color:var(--tan-800)}',
'.br-chip__count{font-size:11.5px;font-weight:700;padding:2px 6px 1px;border-radius:var(--radius-pill);background:var(--ink-100);color:var(--text-secondary)}',
'.br-chip--selected .br-chip__count{background:rgba(242,218,178,.22);color:var(--cream-300)}',
'.br-chip__x{display:inline-flex;border:0;background:transparent;padding:2px;margin-right:-6px;border-radius:50%;cursor:pointer;color:inherit;opacity:.7}',
'.br-chip__x:hover{opacity:1;background:rgba(0,0,0,.06)}'
].join('');

export function Chip({ children, selected, onClick, onRemove, icon, count, variant = 'filter', size = 'md', style }) {
  injectStyles('chip', CSS);
  const cls = ['br-chip', selected ? 'br-chip--selected' : '', variant === 'tag' ? 'br-chip--tag' : '', size === 'sm' ? 'br-chip--sm' : ''].join(' ');
  const inner = [
    icon ? <Icon key="i" name={icon} size={14} /> : null,
    <span key="l">{children}</span>,
    count != null ? <span key="c" className="br-chip__count">{count}</span> : null,
    onRemove ? <span key="x" role="button" aria-label="Remove" className="br-chip__x" onClick={e => { e.stopPropagation(); onRemove(e); }}><Icon name="x" size={13} strokeWidth={2.25} /></span> : null
  ];
  return onClick
    ? <button type="button" className={cls} aria-pressed={!!selected} onClick={onClick} style={style}>{inner}</button>
    : <span className={cls} style={style}>{inner}</span>;
}
