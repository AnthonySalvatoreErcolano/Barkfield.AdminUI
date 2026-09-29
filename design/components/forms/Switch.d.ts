/** On/off toggle that applies immediately (no save) — e.g. autoship active, SMS reminders. */
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: React.ReactNode;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean, e: React.ChangeEvent<HTMLInputElement>) => void;
}
export declare function Switch(props: SwitchProps): JSX.Element;
