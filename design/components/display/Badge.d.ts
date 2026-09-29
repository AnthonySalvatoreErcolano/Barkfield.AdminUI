/**
 * Read-only status pill (uppercase). Map autoship states: Active→success, Paused→warning, Past due / Failed→danger, Scheduled→info, Cancelled→neutral, VIP / Bakery→brand.
 */
export interface BadgeProps {
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';
  variant?: 'soft' | 'solid';
  /** leading status dot */
  dot?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Badge(props: BadgeProps): JSX.Element;
