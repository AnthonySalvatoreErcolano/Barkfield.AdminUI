import type { IconName } from '../core/Icon';
/** Pill for filters (toggleable, with count) and tags (dog breed, diet, product attributes; removable). */
export interface ChipProps {
  children: React.ReactNode;
  /** filter = white outline, teal when selected · tag = cream fill for descriptive labels */
  variant?: 'filter' | 'tag';
  selected?: boolean;
  /** makes the chip a toggle button */
  onClick?: (e: React.MouseEvent) => void;
  /** shows a remove × */
  onRemove?: (e: React.MouseEvent) => void;
  icon?: IconName;
  count?: number;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}
export declare function Chip(props: ChipProps): JSX.Element;
