// Button, IconButton, Icon — ported from design/components/core. Styles are the design system's own.
import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import { ICONS, type IconName } from './iconData';
import { cx, injectStyles } from './injectStyles';

export type { IconName };

export interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
  /** Accessible label. Without one the icon is decorative and hidden from assistive tech. */
  title?: string;
}

export function Icon({ name, size = 18, strokeWidth = 1.75, color = 'currentColor', style, className, title }: IconProps) {
  const body = ICONS[name];
  if (!body) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}
      style={{ flexShrink: 0, display: 'block', ...style }}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

const BUTTON_CSS = [
'.br-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid transparent;border-radius:var(--radius-sm);font-family:var(--font-display);font-weight:700;text-transform:uppercase;letter-spacing:var(--tracking-label);cursor:pointer;white-space:nowrap;transition:background var(--duration-fast) var(--ease-out),border-color var(--duration-fast) var(--ease-out),color var(--duration-fast) var(--ease-out),transform var(--duration-fast) var(--ease-out);text-decoration:none;line-height:1}',
'.br-btn:focus-visible{outline:none;box-shadow:var(--focus-ring)}',
'.br-btn:active:not(:disabled){transform:translateY(1px)}',
'.br-btn:disabled{cursor:not-allowed;opacity:.45}',
'.br-btn--sm{height:var(--control-h-sm);padding:0 12px;font-size:11.5px}',
'.br-btn--md{height:var(--control-h-md);padding:0 16px;font-size:12.5px}',
'.br-btn--lg{height:var(--control-h-lg);padding:0 22px;font-size:14px}',
'.br-btn--full{width:100%}',
'.br-btn--primary{background:var(--action-primary);color:var(--text-on-brand)}',
'.br-btn--primary:hover:not(:disabled){background:var(--action-primary-hover)}',
'.br-btn--primary:active:not(:disabled){background:var(--action-primary-press)}',
'.br-btn--accent{background:var(--action-accent);color:var(--white)}',
'.br-btn--accent:hover:not(:disabled){background:var(--action-accent-hover)}',
'.br-btn--accent:active:not(:disabled){background:var(--action-accent-press)}',
'.br-btn--secondary{background:var(--surface-card);color:var(--text-brand);border-color:var(--border-strong)}',
'.br-btn--secondary:hover:not(:disabled){background:var(--surface-hover);border-color:var(--teal-300)}',
'.br-btn--ghost{background:transparent;color:var(--text-brand)}',
'.br-btn--ghost:hover:not(:disabled){background:var(--teal-50)}',
'.br-btn--danger{background:var(--surface-card);color:var(--status-danger-fg);border-color:var(--terracotta-200)}',
'.br-btn--danger:hover:not(:disabled){background:var(--status-danger-bg);border-color:var(--terracotta-400)}',
'.br-btn--cream{background:var(--cream-300);color:var(--teal-700)}',
'.br-btn--cream:hover:not(:disabled){background:var(--cream-400)}',
].join('');

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = teal · accent = terracotta (create/new, sparingly) · secondary = outline · ghost · danger · cream (on teal) */
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'cream';
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: IconName;
  iconRight?: IconName;
  fullWidth?: boolean;
}

export function Button({ variant = 'primary', size = 'md', iconLeft, iconRight, fullWidth, type = 'button', children, className, ...rest }: ButtonProps) {
  injectStyles('button', BUTTON_CSS);
  const iconSize = size === 'lg' ? 18 : size === 'sm' ? 14 : 16;
  return (
    <button type={type} className={cx('br-btn', 'br-btn--' + variant, 'br-btn--' + size, fullWidth && 'br-btn--full', className)} {...rest}>
      {iconLeft ? <Icon name={iconLeft} size={iconSize} strokeWidth={2} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={iconSize} strokeWidth={2} /> : null}
    </button>
  );
}

const ICON_BUTTON_CSS = [
'.br-ibtn{display:inline-flex;align-items:center;justify-content:center;border:1px solid transparent;border-radius:var(--radius-sm);cursor:pointer;padding:0;transition:background var(--duration-fast) var(--ease-out),color var(--duration-fast) var(--ease-out);color:var(--text-secondary);background:transparent}',
'.br-ibtn:focus-visible{outline:none;box-shadow:var(--focus-ring)}',
'.br-ibtn:disabled{opacity:.4;cursor:not-allowed}',
'.br-ibtn--ghost:hover:not(:disabled){background:var(--surface-hover);color:var(--text-brand)}',
'.br-ibtn--secondary{background:var(--surface-card);border-color:var(--border-default);color:var(--text-brand)}',
'.br-ibtn--secondary:hover:not(:disabled){border-color:var(--teal-300);background:var(--surface-hover)}',
'.br-ibtn--primary{background:var(--action-primary);color:var(--text-on-brand)}',
'.br-ibtn--primary:hover:not(:disabled){background:var(--action-primary-hover)}',
'.br-ibtn--on-brand{color:var(--text-on-brand)}',
'.br-ibtn--on-brand:hover:not(:disabled){background:rgba(242,218,178,.14)}',
'.br-ibtn--sm{width:28px;height:28px}.br-ibtn--md{width:36px;height:36px}.br-ibtn--lg{width:44px;height:44px}',
].join('');

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName;
  /** Required: the button has no visible text. */
  label: string;
  variant?: 'ghost' | 'secondary' | 'primary' | 'on-brand';
  size?: 'sm' | 'md' | 'lg';
}

export function IconButton({ icon, label, variant = 'ghost', size = 'md', className, ...rest }: IconButtonProps) {
  injectStyles('iconbutton', ICON_BUTTON_CSS);
  const s = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  return (
    <button type="button" aria-label={label} title={label} className={cx('br-ibtn', 'br-ibtn--' + variant, 'br-ibtn--' + size, className)} {...rest}>
      <Icon name={icon} size={s} />
    </button>
  );
}
