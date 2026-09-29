/** Native select styled to match Input — delivery frequency, route, status filters. */
export interface SelectOption { value: string; label: string; disabled?: boolean; }
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  hint?: string;
  options: Array<SelectOption | string>;
  size?: 'sm' | 'md' | 'lg';
}
export declare function Select(props: SelectProps): JSX.Element;
