// Seed data for the fake API. Deterministic, so screenshots and tests see the same shop every time.
//
// Built to exercise the awkward cases, not just the happy path:
//   - Daniella Russo holds two subscriptions on different cycles
//   - Alicia and Tom Moreno share one address in Northport (one stop, two boxes)
//   - Marcus Bell's Square link is broken (not synced; his first retry fails)
//   - Priya Shah is archived; Greg Olsen has no address; Hannah Lee's address is not geocoded
//   - Sam Whitaker is being edited by someone else: his first save returns a 409
//   - Tom Kearney's record changes behind your back a few seconds after you open it

import { DeliveryLineSource, DeliveryStatus, FrequencyUnit, FulfillmentMethod, LineOrderStatus, PaymentStatus, PetType, SubscriptionStatus } from '../generated/enums';
import type { CustomerDetail, DeliveryDetail, Pet, Product, SquareCandidate, SubscriptionListItem } from '../ports';
import { makeLine, recompute } from './deliveryModel';

// The seed is laid out around the viewer's own today (as a UTC-midnight date-only value, the way the API
// sends dates), so a demo opened next week still has a busy day to show.
const now = new Date();
const TODAY = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

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
  { first: 'Beth', last: 'Sullivan', town: 'Centerport', street: '2 Prospect Rd', pets: [['Clover', 'Beagle']], plans: [{ name: null, every: 3, unit: FrequencyUnit.Weeks, total: 52.25, status: SubscriptionStatus.Paused }] },
  { first: 'Jake', last: 'Morrison', town: 'Syosset', street: null, pets: [['Scout', 'Pointer']], plans: [{ name: null, every: 4, unit: FrequencyUnit.Weeks, total: 0 }], notes: 'Moved house — new address to come.' },
];

const ZIP: Record<string, string> = {
  'East Northport': '11731', Huntington: '11743', Syosset: '11791', Northport: '11768', Greenlawn: '11740', Centerport: '11721',
  'Kings Park': '11754', Commack: '11725', Smithtown: '11787', 'Dix Hills': '11746',
};

export interface Seed {
  customers: CustomerDetail[];
  pets: Pet[];
  subscriptions: SubscriptionListItem[];
  /** What each subscription ships, per cycle. */
  subscriptionItems: Map<string, Array<{ productId: string; quantity: number }>>;
  products: Product[];
  deliveries: DeliveryDetail[];
  /** People in Square's directory — some already ours, some not yet. */
  squareDirectory: SquareCandidate[];
}

/** The fake's "today". Deliveries and due dates are laid out around it. */
export const FAKE_TODAY = day(0);

const email = (p: Person) => `${p.first}.${p.last}`.toLowerCase().replace(/[^a-z.]/g, '') + '@example.com';

const CATALOG: Array<[name: string, price: number, active?: boolean]> = [
  ['Open Farm Lamb & Oat 24 lb', 89.99], ['Open Farm Wild Salmon 24 lb', 94], ['Raw Bistro Beef 12 lb', 64.5], ['Raw Bistro Lamb 12 lb', 69],
  ['Stella & Chewy’s Chicken 24 lb', 112.4], ['Farmina N&D Pumpkin 12 lb', 71.25], ['Honest Kitchen Base Mix 10 lb', 58.99],
  ['Orijen Six Fish 23.5 lb', 118], ['Acana Wild Atlantic 25 lb', 99.99], ['Primal Venison Nuggets 14 oz', 36.99], ['Primal Beef Nuggets 14 oz', 34.99],
  ['Weruva Cat Wet Food — case of 24', 42], ['Tiki Cat Chicken — 12 pack', 28.5], ['Green Tripe Topper 14 oz', 21.99],
  ['Pumpkin Bites — bakery', 8.99], ['Peanut Butter Biscuits 1 lb', 12.5], ['Bully Sticks 6 in — 5 pack', 17.99], ['Wild Salmon Oil 16 oz', 24.99],
  ['Bakery Box — Large', 24.5], ['Birthday Pupcake', 15], ['Blue Seal Chicken & Rice 30 lb', 54.99, false],
];

