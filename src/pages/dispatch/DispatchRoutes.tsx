// /dispatch/* — the day's board, and a route's load list.
import { Route, Routes } from 'react-router-dom';
import { NotFoundPage } from '../StatusPages';
import { DispatchPage } from './DispatchPage';
import { LoadListPage } from './LoadListPage';

export function DispatchRoutes() {
  return (
    <Routes>
      <Route index element={<DispatchPage />} />
      <Route path="routes/:routeId" element={<LoadListPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
