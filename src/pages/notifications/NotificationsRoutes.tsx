// /notifications/* — the notification centre (PAGES.md §10): rules, the outbox, templates, settings.
//
// One thing is on every tab: while the email transport only logs, the outbox's "Sent" means "would have
// been sent". Left implicit, a list of Sent rows reads as customers having been written to. They
// haven't, so the banner says so — plainly, and on every screen of the section.
import { useQuery } from '@tanstack/react-query';
import { Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../app/layout';
import { useApi } from '../../session/SessionProvider';
import { Alert, Tabs } from '../../ui';
import { NotFoundPage } from '../StatusPages';
import { notificationKeys } from './keys';
import { OutboxPage } from './OutboxPage';
import { RuleDetailPage } from './RuleDetailPage';
import { RulesPage } from './RulesPage';
import { SettingsPage } from './SettingsPage';
import { TemplatesPage } from './TemplatesPage';

type TabId = 'rules' | 'outbox' | 'templates' | 'settings';
const TABS: Array<{ id: TabId; label: string; path: string }> = [
  { id: 'rules', label: 'Rules', path: '/notifications' },
  { id: 'outbox', label: 'Outbox', path: '/notifications/outbox' },
  { id: 'templates', label: 'Templates', path: '/notifications/templates' },
  { id: 'settings', label: 'Settings', path: '/notifications/settings' },
];

export function NotificationsRoutes() {
  return (
    <Routes>
      <Route element={<NotificationsLayout />}>
        <Route index element={<RulesPage />} />
        <Route path="rules/:ruleId" element={<RuleDetailPage />} />
        <Route path="outbox" element={<OutboxPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function NotificationsLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const tab = TABS.find(t => t.id !== 'rules' && pathname.startsWith(t.path))?.id ?? 'rules';
  return (
    <div>
      <PageHeader title="Notifications" />
      <p style={{ margin: '-12px 0 16px', color: 'var(--text-muted)', fontSize: 14.5 }}>
        Emails the shop sends automatically. A rule says <em>when this happens, send that</em>; every email it writes lands in the outbox.
      </p>
      <TransportBanner />
      <Tabs value={tab} onChange={id => navigate(TABS.find(t => t.id === id)!.path)} tabs={TABS} style={{ marginBottom: 18 }} />
      <Outlet />
    </div>
  );
}

/** The standing warnings: the transport isn't real, and/or sending is switched off. */
function TransportBanner() {
  const api = useApi();
  const { data: s } = useQuery({ queryKey: notificationKeys.settings, queryFn: () => api.notifications.settings() });
  if (!s) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
      {!s.transportIsReal ? (
        <Alert tone="warning" title="Emails aren’t actually being sent yet">
          No email service is connected, so nothing reaches anyone’s inbox. In the outbox, <strong>“Sent” means it would have been sent</strong>.
          {s.transportDescription ? <> <span style={{ color: 'var(--text-muted)' }}>({s.transportDescription})</span></> : null}
        </Alert>
      ) : null}
      {!s.isSendingEnabled ? (
        <Alert tone="danger" title="Sending is switched off">
          The master switch in Settings is off. Rules still write their emails, but none are sent — they’re marked “not sent”.
        </Alert>
      ) : null}
    </div>
  );
}
