// Fake ProductsPort, with a stand-in for Square's catalog behind it. Behaves like the API
// (ProductService, Product.cs), including where it is awkward:
//   - Square is searched, not our catalog: results include variations never imported, each marked
//   - Acana's price has moved in Square since the last sync, so it reads as stale until synced
//   - "Pumpkin Bites" has been removed from Square: syncing it is a 404, and sync-all lists it as missing
//   - Northwest Naturals by-the-pound is priced per sale, so it can't be imported (400 with the reason)
//   - Orijen's first single sync is a Square outage (502), to show the retry path
import { SORT_KEYS } from '../sortKeys';
import { NotFoundError, OutageError, ValidationError } from '../errors';
import type { CatalogSearchResult, Product, ProductsPort } from '../ports';
import type { Seed } from './seed';

interface SquareVariation {
  variationId: string;
  itemId: string;
  itemName: string;
  variationName: string | null;
  sku: string | null;
  price: number | null;
  isVariablePricing: boolean;
}

/** Product.ComposeName: "Item — Variation", or the variation alone when it already says the item. */
export function composeName(itemName: string | null, variationName: string | null) {
  const item = itemName?.trim() ?? '';
  const variation = variationName?.trim() ?? '';
  if (!variation) return item;
  if (!item) return variation;
  return variation.toLowerCase().includes(item.toLowerCase()) ? variation : `${item} — ${variation}`;
}

function squareCatalog(db: Seed): SquareVariation[] {
  const mirrored = db.products
    .filter(p => !p.name.startsWith('Pumpkin Bites'))
    .map(p => ({
      variationId: p.squareCatalogObjectId, itemId: p.squareItemId ?? p.squareCatalogObjectId, itemName: p.name, variationName: null,
      sku: p.sku, price: p.name.startsWith('Acana') ? 104.99 : p.price, isVariablePricing: false,
    }));
  const item = (itemId: string, itemName: string, variations: Array<[string, number | null, string | null]>) =>
    variations.map(([variationName, price, sku], i) => ({
      variationId: `${itemId}-V${i + 1}`, itemId, itemName, variationName, sku, price, isVariablePricing: price === null,
    }));
  return [
    ...mirrored,
    ...item('SQITEM900', 'Ziwi Peak Air-Dried Beef', [['2.2 lb', 54.99, 'ZW-B22'], ['5.5 lb', 119.99, 'ZW-B55']]),
    ...item('SQITEM901', 'Northwest Naturals Chicken', [['Nuggets 6 lb', 39.99, 'NWN-C6'], ['By the pound', null, null]]),
    ...item('SQITEM902', 'Primal Venison', [['Primal Venison Patties 6 lb', 79.99, 'PR-VP6']]),
    ...item('SQITEM903', 'Himalayan Yak Chew', [['Small', 9.99, 'YAK-S'], ['Medium', 13.99, 'YAK-M'], ['Large', 18.99, 'YAK-L']]),
  ];
}

