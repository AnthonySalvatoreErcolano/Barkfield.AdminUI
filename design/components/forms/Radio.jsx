import React from 'react';
import { injectStyles } from '../core/useStyles.js';

const CSS = [
'.br-radio{display:inline-flex;align-items:flex-start;gap:10px;cursor:pointer;font-family:var(--font-body);font-size:15px;color:var(--text-primary);line-height:1.35}',
'.br-radio--disabled{opacity:.5;cursor:not-allowed}',
'.br-radio input{position:absolute;opacity:0;width:0;height:0}',
'.br-radio__dot{flex-shrink:0;width:18px;height:18px;margin-top:1px;border:1.5px solid var(--border-strong);border-radius:50%;background:var(--surface-card);display:flex;align-items:center;justify-content:center;transition:all var(--duration-fast) var(--ease-out)}',
'.br-radio:hover .br-radio__dot{border-color:var(--teal-400)}',
'.br-radio input:focus-visible + .br-radio__dot{box-shadow:var(--focus-ring)}',
'.br-radio--on .br-radio__dot{border-color:var(--action-primary);border-width:5.5px}',
'.br-radio__desc{display:block;font-size:13px;color:var(--text-muted)}'
].join('');

export function Radio({ label, description, checked, onChange, disabled, name, value, style, ...rest }) {
  injectStyles('radio', CSS);
  return (
    <label className={['br-radio', checked ? 'br-radio--on' : '', disabled ? 'br-radio--disabled' : ''].join(' ')} style={style}>
      <input type="radio" name={name} value={value} checked={!!checked} disabled={disabled} onChange={e => onChange && onChange(value, e)} {...rest} />
      <span className="br-radio__dot"></span>
      {label || description ? <span>{label}{description ? <span className="br-radio__desc">{description}</span> : null}</span> : null}
    </label>
  );
}
