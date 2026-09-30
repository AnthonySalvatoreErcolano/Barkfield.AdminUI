// Routes. Public: sign-in, forgot and reset password. Everything else sits behind a session, inside the
// shell, and behind the permission for the operation that feeds it.
import type { ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useSession } from '../session/SessionProvider';
import { AccountPage } from '../pages/AccountPage';
import { CustomersRoutes } from '../pages/customers/CustomersRoutes';
import { DeliveriesRoutes } from '../pages/deliveries/DeliveriesRoutes';
import { ProcurementPage } from '../pages/procurement/ProcurementPage';
import { BillingPage } from '../pages/billing/BillingPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { LoginPage, type LoginLocationState } from '../pages/auth/LoginPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { NoAccessPage, NotBuiltPage, NotFoundPage } from '../pages/StatusPages';
import { AppShell } from './AppShell';
import { Splash } from './layout';
import { SCREENS, type Screen } from './nav';

/** Screen id → its component, as screens get built. Anything missing shows the placeholder. */
const BUILT: Record<string, () => ReactNode> = {
  customers: CustomersRoutes,
  deliveries: DeliveriesRoutes,
  procurement: ProcurementPage,
  billing: BillingPage,
};

function RequireSession() {
  const { state } = useSession();
  const location = useLocation();
  if (state.status === 'restoring') return <Splash />;
  if (state.status === 'signedOut') {
    // Remember where they were going, unless they signed out on purpose.
    const from = state.reason === 'signedOut' ? undefined : location.pathname + location.search;
    return <Navigate to="/login" replace state={{ from } satisfies LoginLocationState} />;
  }
  return <AppShell><Outlet /></AppShell>;
}

function ScreenRoute({ screen }: { screen: Screen }) {
  const { canCall } = useSession();
  if (screen.requires && !canCall(screen.requires)) return <NoAccessPage screen={screen} />;
  const Built = BUILT[screen.id];
  return Built ? <Built /> : <NotBuiltPage screen={screen} />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnlyWhileRestoring><LoginPage /></PublicOnlyWhileRestoring>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<RequireSession />}>
        {SCREENS.map(screen => (
          <Route key={screen.id} path={screen.path === '/' ? '/' : screen.path + '/*'} element={<ScreenRoute screen={screen} />} />
        ))}
        <Route path="/account" element={<AccountPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

/** The sign-in page waits for the restore to finish, so a signed-in reload never flashes the form. */
function PublicOnlyWhileRestoring({ children }: { children: ReactNode }) {
  return useSession().state.status === 'restoring' ? <Splash /> : children;
}
