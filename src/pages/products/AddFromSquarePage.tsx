// Add products from Square (PAGES.md §4): search Square's catalog, then add the chosen variation. One
// Square item has many variations (sizes, proteins); a product here is one variation. Searching hits
// Square each time, so it runs on submit, not on every keystroke.
//
// Importing is idempotent — adding something already here refreshes it, and restores it if it was
// discontinued — so "Add back" is the same call as "Add".
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { errorMessage } from '../../api/errors';
import type { CatalogSearchResult } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { useToast } from '../../app/toast';
import { formatMoney, plural } from '../../lib/format';
import { useApi } from '../../session/SessionProvider';
import { Badge, Breadcrumbs, Button, Card, DataTable, Input, Muted } from '../../ui';
import { productKeys } from './keys';

export function AddFromSquarePage() {
  const api = useApi();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const [draft, setDraft] = useState(q);

  const results = useQuery({
    queryKey: productKeys.square(q),
    queryFn: () => api.products.searchSquare(q, 25),
    enabled: !!q,
    staleTime: 30_000,
  });

  const search = (e: FormEvent) => {
    e.preventDefault();
    setParams(draft.trim() ? { q: draft.trim() } : {}, { replace: true });
  };

  // One block per Square item, in the order Square returned them.
  const items = new Map<string, CatalogSearchResult[]>();
  for (const r of results.data ?? []) {
    const key = r.squareItemId ?? r.squareVariationId;
    items.set(key, [...(items.get(key) ?? []), r]);
  }

  return (
    <div>
      <PageHeader title="Add from Square">
        <Breadcrumbs style={{ marginBottom: 14 }} onNavigate={navigate} items={[{ label: 'Products', href: '/products' }, { label: 'Add from Square' }]} />
      </PageHeader>
      <form onSubmit={search} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 20, maxWidth: 620 }}>
        <Input label="Search Square’s catalog" iconLeft="search" value={draft} onChange={e => setDraft(e.target.value)}
          placeholder="e.g. Ziwi, salmon oil, bully stick" style={{ flex: 1 }} autoFocus
          hint="Square matches the start of words in the item’s name — “salm” finds salmon, “almon” doesn’t." />
        <Button type="submit" style={{ marginTop: 26 }} disabled={!draft.trim() || results.isFetching}>{results.isFetching ? 'Searching…' : 'Search'}</Button>
      </form>

      {!q ? (
        <Card><p style={{ margin: 0, color: 'var(--text-muted)' }}>Search for a product as it’s named in Square. Everything Square sells shows up, marked if it’s already here.</p></Card>
      ) : results.error ? (
        <LoadError error={results.error} onRetry={() => results.refetch()} what="Square’s catalog" />
      ) : !results.data ? (
        <p style={{ color: 'var(--text-muted)' }}>Searching Square…</p>
      ) : !results.data.length ? (
        <Card><p style={{ margin: 0 }}>Square has nothing matching “{q}”. Try the first word of the item’s name in Square, check the spelling, or add it in Square first.</p></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
            {plural(items.size, 'item')} in Square, {plural(results.data.length, 'variation')}.
          </p>
          {[...items.values()].map(variations => (
            <Card key={variations[0]!.squareItemId ?? variations[0]!.squareVariationId} title={variations[0]!.itemName} flush>
              <DataTable rows={variations} rowKey={v => v.squareVariationId} columns={[
                { key: 'name', header: 'Variation', render: v => <span style={{ fontWeight: 600 }}>{v.variationName || v.name}</span> },
                { key: 'sku', header: 'SKU', render: v => v.sku ?? <Muted>None</Muted> },
                { key: 'price', header: 'Square price', align: 'right', render: v => v.squarePrice != null ? formatMoney(v.squarePrice) : <Muted>Per sale</Muted> },
                { key: 'state', header: 'Here', render: v => <ImportState result={v} /> },
                { key: 'action', header: '', align: 'right', width: 150, render: v => <ImportAction result={v} /> },
              ]} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ImportState({ result: r }: { result: CatalogSearchResult }) {
  if (r.isVariablePricing) {
    return <span><Badge tone="neutral">Priced per sale</Badge><br /><Muted>Give it a fixed price in Square to add it.</Muted></span>;
  }
  if (!r.isInCatalog) return <Muted>Not added</Muted>;
  if (!r.isActive) return <Badge tone="neutral">Discontinued here</Badge>;
  if (r.priceIsStale) {
    return <span><Badge tone="warning" dot>Price out of date</Badge><br /><Muted>Here {formatMoney(r.localPrice)} — sync to take Square’s.</Muted></span>;
  }
  return <Badge tone="success" dot>In the catalog</Badge>;
}

function ImportAction({ result: r }: { result: CatalogSearchResult }) {
  const api = useApi();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const add = useMutation({
    mutationFn: () => api.products.import(r.squareVariationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast({ title: r.isInCatalog ? `${r.name} is back in the catalog` : `Added ${r.name}`, message: `At Square’s price, ${formatMoney(r.squarePrice)}.` });
    },
    onError: err => toast({ tone: 'danger', title: `Couldn’t add ${r.name}`, message: errorMessage(err) }),
  });
  if (r.isVariablePricing) return null;
  if (r.canImport || (r.isInCatalog && !r.isActive)) {
    return (
      <Button size="sm" variant={r.canImport ? 'primary' : 'secondary'} iconLeft="plus" onClick={() => add.mutate()} disabled={add.isPending} aria-label={`${r.canImport ? 'Add' : 'Add back'} ${r.name}`}>
        {add.isPending ? 'Adding…' : r.canImport ? 'Add' : 'Add back'}
      </Button>
    );
  }
  return <Button size="sm" variant="ghost" onClick={() => navigate(`/products/${r.productId}`)} aria-label={`Open ${r.name}`}>Open</Button>;
}
