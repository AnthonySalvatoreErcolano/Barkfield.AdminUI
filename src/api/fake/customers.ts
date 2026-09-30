// Fake CustomersPort. Behaves like the API, including where the API is awkward:
//   - search, sort (the fixed key set, unknown keys silently fall back) and paging done server-side
//   - duplicate email refused with the API's own wording, including the "reactivate them" variant
//   - Sam Whitaker's first save 409s, as if a colleague saved a moment before
//   - Tom Kearney's phone changes a few seconds after his record is read, for the re-read-before-save path
//   - Marcus Bell's Square link is broken: saves come back squareSynced:false, the first retry is an outage
import { SORT_KEYS } from '../sortKeys';
import { SubscriptionStatus } from '../generated/enums';
import { ConflictError, NotFoundError, OutageError, ValidationError } from '../errors';
import type { CustomerDetail, CustomerListItem, CustomersPort } from '../ports';
import type { Seed } from './seed';
import { toDeliveryListItem } from './deliveryModel';

export function createFakeCustomers(db: Seed, wait: () => Promise<void>): CustomersPort {
  const conflictPending = new Set(db.customers.filter(c => c.lastName === 'Whitaker').map(c => c.id));
  const driftPending = new Set(db.customers.filter(c => c.fullName === 'Tom Kearney').map(c => c.id));
  const squareBroken = new Set(db.customers.filter(c => c.lastName === 'Bell').map(c => c.id));
  let squareRetryFailed = false;

  const find = (id: string) => {
    const c = db.customers.find(x => x.id === id);
    if (!c) throw new NotFoundError(`Customer with ID '${id}' was not found.`);
    return c;
  };

  const toListItem = (c: CustomerDetail): CustomerListItem => ({
    id: c.id, firstName: c.firstName, lastName: c.lastName, fullName: c.fullName, email: c.email, phoneNumber: c.phoneNumber,
    city: c.city, squareCustomerId: c.squareCustomerId, isSyncedToSquare: c.isSyncedToSquare, isActive: c.isActive, createdAt: c.createdAt,
    petCount: db.pets.filter(p => p.customerId === c.id && p.isActive).length,
    activeSubscriptionCount: db.subscriptions.filter(s => s.customerId === c.id && s.status === SubscriptionStatus.Active).length,
  });

  const touch = (c: CustomerDetail) => { c.updatedAt = new Date().toISOString(); };

  const checkEmailFree = (email: string, exceptId?: string) => {
    const clash = db.customers.find(c => c.id !== exceptId && c.email.toLowerCase() === email.trim().toLowerCase());
    if (!clash) return;
    if (exceptId) throw new ValidationError(`Another customer already uses the email '${email}'.`);
    throw new ValidationError(clash.isActive
      ? `A customer with the email '${email}' already exists.`
      : `A deactivated customer ('${clash.fullName}') already uses the email '${email}'. Reactivate them instead of creating a duplicate.`);
  };

  const applyAddress = (c: CustomerDetail) => {
    c.hasAddress = !!(c.street && c.city);
    c.isGeocoded = c.hasAddress; // the API geocodes on save
    c.canReceiveLocalDelivery = c.isGeocoded;
    c.latitude = c.isGeocoded ? 40.9 : null;
    c.longitude = c.isGeocoded ? -73.3 : null;
  };

  const sortValue = (c: CustomerListItem, key: string): string =>
    key === 'email' ? c.email : key === 'createdAt' ? c.createdAt : key === 'city' ? c.city ?? '' : key === 'phone' ? c.phoneNumber ?? '' : `${c.lastName} ${c.firstName}`;

  return {
    async list(q) {
      await wait();
      const term = q.searchTerm?.trim().toLowerCase();
      let rows = db.customers
        .filter(c => q.includeInactive || c.isActive)
        .filter(c => q.hasSquareAccount === undefined || c.isSyncedToSquare === q.hasSquareAccount)
        .filter(c => !q.email || c.email.toLowerCase() === q.email.toLowerCase())
        .filter(c => !term || [c.firstName, c.lastName, c.email, c.phoneNumber ?? ''].some(v => v.toLowerCase().includes(term)))
        .map(toListItem);
      const allowed = SORT_KEYS['/api/customers'];
      const key = (allowed.keys as readonly string[]).includes(q.sortBy ?? '') ? q.sortBy! : allowed.default;
      rows = rows.sort((a, b) => sortValue(a, key).localeCompare(sortValue(b, key)) * (q.sortDescending ? -1 : 1));
      const pageSize = Math.min(Math.max(Number(q.pageSize ?? 25), 1), 200);
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
      const pageNumber = Math.max(Number(q.pageNumber ?? 1), 1);
      return {
        items: rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
        totalCount: rows.length, pageNumber, pageSize, totalPages,
        hasNextPage: pageNumber < totalPages, hasPreviousPage: pageNumber > 1,
      };
    },

    async get(id) {
      await wait();
      const c = find(id);
      if (driftPending.has(id)) {
        driftPending.delete(id);
        setTimeout(() => { c.phoneNumber = '6315550199'; c.notes = 'Changed number — confirmed by phone.'; touch(c); }, 4000);
      }
      return structuredClone({ ...c, pets: db.pets.filter(p => p.customerId === id && p.isActive) });
    },

    async create(body) {
      await wait();
      checkEmailFree(body.email);
      const id = crypto.randomUUID();
      const c: CustomerDetail = {
        id, email: body.email.trim(), firstName: body.firstName.trim(), lastName: body.lastName.trim(), fullName: `${body.firstName.trim()} ${body.lastName.trim()}`,
        phoneNumber: body.phoneNumber ?? null, notes: body.notes ?? null, street: body.street ?? null, city: body.city ?? null, state: body.state ?? null, zipCode: body.zipCode ?? null,
        squareCustomerId: body.squareCustomerId ?? `SQ${Math.floor(Math.random() * 90000 + 10000)}`, isSyncedToSquare: true,
        accessNotes: null, serviceDurationMinutes: 5, preferredWindowStart: null, preferredWindowEnd: null, latitude: null, longitude: null,
        isActive: true, createdAt: new Date().toISOString(), updatedAt: null, pets: [], hasAddress: false, isGeocoded: false, canReceiveLocalDelivery: false,
      };
      applyAddress(c);
      db.customers.push(c);
      return { customerId: id, squareSynced: true, squareError: null };
    },

    async update(id, body) {
      await wait();
      const c = find(id);
      if (conflictPending.has(id)) {
        // A colleague saved a moment ago: their change lands, ours is refused.
        conflictPending.delete(id);
        c.notes = 'Moved to the Tuesday run from next week.';
        touch(c);
        throw new ConflictError('This customer was changed by someone else while you were editing. Reload and try again.');
      }
      checkEmailFree(body.email, id);
      Object.assign(c, {
        firstName: body.firstName.trim(), lastName: body.lastName.trim(), fullName: `${body.firstName.trim()} ${body.lastName.trim()}`,
        email: body.email.trim(), phoneNumber: body.phoneNumber ?? null, notes: body.notes ?? null,
        street: body.street ?? null, city: body.city ?? null, state: body.state ?? null, zipCode: body.zipCode ?? null,
      });
      applyAddress(c);
      touch(c);
      return squareBroken.has(id)
        ? { customerId: id, squareSynced: false, squareError: 'Square did not accept the update: customer profile not found.' }
        : { customerId: id, squareSynced: true, squareError: null };
    },

    async archive(id) {
      await wait();
      const c = find(id);
      c.isActive = false;
      touch(c);
    },

    async restore(id) {
      await wait();
      const c = find(id);
      c.isActive = true;
      touch(c);
    },

    async updateDeliveryDetails(id, body) {
      await wait();
      const c = find(id);
      const { preferredWindowStart: start, preferredWindowEnd: end } = body;
      if ((start && !end) || (!start && end)) throw new ValidationError('A delivery window needs both a start and an end time.');
      if (start && end && end <= start) {
        throw new ValidationError(`A time window must end after it starts (got ${start.slice(0, 5)}–${end.slice(0, 5)}).`);
      }
      if (body.serviceDurationMinutes != null && (body.serviceDurationMinutes < 0 || body.serviceDurationMinutes > 480)) {
        throw new ValidationError('The field ServiceDurationMinutes must be between 0 and 480.', {
          serviceDurationMinutes: ['The field ServiceDurationMinutes must be between 0 and 480.'],
        });
      }
      c.accessNotes = body.accessNotes?.trim() || null;
      if (body.serviceDurationMinutes != null) c.serviceDurationMinutes = body.serviceDurationMinutes;
      c.preferredWindowStart = start ?? null;
      c.preferredWindowEnd = end ?? null;
      touch(c);
    },

    async searchSquare({ email, phoneNumber }) {
      await wait();
      const e = email.trim().toLowerCase();
      const phone = phoneNumber?.replace(/\D/g, '');
      return db.squareDirectory.filter(s => s.email.toLowerCase() === e || (!!phone && s.phoneNumber?.replace(/\D/g, '') === phone));
    },

    async syncSquare(id) {
      await wait();
      const c = find(id);
      if (squareBroken.has(id) && !squareRetryFailed) {
        squareRetryFailed = true;
        throw new OutageError('An upstream service is currently unavailable.');
      }
      squareBroken.delete(id);
      c.squareCustomerId ??= `SQ${Math.floor(Math.random() * 90000 + 10000)}`;
      c.isSyncedToSquare = true;
      touch(c);
      return { customerId: id, squareSynced: true, squareError: null };
    },

    async pets(id, includeInactive) {
      await wait();
      find(id);
      return structuredClone(db.pets.filter(p => p.customerId === id && (includeInactive || p.isActive)));
    },

    async subscriptions(id, includeCanceled) {
      await wait();
      find(id);
      return structuredClone(db.subscriptions.filter(s => s.customerId === id && (includeCanceled || s.status !== SubscriptionStatus.Canceled)));
    },

    async deliveries(id, { pageNumber, pageSize }) {
      await wait();
      find(id);
      const rows = db.deliveries.filter(d => d.customerId === id).sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor));
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
      return {
        items: rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize).map(d => toDeliveryListItem(structuredClone(d))),
        totalCount: rows.length, pageNumber, pageSize, totalPages, hasNextPage: pageNumber < totalPages, hasPreviousPage: pageNumber > 1,
      };
    },
  };
}
