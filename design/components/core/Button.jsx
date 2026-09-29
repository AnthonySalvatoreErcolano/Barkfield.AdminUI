import React from 'react';
import { Icon } from './Icon.jsx';
import { injectStyles } from './useStyles.js';

const CSS = [
'.br-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid transparent;border-radius:var(--radius-sm);font-family:var(--font-display);font-weight:700;text-transform:uppercase;letter-spacing:var(--tracking-label);cursor:pointer;white-space:nowrap;transition:background var(--duration-fast) var(--ease-out),border-color var(--duration-fast) var(--ease-out),color var(--duration-fast) var(--ease-out),transform var(--duration-fast) var(--ease-out);text-decoration:none;line-height:1}',
'.br-btn:focus-visible{outline:none;box-shadow:var(--focus-ring)}',
'.br-btn:active:not(:disabled){transform:translateY(1px)}',
'.br-btn:disabled{cursor:not-allowed;opacity:.45}',
'.br-btn--sm{height:var(--control-h-sm);padding:0 12px;font-size:11.5px}',
'.br-btn--md{height:var(--control-h-md);padding:0 16px;font-size:12.5px}',
'.br-btn--lg{height:var(--control-h-lg);padding:0 22px;font-size:14px}',
'.br-btn--full{width:100%}',
'.br-btn--primary{background:var(--action-primary);color:var(--text-on-brand)}',
'.br-btn--primary:hover:not(:disabled){background:var(--action-primary-hover)}',
'.br-btn--primary:active:not(:disabled){background:var(--action-primary-press)}',
'.br-btn--accent{background:var(--action-accent);color:var(--white)}',
'.br-btn--accent:hover:not(:disabled){background:var(--action-accent-hover)}',
'.br-btn--accent:active:not(:disabled){background:var(--action-accent-press)}',
'.br-btn--secondary{background:var(--surface-card);color:var(--text-brand);border-color:var(--border-strong)}',
'.br-btn--secondary:hover:not(:disabled){background:var(--surface-hover);border-color:var(--teal-300)}',
'.br-btn--ghost{background:transparent;color:var(--text-brand)}',
'.br-btn--ghost:hover:not(:disabled){background:var(--teal-50)}',
'.br-btn--danger{background:var(--surface-card);color:var(--status-danger-fg);border-color:var(--terracotta-200)}',
'.br-btn--danger:hover:not(:disabled){background:var(--status-danger-bg);border-color:var(--terracotta-400)}',
'.br-btn--cream{background:var(--cream-300);color:var(--teal-700)}',
'.br-btn--cream:hover:not(:disabled){background:var(--cream-400)}'
].join('');

export function Button({ variant = 'primary', size = 'md', iconLeft, iconRight, fullWidth, disabled, type = 'button', children, className, ...rest }) {
  injectStyles('button', CSS);
  const iconSize = size === 'lg' ? 18 : size === 'sm' ? 14 : 16;
  const cls = ['br-btn', 'br-btn--' + variant, 'br-btn--' + size, fullWidth ? 'br-btn--full' : '', className || ''].join(' ');
  return (
    <button type={type} className={cls} disabled={disabled} {...rest}>
      {iconLeft ? <Icon name={iconLeft} size={iconSize} strokeWidth={2} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={iconSize} strokeWidth={2} /> : null}
    </button>
  );
}
