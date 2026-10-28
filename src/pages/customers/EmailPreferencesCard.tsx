// A customer's email consent, recorded by staff — consent is given across the counter far more often
// than through a form.
//   - Marketing (promotions) needs a yes. Without it no marketing email reaches them.
//   - Emails about their orders don't need consent, but a customer can ask not to get them.
// The unsubscribe token travels in mail and nowhere else; it isn't shown here, by design.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '../../api/errors';
import type { CustomerDetail } from '../../api/ports';
import { useToast } from '../../app/toast';
import { formatInstant } from '../../lib/format';
import { useApi, useSession } from '../../session/SessionProvider';
import { Card, Muted, Switch } from '../../ui';
import { notificationKeys } from '../notifications/keys';

export function EmailPreferencesCard({ customer }: { customer: CustomerDetail }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { canCall } = useSession();
  const key = notificationKeys.preferences(customer.id);
  const { data: p, error } = useQuery({ queryKey: key, queryFn: () => api.customers.notificationPreferences(customer.id) });
  const canEdit = canCall('PUT /api/customers/{customerId}/notification-preferences') && customer.isActive;

  const save = useMutation({
    mutationFn: (change: { marketingConsent?: boolean; operationalOptOut?: boolean }) =>
      api.customers.setNotificationPreferences(customer.id, {
        marketingConsent: change.marketingConsent ?? p!.marketingConsent,
        operationalOptOut: change.operationalOptOut ?? p!.operationalOptOut,
      }),
    onSuccess: (_r, change) => toast({
      title: change.marketingConsent !== undefined
        ? change.marketingConsent ? `${customer.firstName} agreed to marketing emails` : `${customer.firstName} won’t get marketing emails`
        : change.operationalOptOut ? `${customer.firstName} won’t get order emails` : `${customer.firstName} will get order emails`,
    }),
    onError: err => toast({ tone: 'danger', title: 'Couldn’t save', message: errorMessage(err) }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return (
    <Card title="Email preferences">
      {error ? <Muted>Couldn’t load email preferences.</Muted> : !p ? <Muted>Loading…</Muted> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Switch label="Agreed to marketing emails" checked={p.marketingConsent} disabled={!canEdit || save.isPending}
              onChange={on => save.mutate({ marketingConsent: on })} />
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {p.consentRecordedAt ? `Recorded ${formatInstant(p.consentRecordedAt, true)}.` : 'Never recorded — no marketing emails go out without a yes.'}
            </div>
          </div>
          <div>
            <Switch label="Emails about their orders" checked={!p.operationalOptOut} disabled={!canEdit || save.isPending}
              onChange={on => save.mutate({ operationalOptOut: !on })} />
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {p.operationalOptOut ? 'Asked not to get them — delivery, stock and payment emails are skipped.' : 'Delivery, stock and payment emails. Sent unless they ask not to.'}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
