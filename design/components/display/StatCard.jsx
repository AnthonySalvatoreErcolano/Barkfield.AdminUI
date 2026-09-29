import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { injectStyles } from '../core/useStyles.js';

const CSS = [
'.br-stat{background:var(--surface-card);border:1px solid var(--border-default);border-radius:var(--radius-md);box-shadow:var(--shadow-xs);padding:18px 20px;display:flex;flex-direction:column;gap:10px;min-width:0}',
'.br-stat__top{display:flex;align-items:center;justify-content:space-between;gap:8px}',
'.br-stat__label{font-family:var(--font-display);font-weight:700;font-size:11.5px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-secondary)}',
'.br-stat__icon{width:32px;height:32px;border-radius:50%;background:var(--cream-200);color:var(--teal-600);display:flex;align-items:center;justify-content:center}',
'.br-stat__value{font-family:var(--font-display);font-weight:900;font-size:32px;line-height:1;letter-spacing:var(--tracking-display);color:var(--teal-500);font-variant-numeric:tabular-nums}',
'.br-stat__foot{display:flex;align-items:center;gap:8px;font-family:var(--font-body);font-size:13.5px;color:var(--text-muted)}',
'.br-stat__delta{display:inline-flex;align-items:center;gap:3px;font-family:var(--font-display);font-weight:700;font-size:12.5px}',
'.br-stat__delta--up{color:var(--status-success-fg)}.br-stat__delta--down{color:var(--status-danger-fg)}'
].join('');

export function StatCard({ label, value, delta, trend, caption, icon, style }) {
  injectStyles('statcard', CSS);
  return (
    <div className="br-stat" style={style}>
      <div className="br-stat__top"><span className="br-stat__label">{label}</span>{icon ? <span className="br-stat__icon"><Icon name={icon} size={16} /></span> : null}</div>
      <div className="br-stat__value">{value}</div>
      {delta || caption ? (
        <div className="br-stat__foot">
          {delta ? <span className={'br-stat__delta br-stat__delta--' + (trend || 'up')}><Icon name={trend === 'down' ? 'trending-down' : 'trending-up'} size={14} strokeWidth={2} />{delta}</span> : null}
          {caption ? <span>{caption}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
