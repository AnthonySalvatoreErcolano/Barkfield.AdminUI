import React from 'react';
import { injectStyles } from '../core/useStyles.js';

const CSS = [
'.br-tip{position:relative;display:inline-flex}',
'.br-tip__bubble{position:absolute;left:50%;transform:translateX(-50%) translateY(4px);z-index:var(--z-dropdown);background:var(--ink-900);color:var(--cream-100);font-family:var(--font-body);font-size:13px;line-height:1.35;padding:6px 10px;border-radius:var(--radius-sm);white-space:nowrap;box-shadow:var(--shadow-md);opacity:0;pointer-events:none;transition:opacity var(--duration-fast) var(--ease-out),transform var(--duration-fast) var(--ease-out)}',
'.br-tip__bubble--top{bottom:calc(100% + 8px)}',
'.br-tip__bubble--bottom{top:calc(100% + 8px);transform:translateX(-50%) translateY(-4px)}',
'.br-tip__bubble::after{content:"";position:absolute;left:50%;margin-left:-5px;border:5px solid transparent}',
'.br-tip__bubble--top::after{top:100%;border-top-color:var(--ink-900)}',
'.br-tip__bubble--bottom::after{bottom:100%;border-bottom-color:var(--ink-900)}',
'.br-tip:hover .br-tip__bubble,.br-tip:focus-within .br-tip__bubble,.br-tip--open .br-tip__bubble{opacity:1;transform:translateX(-50%) translateY(0)}'
].join('');

export function Tooltip({ content, placement = 'top', open, children, style }) {
  injectStyles('tooltip', CSS);
  return (
    <span className={'br-tip' + (open ? ' br-tip--open' : '')} style={style}>
      {children}
      <span role="tooltip" className={'br-tip__bubble br-tip__bubble--' + placement}>{content}</span>
    </span>
  );
}
