import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { injectStyles } from '../core/useStyles.js';

const CSS = [
'.br-side{width:var(--sidebar-w);flex-shrink:0;background:var(--surface-card);border-right:1px solid var(--border-default);color:var(--text-primary);display:flex;flex-direction:column;height:100%;min-height:0}',
'.br-side__brand{padding:20px 22px 16px;display:flex;flex-direction:column;align-items:flex-start;gap:6px;border-bottom:1px solid var(--border-subtle)}',
'.br-side__brand img{display:block;max-width:100%;height:auto}',
'.br-side__product{font-family:var(--font-display);font-weight:700;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--tan-700)}',
'.br-side__nav{flex:1;overflow-y:auto;padding:10px 12px 16px}',
'.br-side__section{font-family:var(--font-display);font-weight:700;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-400);padding:16px 12px 6px}',
'.br-side__item{display:flex;align-items:center;gap:12px;width:100%;height:40px;padding:0 12px;border:0;border-radius:var(--radius-sm);background:transparent;color:var(--ink-700);font-family:var(--font-display);font-weight:600;font-size:14px;text-align:left;cursor:pointer;transition:background var(--duration-fast) var(--ease-out),color var(--duration-fast) var(--ease-out)}',
'.br-side__item svg{color:var(--ink-500)}',
'.br-side__item:hover{background:var(--surface-hover);color:var(--teal-600)}',
'.br-side__item:hover svg{color:var(--teal-500)}',
'.br-side__item:focus-visible{outline:none;box-shadow:var(--focus-ring)}',
'.br-side__item--on,.br-side__item--on:hover{background:var(--teal-50);color:var(--teal-600);font-weight:700}',
'.br-side__item--on svg{color:var(--teal-500)}',
'.br-side__label{flex:1}',
'.br-side__badge{font-size:11px;font-weight:700;padding:3px 7px;border-radius:var(--radius-pill);background:var(--terracotta-500);color:#fff}',
'.br-side__foot{padding:14px 18px 16px;border-top:1px solid var(--border-subtle)}'
].join('');

export function SidebarNav({ sections, active, onSelect, logoSrc, logoAlt = 'Barkfield Road', productName, footer, style }) {
  injectStyles('sidebarnav', CSS);
  return (
    <aside className="br-side" style={style}>
      <div className="br-side__brand">
        {logoSrc ? <img src={logoSrc} alt={logoAlt} /> : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, letterSpacing: '.01em' }}>BARKFIELD ROAD</span>}
        {productName ? <span className="br-side__product">{productName}</span> : null}
      </div>
      <nav className="br-side__nav">
        {sections.map((s, si) => (
          <div key={si}>
            {s.title ? <div className="br-side__section">{s.title}</div> : null}
            {s.items.map(it => (
              <button key={it.id} type="button" className={'br-side__item' + (active === it.id ? ' br-side__item--on' : '')} aria-current={active === it.id ? 'page' : undefined} onClick={() => onSelect && onSelect(it.id)}>
                {it.icon ? <Icon name={it.icon} size={19} /> : null}
                <span className="br-side__label">{it.label}</span>
                {it.badge != null ? <span className="br-side__badge">{it.badge}</span> : null}
              </button>
            ))}
          </div>
        ))}
      </nav>
      {footer ? <div className="br-side__foot">{footer}</div> : null}
    </aside>
  );
}
