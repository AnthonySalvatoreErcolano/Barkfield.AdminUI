/** Single radio option. Group several with the same `name`; onChange receives this option's value. */
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: React.ReactNode;
  description?: string;
  name?: string;
  value: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (value: string, e: React.ChangeEvent<HTMLInputElement>) => void;
}
export declare function Radio(props: RadioProps): JSX.Element;
