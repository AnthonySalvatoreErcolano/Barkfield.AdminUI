// Seed data for the fake API. Deterministic, so screenshots and tests see the same shop every time.
//
// Built to exercise the awkward cases, not just the happy path:
//   - Daniella Russo holds two subscriptions on different cycles
//   - Alicia and Tom Moreno share one address in Northport (one stop, two boxes)
//   - Marcus Bell's Square link is broken (not synced; his first retry fails)
//   - Priya Shah is archived; Greg Olsen has no address; Hannah Lee's address is not geocoded
//   - Sam Whitaker is being edited by someone else: his first save returns a 409
//   - Tom Kearney's record changes behind your back a few seconds after you open it

import { DeliveryStatus, FrequencyUnit, FulfillmentMethod, PaymentStatus, PetType, ProcurementStatus, SubscriptionStatus } from '../generated/enums';
import type { CustomerDetail, DeliveryListItem, Pet, SquareCandidate, SubscriptionListItem } from '../ports';

// A fixed "today" for the seed, so relative dates read sensibly. Deliveries are laid out around it.
const TODAY = new Date(Date.UTC(2026, 8, 29)); // Tue 29 Sep 2026

const day = (offset: number) => new Date(TODAY.getTime() + offset * 86_400_000).toISOString().slice(0, 10) + 'T00:00:00Z';
const instant = (offset: number, hour = 14) => new Date(TODAY.getTime() + offset * 86_400_000 + hour * 3_600_000).toISOString();

let counter = 0;
const uuid = (prefix: string) => `${prefix}-0000-4000-8000-${String(++counter).padStart(12, '0')}`;

interface Person {
  first: string;
  last: string;
  town: string;
  street?: string | null;
  phone?: string;
  squareLinked?: boolean;
  active?: boolean;
  geocoded?: boolean;
  accessNotes?: string;
  window?: [string, string];
  pets?: Array<[name: string, breed: string, type?: number]>;
  plans?: Array<{ name: string | null; every: number; unit: number; total: number; status?: number; method?: number }>;
  notes?: string;
}

