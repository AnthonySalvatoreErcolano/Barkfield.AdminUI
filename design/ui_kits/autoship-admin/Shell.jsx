(() => {
const { SidebarNav, Input, IconButton, Button } = window.BarkfieldRoadDesignSystem_ed681c;

function AdminShell({ page, onNav, children, onNew }) {
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-app)' }}>
      <SidebarNav
        logoSrc="../../assets/logos/logo.svg" productName="Autoship Admin"
        active={page} onSelect={onNav}
        sections={[
          { items: [
            { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
            { id: 'subscriptions', label: 'Subscriptions', icon: 'repeat', badge: 1 },
            { id: 'schedule', label: 'Delivery schedule', icon: 'calendar-days' },
            { id: 'customers', label: 'Customers', icon: 'users' }
          ] },
          { title: 'Store', items: [
            { id: 'products', label: 'Products', icon: 'package' },
            { id: 'routes', label: 'Routes', icon: 'route' },
            { id: 'settings', label: 'Settings', icon: 'settings' }
          ] }
        ]}
        footer={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--cream-300)', color: 'var(--teal-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13 }}>KN</div>
          <div style={{ flex: 1, lineHeight: 1.25 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Kevin Neglia</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Owner · East Northport</div>
          </div>
          <IconButton icon="log-out" label="Sign out" size="sm" />
        </div>}
      />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: 'var(--topbar-h)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 32px', background: 'var(--surface-card)', borderBottom: '1px solid var(--border-default)' }}>
          <Input iconLeft="search" placeholder="Search customers, pups, orders…" size="sm" style={{ width: 360 }} />
          <div style={{ flex: 1 }}></div>
          <IconButton icon="bell" label="Notifications" />
          <IconButton icon="printer" label="Print today's pick list" />
          <Button variant="accent" iconLeft="plus" size="sm" onClick={onNew}>New autoship</Button>
        </header>
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: '28px 32px 48px' }}>{children}</div>
        </main>
      </div>
    </div>
  );
}

function PageHeader({ eyebrow, title, actions, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
      <div>
        {children}
        {eyebrow ? <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--tan-700)', marginBottom: 6 }}>{eyebrow}</div> : null}
        <h1 style={{ font: 'var(--type-h1)', letterSpacing: 'var(--tracking-display)', textTransform: 'uppercase', color: 'var(--teal-500)' }}>{title}</h1>
      </div>
      {actions ? <div style={{ display: 'flex', gap: 8 }}>{actions}</div> : null}
    </div>
  );
}

Object.assign(window, { AdminShell, PageHeader });
})();
