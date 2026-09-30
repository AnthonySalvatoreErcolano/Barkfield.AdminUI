// Routes. Public: sign-in, forgot and reset password. Everything else sits behind a session, inside the
// shell, and behind the permission for the operation that feeds it.
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useSession } from '../session/SessionProvider';
import { AccountPage } from '../pages/AccountPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { LoginPage, type LoginLocationState } from '../pages/auth/LoginPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { NoAccessPage, NotBuiltPage, NotFoundPage } from '../pages/StatusPages';
import { AppShell } from './AppShell';
import { Splash } from './layout';
import { SCREENS, type Screen } from './nav';

/** Screen id → its component, as screens get built. Anything missing shows the placeholder. */
// Each screen is its own chunk, loaded the first time someone opens it.
const BUILT: Record<string, ComponentType> = {
  customers: lazy(() => import('../pages/customers/CustomersRoutes').then(m => ({ default: m.CustomersRoutes }))),
  deliveries: lazy(() => import('../pages/deliveries/DeliveriesRoutes').then(m => ({ default: m.DeliveriesRoutes }))),
  procurement: lazy(() => import('../pages/procurement/ProcurementPage').then(m => ({ default: m.ProcurementPage }))),
  billing: lazy(() => import('../pages/billing/BillingPage').then(m => ({ default: m.BillingPage }))),
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
  if (!Built) return <NotBuiltPage screen={screen} />;
  return (
    <Suspense fallback={<p style={{ color: 'var(--text-muted)' }}>Loading…</p>}>
      <Built />
    </Suspense>
  );
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
