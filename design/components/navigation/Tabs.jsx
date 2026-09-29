import React from 'react';
import { injectStyles } from '../core/useStyles.js';

const CSS = [
'.br-tabs{display:flex;align-items:flex-end;gap:24px;border-bottom:1px solid var(--border-default)}',
'.br-tab{position:relative;display:inline-flex;align-items:center;gap:8px;height:42px;border:0;background:transparent;padding:0;font-family:var(--font-display);font-weight:700;font-size:13px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-muted);cursor:pointer;transition:color var(--duration-fast) var(--ease-out);padding-top:2px}',
'.br-tab:hover{color:var(--text-brand)}',
'.br-tab:focus-visible{outline:none;box-shadow:var(--focus-ring);border-radius:var(--radius-xs)}',
'.br-tab--on{color:var(--teal-500)}',
'.br-tab--on::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:3px;background:var(--teal-500);border-radius:2px 2px 0 0}',
'.br-tab__count{font-size:11px;padding:3px 6px 2px;border-radius:var(--radius-pill);background:var(--ink-100);color:var(--text-secondary);letter-spacing:0}',
'.br-tab--on .br-tab__count{background:var(--teal-50);color:var(--teal-600)}',
'.br-tabs--pill{border:0;gap:4px;background:var(--surface-sunken);padding:4px;border-radius:var(--radius-md);display:inline-flex;align-items:center}',
'.br-tabs--pill .br-tab{height:30px;padding:2px 12px 0;border-radius:var(--radius-sm);font-size:12px}',
'.br-tabs--pill .br-tab--on{background:var(--surface-card);box-shadow:var(--shadow-sm)}',
'.br-tabs--pill .br-tab--on::after{display:none}'
].join('');

export function Tabs({ tabs, value, onChange, variant = 'line', style }) {
  injectStyles('tabs', CSS);
  return (
    <div role="tablist" className={'br-tabs' + (variant === 'pill' ? ' br-tabs--pill' : '')} style={style}>
      {tabs.map(t => (
        <button key={t.id} role="tab" type="button" aria-selected={value === t.id} className={'br-tab' + (value === t.id ? ' br-tab--on' : '')} onClick={() => onChange && onChange(t.id)}>
          {t.label}{t.count != null ? <span className="br-tab__count">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
