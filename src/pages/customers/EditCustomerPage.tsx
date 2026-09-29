// Edit a customer's contact and address. Saves through useGuardedSave: re-read first, and if someone
// else changed the record, their values are folded in and shown before anything is saved.
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { errorMessage, ValidationError } from '../../api/errors';
import type { CustomerDetail } from '../../api/ports';
import { PageHeader } from '../../app/layout';
import { LoadError } from '../../app/LoadError';
import { useToast } from '../../app/toast';
import { useGuardedSave } from '../../app/useGuardedSave';
import { useApi } from '../../session/SessionProvider';
import { Breadcrumbs, Card } from '../../ui';
import { CustomerForm, toCustomerForm, toCustomerRequest, validateCustomer, type CustomerFormValues } from './CustomerForm';
import { customerKeys } from './keys';
import type { CustomerDetailState } from './CustomerDetailPage';

export function EditCustomerPage() {
  const { customerId = '' } = useParams();
  const api = useApi();
  const { data, error, refetch } = useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn: ({ signal }) => api.customers.get(customerId, signal),
    // Always start the form from the record as it is now, not a cached copy.
    staleTime: 0,
    refetchOnMount: 'always',
  });
  if (error) return <LoadError error={error} onRetry={() => refetch()} what="this customer" />;
  if (!data) return <p style={{ color: 'var(--text-muted)' }}>Loading…</p>;
  return <EditCustomerForm key={data.id} customer={data} />;
}

function EditCustomerForm({ customer }: { customer: CustomerDetail }) {
  const api = useApi();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const initial = toCustomerForm(customer);
  const [values, setValues] = useState<CustomerFormValues>(initial);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const detailUrl = `/customers/${customer.id}`;

  const { submit, notice } = useGuardedSave({
    initial,
    reread: async () => toCustomerForm(await api.customers.get(customer.id)),
    save: v => api.customers.update(customer.id, toCustomerRequest(v)),
  });

  const errors = tried ? validateCustomer(values) : {};

  const onSubmit = async () => {
    setTried(true);
    if (Object.keys(validateCustomer(values)).length) return;
    setBusy(true);
    setFormError(null);
    setServerErrors({});
    try {
      const outcome = await submit(values);
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      if (outcome.status === 'stale') {
        setValues(outcome.merged);
        return;
      }
      const { squareSynced, squareError } = outcome.result;
      if (squareSynced) toast({ title: 'Customer saved' });
      navigate(detailUrl, { state: squareSynced ? undefined : { squareError } satisfies CustomerDetailState });
    } catch (err) {
      if (err instanceof ValidationError && Object.keys(err.fieldErrors).length) setServerErrors(err.fieldErrors);
      else setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const name = customer.fullName ?? `${customer.firstName} ${customer.lastName}`;
  return (
    <div>
      <PageHeader title={`Edit ${name}`}>
        <Breadcrumbs style={{ marginBottom: 14 }} onNavigate={navigate}
          items={[{ label: 'Customers', href: '/customers' }, { label: name, href: detailUrl }, { label: 'Edit' }]} />
      </PageHeader>
      <Card style={{ maxWidth: 860 }}>
        <CustomerForm values={values} onChange={setValues} onSubmit={onSubmit} onCancel={() => navigate(detailUrl)}
          submitLabel="Save changes" busy={busy} errors={errors} serverErrors={serverErrors} formError={formError} stale={notice} />
      </Card>
    </div>
  );
}
