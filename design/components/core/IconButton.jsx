import React from 'react';
import { Icon } from './Icon.jsx';
import { injectStyles } from './useStyles.js';

const CSS = [
'.br-ibtn{display:inline-flex;align-items:center;justify-content:center;border:1px solid transparent;border-radius:var(--radius-sm);cursor:pointer;padding:0;transition:background var(--duration-fast) var(--ease-out),color var(--duration-fast) var(--ease-out);color:var(--text-secondary);background:transparent}',
'.br-ibtn:focus-visible{outline:none;box-shadow:var(--focus-ring)}',
'.br-ibtn:disabled{opacity:.4;cursor:not-allowed}',
'.br-ibtn--ghost:hover:not(:disabled){background:var(--surface-hover);color:var(--text-brand)}',
'.br-ibtn--secondary{background:var(--surface-card);border-color:var(--border-default);color:var(--text-brand)}',
'.br-ibtn--secondary:hover:not(:disabled){border-color:var(--teal-300);background:var(--surface-hover)}',
'.br-ibtn--primary{background:var(--action-primary);color:var(--text-on-brand)}',
'.br-ibtn--primary:hover:not(:disabled){background:var(--action-primary-hover)}',
'.br-ibtn--on-brand{color:var(--text-on-brand)}',
'.br-ibtn--on-brand:hover:not(:disabled){background:rgba(242,218,178,.14)}',
'.br-ibtn--sm{width:28px;height:28px}.br-ibtn--md{width:36px;height:36px}.br-ibtn--lg{width:44px;height:44px}'
].join('');

export function IconButton({ icon, label, variant = 'ghost', size = 'md', className, ...rest }) {
  injectStyles('iconbutton', CSS);
  const s = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  return (
    <button type="button" aria-label={label} title={label} className={['br-ibtn', 'br-ibtn--' + variant, 'br-ibtn--' + size, className || ''].join(' ')} {...rest}>
      <Icon name={icon} size={s} />
    </button>
  );
}
