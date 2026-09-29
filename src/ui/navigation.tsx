// SidebarNav, Tabs, Breadcrumbs — ported from design/components/navigation.
// Change from the source: nav items and crumbs with an `href` render as real links, so staff can open a
// screen in a new tab; a plain click is handed to `onNavigate` for client-side routing.
import { Fragment, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { Icon, type IconName } from './core';
import { cx, injectStyles } from './injectStyles';

/** True for a click the browser should handle itself (new tab, new window, download). */
function isModified(e: MouseEvent) {
  return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
}

// --- SidebarNav ----------------------------------------------------------------------------------

const SIDEBAR_CSS = [
'.br-side{width:var(--sidebar-w);flex-shrink:0;background:var(--surface-card);border-right:1px solid var(--border-default);color:var(--text-primary);display:flex;flex-direction:column;height:100%;min-height:0}',
'.br-side__brand{padding:20px 22px 16px;display:flex;flex-direction:column;align-items:flex-start;gap:6px;border-bottom:1px solid var(--border-subtle)}',
'.br-side__brand img{display:block;max-width:100%;height:auto}',
'.br-side__product{font-family:var(--font-display);font-weight:700;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--tan-700)}',
'.br-side__nav{flex:1;overflow-y:auto;padding:10px 12px 16px}',
'.br-side__section{font-family:var(--font-display);font-weight:700;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-400);padding:16px 12px 6px}',
'.br-side__item{display:flex;align-items:center;gap:12px;width:100%;height:40px;padding:0 12px;border:0;border-radius:var(--radius-sm);background:transparent;color:var(--ink-700);font-family:var(--font-display);font-weight:600;font-size:14px;text-align:left;cursor:pointer;text-decoration:none;transition:background var(--duration-fast) var(--ease-out),color var(--duration-fast) var(--ease-out)}',
'.br-side__item svg{color:var(--ink-500)}',
'.br-side__item:hover{background:var(--surface-hover);color:var(--teal-600)}',
'.br-side__item:hover svg{color:var(--teal-500)}',
'.br-side__item:focus-visible{outline:none;box-shadow:var(--focus-ring)}',
'.br-side__item--on,.br-side__item--on:hover{background:var(--teal-50);color:var(--teal-600);font-weight:700}',
'.br-side__item--on svg{color:var(--teal-500)}',
'.br-side__label{flex:1}',
'.br-side__badge{font-size:11px;font-weight:700;padding:3px 7px;border-radius:var(--radius-pill);background:var(--terracotta-500);color:#fff}',
'.br-side__foot{padding:14px 18px 16px;border-top:1px solid var(--border-subtle)}',
].join('');

export interface SidebarItem {
  id: string;
  label: string;
  icon?: IconName;
  href?: string;
  badge?: ReactNode;
}

export interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

export interface SidebarNavProps {
  sections: SidebarSection[];
  active?: string;
  onNavigate?: (item: SidebarItem) => void;
  logoSrc?: string;
  logoAlt?: string;
  productName?: string;
  footer?: ReactNode;
  style?: CSSProperties;
}

export function SidebarNav({ sections, active, onNavigate, logoSrc, logoAlt = 'Barkfield Road', productName, footer, style }: SidebarNavProps) {
  injectStyles('sidebarnav', SIDEBAR_CSS);
  return (
    <aside className="br-side" style={style}>
      <div className="br-side__brand">
        {logoSrc ? <img src={logoSrc} alt={logoAlt} width={176} /> : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, letterSpacing: '.01em' }}>BARKFIELD ROAD</span>}
        {productName ? <span className="br-side__product">{productName}</span> : null}
      </div>
      <nav className="br-side__nav" aria-label="Main">
        {sections.map((s, si) => (
          <div key={si}>
            {s.title ? <div className="br-side__section">{s.title}</div> : null}
            {s.items.map(it => {
              const on = active === it.id;
              const body = (
                <>
                  {it.icon ? <Icon name={it.icon} size={19} /> : null}
                  <span className="br-side__label">{it.label}</span>
                  {it.badge != null ? <span className="br-side__badge">{it.badge}</span> : null}
                </>
              );
              const cls = cx('br-side__item', on && 'br-side__item--on');
              return it.href ? (
                <a key={it.id} href={it.href} className={cls} aria-current={on ? 'page' : undefined}
                  onClick={e => { if (isModified(e) || !onNavigate) return; e.preventDefault(); onNavigate(it); }}>{body}</a>
              ) : (
                <button key={it.id} type="button" className={cls} aria-current={on ? 'page' : undefined} onClick={() => onNavigate?.(it)}>{body}</button>
              );
            })}
          </div>
        ))}
      </nav>
      {footer ? <div className="br-side__foot">{footer}</div> : null}
    </aside>
  );
}

