/**
 * Modal for focused tasks and confirmations: teal uppercase Black title, sunken footer for actions.
 */
export interface DialogProps {
  open: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** right-aligned action Buttons; primary last */
  footer?: React.ReactNode;
  onClose?: () => void;
  size?: 'sm' | 'md' | 'lg';
  /** render in-flow instead of fixed (for docs/thumbnails) */
  inline?: boolean;
}
export declare function Dialog(props: DialogProps): JSX.Element | null;
