// /users/* — list, new, detail, edit. Create and edit are gated on the operations they call.
import { Route, Routes } from 'react-router-dom';
import { useSession } from '../../session/SessionProvider';
import { NotFoundPage } from '../StatusPages';
import { EditUserPage } from './EditUserPage';
import { NewUserPage } from './NewUserPage';
import { UserDetailPage } from './UserDetailPage';
import { UsersListPage } from './UsersListPage';

export function UsersRoutes() {
  const { canCall } = useSession();
  return (
    <Routes>
      <Route index element={<UsersListPage />} />
      {canCall('POST /api/users') ? <Route path="new" element={<NewUserPage />} /> : null}
      <Route path=":userId" element={<UserDetailPage />} />
      {canCall('PUT /api/users/{userId}') ? <Route path=":userId/edit" element={<EditUserPage />} /> : null}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
