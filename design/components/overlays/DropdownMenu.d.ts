import type { IconName } from '../core/Icon';
export interface DropdownMenuItem {
  label?: string;
  icon?: IconName;
  onSelect?: () => void;
  /** terracotta destructive item */
  danger?: boolean;
  disabled?: boolean;
  /** shows a check — for single-choice menus (sort by, view) */
  selected?: boolean;
  shortcut?: string;
  /** render a separator instead of an item */
  divider?: boolean;
  /** render a small uppercase group label instead of an item */
  heading?: string;
}
/** Click-to-open action menu anchored to any trigger (IconButton "ellipsis", Button with chevron). Closes on outside click / Esc. */
export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
  defaultOpen?: boolean;
  onSelect?: (item: DropdownMenuItem) => void;
  style?: React.CSSProperties;
}
export declare function DropdownMenu(props: DropdownMenuProps): JSX.Element;
