import type { IconName } from '../core/Icon';
/** KPI tile: uppercase label, big teal Black numeral, optional trend delta + caption. */
export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  /** e.g. "+4.2%" */
  delta?: string;
  /** up = green, down = terracotta. Reflects good/bad, not literal direction. */
  trend?: 'up' | 'down';
  caption?: string;
  icon?: IconName;
  style?: React.CSSProperties;
}
export declare function StatCard(props: StatCardProps): JSX.Element;
