import React from 'react';
import { injectStyles } from '../core/useStyles.js';

const CSS = [
'.br-field{display:flex;flex-direction:column;gap:6px;min-width:0}',
'.br-field__label{font-family:var(--font-display);font-weight:700;font-size:12px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-secondary)}',
'.br-field__hint{font-family:var(--font-body);font-size:13px;color:var(--text-muted)}',
'.br-field__hint--error{color:var(--status-danger-fg)}',
'.br-textarea{width:100%;min-height:96px;resize:vertical;background:var(--surface-card);border:1px solid var(--border-strong);border-radius:var(--radius-sm);padding:10px 12px;font-family:var(--font-body);font-size:15px;line-height:1.5;color:var(--text-primary);transition:border-color var(--duration-fast) var(--ease-out),box-shadow var(--duration-fast) var(--ease-out)}',
'.br-textarea::placeholder{color:var(--text-disabled)}',
'.br-textarea:hover{border-color:var(--tan-500)}',
'.br-textarea:focus{outline:0;border-color:var(--border-focus);box-shadow:var(--focus-ring)}',
'.br-textarea--error{border-color:var(--terracotta-500)}',
'.br-textarea:disabled{background:var(--surface-sunken);opacity:.6}'
].join('');

export function Textarea({ label, hint, error, id, rows = 4, style, ...rest }) {
  injectStyles('textarea', CSS);
  const taId = id || (label ? 'ta-' + String(label).replace(/\s+/g, '-').toLowerCase() : undefined);
  return (
    <div className="br-field" style={style}>
      {label ? <label className="br-field__label" htmlFor={taId}>{label}</label> : null}
      <textarea id={taId} rows={rows} className={'br-textarea' + (error ? ' br-textarea--error' : '')} aria-invalid={!!error} {...rest}></textarea>
      {error ? <span className="br-field__hint br-field__hint--error">{error}</span> : hint ? <span className="br-field__hint">{hint}</span> : null}
    </div>
  );
}
