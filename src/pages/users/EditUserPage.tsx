// Edit a user's name, email, roles and admin flag. Saves through useGuardedSave: users carry no revision,
// so the form re-reads first and folds in anything a colleague changed before saving over it.
//
// Editing yourself: taking away your own admin flag or a role asks first, and afterwards the session is
// re-read so the screens you can reach follow at once.
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { errorMessage } from '../../api/errors';
import type { Role, UserDetail } from '../../api/ports';
import { OPERATION_PERMISSIONS } from '../../api/generated/permissions';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { useToast } from '../../app/toast';
import { useGuardedSave } from '../../app/useGuardedSave';
import { useApi, useSession } from '../../session/SessionProvider';
import { Alert, Breadcrumbs, Button, Card, Dialog } from '../../ui';
import { userKeys } from './keys';
import { serverErrorsOf } from './serverErrors';
import { roleIdsOf, toUserForm, toUserRequest, UserForm, validateUser, type UserFormValues } from './UserForm';

export function EditUserPage() {
  const { userId = '' } = useParams();
  const api = useApi();
  const user = useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: ({ signal }) => api.users.get(userId, signal),
    // Always start the form from the record as it is now, not a cached copy.
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const roles = useQuery({ queryKey: userKeys.roles, queryFn: () => api.users.roles(), staleTime: Infinity });
  const error = user.error ?? roles.error;
  if (error) return <LoadError error={error} onRetry={() => { user.refetch(); roles.refetch(); }} what="this user" />;
  if (!user.data || !roles.data) return <p style={{ color: 'var(--text-muted)' }}>Loading…</p>;
  return <EditUserForm key={user.data.id} user={user.data} roles={roles.data} />;
}

function EditUserForm({ user, roles }: { user: UserDetail; roles: Role[] }) {
  const api = useApi();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const session = useSession();
  const isSelf = user.id === session.user.id;
  const initial = toUserForm(user);
  const [values, setValues] = useState<UserFormValues>(initial);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmSelf, setConfirmSelf] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const detailUrl = `/users/${user.id}`;

  const { submit, notice } = useGuardedSave({
    initial,
    reread: async () => toUserForm(await api.users.get(user.id)),
    save: v => api.users.update(user.id, toUserRequest(v)),
  });

  const errors = tried ? validateUser(values, 'edit') : {};

  // What you would be giving up on your own account, measured against what you hold now.
  const current = toUserForm(session.user);
  const droppedRoles = roleIdsOf(current).filter(id => !roleIdsOf(values).includes(id)).map(id => roles.find(r => r.id === id)?.name ?? id);
  const droppingAdmin = current.isAdmin === 'yes' && values.isAdmin !== 'yes';
  const givingUpAccess = isSelf && (droppingAdmin || droppedRoles.length > 0);

  const onSubmit = () => {
    setTried(true);
    if (Object.keys(validateUser(values, 'edit')).length) return;
    if (givingUpAccess) setConfirmSelf(true);
    else void save();
  };

  const save = async () => {
    setConfirmSelf(false);
    setBusy(true);
    setFormError(null);
    setServerErrors({});
    try {
      const outcome = await submit(values);
      await queryClient.invalidateQueries({ queryKey: userKeys.all });
      if (outcome.status === 'stale') {
        setValues(outcome.merged);
        return;
      }
      toast({ title: 'User saved' });
      if (isSelf) {
        const me = await session.refreshUser();
        if (!me.permissions.includes(OPERATION_PERMISSIONS['GET /api/users'])) {
          navigate('/account');
          return;
        }
      }
      navigate(detailUrl);
    } catch (err) {
      const fields = serverErrorsOf(err);
      if (fields) setServerErrors(fields);
      else setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title={`Edit ${user.name}`}>
        <Breadcrumbs style={{ marginBottom: 14 }} onNavigate={navigate}
          items={[{ label: 'Users', href: '/users' }, { label: user.name, href: detailUrl }, { label: 'Edit' }]} />
      </PageHeader>
      <Card style={{ maxWidth: 860 }}>
        <UserForm mode="edit" values={values} onChange={setValues} roles={roles} onSubmit={onSubmit} onCancel={() => navigate(detailUrl)}
          submitLabel="Save changes" busy={busy} errors={errors} serverErrors={serverErrors} formError={formError} stale={notice} isSelf={isSelf} />
      </Card>
      {confirmSelf ? (
        <Dialog open size="sm" onClose={() => setConfirmSelf(false)} title="Change your own access?"
          description="You can’t give this back to yourself — another administrator would have to."
          footer={<>
            <Button variant="ghost" onClick={() => setConfirmSelf(false)}>Go back</Button>
            <Button variant="danger" onClick={() => void save()}>Save anyway</Button>
          </>}>
          <Alert tone="warning">
            You’re giving up {[droppingAdmin ? 'the administrator flag' : null, droppedRoles.length ? `the ${droppedRoles.join(' and ')} role${droppedRoles.length > 1 ? 's' : ''}` : null].filter(Boolean).join(' and ')}.
          </Alert>
        </Dialog>
      ) : null}
    </div>
  );
}
