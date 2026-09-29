/** Content container: white, 1px warm border, 6px radius, hairline shadow. Optional eyebrow/title/actions header and footer. */
export interface CardProps {
  title?: React.ReactNode;
  /** small tan uppercase label above the title */
  eyebrow?: string;
  /** right-aligned header slot (Buttons, IconButtons) */
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  /** default white · cream (brand panel) · brand (teal, cream text) */
  tone?: 'default' | 'cream' | 'brand';
  /** remove body side padding — for embedding a DataTable */
  flush?: boolean;
  style?: React.CSSProperties;
}
export declare function Card(props: CardProps): JSX.Element;
