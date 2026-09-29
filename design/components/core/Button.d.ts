import type { IconName } from './Icon';
/**
 * Primary action control. Uppercase Brother/League Spartan label, 4px radius.
 */
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** primary = teal (default action) · accent = terracotta (promotional / create) · secondary = outlined · ghost = text · danger = destructive outline · cream = on teal surfaces */
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'cream';
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: IconName;
  iconRight?: IconName;
  fullWidth?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;
