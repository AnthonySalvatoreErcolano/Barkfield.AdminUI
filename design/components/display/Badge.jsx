import React from 'react';
import { injectStyles } from '../core/useStyles.js';

const CSS = [
'.br-badge{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 9px;border-radius:var(--radius-pill);font-family:var(--font-display);font-weight:700;font-size:11px;letter-spacing:var(--tracking-label);text-transform:uppercase;white-space:nowrap;line-height:1;padding-top:1px}',
'.br-badge__dot{width:6px;height:6px;border-radius:50%;background:currentColor;margin-top:-1px}',
'.br-badge--success{background:var(--status-success-bg);color:var(--status-success-fg)}',
'.br-badge--warning{background:var(--status-warning-bg);color:var(--status-warning-fg)}',
'.br-badge--danger{background:var(--status-danger-bg);color:var(--status-danger-fg)}',
'.br-badge--info{background:var(--status-info-bg);color:var(--status-info-fg)}',
'.br-badge--neutral{background:var(--status-neutral-bg);color:var(--status-neutral-fg)}',
'.br-badge--brand{background:var(--cream-300);color:var(--teal-700)}',
'.br-badge--solid.br-badge--success{background:var(--status-success-solid);color:#fff}',
'.br-badge--solid.br-badge--warning{background:var(--status-warning-solid);color:#fff}',
'.br-badge--solid.br-badge--danger{background:var(--status-danger-solid);color:#fff}',
'.br-badge--solid.br-badge--info{background:var(--status-info-solid);color:var(--cream-300)}',
'.br-badge--solid.br-badge--neutral{background:var(--ink-600);color:#fff}',
'.br-badge--solid.br-badge--brand{background:var(--teal-500);color:var(--cream-300)}'
].join('');

export function Badge({ tone = 'neutral', variant = 'soft', dot, children, style }) {
  injectStyles('badge', CSS);
  return (
    <span className={['br-badge', 'br-badge--' + tone, variant === 'solid' ? 'br-badge--solid' : ''].join(' ')} style={style}>
      {dot ? <span className="br-badge__dot"></span> : null}{children}
    </span>
  );
}
