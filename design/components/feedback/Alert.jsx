import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { injectStyles } from '../core/useStyles.js';

const ICON = { info: 'info', success: 'circle-check', warning: 'triangle-alert', danger: 'circle-x' };
const CSS = [
'.br-alert{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:var(--radius-md);border:1px solid;font-family:var(--font-body);font-size:14.5px;line-height:1.45}',
'.br-alert--info{background:var(--status-info-bg);border-color:var(--teal-100);color:var(--status-info-fg)}',
'.br-alert--success{background:var(--status-success-bg);border-color:var(--green-100);color:var(--status-success-fg)}',
'.br-alert--warning{background:var(--status-warning-bg);border-color:var(--amber-100);color:var(--status-warning-fg)}',
'.br-alert--danger{background:var(--status-danger-bg);border-color:var(--terracotta-100);color:var(--status-danger-fg)}',
'.br-alert__body{flex:1;min-width:0;color:var(--text-primary)}',
'.br-alert__title{font-family:var(--font-display);font-weight:700;font-size:14px;letter-spacing:.01em;margin-bottom:2px;padding-top:2px}',
'.br-alert__x{border:0;background:transparent;color:inherit;cursor:pointer;padding:2px;border-radius:var(--radius-xs);opacity:.7}',
'.br-alert__x:hover{opacity:1}',
'.br-alert__action{flex-shrink:0;align-self:center}'
].join('');

export function Alert({ tone = 'info', title, children, action, onClose, style }) {
  injectStyles('alert', CSS);
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={'br-alert br-alert--' + tone} style={style}>
      <Icon name={ICON[tone]} size={18} style={{ marginTop: 1 }} />
      <div className="br-alert__body">{title ? <div className="br-alert__title" style={{ color: 'inherit' }}>{title}</div> : null}<div>{children}</div></div>
      {action ? <div className="br-alert__action">{action}</div> : null}
      {onClose ? <button className="br-alert__x" aria-label="Dismiss" onClick={onClose}><Icon name="x" size={16} /></button> : null}
    </div>
  );
}
