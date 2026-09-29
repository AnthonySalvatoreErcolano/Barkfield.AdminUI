/** Checkbox with teal fill; supports indeterminate (table "select all"). onChange receives the new boolean. */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: React.ReactNode;
  description?: string;
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean, e: React.ChangeEvent<HTMLInputElement>) => void;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
