// /customers/* — list, new, detail, edit. Create and edit are gated on the operations they call.
import { Route, Routes } from 'react-router-dom';
import { useSession } from '../../session/SessionProvider';
import { NotFoundPage } from '../StatusPages';
import { CustomerDetailPage } from './CustomerDetailPage';
import { CustomersListPage } from './CustomersListPage';
import { EditCustomerPage } from './EditCustomerPage';
import { NewCustomerPage } from './NewCustomerPage';

export function CustomersRoutes() {
  const { canCall } = useSession();
  return (
    <Routes>
      <Route index element={<CustomersListPage />} />
      {canCall('POST /api/customers') ? <Route path="new" element={<NewCustomerPage />} /> : null}
      <Route path=":customerId" element={<CustomerDetailPage />} />
      {canCall('PUT /api/customers/{customerId}') ? <Route path=":customerId/edit" element={<EditCustomerPage />} /> : null}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
