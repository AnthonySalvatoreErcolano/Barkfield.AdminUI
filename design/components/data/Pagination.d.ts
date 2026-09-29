/** Table footer pager: "Showing x–y of n" + numbered pages with ellipsis. */
export interface PaginationProps {
  /** 1-based */
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  /** total rows — enables the "Showing x–y of n" summary */
  total?: number;
  pageSize?: number;
  style?: React.CSSProperties;
}
export declare function Pagination(props: PaginationProps): JSX.Element;
