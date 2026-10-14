// /products/* — list, add from Square, detail. Adding is gated on the import operation it calls.
import { Route, Routes } from 'react-router-dom';
import { useSession } from '../../session/SessionProvider';
import { NotFoundPage } from '../StatusPages';
import { AddFromSquarePage } from './AddFromSquarePage';
import { ProductDetailPage } from './ProductDetailPage';
import { ProductsListPage } from './ProductsListPage';

export function ProductsRoutes() {
  const { canCall } = useSession();
  return (
    <Routes>
      <Route index element={<ProductsListPage />} />
      {canCall('POST /api/products/import') ? <Route path="add" element={<AddFromSquarePage />} /> : null}
      <Route path=":productId" element={<ProductDetailPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
