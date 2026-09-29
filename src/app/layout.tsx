// Page-level layout pieces shared across screens.
import { useEffect, useState, type ReactNode } from 'react';
import logoUrl from '../../design/assets/logos/logo.svg';
import { injectStyles } from '../ui/injectStyles';

const CSS = [
'.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:24px}',
'.page-head__eyebrow{font-family:var(--font-display);font-weight:700;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--tan-700);margin-bottom:6px}',
'.page-head__title{font:var(--type-h1);letter-spacing:var(--tracking-display);text-transform:uppercase;color:var(--teal-500)}',
'.page-head__actions{display:flex;gap:8px}',
'.auth{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px 16px;background:var(--bg-app)}',
'.auth__card{width:100%;max-width:420px;background:var(--surface-card);border:1px solid var(--border-default);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);padding:32px 32px 28px}',
'.auth__logo{display:block;width:176px;height:auto;margin:0 auto 20px}',
'.auth__title{font-family:var(--font-display);font-weight:900;font-size:22px;letter-spacing:var(--tracking-display);text-transform:uppercase;color:var(--teal-500);text-align:center;margin-bottom:6px}',
'.auth__lede{font-family:var(--font-body);font-size:15px;color:var(--text-secondary);text-align:center;margin:0 0 22px;line-height:1.45}',
'.auth__form{display:flex;flex-direction:column;gap:16px}',
'.auth__foot{margin-top:18px;text-align:center;font-size:14.5px}',
].join('');

/** Page title block, as in design/ui_kits/autoship-admin/Shell.jsx. */
export function PageHeader({ eyebrow, title, actions, children }: { eyebrow?: ReactNode; title: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  injectStyles('layout', CSS);
  return (
    <div className="page-head">
      <div>
        {children}
        {eyebrow ? <div className="page-head__eyebrow">{eyebrow}</div> : null}
        <h1 className="page-head__title">{title}</h1>
      </div>
      {actions ? <div className="page-head__actions">{actions}</div> : null}
    </div>
  );
}

/** The centred card that sign-in, forgot-password and reset-password sit in. */
export function AuthCard({ title, lede, children, footer }: { title: ReactNode; lede?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  injectStyles('layout', CSS);
  return (
    <main className="auth">
      <div className="auth__card">
        <img className="auth__logo" src={logoUrl} alt="Barkfield Road" />
        <h1 className="auth__title">{title}</h1>
        {lede ? <p className="auth__lede">{lede}</p> : null}
        {children}
        {footer ? <div className="auth__foot">{footer}</div> : null}
      </div>
    </main>
  );
}

/** Full-page state while the session is being restored on load. Says so if it takes more than a moment. */
export function Splash() {
  injectStyles('layout', CSS);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 2500);
    return () => clearTimeout(t);
  }, []);
  return (
    <main className="auth" aria-busy="true" style={{ flexDirection: 'column' }}>
      <img className="auth__logo" src={logoUrl} alt="Barkfield Road — loading" />
      {slow ? <p className="auth__lede" role="status">Connecting to the server…</p> : null}
    </main>
  );
}
