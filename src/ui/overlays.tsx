// Dialog, DropdownMenu — ported from design/components/overlays.
// Changes from the source Dialog: Escape closes it, focus moves into it on open and is trapped there,
// and focus returns to whatever opened it on close. Destructive confirmations (cancel a subscription,
// archive a customer) run through this, so keyboard handling is not optional.
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Icon, IconButton, type IconName } from './core';
import { cx, injectStyles } from './injectStyles';

const DIALOG_CSS = [
'.br-dlg-scrim{position:fixed;inset:0;background:var(--surface-overlay);display:flex;align-items:center;justify-content:center;padding:24px;z-index:var(--z-overlay);animation:br-fade var(--duration-base) var(--ease-out)}',
'@keyframes br-fade{from{opacity:0}to{opacity:1}}',
'@keyframes br-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}',
'.br-dlg{width:100%;background:var(--surface-card);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);display:flex;flex-direction:column;max-height:calc(100vh - 48px);animation:br-rise var(--duration-slow) var(--ease-out);overflow:hidden}',
'.br-dlg:focus{outline:none}',
'.br-dlg--sm{max-width:420px}.br-dlg--md{max-width:540px}.br-dlg--lg{max-width:720px}',
'.br-dlg__head{display:flex;align-items:flex-start;gap:12px;padding:22px 24px 6px}',
'.br-dlg__title{flex:1;font-family:var(--font-display);font-weight:900;font-size:21px;letter-spacing:var(--tracking-display);text-transform:uppercase;color:var(--teal-500);line-height:1.15;padding-top:4px}',
'.br-dlg__desc{padding:0 24px;font-family:var(--font-body);font-size:15px;color:var(--text-secondary);line-height:1.5}',
'.br-dlg__body{padding:16px 24px 20px;overflow-y:auto}',
'.br-dlg__foot{display:flex;justify-content:flex-end;gap:10px;padding:14px 24px;background:var(--surface-sunken);border-top:1px solid var(--border-subtle)}',
].join('');

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface DialogProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Omit to make the dialog undismissable (no ×, no Escape, no scrim click) — e.g. while saving. */
  onClose?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function Dialog({ open, title, description, children, footer, onClose, size = 'md' }: DialogProps) {
  injectStyles('dialog', DIALOG_CSS);
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const box = ref.current!;
    // Focus the first field if there is one, otherwise the dialog itself (not the × button).
    const first = box.querySelector<HTMLElement>('.br-dlg__body ' + FOCUSABLE);
    (first ?? box).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeRef.current) {
        e.stopPropagation();
        closeRef.current();
      } else if (e.key === 'Tab') {
        const items = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (items.length === 0) { e.preventDefault(); return; }
        const firstItem = items[0]!;
        const lastItem = items[items.length - 1]!;
        if (e.shiftKey && (document.activeElement === firstItem || document.activeElement === box)) { e.preventDefault(); lastItem.focus(); }
        else if (!e.shiftKey && document.activeElement === lastItem) { e.preventDefault(); firstItem.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="br-dlg-scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descId : undefined}
        tabIndex={-1} className={'br-dlg br-dlg--' + size}>
        <div className="br-dlg__head"><h2 id={titleId} className="br-dlg__title">{title}</h2>{onClose ? <IconButton icon="x" label="Close" size="sm" onClick={onClose} /> : null}</div>
        {description ? <p id={descId} className="br-dlg__desc" style={{ margin: 0 }}>{description}</p> : null}
        {children ? <div className="br-dlg__body">{children}</div> : <div style={{ height: 20 }} />}
        {footer ? <div className="br-dlg__foot">{footer}</div> : null}
      </div>
    </div>
  );
}

const DROPDOWN_CSS = [
'.br-dd{position:relative;display:inline-flex}',
'.br-dd__trigger{display:inline-flex;border:0;background:none;padding:0;cursor:pointer;border-radius:var(--radius-sm);font:inherit;color:inherit;text-align:left}',
'.br-dd--block{display:flex}.br-dd--block .br-dd__trigger{width:100%}',
'.br-dd__trigger:focus-visible{outline:none;box-shadow:var(--focus-ring)}',
'.br-dd__menu{position:absolute;top:calc(100% + 6px);min-width:200px;background:var(--surface-raised);border:1px solid var(--border-default);border-radius:var(--radius-md);box-shadow:var(--shadow-md);padding:6px;z-index:var(--z-dropdown);animation:br-dd-in var(--duration-fast) var(--ease-out)}',
'.br-dd__menu--up{top:auto;bottom:calc(100% + 6px)}',
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
'.br-dd__short{margin-left:auto;font-size:12.5px;color:var(--text-muted)}',
].join('');

export type DropdownItem =
  | { divider: true }
  | { heading: string }
  | { label: string; icon?: IconName; onSelect?: () => void; danger?: boolean; disabled?: boolean; selected?: boolean; shortcut?: string };

export interface DropdownMenuProps {
  /** Rendered inside the trigger button — pass content, not another button. */
  trigger: ReactNode;
  triggerLabel?: string;
  items: DropdownItem[];
  align?: 'left' | 'right';
  /** Open upwards — for triggers at the bottom of the screen, like the sidebar footer. */
  placement?: 'down' | 'up';
  /** Stretch the trigger to the full width of its container. */
  block?: boolean;
  style?: CSSProperties;
}

export function DropdownMenu({ trigger, triggerLabel, items, align = 'left', placement = 'down', block, style }: DropdownMenuProps) {
  injectStyles('dropdown', DROPDOWN_CSS);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: globalThis.MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', off);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <span className={cx('br-dd', block && 'br-dd--block')} ref={ref} style={style}>
      <button type="button" className="br-dd__trigger" aria-haspopup="menu" aria-expanded={open} aria-label={triggerLabel} onClick={() => setOpen(!open)}>{trigger}</button>
      {open ? (
        <div role="menu" className={cx('br-dd__menu', 'br-dd__menu--' + align, placement === 'up' && 'br-dd__menu--up')}>
          {items.map((it, i) => 'divider' in it ? <div key={i} className="br-dd__sep" />
            : 'heading' in it ? <div key={i} className="br-dd__label">{it.heading}</div>
            : (
              <button key={i} role="menuitem" type="button" disabled={it.disabled}
                className={cx('br-dd__item', it.danger && 'br-dd__item--danger', it.selected && 'br-dd__item--on')}
                onClick={() => { setOpen(false); it.onSelect?.(); }}>
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