const PEOPLE: Person[] = [
  { first: 'Daniella', last: 'Russo', town: 'East Northport', street: '14 Laurel Hill Rd', accessNotes: 'Leave at the side gate. Gate code 4471.', window: ['09:00:00', '12:00:00'],
    pets: [['Biscuit', 'Golden Retriever']],
    plans: [{ name: 'Biscuit’s food', every: 4, unit: FrequencyUnit.Weeks, total: 89.99 }, { name: 'Bakery box', every: 2, unit: FrequencyUnit.Weeks, total: 24.5 }] },
  { first: 'Marcus', last: 'Bell', town: 'Huntington', street: '8 Woodhull Rd', squareLinked: false, pets: [['Juniper', 'Australian Shepherd']],
    plans: [{ name: null, every: 2, unit: FrequencyUnit.Weeks, total: 64.5 }], notes: 'Prefers texts to calls.' },
  { first: 'Priya', last: 'Shah', town: 'Syosset', street: '31 Jericho Tpke', active: false, pets: [['Mochi', 'Shiba Inu']],
    plans: [{ name: 'Bakery box', every: 6, unit: FrequencyUnit.Weeks, total: 38, status: SubscriptionStatus.Canceled }] },
  { first: 'Tom', last: 'Kearney', town: 'Northport', street: '52 Scudder Ave', pets: [['Rufus', 'Labrador']],
    plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 112.4 }] },
  { first: 'Alicia', last: 'Moreno', town: 'Northport', street: '22 Bayview Ave', accessNotes: 'Two households share this door — check the name on each box.', window: ['13:00:00', '16:00:00'],
    pets: [['Pepper', 'Miniature Schnauzer'], ['Salt', 'Miniature Schnauzer']],
    plans: [{ name: 'Schnauzer food', every: 3, unit: FrequencyUnit.Weeks, total: 71.25 }] },
  { first: 'Tom', last: 'Moreno', town: 'Northport', street: '22 Bayview Ave', pets: [['Olive', 'Domestic Shorthair', PetType.Cat]],
    plans: [{ name: 'Cat food', every: 1, unit: FrequencyUnit.Months, total: 42 }] },
  { first: 'Greg', last: 'Olsen', town: 'Greenlawn', street: null, pets: [['Duke', 'German Shepherd']],
    plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 94, method: FulfillmentMethod.Pickup }], notes: 'Collects in store on Saturdays. Chicken allergy.' },
  { first: 'Hannah', last: 'Lee', town: 'Centerport', street: '9 Harbor Rd', geocoded: false, pets: [['Olive', 'Cavalier King Charles']],
    plans: [{ name: null, every: 6, unit: FrequencyUnit.Weeks, total: 58.99 }] },
  { first: 'Sam', last: 'Whitaker', town: 'Kings Park', street: '140 Old Dock Rd', pets: [['Bear', 'Bernese Mountain Dog']],
    plans: [{ name: null, every: 2, unit: FrequencyUnit.Weeks, total: 0, status: SubscriptionStatus.Paused }] },
  { first: 'Chris', last: 'Pardo', town: 'Commack', street: '3 Vanderbilt Pkwy', pets: [['Ziggy', 'Beagle']], plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 61.3 }] },
  { first: 'Nina', last: 'Voss', town: 'Smithtown', street: '77 Main St', pets: [['Loki', 'Husky']], plans: [{ name: null, every: 3, unit: FrequencyUnit.Weeks, total: 88 }] },
  { first: 'Leah', last: 'Tran', town: 'Dix Hills', street: '18 Deer Park Rd', pets: [['Nori', 'Corgi']], plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 54.75, status: SubscriptionStatus.NewSignUp }] },
  { first: 'Ben', last: 'Carter', town: 'Huntington', street: '201 Park Ave', pets: [['Maple', 'Goldendoodle']], plans: [{ name: null, every: 2, unit: FrequencyUnit.Weeks, total: 47.2 }] },
  { first: 'Jo', last: 'Fitzgerald', town: 'East Northport', street: '6 Elwood Rd', pets: [['Tucker', 'Boxer']], plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 79.99 }] },
  { first: 'Ravi', last: 'Patel', town: 'Commack', street: '44 Jericho Tpke', pets: [['Kiwi', 'Pomeranian']], plans: [{ name: null, every: 5, unit: FrequencyUnit.Weeks, total: 36.4 }] },
  { first: 'Ann', last: 'Cho', town: 'Syosset', street: '12 Cold Spring Rd', pets: [['Momo', 'Maltese']], plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 41.1 }] },
  { first: 'Kate', last: 'Dunn', town: 'Northport', street: '90 Main St', pets: [['Finn', 'Irish Setter']], plans: [{ name: null, every: 3, unit: FrequencyUnit.Weeks, total: 92.3 }] },
  { first: 'Pat', last: 'Kim', town: 'Centerport', street: '15 Little Neck Rd', pets: [['Suki', 'Akita']], plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 101.5 }] },
  { first: 'Maria', last: 'Gonzalez', town: 'Kings Park', street: '8 Church St', pets: [['Coco', 'Chihuahua']], plans: [{ name: null, every: 6, unit: FrequencyUnit.Weeks, total: 28.99 }] },
  { first: 'David', last: 'Schwartz', town: 'Dix Hills', street: '301 Vanderbilt Pkwy', pets: [['Buster', 'Bulldog']], plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 73.2 }] },
  { first: 'Erin', last: 'O’Connell', town: 'Greenlawn', street: '27 Broadway', pets: [['Murphy', 'Wheaten Terrier']], plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 66 }] },
  { first: 'Luis', last: 'Ramirez', town: 'Huntington', street: '55 New York Ave', pets: [['Rocky', 'Pit Bull']], plans: [{ name: null, every: 2, unit: FrequencyUnit.Weeks, total: 58.5 }] },
  { first: 'Grace', last: 'Wu', town: 'Smithtown', street: '10 Edgewood Ave', pets: [['Dumpling', 'Pug']], plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 39.9 }] },
  { first: 'Owen', last: 'Brennan', town: 'East Northport', street: '400 Larkfield Rd', pets: [['Scout', 'Border Collie']], plans: [{ name: null, every: 3, unit: FrequencyUnit.Weeks, total: 84 }] },
  { first: 'Sofia', last: 'Rossi', town: 'Commack', street: '6 Harned Rd', pets: [['Luna', 'Labradoodle']], plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 77.7 }] },
  { first: 'Mike', last: 'Flanagan', town: 'Northport', street: '33 Ocean Ave', pets: [['Gus', 'Basset Hound']], plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 62.4 }] },
  { first: 'Rachel', last: 'Adler', town: 'Syosset', street: '19 Whitney Ave', pets: [['Pixel', 'Jack Russell']], plans: [{ name: null, every: 2, unit: FrequencyUnit.Weeks, total: 33.3 }] },
  { first: 'Kevin', last: 'Moran', town: 'Kings Park', street: '71 Indian Head Rd', pets: [['Diesel', 'Rottweiler']], plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 118 }] },
  { first: 'Lauren', last: 'Price', town: 'Centerport', street: '4 Mill Dam Rd', pets: [['Poppy', 'Cockapoo']], plans: [{ name: null, every: 5, unit: FrequencyUnit.Weeks, total: 49.5 }] },
  { first: 'Jamal', last: 'Hughes', town: 'Huntington', street: '88 Oakwood Rd', pets: [['King', 'Great Dane']], plans: [{ name: null, every: 2, unit: FrequencyUnit.Weeks, total: 139.9 }] },
  { first: 'Tess', last: 'Nolan', town: 'Dix Hills', street: '5 Half Hollow Rd', pets: [['Bella', 'Golden Retriever']], plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 91 }] },
  { first: 'Victor', last: 'Almeida', town: 'Greenlawn', street: '62 Pulaski Rd', active: false, pets: [['Tango', 'Vizsla']] },
  { first: 'Emma', last: 'Lindqvist', town: 'Smithtown', street: '14 Landing Ave', pets: [['Fika', 'Samoyed']], plans: [{ name: null, every: 3, unit: FrequencyUnit.Weeks, total: 86.6 }] },
  { first: 'Noah', last: 'Feld', town: 'Commack', street: '120 Commack Rd', squareLinked: false, pets: [['Pretzel', 'Dachshund']], plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 44.4 }] },
  { first: 'Ivy', last: 'Castellano', town: 'East Northport', street: '9 Clay Pitts Rd', pets: [['Honey', 'Shih Tzu']], plans: [{ name: null, every: 6, unit: FrequencyUnit.Weeks, total: 31.2 }] },
  { first: 'Frank', last: 'DeLuca', town: 'Northport', street: '17 Bluff Point Rd', pets: [['Sarge', 'Doberman']], plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 97.5 }] },
  { first: 'Claire', last: 'Beaumont', town: 'Huntington', street: '240 Main St', pets: [['Remy', 'French Bulldog']], plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 68.8 }] },
  { first: 'Omar', last: 'Haddad', town: 'Kings Park', street: '36 Lawrence Rd', pets: [['Sahara', 'Saluki']], plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 72 }] },
  { first: 'Beth', last: 'Sullivan', town: 'Centerport', street: '2 Prospect Rd', pets: [['Clover', 'Beagle']], plans: [{ name: null, every: 3, unit: FrequencyUnit.Weeks, total: 52.25 }] },
  { first: 'Jake', last: 'Morrison', town: 'Syosset', street: '47 Split Rock Rd', pets: [], plans: [] },
];