// --- Tabs ----------------------------------------------------------------------------------------

const TABS_CSS = [
'.br-tabs{display:flex;align-items:flex-end;gap:24px;border-bottom:1px solid var(--border-default)}',
'.br-tab{position:relative;display:inline-flex;align-items:center;gap:8px;height:42px;border:0;background:transparent;padding:0;font-family:var(--font-display);font-weight:700;font-size:13px;letter-spacing:var(--tracking-label);text-transform:uppercase;color:var(--text-muted);cursor:pointer;transition:color var(--duration-fast) var(--ease-out);padding-top:2px}',
'.br-tab:hover{color:var(--text-brand)}',
'.br-tab:focus-visible{outline:none;box-shadow:var(--focus-ring);border-radius:var(--radius-xs)}',
'.br-tab--on{color:var(--teal-500)}',
'.br-tab--on::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:3px;background:var(--teal-500);border-radius:2px 2px 0 0}',
'.br-tab__count{font-size:11px;padding:3px 6px 2px;border-radius:var(--radius-pill);background:var(--ink-100);color:var(--text-secondary);letter-spacing:0}',
'.br-tab--on .br-tab__count{background:var(--teal-50);color:var(--teal-600)}',
'.br-tabs--pill{border:0;gap:4px;background:var(--surface-sunken);padding:4px;border-radius:var(--radius-md);display:inline-flex;align-items:center}',
'.br-tabs--pill .br-tab{height:30px;padding:2px 12px 0;border-radius:var(--radius-sm);font-size:12px}',
'.br-tabs--pill .br-tab--on{background:var(--surface-card);box-shadow:var(--shadow-sm)}',
'.br-tabs--pill .br-tab--on::after{display:none}',
].join('');

export interface TabItem<Id extends string> {
  id: Id;
  label: ReactNode;
  count?: number | null;
}

export interface TabsProps<Id extends string> {
  tabs: TabItem<Id>[];
  value: Id;
  onChange: (id: Id) => void;
  variant?: 'line' | 'pill';
  style?: CSSProperties;
}

export function Tabs<Id extends string>({ tabs, value, onChange, variant = 'line', style }: TabsProps<Id>) {
  injectStyles('tabs', TABS_CSS);
  return (
    <div role="tablist" className={cx('br-tabs', variant === 'pill' && 'br-tabs--pill')} style={style}>
      {tabs.map(t => (
        <button key={t.id} role="tab" type="button" aria-selected={value === t.id} className={cx('br-tab', value === t.id && 'br-tab--on')} onClick={() => onChange(t.id)}>
          {t.label}{t.count != null ? <span className="br-tab__count">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

// --- Breadcrumbs ---------------------------------------------------------------------------------

const CRUMBS_CSS = [
'.br-crumbs{display:flex;align-items:center;flex-wrap:wrap;gap:6px;font-family:var(--font-display);font-weight:600;font-size:13px;color:var(--text-muted)}',
'.br-crumbs a,.br-crumbs button{color:var(--text-secondary);text-decoration:none;background:none;border:0;padding:0;font:inherit;cursor:pointer}',
'.br-crumbs a:hover,.br-crumbs button:hover{color:var(--text-brand);text-decoration:underline;text-underline-offset:3px}',
'.br-crumbs__cur{color:var(--text-primary)}',
].join('');

export interface Crumb {
  label: ReactNode;
  href?: string;
  onClick?: () => void;
}

export function Breadcrumbs({ items, onNavigate, style }: { items: Crumb[]; onNavigate?: (href: string) => void; style?: CSSProperties }) {
  injectStyles('breadcrumbs', CRUMBS_CSS);
  return (
    <nav className="br-crumbs" aria-label="Breadcrumb" style={style}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={i}>
            {last ? <span className="br-crumbs__cur" aria-current="page">{it.label}</span>
              : it.href ? <a href={it.href} onClick={e => { if (isModified(e) || !onNavigate) return; e.preventDefault(); onNavigate(it.href!); }}>{it.label}</a>
              : <button type="button" onClick={it.onClick}>{it.label}</button>}
            {!last ? <Icon name="chevron-right" size={14} /> : null}
          </Fragment>
        );
      })}
    </nav>
  );
}
