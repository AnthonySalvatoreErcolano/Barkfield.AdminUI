// Badge, Card, Chip, StatCard — ported from design/components/display.
import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { Icon, type IconName } from './core';
import { cx, injectStyles } from './injectStyles';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

// --- Badge ---------------------------------------------------------------------------------------

const BADGE_CSS = [
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
'.br-badge--solid.br-badge--brand{background:var(--teal-500);color:var(--cream-300)}',
].join('');

export interface BadgeProps {
  tone?: Tone;
  variant?: 'soft' | 'solid';
  dot?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
}

export function Badge({ tone = 'neutral', variant = 'soft', dot, children, style }: BadgeProps) {
  injectStyles('badge', BADGE_CSS);
  return (
    <span className={cx('br-badge', 'br-badge--' + tone, variant === 'solid' && 'br-badge--solid')} style={style}>
      {dot ? <span className="br-badge__dot" /> : null}{children}
    </span>
  );
}

// --- Card ----------------------------------------------------------------------------------------

const CARD_CSS = [
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
'.br-card__foot{padding:12px 20px;border-top:1px solid var(--border-subtle);display:flex;align-items:center;gap:8px;justify-content:flex-end}',
].join('');

export interface CardProps {
  title?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  /** At most one `brand` (teal) card per screen. */
  tone?: 'default' | 'cream' | 'brand';
  /** No body padding — for tables. */
  flush?: boolean;
  style?: CSSProperties;
}

export function Card({ title, eyebrow, actions, footer, children, tone = 'default', flush, style }: CardProps) {
  injectStyles('card', CARD_CSS);
  const hasHead = title || eyebrow || actions;
  return (
    <section className={cx('br-card', tone !== 'default' && 'br-card--' + tone)} style={style}>
      {hasHead ? (
        <header className="br-card__head">
          <div>{eyebrow ? <div className="br-card__eyebrow">{eyebrow}</div> : null}{title ? <h3 className="br-card__title">{title}</h3> : null}</div>
          {actions ? <div className="br-card__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cx('br-card__body', flush && 'br-card__body--flush')} style={hasHead ? undefined : { paddingTop: flush ? 0 : 20 }}>{children}</div>
      {footer ? <footer className="br-card__foot">{footer}</footer> : null}
    </section>
  );
}

// --- Chip ----------------------------------------------------------------------------------------

const CHIP_CSS = [
'.br-chip{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:var(--radius-pill);border:1px solid var(--border-strong);background:var(--surface-card);color:var(--text-primary);font-family:var(--font-display);font-weight:600;font-size:13.5px;line-height:1;white-space:nowrap;transition:all var(--duration-fast) var(--ease-out);padding-top:1px}',
'button.br-chip{cursor:pointer}',
'button.br-chip:hover{border-color:var(--teal-300);background:var(--surface-hover)}',
'.br-chip:focus-visible{outline:none;box-shadow:var(--focus-ring)}',
'.br-chip--sm{height:24px;padding:0 9px;font-size:12.5px}',
'.br-chip--selected{background:var(--teal-500);border-color:var(--teal-500);color:var(--cream-300)}',
'button.br-chip--selected:hover{background:var(--teal-600);border-color:var(--teal-600)}',
'.br-chip--tag{background:var(--cream-100);border-color:var(--cream-400);color:var(--tan-800)}',
'.br-chip__count{font-size:11.5px;font-weight:700;padding:2px 6px 1px;border-radius:var(--radius-pill);background:var(--ink-100);color:var(--text-secondary)}',
'.br-chip--selected .br-chip__count{background:rgba(242,218,178,.22);color:var(--cream-300)}',
'.br-chip__x{display:inline-flex;border:0;background:transparent;padding:2px;margin-right:-6px;border-radius:50%;cursor:pointer;color:inherit;opacity:.7}',
'.br-chip__x:hover{opacity:1;background:rgba(0,0,0,.06)}',
].join('');

export interface ChipProps {
  children?: ReactNode;
  selected?: boolean;
  /** Makes the chip a toggle button. */
  onClick?: () => void;
  onRemove?: (event: MouseEvent) => void;
  icon?: IconName;
  count?: number | null;
  variant?: 'filter' | 'tag';
  size?: 'sm' | 'md';
  style?: CSSProperties;
}

export function Chip({ children, selected, onClick, onRemove, icon, count, variant = 'filter', size = 'md', style }: ChipProps) {
  injectStyles('chip', CHIP_CSS);
  const cls = cx('br-chip', selected && 'br-chip--selected', variant === 'tag' && 'br-chip--tag', size === 'sm' && 'br-chip--sm');
  const inner = (
    <>
      {icon ? <Icon name={icon} size={14} /> : null}
      <span>{children}</span>
      {count != null ? <span className="br-chip__count">{count}</span> : null}
      {onRemove ? (
        <button type="button" aria-label="Remove" className="br-chip__x" onClick={e => { e.stopPropagation(); onRemove(e); }}>
          <Icon name="x" size={13} strokeWidth={2.25} />
        </button>
      ) : null}
    </>
  );
  return onClick
    ? <button type="button" className={cls} aria-pressed={!!selected} onClick={onClick} style={style}>{inner}</button>
    : <span className={cls} style={style}>{inner}</span>;
}

// --- StatCard ------------------------------------------------------------------------------------

const STAT_CSS = [
'.br-stat{background:var(--surface-card);border:1px solid var(--border-default);border-radius:var(--radius-md);box-shadow:var(--shadow-xs);padding:18px 20px;display:flex;flex-direction:column;gap:10px;min-width:0}',
'.br-stat__top{display:flex;align-items:center;justify-content:space-between;gap:8px}',
'.br-stat__label{font-family:var(--font-display);font-weight:700;font-size:11.5px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-secondary)}',
'.br-stat__icon{width:32px;height:32px;border-radius:50%;background:var(--cream-200);color:var(--teal-600);display:flex;align-items:center;justify-content:center}',
'.br-stat__value{font-family:var(--font-display);font-weight:900;font-size:32px;line-height:1;letter-spacing:var(--tracking-display);color:var(--teal-500);font-variant-numeric:tabular-nums}',
'.br-stat__foot{display:flex;align-items:center;gap:8px;font-family:var(--font-body);font-size:13.5px;color:var(--text-muted)}',
'.br-stat__delta{display:inline-flex;align-items:center;gap:3px;font-family:var(--font-display);font-weight:700;font-size:12.5px}',
'.br-stat__delta--up{color:var(--status-success-fg)}.br-stat__delta--down{color:var(--status-danger-fg)}',
].join('');

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  trend?: 'up' | 'down';
  caption?: ReactNode;
  icon?: IconName;
  style?: CSSProperties;
}

export function StatCard({ label, value, delta, trend, caption, icon, style }: StatCardProps) {
  injectStyles('statcard', STAT_CSS);
  return (
    <div className="br-stat" style={style}>
      <div className="br-stat__top"><span className="br-stat__label">{label}</span>{icon ? <span className="br-stat__icon"><Icon name={icon} size={16} /></span> : null}</div>
      <div className="br-stat__value">{value}</div>
      {delta || caption ? (
        <div className="br-stat__foot">
          {delta ? <span className={'br-stat__delta br-stat__delta--' + (trend ?? 'up')}><Icon name={trend === 'down' ? 'trending-down' : 'trending-up'} size={14} strokeWidth={2} />{delta}</span> : null}
          {caption ? <span>{caption}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
