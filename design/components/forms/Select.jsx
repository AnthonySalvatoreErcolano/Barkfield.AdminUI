import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { injectStyles } from '../core/useStyles.js';

const CSS = ['.br-field{display:flex;flex-direction:column;gap:6px;min-width:0}',
'.br-field__label{font-family:var(--font-display);font-weight:700;font-size:12px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-secondary)}',
'.br-field__hint{font-family:var(--font-body);font-size:13px;color:var(--text-muted)}',
'.br-field__hint--error{color:var(--status-danger-fg)}',
'.br-select{position:relative;display:flex;align-items:center}',
'.br-select select{appearance:none;-webkit-appearance:none;width:100%;background:var(--surface-card);border:1px solid var(--border-strong);border-radius:var(--radius-sm);padding:0 36px 0 12px;font-family:var(--font-body);font-size:15px;color:var(--text-primary);cursor:pointer;transition:border-color var(--duration-fast) var(--ease-out)}',
'.br-select select:hover{border-color:var(--tan-500)}',
'.br-select select:focus{outline:0;border-color:var(--border-focus);box-shadow:var(--focus-ring)}',
'.br-select select:disabled{background:var(--surface-sunken);opacity:.6;cursor:not-allowed}',
'.br-select--sm select{height:var(--control-h-sm);font-size:14px}.br-select--md select{height:var(--control-h-md)}.br-select--lg select{height:var(--control-h-lg)}',
'.br-select__chev{position:absolute;right:10px;pointer-events:none;color:var(--text-brand)}'
].join('');

export function Select({ label, hint, options = [], size = 'md', id, style, ...rest }) {
  injectStyles('select', CSS);
  const selId = id || (label ? 'sel-' + String(label).replace(/\s+/g, '-').toLowerCase() : undefined);
  return (
    <div className="br-field" style={style}>
      {label ? <label className="br-field__label" htmlFor={selId}>{label}</label> : null}
      <div className={'br-select br-select--' + size}>
        <select id={selId} {...rest}>
          {options.map(o => typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
        </select>
        <Icon name="chevron-down" size={16} className="br-select__chev" />
      </div>
      {hint ? <span className="br-field__hint">{hint}</span> : null}
    </div>
  );
}
