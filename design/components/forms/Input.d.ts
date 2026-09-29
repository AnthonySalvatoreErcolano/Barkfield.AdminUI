import type { IconName } from '../core/Icon';
/** Text field with uppercase label, optional leading icon, suffix, hint and error. */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  /** Error message — switches border to terracotta and replaces hint */
  error?: string;
  iconLeft?: IconName;
  /** Trailing unit text, e.g. "lbs" or "days" */
  suffix?: string;
  size?: 'sm' | 'md' | 'lg';
}
export declare function Input(props: InputProps): JSX.Element;
