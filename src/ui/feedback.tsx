// Alert, Toast, Tooltip — ported from design/components/feedback.
import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from './core';
import { injectStyles } from './injectStyles';

export type StatusTone = 'info' | 'success' | 'warning' | 'danger';
const ICON: Record<StatusTone, IconName> = { info: 'info', success: 'circle-check', warning: 'triangle-alert', danger: 'circle-x' };

// --- Alert ---------------------------------------------------------------------------------------

const ALERT_CSS = [
'.br-alert{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:var(--radius-md);border:1px solid;font-family:var(--font-body);font-size:14.5px;line-height:1.45}',
'.br-alert--info{background:var(--status-info-bg);border-color:var(--teal-100);color:var(--status-info-fg)}',
'.br-alert--success{background:var(--status-success-bg);border-color:var(--green-100);color:var(--status-success-fg)}',
'.br-alert--warning{background:var(--status-warning-bg);border-color:var(--amber-100);color:var(--status-warning-fg)}',
'.br-alert--danger{background:var(--status-danger-bg);border-color:var(--terracotta-100);color:var(--status-danger-fg)}',
'.br-alert__body{flex:1;min-width:0;color:var(--text-primary)}',
'.br-alert__title{font-family:var(--font-display);font-weight:700;font-size:14px;letter-spacing:.01em;margin-bottom:2px;padding-top:2px}',
'.br-alert__x{border:0;background:transparent;color:inherit;cursor:pointer;padding:2px;border-radius:var(--radius-xs);opacity:.7}',
'.br-alert__x:hover{opacity:1}',
'.br-alert__action{flex-shrink:0;align-self:center}',
].join('');

export interface AlertProps {
  tone?: StatusTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  onClose?: () => void;
  style?: CSSProperties;
}

export function Alert({ tone = 'info', title, children, action, onClose, style }: AlertProps) {
  injectStyles('alert', ALERT_CSS);
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={'br-alert br-alert--' + tone} style={style}>
      <Icon name={ICON[tone]} size={18} style={{ marginTop: 1 }} />
      <div className="br-alert__body">{title ? <div className="br-alert__title" style={{ color: 'inherit' }}>{title}</div> : null}<div>{children}</div></div>
      {action ? <div className="br-alert__action">{action}</div> : null}
      {onClose ? <button type="button" className="br-alert__x" aria-label="Dismiss" onClick={onClose}><Icon name="x" size={16} /></button> : null}
    </div>
  );
}

// --- Toast ---------------------------------------------------------------------------------------

const TOAST_COLOR: Record<StatusTone, string> = { info: 'var(--teal-300)', success: '#7FC39A', warning: 'var(--amber-500)', danger: 'var(--terracotta-300)' };
const TOAST_CSS = [
'.br-toast{display:flex;align-items:flex-start;gap:12px;width:360px;max-width:calc(100vw - 32px);padding:14px 14px 14px 16px;border-radius:var(--radius-md);background:var(--ink-900);color:var(--cream-100);box-shadow:var(--shadow-lg);font-family:var(--font-body);font-size:14px;line-height:1.4;animation:br-toast-in var(--duration-slow) var(--ease-out)}',
'@keyframes br-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
'.br-toast__body{flex:1;min-width:0}',
'.br-toast__title{font-family:var(--font-display);font-weight:700;font-size:14px;letter-spacing:.01em;color:var(--cream-300);padding-top:2px}',
'.br-toast__msg{color:var(--ink-300);margin-top:2px}',
'.br-toast__action{border:0;background:transparent;font-family:var(--font-display);font-weight:700;font-size:12px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--cream-300);cursor:pointer;padding:4px 6px;border-radius:var(--radius-xs);align-self:center}',
'.br-toast__action:hover{background:rgba(242,218,178,.12)}',
'.br-toast__x{border:0;background:transparent;color:var(--ink-400);cursor:pointer;padding:2px}',
'.br-toast__x:hover{color:var(--cream-100)}',
'.br-toast-stack{position:fixed;right:24px;bottom:24px;display:flex;flex-direction:column;gap:10px;z-index:var(--z-toast)}',
].join('');

export interface ToastProps {
  tone?: StatusTone;
  title?: ReactNode;
  message?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  style?: CSSProperties;
}

export function Toast({ tone = 'success', title, message, actionLabel, onAction, onClose, style }: ToastProps) {
  injectStyles('toast', TOAST_CSS);
  return (
    <div role="status" className="br-toast" style={style}>
      <Icon name={ICON[tone]} size={18} color={TOAST_COLOR[tone]} style={{ marginTop: 1 }} />
      <div className="br-toast__body">{title ? <div className="br-toast__title">{title}</div> : null}{message ? <div className="br-toast__msg">{message}</div> : null}</div>
      {actionLabel ? <button type="button" className="br-toast__action" onClick={onAction}>{actionLabel}</button> : null}
      {onClose ? <button type="button" className="br-toast__x" aria-label="Dismiss" onClick={onClose}><Icon name="x" size={16} /></button> : null}
    </div>
  );
}

export function ToastStack({ children }: { children?: ReactNode }) {
  injectStyles('toast', TOAST_CSS);
  return <div className="br-toast-stack" aria-live="polite">{children}</div>;
}

// --- Tooltip -------------------------------------------------------------------------------------

const TOOLTIP_CSS = [
'.br-tip{position:relative;display:inline-flex}',
'.br-tip__bubble{position:absolute;left:50%;transform:translateX(-50%) translateY(4px);z-index:var(--z-dropdown);background:var(--ink-900);color:var(--cream-100);font-family:var(--font-body);font-size:13px;line-height:1.35;padding:6px 10px;border-radius:var(--radius-sm);white-space:nowrap;box-shadow:var(--shadow-md);opacity:0;pointer-events:none;transition:opacity var(--duration-fast) var(--ease-out),transform var(--duration-fast) var(--ease-out)}',
'.br-tip__bubble--top{bottom:calc(100% + 8px)}',
'.br-tip__bubble--bottom{top:calc(100% + 8px);transform:translateX(-50%) translateY(-4px)}',
'.br-tip__bubble::after{content:"";position:absolute;left:50%;margin-left:-5px;border:5px solid transparent}',
'.br-tip__bubble--top::after{top:100%;border-top-color:var(--ink-900)}',
'.br-tip__bubble--bottom::after{bottom:100%;border-bottom-color:var(--ink-900)}',
'.br-tip:hover .br-tip__bubble,.br-tip:focus-within .br-tip__bubble,.br-tip--open .br-tip__bubble{opacity:1;transform:translateX(-50%) translateY(0)}',
].join('');

export interface TooltipProps {
  content: ReactNode;
  placement?: 'top' | 'bottom';
  open?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}

export function Tooltip({ content, placement = 'top', open, children, style }: TooltipProps) {
  injectStyles('tooltip', TOOLTIP_CSS);
  return (
    <span className={'br-tip' + (open ? ' br-tip--open' : '')} style={style}>
      {children}
      <span role="tooltip" className={'br-tip__bubble br-tip__bubble--' + placement}>{content}</span>
    </span>
  );
}
