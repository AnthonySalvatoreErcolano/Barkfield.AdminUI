// Product detail (PAGES.md §4): what Square says it is and costs, when we last checked, where it's used,
// and the item's other sizes. Re-sync, discontinue and restore from here; there is no edit — Square owns it.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { errorMessage, NotFoundError } from '../../api/errors';
import type { Product } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { useToast } from '../../app/toast';
import { formatInstant, formatMoney, plural } from '../../lib/format';
import { Can, useApi } from '../../session/SessionProvider';
import { Alert, Badge, Breadcrumbs, Button, Card, DataTable, DetailField, Dialog, Muted } from '../../ui';
import { productKeys } from './keys';

export function ProductDetailPage() {
  const { productId = '' } = useParams();
  const api = useApi();
  const { data, error, refetch } = useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: ({ signal }) => api.products.get(productId, signal),
  });
  if (error) return <LoadError error={error} onRetry={() => refetch()} what="this product" />;
  if (!data) return <p style={{ color: 'var(--text-muted)' }}>Loading…</p>;
  return <ProductView product={data} />;
}

function ProductView({ product }: { product: Product }) {
  const navigate = useNavigate();
  const [confirmDiscontinue, setConfirmDiscontinue] = useState(false);

  return (
    <div>
      <PageHeader
        title={product.name}
        actions={<Can call="POST /api/products/{productId}/sync">
          <SyncButton product={product} />
          {product.isActive
            ? <Button variant="danger" onClick={() => setConfirmDiscontinue(true)}>Discontinue</Button>
            : <RestoreButton product={product} />}
        </Can>}
      >
        <Breadcrumbs style={{ marginBottom: 14 }} onNavigate={navigate} items={[{ label: 'Products', href: '/products' }, { label: product.name }]} />
      </PageHeader>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: -12, marginBottom: 20, flexWrap: 'wrap' }}>
        {product.isActive ? <Badge tone="success" dot>In the catalog</Badge> : <Badge tone="neutral" dot>Discontinued</Badge>}
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {product.lastSyncedAt ? `Last synced with Square ${formatInstant(product.lastSyncedAt, true)}` : 'Never synced with Square'}
        </span>
      </div>

      {!product.isActive ? (
        <Alert tone="info" style={{ marginBottom: 16 }}>
          Discontinued products don’t appear when adding to a subscription or a delivery.
          {product.subscriptionUsageCount ? ` ${plural(product.subscriptionUsageCount, 'subscription line')} still include it, and each of those subscriptions flags it.` : ''}
        </Alert>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        <Card title="From Square" eyebrow="Change these in Square, then sync">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <DetailField label="Price">
              <span style={{ fontSize: 20, fontWeight: 700 }}>{formatMoney(product.price)}</span>
            </DetailField>
            <DetailField label="SKU">{product.sku ?? <Muted>None</Muted>}</DetailField>
            <DetailField label="Item">{product.itemName ?? <Muted>None</Muted>}</DetailField>
            <DetailField label="Variation">{product.variationName ?? <Muted>None</Muted>}</DetailField>
            <DetailField label="Square variation ID"><code style={{ fontSize: 13 }}>{product.squareCatalogObjectId}</code></DetailField>
            <DetailField label="Added here">{formatInstant(product.createdAt)}</DetailField>
          </div>
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="Where it’s used">
            <p style={{ margin: 0, fontSize: 15 }}>
              {product.subscriptionUsageCount
                ? <>On <strong>{plural(product.subscriptionUsageCount, 'subscription line')}</strong> — standing items, rotations and add-ons together.</>
                : 'Not on any subscription.'}
            </p>
            <p style={{ margin: '10px 0 0', fontSize: 13.5, color: 'var(--text-muted)' }}>
              Delivery history keeps the name and price as they were, whatever happens to it here.
            </p>
          </Card>
          {product.squareItemId ? <OtherSizes product={product} /> : null}
        </div>
      </div>

      {confirmDiscontinue ? <DiscontinueDialog product={product} onClose={() => setConfirmDiscontinue(false)} /> : null}
    </div>
  );
}

/** The same Square item's other variations that are in our catalog — the sizes of one product. */
function OtherSizes({ product }: { product: Product }) {
  const api = useApi();
  const navigate = useNavigate();
  const query = { squareItemId: product.squareItemId!, includeInactive: true, pageSize: 50 };
  const { data } = useQuery({ queryKey: productKeys.list(query), queryFn: ({ signal }) => api.products.list(query, signal) });
  const others = (data?.items ?? []).filter(p => p.id !== product.id);
  if (!others.length) return null;
  return (
    <Card title="Other sizes here" flush>
      <DataTable rows={others} rowKey={p => p.id} onRowClick={p => navigate(`/products/${p.id}`)} density="compact"
        columns={[
          { key: 'name', header: 'Product', render: p => <span>{p.variationName ?? p.name}{!p.isActive ? <> <Badge tone="neutral">Discontinued</Badge></> : null}</span> },
          { key: 'price', header: 'Price', align: 'right', render: p => formatMoney(p.price) },
        ]} />
    </Card>
  );
}

function SyncButton({ product }: { product: Product }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const sync = useMutation({
    mutationFn: () => api.products.sync(product.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast({ title: 'Synced with Square' });
    },
    onError: err => toast({
      tone: 'danger',
      title: err instanceof NotFoundError ? 'Gone from Square' : 'Couldn’t sync',
      // Nothing was changed on failure: the price here stays what it was.
      message: `${errorMessage(err)}${err instanceof NotFoundError ? ' The price here is unchanged — discontinue it if it’s no longer sold.' : ''}`,
    }),
  });
  return <Button variant="secondary" iconLeft="refresh-cw" onClick={() => sync.mutate()} disabled={sync.isPending}>{sync.isPending ? 'Syncing…' : 'Sync from Square'}</Button>;
}

function DiscontinueDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const discontinue = useMutation({
    mutationFn: () => api.products.deactivate(product.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast({ title: `${product.name} discontinued` });
      onClose();
    },
  });
  return (
    <Dialog open size="sm" onClose={discontinue.isPending ? undefined : onClose} title={`Discontinue ${product.name}?`}
      description="It stops appearing when adding to subscriptions and deliveries. Nothing is deleted, and you can restore it."
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={discontinue.isPending}>Keep</Button>
        <Button variant="danger" onClick={() => discontinue.mutate()} disabled={discontinue.isPending}>{discontinue.isPending ? 'Discontinuing…' : 'Discontinue'}</Button>
      </>}>
      {product.subscriptionUsageCount ? (
        <Alert tone="warning" title={`Still on ${plural(product.subscriptionUsageCount, 'subscription line')}`}>
          Those subscriptions keep it and will go on putting it in boxes until someone swaps it out — each one flags it as discontinued.
        </Alert>
      ) : null}
      {discontinue.error ? <Alert tone="danger" style={{ marginTop: 12 }}>{errorMessage(discontinue.error)}</Alert> : null}
    </Dialog>
  );
}

function RestoreButton({ product }: { product: Product }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const restore = useMutation({
    mutationFn: () => api.products.reactivate(product.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast({ title: `${product.name} restored`, message: 'Sync it to pick up Square’s current price.' });
    },
    onError: err => toast({ tone: 'danger', title: 'Couldn’t restore', message: errorMessage(err) }),
  });
  return <Button onClick={() => restore.mutate()} disabled={restore.isPending}>{restore.isPending ? 'Restoring…' : 'Restore'}</Button>;
}
