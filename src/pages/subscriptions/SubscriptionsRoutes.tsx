// /subscriptions/* — list, new, detail. Creating is gated on the operation it calls.
import { Route, Routes } from 'react-router-dom';
import { useSession } from '../../session/SessionProvider';
import { NotFoundPage } from '../StatusPages';
import { NewSubscriptionPage } from './NewSubscriptionPage';
import { SubscriptionDetailPage } from './SubscriptionDetailPage';
import { SubscriptionsListPage } from './SubscriptionsListPage';

export function SubscriptionsRoutes() {
  const { canCall } = useSession();
  return (
    <Routes>
      <Route index element={<SubscriptionsListPage />} />
      {canCall('POST /api/subscriptions') ? <Route path="new" element={<NewSubscriptionPage />} /> : null}
      <Route path=":subscriptionId" element={<SubscriptionDetailPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
