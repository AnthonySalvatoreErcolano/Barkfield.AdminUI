// Create a staff account (PAGES.md §9): name, email, a starting password, roles and the admin flag.
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api/errors';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { useToast } from '../../app/toast';
import { useApi } from '../../session/SessionProvider';
import { Breadcrumbs, Card } from '../../ui';
import { userKeys } from './keys';
import { serverErrorsOf } from './serverErrors';
import { EMPTY_USER, toUserRequest, UserForm, validateUser, type UserFormValues } from './UserForm';

export function NewUserPage() {
  const api = useApi();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const roles = useQuery({ queryKey: userKeys.roles, queryFn: () => api.users.roles(), staleTime: Infinity });
  const [values, setValues] = useState<UserFormValues>(EMPTY_USER);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const errors = tried ? validateUser(values, 'create') : {};

  const onSubmit = async () => {
    setTried(true);
    if (Object.keys(validateUser(values, 'create')).length) return;
    setBusy(true);
    setFormError(null);
    setServerErrors({});
    try {
      const id = await api.users.create({ ...toUserRequest(values), password: values.password });
      await queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast({ title: `${values.name.trim()} can sign in now`, message: 'Give them their password yourself — no email goes out.' });
      navigate(`/users/${id}`);
    } catch (err) {
      const fields = serverErrorsOf(err);
      if (fields) setServerErrors(fields);
      else setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (roles.error) return <LoadError error={roles.error} onRetry={() => roles.refetch()} what="the roles" />;
  return (
    <div>
      <PageHeader title="New user">
        <Breadcrumbs style={{ marginBottom: 14 }} onNavigate={navigate} items={[{ label: 'Users', href: '/users' }, { label: 'New user' }]} />
      </PageHeader>
      <Card style={{ maxWidth: 860 }}>
        {roles.data ? (
          <UserForm mode="create" values={values} onChange={setValues} roles={roles.data} onSubmit={onSubmit} onCancel={() => navigate('/users')}
            submitLabel="Create user" busy={busy} errors={errors} serverErrors={serverErrors} formError={formError} />
        ) : <p style={{ margin: 0, color: 'var(--text-muted)' }}>Loading…</p>}
      </Card>
    </div>
  );
}
