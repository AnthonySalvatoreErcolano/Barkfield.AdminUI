/** Transient confirmation (dark ink card, cream title). Place inside a fixed bottom-right stack: <div className="br-toast-stack">. */
export interface ToastProps {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  message?: React.ReactNode;
  /** e.g. "Undo" */
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  style?: React.CSSProperties;
}
export declare function Toast(props: ToastProps): JSX.Element;
