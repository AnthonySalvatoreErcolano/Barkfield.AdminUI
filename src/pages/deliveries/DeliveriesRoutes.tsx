// /deliveries/* — worklist, generate, one-off, prep sheet, detail. Each gated on the operation it calls.
import { Route, Routes } from 'react-router-dom';
import { useSession } from '../../session/SessionProvider';
import { NotFoundPage } from '../StatusPages';
import { DeliveriesListPage } from './DeliveriesListPage';
import { DeliveryDetailPage } from './DeliveryDetailPage';
import { GenerateDeliveriesPage } from './GenerateDeliveriesPage';
import { NewOneOffDeliveryPage } from './NewOneOffDeliveryPage';
import { PrepSheetPage } from './PrepSheetPage';

export function DeliveriesRoutes() {
  const { canCall } = useSession();
  return (
    <Routes>
      <Route index element={<DeliveriesListPage />} />
      {canCall('GET /api/deliveries/due') ? <Route path="generate" element={<GenerateDeliveriesPage />} /> : null}
      {canCall('POST /api/deliveries') ? <Route path="new" element={<NewOneOffDeliveryPage />} /> : null}
      {canCall('GET /api/deliveries/sheet') ? <Route path="sheet" element={<PrepSheetPage />} /> : null}
      <Route path=":deliveryId" element={<DeliveryDetailPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
