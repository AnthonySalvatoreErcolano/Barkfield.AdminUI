/** Column definition for DataTable. */
export interface DataTableColumn<Row = any> {
  key: string;
  header: React.ReactNode;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  /** custom cell renderer; defaults to row[key] */
  render?: (row: Row) => React.ReactNode;
}
/**
 * Admin data table — sunken uppercase tan header, 52px rows (40px compact), warm hover, teal-tint selection.
 * @startingPoint section="Data" subtitle="Sortable, selectable table with pagination" viewport="900x420"
 */
export interface DataTableProps<Row = any> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  /** default 'id' */
  rowKey?: string;
  selectable?: boolean;
  selected?: Array<string | number>;
  onSelectChange?: (keys: Array<string | number>) => void;
  onRowClick?: (row: Row) => void;
  sort?: { key: string; dir: 'asc' | 'desc' };
  onSortChange?: (sort: { key: string; dir: 'asc' | 'desc' }) => void;
  density?: 'default' | 'compact';
  /** shown when rows is empty */
  empty?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function DataTable<Row = any>(props: DataTableProps<Row>): JSX.Element;
