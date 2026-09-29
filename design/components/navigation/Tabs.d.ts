/** Section switcher. line = underlined page tabs (default); pill = segmented control for view toggles. */
export interface TabItem { id: string; label: React.ReactNode; count?: number; }
export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange?: (id: string) => void;
  variant?: 'line' | 'pill';
  style?: React.CSSProperties;
}
export declare function Tabs(props: TabsProps): JSX.Element;
