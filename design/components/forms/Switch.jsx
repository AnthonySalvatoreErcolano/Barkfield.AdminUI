import React from 'react';
import { injectStyles } from '../core/useStyles.js';

const CSS = [
'.br-switch{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-family:var(--font-body);font-size:15px;color:var(--text-primary)}',
'.br-switch--disabled{opacity:.5;cursor:not-allowed}',
'.br-switch input{position:absolute;opacity:0;width:0;height:0}',
'.br-switch__track{position:relative;width:36px;height:20px;border-radius:var(--radius-pill);background:var(--ink-300);transition:background var(--duration-base) var(--ease-out);flex-shrink:0}',
'.br-switch__thumb{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--white);box-shadow:var(--shadow-sm);transition:transform var(--duration-base) var(--ease-out)}',
'.br-switch--on .br-switch__track{background:var(--action-primary)}',
'.br-switch--on .br-switch__thumb{transform:translateX(16px);background:var(--cream-100)}',
'.br-switch input:focus-visible + .br-switch__track{box-shadow:var(--focus-ring)}'
].join('');

export function Switch({ label, checked, onChange, disabled, style, ...rest }) {
  injectStyles('switch', CSS);
  return (
    <label className={['br-switch', checked ? 'br-switch--on' : '', disabled ? 'br-switch--disabled' : ''].join(' ')} style={style}>
      <input type="checkbox" role="switch" checked={!!checked} disabled={disabled} onChange={e => onChange && onChange(e.target.checked, e)} {...rest} />
      <span className="br-switch__track"><span className="br-switch__thumb"></span></span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
