import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { injectStyles } from '../core/useStyles.js';

const CSS = ['.br-field{display:flex;flex-direction:column;gap:6px;min-width:0}',
'.br-field__label{font-family:var(--font-display);font-weight:700;font-size:12px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-secondary)}',
'.br-field__hint{font-family:var(--font-body);font-size:13px;color:var(--text-muted)}',
'.br-field__hint--error{color:var(--status-danger-fg)}',
'.br-input{display:flex;align-items:center;gap:8px;background:var(--surface-card);border:1px solid var(--border-strong);border-radius:var(--radius-sm);padding:0 12px;color:var(--text-muted);transition:border-color var(--duration-fast) var(--ease-out),box-shadow var(--duration-fast) var(--ease-out)}',
'.br-input:hover{border-color:var(--tan-500)}',
'.br-input:focus-within{border-color:var(--border-focus);box-shadow:var(--focus-ring);color:var(--text-brand)}',
'.br-input--error{border-color:var(--terracotta-500)}',
'.br-input--disabled{background:var(--surface-sunken);opacity:.6}',
'.br-input--sm{height:var(--control-h-sm)}.br-input--md{height:var(--control-h-md)}.br-input--lg{height:var(--control-h-lg)}',
'.br-input input{flex:1;min-width:0;border:0;outline:0;background:transparent;font-family:var(--font-body);font-size:15px;color:var(--text-primary);height:100%;padding:0}',
'.br-input input::placeholder{color:var(--text-disabled)}',
'.br-input__suffix{font-family:var(--font-body);font-size:14px;color:var(--text-muted)}'
].join('');

export function Input({ label, hint, error, iconLeft, suffix, size = 'md', disabled, id, style, ...rest }) {
  injectStyles('input', CSS);
  const inputId = id || (label ? 'in-' + String(label).replace(/\s+/g, '-').toLowerCase() : undefined);
  const box = ['br-input', 'br-input--' + size, error ? 'br-input--error' : '', disabled ? 'br-input--disabled' : ''].join(' ');
  return (
    <div className="br-field" style={style}>
      {label ? <label className="br-field__label" htmlFor={inputId}>{label}</label> : null}
      <div className={box}>
        {iconLeft ? <Icon name={iconLeft} size={16} /> : null}
        <input id={inputId} disabled={disabled} aria-invalid={!!error} {...rest} />
        {suffix ? <span className="br-input__suffix">{suffix}</span> : null}
      </div>
      {error ? <span className="br-field__hint br-field__hint--error">{error}</span> : hint ? <span className="br-field__hint">{hint}</span> : null}
    </div>
  );
}
