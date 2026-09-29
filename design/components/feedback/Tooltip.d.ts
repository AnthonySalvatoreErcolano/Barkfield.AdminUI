/** Hover/focus hint for icon buttons and truncated values. Ink bubble, 13px Zilla Slab. */
export interface TooltipProps {
  content: React.ReactNode;
  placement?: 'top' | 'bottom';
  /** force visible (docs/demos) */
  open?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Tooltip(props: TooltipProps): JSX.Element;
