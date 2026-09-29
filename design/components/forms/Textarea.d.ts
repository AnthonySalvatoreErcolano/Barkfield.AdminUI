/** Multi-line text field — delivery notes, internal customer notes. Same label/hint/error pattern as Input. */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  rows?: number;
}
export declare function Textarea(props: TextareaProps): JSX.Element;
