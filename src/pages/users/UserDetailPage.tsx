// User detail (PAGES.md §9): the account, the roles held, and what that adds up to — the flat permission
// list the API itself enforces. Deactivate and restore from here; your own account can't be deactivated.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { errorMessage } from '../../api/errors';
import type { UserDetail } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { useToast } from '../../app/toast';
import { formatInstant } from '../../lib/format';
import { Can, useApi, useSession } from '../../session/SessionProvider';
import { Alert, Badge, Breadcrumbs, Button, Card, Chip, DetailField, Dialog, Muted } from '../../ui';
import { userKeys } from './keys';

export function UserDetailPage() {
  const { userId = '' } = useParams();
  const api = useApi();
  const { data, error, refetch } = useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: ({ signal }) => api.users.get(userId, signal),
  });
  if (error) return <LoadError error={error} onRetry={() => refetch()} what="this user" />;
  if (!data) return <p style={{ color: 'var(--text-muted)' }}>Loading…</p>;
  return <UserView user={data} />;
}

// The permission names are `area:action`. Shown grouped by area, in the sidebar's order.
const AREAS: Array<[string, string]> = [
  ['customer', 'Customers'], ['subscription', 'Subscriptions'], ['delivery', 'Deliveries'],
  ['dispatch', 'Dispatch'], ['billing', 'Billing'], ['product', 'Products'], ['user', 'Users'],
];
const ACTION_WORDS: Record<string, string> = {
  view: 'See', create: 'Add', edit: 'Change', delete: 'Remove', manage: 'Manage', pack: 'Pack', send: 'Send', charge: 'Charge',
};

/** See, add, change, remove, then the rest — not the alphabetical order the API sends. */
const order = (action: string) => {
  const i = Object.keys(ACTION_WORDS).indexOf(action);
  return i < 0 ? 99 : i;
};

function permissionGroups(permissions: string[]) {
  const known = new Set(AREAS.map(([a]) => a));
  const groups = AREAS.map(([area, label]) => ({
    label, actions: permissions.filter(p => p.startsWith(area + ':')).map(p => p.slice(area.length + 1)).sort((a, b) => order(a) - order(b)),
  })).filter(g => g.actions.length);
  // Anything new the API grants still shows, under its raw name.
  const other = permissions.filter(p => !known.has(p.split(':')[0]!));
  if (other.length) groups.push({ label: 'Other', actions: other });
  return groups;
}

function UserView({ user }: { user: UserDetail }) {
  const navigate = useNavigate();
  const { user: me } = useSession();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const isSelf = user.id === me.id;

  return (
    <div>
      <PageHeader
        title={user.name}
        actions={<>
          <Can call="PUT /api/users/{userId}">
            <Button variant="secondary" iconLeft="pencil" onClick={() => navigate(`/users/${user.id}/edit`)}>Edit user</Button>
          </Can>
          {user.isActive
            ? !isSelf ? <Can call="DELETE /api/users/{userId}"><Button variant="danger" onClick={() => setConfirmDeactivate(true)}>Deactivate</Button></Can> : null
            : <Can call="POST /api/users/{userId}/reactivate"><RestoreButton user={user} /></Can>}
        </>}
      >
        <Breadcrumbs style={{ marginBottom: 14 }} onNavigate={navigate} items={[{ label: 'Users', href: '/users' }, { label: user.name }]} />
      </PageHeader>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: -12, marginBottom: 20, flexWrap: 'wrap' }}>
        {user.isActive ? <Badge tone="success" dot>Active</Badge> : <Badge tone="neutral" dot>Deactivated</Badge>}
        {user.isAdmin ? <Badge tone="brand">Administrator</Badge> : null}
        {isSelf ? <Badge tone="info">You</Badge> : null}
      </div>

      {!user.isActive ? (
        <Alert tone="info" style={{ marginBottom: 16 }}>
          {user.name} can’t sign in, and nothing they try is allowed. Their account is kept because deliveries and history refer to it — restoring lets them back in with the same password.
        </Alert>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.3fr)', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="Account">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <DetailField label="Email"><a href={`mailto:${user.email}`}>{user.email}</a></DetailField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <DetailField label="Added">{formatInstant(user.createdAt)}</DetailField>
                <DetailField label="Last changed">{user.updatedAt ? formatInstant(user.updatedAt) : <Muted>Never</Muted>}</DetailField>
              </div>
              {isSelf ? (
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
                  Change your password under <a href="/account" onClick={e => { e.preventDefault(); navigate('/account'); }}>Account</a>.
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
                  Passwords aren’t set here. A forgotten one is reset from the sign-in page’s “Forgot password”.
                </p>
              )}
            </div>
          </Card>
          <Card title="Roles">
            {user.roles.length ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {user.roles.map(r => (
                  <li key={r.id}>
                    <div style={{ fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center' }}>{r.name}{r.isSystemRole ? <Badge tone="neutral">Built in</Badge> : null}</div>
                    {r.description ? <div style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>{r.description}</div> : null}
                  </li>
                ))}
              </ul>
            ) : <Muted>None</Muted>}
          </Card>
        </div>

        <Card title="What they can do" eyebrow="Permissions">
          {user.isAdmin ? (
            <Alert tone="info" style={{ marginBottom: 14 }}>As an administrator, {isSelf ? 'you pass' : `${user.name} passes`} every permission check, whatever the roles say.</Alert>
          ) : null}
          {user.permissions.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {permissionGroups(user.permissions).map(g => (
                <div key={g.label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{g.label}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {g.actions.map(a => <Chip key={a} variant="tag" size="sm">{ACTION_WORDS[a] ?? a}</Chip>)}
                  </div>
                </div>
              ))}
            </div>
          ) : <Muted>Nothing — their roles grant no permissions.</Muted>}
          <p style={{ margin: '16px 0 0', fontSize: 13.5, color: 'var(--text-muted)' }}>
            Comes from their roles, which are set up in the database — to change what a role allows, ask whoever runs the system.
          </p>
        </Card>
      </div>

      {confirmDeactivate ? <DeactivateDialog user={user} onClose={() => setConfirmDeactivate(false)} /> : null}
    </div>
  );
}

function DeactivateDialog({ user, onClose }: { user: UserDetail; onClose: () => void }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const deactivate = useMutation({
    mutationFn: () => api.users.deactivate(user.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast({ title: `${user.name} deactivated`, message: 'Restore them any time from their record.' });
      onClose();
    },
  });
  return (
    <Dialog open onClose={deactivate.isPending ? undefined : onClose} size="sm" title={`Deactivate ${user.name}?`}
      description="They’re locked out straight away — sign-in is refused and so is anything they try in an open session. Nothing is deleted, and you can restore them."
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={deactivate.isPending}>Keep</Button>
        <Button variant="danger" onClick={() => deactivate.mutate()} disabled={deactivate.isPending}>{deactivate.isPending ? 'Deactivating…' : 'Deactivate'}</Button>
      </>}>
      {deactivate.error ? <Alert tone="danger">{errorMessage(deactivate.error)}</Alert> : null}
    </Dialog>
  );
}

function RestoreButton({ user }: { user: UserDetail }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const restore = useMutation({
    mutationFn: () => api.users.reactivate(user.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast({ title: `${user.name} restored`, message: 'They can sign in again with their old password.' });
    },
    onError: err => toast({ tone: 'danger', title: 'Couldn’t restore', message: errorMessage(err) }),
  });
  return <Button iconLeft="refresh-cw" onClick={() => restore.mutate()} disabled={restore.isPending}>{restore.isPending ? 'Restoring…' : 'Restore'}</Button>;
}
