export type IconName = 'layout-dashboard'|'users'|'calendar'|'calendar-days'|'calendar-clock'|'truck'|'package'|'repeat'|'settings'|'search'|'bell'|'plus'|'minus'|'filter'|'chevron-down'|'chevron-up'|'chevron-right'|'chevron-left'|'x'|'check'|'pause'|'play'|'skip-forward'|'pencil'|'trash-2'|'ellipsis'|'mail'|'phone'|'map-pin'|'globe'|'credit-card'|'triangle-alert'|'info'|'circle-check'|'circle-x'|'download'|'upload'|'trending-up'|'trending-down'|'clock'|'dog'|'bone'|'log-out'|'menu'|'sliders-horizontal'|'refresh-cw'|'file-text'|'message-square'|'star'|'heart'|'user'|'house'|'shopping-bag'|'circle-dollar-sign'|'route'|'eye'|'copy'|'external-link'|'arrow-up-down'|'arrow-up'|'arrow-down'|'list'|'layout-grid'|'store'|'tag'|'notebook-pen'|'printer'|'cake';
/** Lucide outline icon (1.75 stroke) — the only icon set used in Barkfield Road UI. */
export interface IconProps {
  name: IconName;
  /** px, default 18 */
  size?: number;
  /** default 1.75 */
  strokeWidth?: number;
  /** default currentColor */
  color?: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element | null;
