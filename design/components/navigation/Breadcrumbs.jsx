import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { injectStyles } from '../core/useStyles.js';

const CSS = [
'.br-crumbs{display:flex;align-items:center;flex-wrap:wrap;gap:6px;font-family:var(--font-display);font-weight:600;font-size:13px;color:var(--text-muted)}',
'.br-crumbs a,.br-crumbs button{color:var(--text-secondary);text-decoration:none;background:none;border:0;padding:0;font:inherit;cursor:pointer}',
'.br-crumbs a:hover,.br-crumbs button:hover{color:var(--text-brand);text-decoration:underline;text-underline-offset:3px}',
'.br-crumbs__cur{color:var(--text-primary)}'
].join('');

export function Breadcrumbs({ items, style }) {
  injectStyles('breadcrumbs', CSS);
  return (
    <nav className="br-crumbs" aria-label="Breadcrumb" style={style}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {last ? <span className="br-crumbs__cur" aria-current="page">{it.label}</span>
              : it.href ? <a href={it.href}>{it.label}</a>
              : <button type="button" onClick={it.onClick}>{it.label}</button>}
            {!last ? <Icon name="chevron-right" size={14} /> : null}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
