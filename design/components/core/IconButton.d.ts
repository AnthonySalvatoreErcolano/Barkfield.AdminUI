import type { IconName } from './Icon';
/** Square icon-only button for toolbars, table row actions, dialog close. Always pass `label` (used as aria-label + tooltip). */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  label: string;
  /** ghost (default) · secondary (outlined) · primary (teal) · on-brand (cream glyph on teal) */
  variant?: 'ghost' | 'secondary' | 'primary' | 'on-brand';
  size?: 'sm' | 'md' | 'lg';
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