/** The day's mix of states — enough of each for every screen state to be reachable. */
type TodayState = 'notStarted' | 'inProgress' | 'partial' | 'ready' | 'blocked' | 'packed';
const TODAY_PATTERN: TodayState[] = ['notStarted', 'inProgress', 'ready', 'blocked', 'partial', 'notStarted', 'ready', 'packed', 'inProgress', 'notStarted'];

export function createSeed(): Seed {
  counter = 0;
  const customers: CustomerDetail[] = [];
  const pets: Pet[] = [];
  const subscriptions: SubscriptionListItem[] = [];
  const subscriptionItems = new Map<string, Array<{ productId: string; quantity: number }>>();
  const deliveries: DeliveryDetail[] = [];

  const products: Product[] = CATALOG.map(([name, price, active = true], i) => ({
    id: uuid('9d0d0c70'), squareCatalogObjectId: `SQVAR${1000 + i}`, squareItemId: `SQITEM${500 + i}`, name,
    itemName: name.split(/ \d| —/)[0] ?? name, variationName: null, sku: `BR-${String(100 + i)}`, price, isActive: active,
    lastSyncedAt: instant(-1, 6), createdAt: instant(-300), updatedAt: null, subscriptionUsageCount: 0,
  }));
  const food = products.slice(0, 11);
  const catFood = products.slice(11, 13);
  const extras = products.slice(13, 18);
  const byName = (n: string) => products.find(p => p.name.startsWith(n))!;

  let todayIndex = 0;

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

    const customer: CustomerDetail = {
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
    };
    customers.push(customer);

    (p.plans ?? []).forEach((plan, k) => {
      const subId = uuid('5b5c0000');
      const status = (plan.status ?? SubscriptionStatus.Active) as SubscriptionListItem['status'];
      const method = (plan.method ?? FulfillmentMethod.LocalDelivery) as SubscriptionListItem['fulfillmentMethod'];
      const unitName = { 1: 'day', 2: 'week', 3: 'month' }[plan.unit]!;
      const label = plan.every === 1 ? `Every ${unitName}` : `Every ${plan.every} ${unitName}s`;
      const cycleDays = plan.unit === FrequencyUnit.Days ? plan.every : plan.unit === FrequencyUnit.Weeks ? plan.every * 7 : plan.every * 30;
      const petNames = customerPets.map(x => x.name).join(' & ');
      const displayName = plan.name ?? `${petNames || p.first} — ${label.toLowerCase()}`;

      // What ships each cycle. Tess Nolan's box has four lines — the delivery PAGES.md uses to explain
      // why adjacent rows on the procurement board 409 against each other.
      const isCat = customerPets.some(x => x.petTypeName === 'Cat');
      const items = plan.name === 'Bakery box'
        ? [{ productId: byName('Bakery Box').id, quantity: 1 }]
        : p.last === 'Nolan'
          ? [{ productId: byName('Primal Venison').id, quantity: 2 }, { productId: byName('Green Tripe').id, quantity: 1 },
             { productId: byName('Open Farm Lamb').id, quantity: 1 }, { productId: byName('Wild Salmon Oil').id, quantity: 1 }]
          : [{ productId: (isCat ? catFood[i % 2] : food[i % food.length])!.id, quantity: 1 },
             ...(i % 3 === 0 || p.first === 'Kate' ? [{ productId: extras[i % extras.length]!.id, quantity: 1 + (i % 2) }] : [])];
      subscriptionItems.set(subId, items);
      items.forEach(it => { products.find(x => x.id === it.productId)!.subscriptionUsageCount++; });

      const eligibleToday = customer.isActive && status === SubscriptionStatus.Active && (hasAddress || method !== FulfillmentMethod.LocalDelivery)
        && todayIndex < 25 && i % 7 !== 6 && !['Emma', 'Owen'].includes(p.first);
      const generatedToday = eligibleToday || ['Marcus', 'Kate', 'Pat', 'Frank', 'Tess'].includes(p.first) && status === SubscriptionStatus.Active;
      // Due dates: the day's run was generated this morning, so those moved on a cycle. Two others are
      // overdue and not yet generated; Jake's is due but he has no address; Beth's pause ends today.
      const next = generatedToday ? cycleDays
        : p.first === 'Jake' || p.first === 'Beth' ? 0
        : p.first === 'Emma' || p.first === 'Owen' ? -2
        : 1 + ((i * 3 + k) % 12);

      subscriptions.push({
        id: subId, customerId: id, customerName: `${p.first} ${p.last}`, name: plan.name, displayName,
        status, statusName: ['', 'NewSignUp', 'Active', 'Paused', 'Canceled'][status]!,
        frequencyInterval: plan.every, frequencyUnit: plan.unit as SubscriptionListItem['frequencyUnit'], frequencyLabel: label,
        fulfillmentMethod: method, fulfillmentMethodName: ['', 'LocalDelivery', 'Pickup', 'Shipping'][method]!,
        nextDeliveryDate: day(next), lastDeliveryDate: day(generatedToday ? -cycleDays : next - cycleDays), signUpDate: created,
        pausedUntil: status === SubscriptionStatus.Paused ? day(p.first === 'Beth' ? 0 : 21) : null, isPauseExpired: p.first === 'Beth',
        itemCount: items.length, rotationGroupCount: i % 4 === 0 ? 1 : 0, pendingAddOnCount: k === 1 ? 1 : 0, inactiveProductCount: 0,
        createdAt: created, updatedAt: null, revision: 1,
      });

      if (status === SubscriptionStatus.Canceled || status === SubscriptionStatus.NewSignUp || !customer.isActive) return;

      const build = (when: number, lineStatus: (index: number) => number): DeliveryDetail => {
        const lines = items.map((it, n) => {
          const product = products.find(x => x.id === it.productId)!;
          return makeLine(product, it.quantity, DeliveryLineSource.Recurring, subId, lineStatus(n));
        });
        return recompute({
          // The API sends null here for an unnamed subscription — the composed label is only on the subscription DTOs.
          id: uuid('de11e000'), subscriptionId: subId, subscriptionName: plan.name, subscriptionDisplayName: displayName,
          frequencyInterval: plan.every, frequencyUnit: plan.unit as DeliveryDetail['frequencyUnit'], customerId: id, customerName: `${p.first} ${p.last}`,
          scheduledFor: day(when), completedAt: null, status: DeliveryStatus.Scheduled as DeliveryDetail['status'],
          fulfillmentMethod: method, procurementStatus: 1 as DeliveryDetail['procurementStatus'],
          paymentStatus: PaymentStatus.NotCharged as DeliveryDetail['paymentStatus'], paymentAttemptCount: 0,
          paymentFailureCode: null, paymentFailureReason: null, paymentAttemptedAt: null,
          squareOrderId: null, squarePaymentId: null, squareReceiptUrl: null, amountCharged: null, astroCompleted: false,
          externalOrderId: null, sentToRoutingAt: null, notes: null, failureReason: null,
          createdAt: instant(when - 2, 6), updatedAt: null, revision: 1,
          lines, discounts: [], photos: [], driverNotes: null, customerNotifiedAt: null, customerHasBeenNotified: false, hasProofOfDelivery: false,
          deliveryStreet: customer.street ?? '', deliveryCity: customer.city ?? '', deliveryState: customer.state ?? '', deliveryZipCode: customer.zipCode ?? '',
          deliveryLatitude: customer.latitude, deliveryLongitude: customer.longitude,
          requestedWindowStart: customer.preferredWindowStart, requestedWindowEnd: customer.preferredWindowEnd, serviceDurationMinutesOverride: null,
          customerPhoneNumber: customer.phoneNumber, accessNotes: customer.accessNotes, serviceDurationMinutes: customer.serviceDurationMinutes,
          // derived — filled by recompute()
          totalUnits: 0, total: 0, unresolvedLines: [], chargeVariance: null, needsRefundAttention: false, packingBlockers: [], effectiveServiceDurationMinutes: 0,
          statusName: null, fulfillmentMethodName: null, procurementStatusName: null, paymentStatusName: null,
          isOneOff: false, isClosed: false, isReadyToPack: false, hasPaid: false, contentsAreLocked: false, paymentFailed: false,
        });
      };

      // History: three delivered, paid cycles. One charge differs from our estimate — Square prices
      // from its live catalog — and the most recent carries proof-of-delivery photos.
      for (let n = 3; n >= 1; n--) {
        const d = build(-n * cycleDays, () => LineOrderStatus.Received);
        Object.assign(d, {
          status: DeliveryStatus.Delivered, completedAt: instant(-n * cycleDays, 16), sentToRoutingAt: instant(-n * cycleDays, 7),
          paymentStatus: PaymentStatus.Paid, paymentAttemptCount: 1, paymentAttemptedAt: instant(-n * cycleDays - 1, 9),
          squarePaymentId: `PAY${i}${k}${n}`, squareReceiptUrl: 'https://squareup.com/receipt/preview/example',
          customerHasBeenNotified: true, customerNotifiedAt: instant(-n * cycleDays, 17),
        });
        recompute(d);
        d.amountCharged = n === 2 ? Math.round((d.total + 1.2) * 100) / 100 : d.total;
        if (n === 1) {
          d.hasProofOfDelivery = true;
          d.driverNotes = 'Left at the side door.';
          d.photos = [{ routificPhotoUuid: `photo-${i}-${k}`, routificOrderUuid: `order-${i}-${k}`, createdAt: instant(-cycleDays, 16) }];
        }
        recompute(d);
        deliveries.push(d);
      }

      if (!generatedToday) return;
      // Ann's box stays untouched (all pending): the procurement fake makes it "keep changing", and a
      // receive-all should never trip on it.
      const state: TodayState = p.first === 'Tess' ? 'inProgress' : p.first === 'Ann' ? 'notStarted'
        : ['Marcus', 'Kate', 'Pat', 'Frank'].includes(p.first) ? 'ready'
        : TODAY_PATTERN[todayIndex % TODAY_PATTERN.length]!;
      todayIndex++;
      const d = build(0, n => {
        switch (state) {
          case 'notStarted': return LineOrderStatus.Pending;
          case 'inProgress': return n === 0 ? LineOrderStatus.Ordered : LineOrderStatus.Pending;
          case 'partial': return n === 0 ? LineOrderStatus.PartiallyReceived : LineOrderStatus.Ordered;
          case 'blocked': return n === 0 ? LineOrderStatus.OutOfStock : LineOrderStatus.Ordered;
          default: return LineOrderStatus.Received;
        }
      });
      const first = d.lines[0]!;
      if (state === 'inProgress') first.statusNote = 'PO 4471';
      if (state === 'blocked') first.statusNote = 'Supplier out until next week.';
      if (state === 'partial') { first.quantity = 3; first.quantityReceived = 1; first.statusNote = '1 of 3 arrived.'; }
      if (state === 'packed') d.status = DeliveryStatus.Packed as DeliveryDetail['status'];

      // Billing states: Marcus's card declined; Kate paid but a line was shorted afterwards (refund owed);
      // Pat's charge came in above our estimate; Frank paid, so his contents are locked.
      if (p.first === 'Marcus') Object.assign(d, { paymentStatus: PaymentStatus.Failed, paymentAttemptCount: 1, paymentAttemptedAt: instant(-1, 9), paymentFailureCode: 'PAYMENT_METHOD_ERROR', paymentFailureReason: 'Card declined.' });
      if (p.first === 'Kate' || p.first === 'Pat' || p.first === 'Frank') {
        Object.assign(d, { paymentStatus: PaymentStatus.Paid, paymentAttemptCount: 1, paymentAttemptedAt: instant(-1, 9), squarePaymentId: `PAYT${i}` });
      }
      if (p.first === 'Kate') { d.status = DeliveryStatus.Packed as DeliveryDetail['status']; d.lines[d.lines.length - 1]!.orderStatus = LineOrderStatus.Shorted as DeliveryDetail['lines'][number]['orderStatus']; }
      recompute(d);
      if (d.hasPaid) d.amountCharged = p.first === 'Pat' ? Math.round((d.total + 2.35) * 100) / 100 : p.first === 'Kate' ? Math.round((d.total + d.lines[d.lines.length - 1]!.unitPrice) * 100) / 100 : d.total;
      recompute(d);
      deliveries.push(d);
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

  return { customers, pets, subscriptions, subscriptionItems, products, deliveries, squareDirectory };
}
