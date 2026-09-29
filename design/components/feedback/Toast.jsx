import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { injectStyles } from '../core/useStyles.js';

const ICON = { info: 'info', success: 'circle-check', warning: 'triangle-alert', danger: 'circle-x' };
const COLOR = { info: 'var(--teal-300)', success: '#7FC39A', warning: 'var(--amber-500)', danger: 'var(--terracotta-300)' };
const CSS = [
'.br-toast{display:flex;align-items:flex-start;gap:12px;width:360px;max-width:calc(100vw - 32px);padding:14px 14px 14px 16px;border-radius:var(--radius-md);background:var(--ink-900);color:var(--cream-100);box-shadow:var(--shadow-lg);font-family:var(--font-body);font-size:14px;line-height:1.4;animation:br-toast-in var(--duration-slow) var(--ease-out)}',
'@keyframes br-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
'.br-toast__body{flex:1;min-width:0}',
'.br-toast__title{font-family:var(--font-display);font-weight:700;font-size:14px;letter-spacing:.01em;color:var(--cream-300);padding-top:2px}',
'.br-toast__msg{color:var(--ink-300);margin-top:2px}',
'.br-toast__action{border:0;background:transparent;font-family:var(--font-display);font-weight:700;font-size:12px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--cream-300);cursor:pointer;padding:4px 6px;border-radius:var(--radius-xs);align-self:center}',
'.br-toast__action:hover{background:rgba(242,218,178,.12)}',
'.br-toast__x{border:0;background:transparent;color:var(--ink-400);cursor:pointer;padding:2px}',
'.br-toast__x:hover{color:var(--cream-100)}',
'.br-toast-stack{position:fixed;right:24px;bottom:24px;display:flex;flex-direction:column;gap:10px;z-index:var(--z-toast)}'
].join('');

export function Toast({ tone = 'success', title, message, actionLabel, onAction, onClose, style }) {
  injectStyles('toast', CSS);
  return (
    <div role="status" className="br-toast" style={style}>
      <Icon name={ICON[tone]} size={18} color={COLOR[tone]} style={{ marginTop: 1 }} />
      <div className="br-toast__body">{title ? <div className="br-toast__title">{title}</div> : null}{message ? <div className="br-toast__msg">{message}</div> : null}</div>
      {actionLabel ? <button className="br-toast__action" onClick={onAction}>{actionLabel}</button> : null}
      {onClose ? <button className="br-toast__x" aria-label="Dismiss" onClick={onClose}><Icon name="x" size={16} /></button> : null}
    </div>
  );
}
