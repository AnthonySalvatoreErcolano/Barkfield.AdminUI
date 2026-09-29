import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { injectStyles } from '../core/useStyles.js';

const CSS = [
'.br-check{display:inline-flex;align-items:flex-start;gap:10px;cursor:pointer;font-family:var(--font-body);font-size:15px;color:var(--text-primary);line-height:1.35}',
'.br-check--disabled{opacity:.5;cursor:not-allowed}',
'.br-check input{position:absolute;opacity:0;width:0;height:0}',
'.br-check__box{flex-shrink:0;width:18px;height:18px;margin-top:1px;border:1.5px solid var(--border-strong);border-radius:var(--radius-xs);background:var(--surface-card);display:flex;align-items:center;justify-content:center;color:var(--text-on-brand);transition:all var(--duration-fast) var(--ease-out)}',
'.br-check:hover .br-check__box{border-color:var(--teal-400)}',
'.br-check input:focus-visible + .br-check__box{box-shadow:var(--focus-ring)}',
'.br-check--on .br-check__box{background:var(--action-primary);border-color:var(--action-primary)}',
'.br-check__desc{display:block;font-size:13px;color:var(--text-muted)}'
].join('');

export function Checkbox({ label, description, checked, indeterminate, onChange, disabled, style, ...rest }) {
  injectStyles('checkbox', CSS);
  const on = checked || indeterminate;
  return (
    <label className={['br-check', on ? 'br-check--on' : '', disabled ? 'br-check--disabled' : ''].join(' ')} style={style}>
      <input type="checkbox" checked={!!checked} disabled={disabled} onChange={e => onChange && onChange(e.target.checked, e)} {...rest} />
      <span className="br-check__box">{indeterminate ? <Icon name="minus" size={13} strokeWidth={3} /> : checked ? <Icon name="check" size={13} strokeWidth={3} /> : null}</span>
      {label || description ? <span>{label}{description ? <span className="br-check__desc">{description}</span> : null}</span> : null}
    </label>
  );
}
