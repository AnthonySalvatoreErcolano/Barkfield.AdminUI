// Compile-time checks on http.ts's typing over the generated contract. The functions are never called:
// `tsc` is what runs these. Each @ts-expect-error fails the typecheck if the mistake starts compiling.

import type { components } from './generated/schema';
import { FrequencyUnit } from './generated/enums';
import { http } from './http';

type Schemas = components['schemas'];

function typeChecks() {
  expectTypeOf(http.get('/api/users/me')).resolves.toEqualTypeOf<Schemas['UserDetailDto']>();
  expectTypeOf(http.get('/api/customers')).resolves.toEqualTypeOf<Schemas['PagedResultOfCustomerListItemDto']>();

  // Path parameters are required where the route has them.
  http.get('/api/customers/{customerId}', { path: { customerId: 'id' } });
  // @ts-expect-error — missing the customerId path parameter
  http.get('/api/customers/{customerId}');

  // Query keys come from the spec.
  http.get('/api/customers', { query: { searchTerm: 'russo', includeInactive: true } });
  // @ts-expect-error — not a query parameter of this endpoint
  http.get('/api/customers', { query: { search: 'russo' } });

  // Enums are sent as integers.
  http.put('/api/subscriptions/{subscriptionId}/frequency', {
    path: { subscriptionId: 'id' },
    body: { frequencyInterval: 2, frequencyUnit: FrequencyUnit.Weeks },
  });
  http.put('/api/subscriptions/{subscriptionId}/frequency', {
    path: { subscriptionId: 'id' },
    // @ts-expect-error — the name, not the number
    body: { frequencyInterval: 2, frequencyUnit: 'Weeks' },
  });

  // A GET has no body; a write with a required body must carry one.
  // @ts-expect-error — GET takes no body
  http.get('/api/users/me', { body: {} });
  // @ts-expect-error — login needs its body
  http.post('/api/auth/login');

  // @ts-expect-error — no such path
  http.get('/api/customer');
}

it('is checked by tsc, not at runtime', () => {
  expect(typeChecks).toBeTypeOf('function');
});
