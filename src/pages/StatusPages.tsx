// Placeholder and dead-end pages.
import { Link } from 'react-router-dom';
import { PageHeader } from '../app/layout';
import type { Screen } from '../app/nav';
import { Card } from '../ui';

/** A nav destination whose screen is not built yet. Removed screen by screen as they land. */
export function NotBuiltPage({ screen }: { screen: Screen }) {
  return (
    <div>
      <PageHeader title={screen.label} />
      <Card>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>This screen hasn’t been built yet.</p>
      </Card>
    </div>
  );
}

/**
 * Reached by typing a URL for a screen the user's permissions don't cover — the nav never links there.
 * Said plainly rather than as an error, because nothing went wrong.
 */
export function NoAccessPage({ screen }: { screen: Screen }) {
  return (
    <div>
      <PageHeader title={screen.label} />
      <Card>
        <p style={{ margin: 0 }}>Your account doesn’t include {screen.label.toLowerCase()}. If you need it, ask a manager to add it to your role.</p>
      </Card>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div>
      <PageHeader title="Page not found" />
      <Card>
        <p style={{ margin: 0 }}>There’s nothing at this address. <Link to="/">Go to the dashboard</Link>.</p>
      </Card>
    </div>
  );
}
