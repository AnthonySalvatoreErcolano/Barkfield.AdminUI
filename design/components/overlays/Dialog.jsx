import React from 'react';
import { IconButton } from '../core/IconButton.jsx';
import { injectStyles } from '../core/useStyles.js';

const CSS = [
'.br-dlg-scrim{position:fixed;inset:0;background:var(--surface-overlay);display:flex;align-items:center;justify-content:center;padding:24px;z-index:var(--z-overlay);animation:br-fade var(--duration-base) var(--ease-out)}',
'.br-dlg-scrim--inline{position:relative;inset:auto;min-height:100%;animation:none}',
'@keyframes br-fade{from{opacity:0}to{opacity:1}}',
'@keyframes br-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}',
'.br-dlg{width:100%;background:var(--surface-card);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);display:flex;flex-direction:column;max-height:calc(100vh - 48px);animation:br-rise var(--duration-slow) var(--ease-out);overflow:hidden}',
'.br-dlg--sm{max-width:420px}.br-dlg--md{max-width:540px}.br-dlg--lg{max-width:720px}',
'.br-dlg__head{display:flex;align-items:flex-start;gap:12px;padding:22px 24px 6px}',
'.br-dlg__title{flex:1;font-family:var(--font-display);font-weight:900;font-size:21px;letter-spacing:var(--tracking-display);text-transform:uppercase;color:var(--teal-500);line-height:1.15;padding-top:4px}',
'.br-dlg__desc{padding:0 24px;font-family:var(--font-body);font-size:15px;color:var(--text-secondary);line-height:1.5}',
'.br-dlg__body{padding:16px 24px 20px;overflow-y:auto}',
'.br-dlg__foot{display:flex;justify-content:flex-end;gap:10px;padding:14px 24px;background:var(--surface-sunken);border-top:1px solid var(--border-subtle)}'
].join('');

export function Dialog({ open, title, description, children, footer, onClose, size = 'md', inline }) {
  injectStyles('dialog', CSS);
  if (!open) return null;
  return (
    <div className={'br-dlg-scrim' + (inline ? ' br-dlg-scrim--inline' : '')} onMouseDown={e => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} className={'br-dlg br-dlg--' + size}>
        <div className="br-dlg__head"><h2 className="br-dlg__title">{title}</h2>{onClose ? <IconButton icon="x" label="Close" size="sm" onClick={onClose} /> : null}</div>
        {description ? <p className="br-dlg__desc" style={{ margin: 0 }}>{description}</p> : null}
        {children ? <div className="br-dlg__body">{children}</div> : <div style={{ height: 20 }}></div>}
        {footer ? <div className="br-dlg__foot">{footer}</div> : null}
      </div>
    </div>
  );
}
