import React from 'react';
import { injectStyles } from '../core/useStyles.js';

const CSS = [
'.br-card{background:var(--surface-card);border:1px solid var(--border-default);border-radius:var(--radius-md);box-shadow:var(--shadow-xs);display:flex;flex-direction:column;min-width:0}',
'.br-card--cream{background:var(--cream-100);border-color:var(--cream-400)}',
'.br-card--brand{background:var(--teal-500);border-color:var(--teal-500);color:var(--cream-300)}',
'.br-card__head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:18px 20px 0}',
'.br-card__eyebrow{font-family:var(--font-display);font-weight:700;font-size:11px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--tan-700);margin-bottom:4px}',
'.br-card--brand .br-card__eyebrow{color:var(--tan-300)}',
'.br-card__title{font-family:var(--font-display);font-weight:800;font-size:16px;letter-spacing:.02em;text-transform:uppercase;color:var(--text-primary);line-height:1.2}',
'.br-card--brand .br-card__title{color:var(--cream-300)}',
'.br-card__actions{display:flex;align-items:center;gap:8px;flex-shrink:0}',
'.br-card__body{padding:16px 20px 20px;flex:1;min-width:0}',
'.br-card__body--flush{padding:12px 0 0}',
'.br-card__foot{padding:12px 20px;border-top:1px solid var(--border-subtle);display:flex;align-items:center;gap:8px;justify-content:flex-end}'
].join('');

export function Card({ title, eyebrow, actions, footer, children, tone = 'default', flush, style }) {
  injectStyles('card', CSS);
  const hasHead = title || eyebrow || actions;
  return (
    <section className={'br-card' + (tone !== 'default' ? ' br-card--' + tone : '')} style={style}>
      {hasHead ? (
        <header className="br-card__head">
          <div>{eyebrow ? <div className="br-card__eyebrow">{eyebrow}</div> : null}{title ? <h3 className="br-card__title">{title}</h3> : null}</div>
          {actions ? <div className="br-card__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className={'br-card__body' + (flush ? ' br-card__body--flush' : '')} style={hasHead ? null : { paddingTop: 20 }}>{children}</div>
      {footer ? <footer className="br-card__foot">{footer}</footer> : null}
    </section>
  );
}
