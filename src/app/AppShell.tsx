// The signed-in frame: white sidebar (248px), 64px top bar, content column up to 1320px — as laid out
// in design/ui_kits/autoship-admin/Shell.jsx. Nav items the user cannot use are not rendered.
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logoUrl from '../../design/assets/logos/logo.svg';
import { useSession } from '../session/SessionProvider';
import { DropdownMenu, Icon, SidebarNav, type SidebarSection } from '../ui';
import { NAV, screenForPath } from './nav';
import { injectStyles } from '../ui/injectStyles';

const CSS = [
'.app{display:flex;height:100vh;background:var(--bg-app)}',
'.app__main{flex:1;min-width:0;display:flex;flex-direction:column}',
'.app__top{height:var(--topbar-h);flex-shrink:0;display:flex;align-items:center;gap:12px;padding:0 32px;background:var(--surface-card);border-bottom:1px solid var(--border-default)}',
'.app__date{font-family:var(--font-display);font-weight:700;font-size:13px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-secondary)}',
'.app__scroll{flex:1;overflow-y:auto}',
'.app__content{max-width:var(--content-max);margin:0 auto;padding:28px 32px 48px}',
'.app__me{display:flex;align-items:center;gap:10px;width:100%}',
'.app__avatar{width:34px;height:34px;border-radius:50%;background:var(--cream-300);color:var(--teal-600);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:800;font-size:13px;flex-shrink:0}',
'.app__name{font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--text-primary);line-height:1.25}',
'.app__role{font-size:12.5px;color:var(--text-muted);line-height:1.25}',
].join('');

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join('');
}

export function AppShell({ children }: { children: ReactNode }) {
  injectStyles('app-shell', CSS);
  const { user, canCall, signOut } = useSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const sections: SidebarSection[] = NAV
    .map(section => ({
      title: section.title,
      items: section.screens
        .filter(s => !s.requires || canCall(s.requires))
        .map(s => ({ id: s.id, label: s.label, icon: s.icon, href: s.path })),
    }))
    .filter(section => section.items.length > 0);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="app">
      <SidebarNav
        logoSrc={logoUrl}
        productName="Autoship Admin"
        sections={sections}
        active={screenForPath(pathname)?.id}
        onNavigate={item => navigate(item.href!)}
        footer={
          <DropdownMenu
            placement="up"
            block
            triggerLabel={`Account menu for ${user.name}`}
            trigger={
              <span className="app__me">
                <span className="app__avatar" aria-hidden>{initials(user.name)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="app__name" style={{ display: 'block' }}>{user.name}</span>
                  <span className="app__role" style={{ display: 'block' }}>{user.roles.map(r => r.name).join(', ') || user.email}</span>
                </span>
                <Icon name="chevron-up" size={16} />
              </span>
            }
            items={[
              { label: 'My account', icon: 'user', onSelect: () => navigate('/account') },
              { divider: true },
              { label: 'Sign out', icon: 'log-out', onSelect: () => { void signOut(); } },
            ]}
          />
        }
      />
      <div className="app__main">
        <header className="app__top">
          <span className="app__date">{today}</span>
        </header>
        <main className="app__scroll">
          <div className="app__content">{children}</div>
        </main>
      </div>
    </div>
  );
}