const ZIP: Record<string, string> = {
  'East Northport': '11731', Huntington: '11743', Syosset: '11791', Northport: '11768', Greenlawn: '11740', Centerport: '11721',
  'Kings Park': '11754', Commack: '11725', Smithtown: '11787', 'Dix Hills': '11746',
};

export interface Seed {
  customers: CustomerDetail[];
  pets: Pet[];
  subscriptions: SubscriptionListItem[];
  deliveries: DeliveryListItem[];
  /** People in Square's directory — some already ours, some not yet. */
  squareDirectory: SquareCandidate[];
}

const email = (p: Person) => `${p.first}.${p.last}`.toLowerCase().replace(/[^a-z.]/g, '') + '@example.com';

export function createSeed(): Seed {
  counter = 0;
  const customers: CustomerDetail[] = [];
  const pets: Pet[] = [];
  const subscriptions: SubscriptionListItem[] = [];
  const deliveries: DeliveryListItem[] = [];

  PEOPLE.forEach((p, i) => {
    const id = uuid('c0ffee00');
    const created = instant(-400 + i * 9);
    const hasAddress = p.street !== null;
    const customerPets: Pet[] = (p.pets ?? []).map(([name, breed, type = PetType.Dog], j) => ({
      id: uuid('9e700000'), customerId: id, name, breed, petType: type as Pet['petType'], petTypeName: type === PetType.Cat ? 'Cat' : 'Dog',
      birthday: day(-365 * (2 + ((i + j) % 9))), ageYears: 2 + ((i + j) % 9), notes: null, pictureUrl: null, isActive: true,
      createdAt: created, updatedAt: null,
      ...(name === 'Duke' ? { allergies: [{ id: 'a11e0000-0000-4000-8000-000000000001', allergyName: 'Chicken' }], allergyIds: null, hasAllergies: true }
        : { allergies: [], allergyIds: null, hasAllergies: false }),
    }));
    pets.push(...customerPets);

    customers.push({
      id, email: email(p), firstName: p.first, lastName: p.last, fullName: `${p.first} ${p.last}`,
      phoneNumber: p.phone ?? `631555${String(100 + i * 7).padStart(4, '0')}`,
      notes: p.notes ?? null,
      street: hasAddress ? (p.street ?? null) : null, city: hasAddress ? p.town : null, state: hasAddress ? 'NY' : null, zipCode: hasAddress ? ZIP[p.town]! : null,
      squareCustomerId: p.squareLinked === false ? null : `SQ${String(9100 + i)}`, isSyncedToSquare: p.squareLinked !== false,
      accessNotes: p.accessNotes ?? null, serviceDurationMinutes: 5,
      preferredWindowStart: p.window?.[0] ?? null, preferredWindowEnd: p.window?.[1] ?? null,
      latitude: hasAddress && p.geocoded !== false ? 40.88 + i / 1000 : null, longitude: hasAddress && p.geocoded !== false ? -73.33 - i / 1000 : null,
      isActive: p.active !== false, createdAt: created, updatedAt: null,
      pets: customerPets,
      hasAddress, isGeocoded: hasAddress && p.geocoded !== false, canReceiveLocalDelivery: hasAddress && p.geocoded !== false,
    });

    (p.plans ?? []).forEach((plan, k) => {
      const subId = uuid('5b5c0000');
      const status = (plan.status ?? SubscriptionStatus.Active) as SubscriptionListItem['status'];
      const method = (plan.method ?? FulfillmentMethod.LocalDelivery) as SubscriptionListItem['fulfillmentMethod'];
      const unitName = { 1: 'day', 2: 'week', 3: 'month' }[plan.unit]!;
      const label = plan.every === 1 ? `Every ${unitName}` : `Every ${plan.every} ${unitName}s`;
      const petNames = customerPets.map(x => x.name).join(' & ');
      const next = (i * 3 + k * 5) % 21 - 3;
      subscriptions.push({
        id: subId, customerId: id, customerName: `${p.first} ${p.last}`, name: plan.name, displayName: plan.name ?? `${petNames || p.first} — ${label.toLowerCase()}`,
        status, statusName: ['', 'NewSignUp', 'Active', 'Paused', 'Canceled'][status]!,
        frequencyInterval: plan.every, frequencyUnit: plan.unit as SubscriptionListItem['frequencyUnit'], frequencyLabel: label,
        fulfillmentMethod: method, fulfillmentMethodName: ['', 'LocalDelivery', 'Pickup', 'Shipping'][method]!,
        nextDeliveryDate: day(next), lastDeliveryDate: day(next - plan.every * 7), signUpDate: created,
        pausedUntil: status === SubscriptionStatus.Paused ? day(21) : null, isPauseExpired: false,
        itemCount: 1 + (i % 3), rotationGroupCount: i % 4 === 0 ? 1 : 0, pendingAddOnCount: k === 1 ? 1 : 0, inactiveProductCount: 0,
        createdAt: created, updatedAt: null, revision: 1,
      });

      if (status === SubscriptionStatus.Canceled || status === SubscriptionStatus.NewSignUp) return;
      // Three past deliveries and the next one.
      for (let n = 3; n >= 0; n--) {
        const when = next - n * plan.every * 7;
        const past = when < 0;
        const paid = past || when === 0;
        const declined = p.last === 'Bell' && n === 0;
        deliveries.push({
          id: uuid('de11e000'), subscriptionId: subId, subscriptionName: plan.name ?? label, customerId: id, customerName: `${p.first} ${p.last}`,
          scheduledFor: day(when), completedAt: past ? instant(when, 17) : null,
          status: (past ? DeliveryStatus.Delivered : DeliveryStatus.Scheduled) as DeliveryListItem['status'],
          statusName: past ? 'Delivered' : 'Scheduled',
          fulfillmentMethod: method, fulfillmentMethodName: ['', 'LocalDelivery', 'Pickup', 'Shipping'][method]!,
          procurementStatus: (past ? ProcurementStatus.Ready : ProcurementStatus.NotStarted) as DeliveryListItem['procurementStatus'],
          procurementStatusName: past ? 'Ready' : 'NotStarted',
          paymentStatus: (declined ? PaymentStatus.Failed : paid ? PaymentStatus.Paid : PaymentStatus.NotCharged) as DeliveryListItem['paymentStatus'],
          paymentStatusName: declined ? 'Failed' : paid ? 'Paid' : 'NotCharged',
          paymentAttemptCount: paid || declined ? 1 : 0, paymentFailureCode: declined ? 'PAYMENT_METHOD_ERROR' : null,
          paymentFailureReason: declined ? 'Card declined.' : null, paymentAttemptedAt: paid || declined ? instant(when - 1, 9) : null,
          // Square prices from its live catalog, so what it took can differ from our snapshot estimate.
          total: plan.total, amountCharged: paid && !declined ? (n === 2 ? Math.round((plan.total + 1.2) * 100) / 100 : plan.total) : null,
          squareOrderId: null, squarePaymentId: null, squareReceiptUrl: null, astroCompleted: false, externalOrderId: null,
          sentToRoutingAt: past ? instant(when, 7) : null, notes: null, failureReason: null,
          lineCount: 2, unresolvedLineCount: past ? 0 : 2, blockedLineCount: 0, totalUnits: 2, deliveryCity: p.town,
          createdAt: instant(when - 7), updatedAt: null, revision: 1,
          isOneOff: false, isClosed: past, isReadyToPack: past, hasPaid: paid && !declined, contentsAreLocked: paid && !declined, paymentFailed: declined,
        });
      }
    });
  });

  const squareDirectory: SquareCandidate[] = [
    ...customers.filter(c => c.squareCustomerId).slice(0, 12).map(c => ({
      squareCustomerId: c.squareCustomerId!, firstName: c.firstName, lastName: c.lastName, email: c.email, phoneNumber: c.phoneNumber,
    })),
    // Walk-in store customers who are in Square but not yet on auto-ship.
    { squareCustomerId: 'SQ7001', firstName: 'Linda', lastName: 'Park', email: 'linda.park@example.com', phoneNumber: '6315550901' },
    { squareCustomerId: 'SQ7002', firstName: 'Linda', lastName: 'Park', email: 'lpark.home@example.com', phoneNumber: '6315550901' },
    { squareCustomerId: 'SQ7003', firstName: 'Robert', lastName: 'Hale', email: 'rob.hale@example.com', phoneNumber: null },
  ];

  return { customers, pets, subscriptions, deliveries, squareDirectory };
}
