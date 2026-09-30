// The app's screens, in PAGES.md order, grouped for the sidebar. Each screen names the operation that
// feeds it; the nav item and the route are hidden from anyone who cannot call it. No permission strings
// are typed here — they come from the spec via OPERATION_PERMISSIONS.
import type { GatedOperation } from '../api/generated/permissions';
import type { IconName } from '../ui';

export interface Screen {
  id: string;
  label: string;
  path: string;
  icon: IconName;
  /** The operation the screen cannot work without. Absent = any signed-in user. */
  requires?: GatedOperation;
  /** False until the screen is built; the route shows a placeholder meanwhile. */
  built: boolean;
}

export interface NavSection {
  title?: string;
  screens: Screen[];
}

export const NAV: NavSection[] = [
  {
    screens: [
      { id: 'dashboard', label: 'Dashboard', path: '/', icon: 'layout-dashboard', built: false },
    ],
  },
  {
    title: 'Customers',
    screens: [
      { id: 'customers', label: 'Customers', path: '/customers', icon: 'users', requires: 'GET /api/customers', built: true },
      { id: 'subscriptions', label: 'Subscriptions', path: '/subscriptions', icon: 'repeat', requires: 'GET /api/subscriptions', built: true },
    ],
  },
  {
    title: 'The day’s work',
    screens: [
      { id: 'deliveries', label: 'Deliveries', path: '/deliveries', icon: 'package', requires: 'GET /api/deliveries', built: true },
      { id: 'procurement', label: 'Procurement', path: '/procurement', icon: 'shopping-bag', requires: 'GET /api/procurement/products', built: true },
      { id: 'billing', label: 'Billing', path: '/billing', icon: 'credit-card', requires: 'GET /api/deliveries/needs-attention', built: true },
      { id: 'dispatch', label: 'Dispatch', path: '/dispatch', icon: 'truck', requires: 'GET /api/dispatch', built: false },
    ],
  },
  {
    title: 'Store',
    screens: [
      { id: 'products', label: 'Products', path: '/products', icon: 'tag', requires: 'GET /api/products', built: false },
      { id: 'users', label: 'Users', path: '/users', icon: 'user', requires: 'GET /api/users', built: false },
    ],
  },
];

export const SCREENS: Screen[] = NAV.flatMap(s => s.screens);

/** The screen a path belongs to — the longest matching prefix, so /customers/123 is Customers. */
export function screenForPath(pathname: string): Screen | undefined {
  return SCREENS
    .filter(s => s.path === '/' ? pathname === '/' : pathname === s.path || pathname.startsWith(s.path + '/'))
    .sort((a, b) => b.path.length - a.path.length)[0];
}
