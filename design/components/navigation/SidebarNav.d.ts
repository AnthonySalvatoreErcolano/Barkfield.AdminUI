import type { IconName } from '../core/Icon';
export interface SidebarNavItem { id: string; label: string; icon?: IconName; /** terracotta count pill */ badge?: number | string; }
export interface SidebarNavSection { title?: string; items: SidebarNavItem[]; }
/** Light admin sidebar: white column, logo, sectioned nav (active item = teal-tint pill), footer slot. */
export interface SidebarNavProps {
  sections: SidebarNavSection[];
  active?: string;
  onSelect?: (id: string) => void;
  /** path to the primary logo, e.g. assets/logos/logo.svg */
  logoSrc?: string;
  logoAlt?: string;
  /** small tan label under the logo, e.g. "Autoship Admin" */
  productName?: string;
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function SidebarNav(props: SidebarNavProps): JSX.Element;