export function createFakeProducts(db: Seed, wait: () => Promise<void>): ProductsPort {
  const square = squareCatalog(db);
  const outagePending = new Set(db.products.filter(p => p.name.startsWith('Orijen')).map(p => p.id));

  const find = (id: string) => {
    const p = db.products.find(x => x.id === id);
    if (!p) throw new NotFoundError(`Product with ID '${id}' was not found.`);
    return p;
  };
  const now = () => new Date().toISOString();
  const syncFrom = (p: Product, v: SquareVariation) => {
    Object.assign(p, { itemName: v.itemName, variationName: v.variationName, name: composeName(v.itemName, v.variationName), price: v.price!, sku: v.sku, lastSyncedAt: now(), updatedAt: now() });
  };

  return {
    async list(q) {
      await wait();
      const term = q.searchTerm?.trim().toLowerCase();
      const allowed = SORT_KEYS['/api/products'];
      const key = (allowed.keys as readonly string[]).includes(q.sortBy ?? '') ? q.sortBy! : allowed.default;
      const value = (p: Product): string | number =>
        key === 'price' ? p.price : key === 'sku' ? p.sku ?? '' : key === 'createdAt' ? p.createdAt : key === 'lastSyncedAt' ? p.lastSyncedAt ?? '' : p.name;
      const rows = db.products
        .filter(p => q.includeInactive || p.isActive)
        .filter(p => !q.squareItemId || p.squareItemId === q.squareItemId)
        .filter(p => !term || [p.name, p.itemName ?? '', p.variationName ?? '', p.sku ?? ''].some(v => v.toLowerCase().includes(term)))
        .sort((a, b) => {
          const [x, y] = [value(a), value(b)];
          const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
          return (c || a.id.localeCompare(b.id)) * (q.sortDescending ? -1 : 1);
        });
      const pageSize = Math.min(Math.max(Number(q.pageSize ?? 25), 1), 200);
      const pageNumber = Math.max(Number(q.pageNumber ?? 1), 1);
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
      return {
        items: structuredClone(rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)),
        totalCount: rows.length, pageNumber, pageSize, totalPages, hasNextPage: pageNumber < totalPages, hasPreviousPage: pageNumber > 1,
      };
    },

    async get(id) {
      await wait();
      return structuredClone(find(id));
    },

    async searchSquare(q, limit = 50) {
      await wait();
      const term = q.trim().toLowerCase();
      if (!term) throw new ValidationError('A search term is required.');
      // Square matches items by the start of words ("salm" finds salmon, "almon" doesn't), and every
      // variation of a matching item comes back.
      const words = (s: string) => s.toLowerCase().split(/[^a-z0-9&]+/).filter(Boolean);
      const matches = (v: SquareVariation) => {
        const have = words(composeName(v.itemName, v.variationName));
        return words(term).every(t => have.some(w => w.startsWith(t)));
      };
      const items = [...new Set(square.filter(matches).map(v => v.itemId))].slice(0, limit);
      return square.filter(v => items.includes(v.itemId)).map((v): CatalogSearchResult => {
        const local = db.products.find(p => p.squareCatalogObjectId === v.variationId);
        const isInCatalog = !!local;
        return {
          productId: local?.id ?? null, squareVariationId: v.variationId, squareItemId: v.itemId,
          name: composeName(v.itemName, v.variationName), itemName: v.itemName, variationName: v.variationName ?? '',
          sku: v.sku, squarePrice: v.price, localPrice: local?.price ?? null, isVariablePricing: v.isVariablePricing,
          isActive: local?.isActive ?? false, isInCatalog, canImport: !isInCatalog && !v.isVariablePricing,
          priceIsStale: isInCatalog && v.price !== null && local!.price !== v.price,
        };
      });
    },

    async import(variationId) {
      await wait();
      const v = square.find(x => x.variationId === variationId.trim());
      if (!v) throw new NotFoundError(`Square has no catalog variation with ID '${variationId}'.`);
      const name = composeName(v.itemName, v.variationName);
      if (v.isVariablePricing || v.price === null) {
        throw new ValidationError(`'${name}' is priced per sale in Square and cannot be added to a subscription. Give it a fixed price in Square first.`);
      }
      const existing = db.products.find(p => p.squareCatalogObjectId === v.variationId);
      if (existing) {
        syncFrom(existing, v);
        existing.isActive = true;
        return existing.id;
      }
      const p: Product = {
        id: crypto.randomUUID(), squareCatalogObjectId: v.variationId, squareItemId: v.itemId, name, itemName: v.itemName,
        variationName: v.variationName, sku: v.sku, price: v.price, isActive: true, lastSyncedAt: now(), createdAt: now(),
        updatedAt: null, subscriptionUsageCount: 0,
      };
      db.products.push(p);
      return p.id;
    },

    async sync(id) {
      await wait();
      const p = find(id);
      if (outagePending.delete(id)) throw new OutageError('Square is unavailable right now. Try again shortly.');
      const v = square.find(x => x.variationId === p.squareCatalogObjectId);
      if (!v) throw new NotFoundError(`'${p.name}' no longer exists in Square (variation '${p.squareCatalogObjectId}').`);
      if (v.isVariablePricing || v.price === null) throw new ValidationError(`'${p.name}' has been changed to variable pricing in Square. Its local price was left unchanged.`);
      syncFrom(p, v);
    },

    async syncAll() {
      await wait();
      const active = db.products.filter(p => p.isActive);
      const missing: string[] = [];
      let updated = 0;
      for (const p of active) {
        const v = square.find(x => x.variationId === p.squareCatalogObjectId);
        if (!v || v.isVariablePricing || v.price === null) { missing.push(p.name); continue; }
        if (composeName(v.itemName, v.variationName) === p.name && v.price === p.price && v.sku === p.sku) continue;
        syncFrom(p, v);
        updated++;
      }
      // The API only stamps lastSyncedAt on products it changed.
      return { checked: active.length, updated, unchanged: active.length - updated - missing.length, missing, missingCount: missing.length };
    },

    async deactivate(id) {
      await wait();
      Object.assign(find(id), { isActive: false, updatedAt: now() });
    },

    async reactivate(id) {
      await wait();
      Object.assign(find(id), { isActive: true, updatedAt: now() });
    },
  };
}
