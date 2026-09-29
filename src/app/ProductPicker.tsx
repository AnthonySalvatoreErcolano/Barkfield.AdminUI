// Search the catalog and pick one product. Only active products are offered: the API refuses a
// discontinued one on any delivery, so offering it would only lead to an error.
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { Product } from '../api/ports';
import { formatMoney } from '../lib/format';
import { useApi } from '../session/SessionProvider';
import { Input } from '../ui';
import { cx, injectStyles } from '../ui/injectStyles';

const CSS = [
'.pp{display:flex;flex-direction:column;gap:8px}',
'.pp__list{border:1px solid var(--border-default);border-radius:var(--radius-md);max-height:240px;overflow-y:auto;background:var(--surface-card)}',
'.pp__item{display:flex;justify-content:space-between;gap:12px;width:100%;padding:9px 12px;border:0;border-bottom:1px solid var(--border-subtle);background:transparent;font-family:var(--font-body);font-size:14.5px;text-align:left;cursor:pointer;color:var(--text-primary)}',
'.pp__item:last-child{border-bottom:0}',
'.pp__item:hover,.pp__item:focus-visible{outline:0;background:var(--surface-hover)}',
'.pp__item--on{background:var(--surface-selected)}',
'.pp__empty{padding:12px;color:var(--text-muted);font-size:14px}',
].join('');

export function ProductPicker({ label = 'Product', value, onChange, excludeId }: {
  label?: string;
  value: Product | null;
  onChange: (product: Product) => void;
  /** e.g. the line's own product, when choosing a substitute. */
  excludeId?: string;
}) {
  injectStyles('product-picker', CSS);
  const api = useApi();
  const [search, setSearch] = useState('');
  const { data, isFetching } = useQuery({
    queryKey: ['products', 'picker', search],
    queryFn: ({ signal }) => api.products.list({ searchTerm: search.trim() || undefined, pageSize: 20 }, signal),
    staleTime: 60_000,
  });
  const items = (data?.items ?? []).filter(p => p.id !== excludeId && p.isActive);
  return (
    <div className="pp">
      <Input label={label} iconLeft="search" placeholder="Search products by name or SKU" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="pp__list" role="listbox" aria-label={`${label} results`}>
        {items.length === 0
          ? <div className="pp__empty">{isFetching ? 'Searching…' : 'No active products match.'}</div>
          : items.map(p => (
            <button key={p.id} type="button" role="option" aria-selected={value?.id === p.id} className={cx('pp__item', value?.id === p.id && 'pp__item--on')} onClick={() => onChange(p)}>
              <span>{p.name}{p.sku ? <span style={{ color: 'var(--text-muted)', fontSize: 13 }}> · {p.sku}</span> : null}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(p.price)}</span>
            </button>
          ))}
      </div>
    </div>
  );
}
