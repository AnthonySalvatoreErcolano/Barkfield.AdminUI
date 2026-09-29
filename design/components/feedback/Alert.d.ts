/** Inline, persistent message banner inside a page or card. */
export interface AlertProps {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children?: React.ReactNode;
  /** trailing slot, usually a small Button */
  action?: React.ReactNode;
  onClose?: () => void;
  style?: React.CSSProperties;
}
export declare function Alert(props: AlertProps): JSX.Element;
