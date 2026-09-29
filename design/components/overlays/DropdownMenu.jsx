import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { injectStyles } from '../core/useStyles.js';

const CSS = [
'.br-dd{position:relative;display:inline-flex}',
'.br-dd__menu{position:absolute;top:calc(100% + 6px);min-width:200px;background:var(--surface-raised);border:1px solid var(--border-default);border-radius:var(--radius-md);box-shadow:var(--shadow-md);padding:6px;z-index:var(--z-dropdown);animation:br-dd-in var(--duration-fast) var(--ease-out)}',
'@keyframes br-dd-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}',
'.br-dd__menu--right{right:0}.br-dd__menu--left{left:0}',
'.br-dd__label{font-family:var(--font-display);font-weight:700;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-400);padding:8px 10px 4px}',
'.br-dd__item{display:flex;align-items:center;gap:10px;width:100%;min-height:34px;padding:0 10px;border:0;border-radius:var(--radius-sm);background:transparent;font-family:var(--font-body);font-size:14.5px;color:var(--text-primary);text-align:left;cursor:pointer;white-space:nowrap}',
'.br-dd__item svg{color:var(--ink-500)}',
'.br-dd__item:hover,.br-dd__item:focus-visible{outline:0;background:var(--surface-hover);color:var(--teal-600)}',
'.br-dd__item:hover svg{color:var(--teal-500)}',
'.br-dd__item--danger,.br-dd__item--danger svg{color:var(--status-danger-fg)}',
'.br-dd__item--danger:hover{background:var(--status-danger-bg);color:var(--status-danger-fg)}',
'.br-dd__item--danger:hover svg{color:var(--status-danger-fg)}',
'.br-dd__item:disabled{opacity:.45;cursor:not-allowed;background:transparent}',
'.br-dd__item--on{color:var(--teal-600);font-weight:600}',
'.br-dd__check{margin-left:auto;color:var(--teal-500)}',
'.br-dd__sep{height:1px;background:var(--border-subtle);margin:6px -6px}',
'.br-dd__short{margin-left:auto;font-size:12.5px;color:var(--text-muted)}'
].join('');

export function DropdownMenu({ trigger, items, align = 'left', defaultOpen = false, onSelect, style }) {
  injectStyles('dropdown', CSS);
  const [open, setOpen] = React.useState(defaultOpen);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const off = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <span className="br-dd" ref={ref} style={style}>
      <span onClick={() => setOpen(!open)} style={{ display: 'inline-flex' }}>{trigger}</span>
      {open ? (
        <div role="menu" className={'br-dd__menu br-dd__menu--' + align}>
          {items.map((it, i) => it.divider ? <div key={i} className="br-dd__sep"></div>
            : it.heading ? <div key={i} className="br-dd__label">{it.heading}</div>
            : (
              <button key={i} role="menuitem" type="button" disabled={it.disabled}
                className={'br-dd__item' + (it.danger ? ' br-dd__item--danger' : '') + (it.selected ? ' br-dd__item--on' : '')}
                onClick={() => { setOpen(false); if (it.onSelect) it.onSelect(); if (onSelect) onSelect(it); }}>
                {it.icon ? <Icon name={it.icon} size={16} /> : null}
                <span>{it.label}</span>
                {it.selected ? <Icon name="check" size={16} strokeWidth={2.25} className="br-dd__check" /> : it.shortcut ? <span className="br-dd__short">{it.shortcut}</span> : null}
              </button>
            ))}
        </div>
      ) : null}
    </span>
  );
}
