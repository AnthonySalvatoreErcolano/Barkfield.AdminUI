// Fake PetsPort. Behaves like the API (PetService, Pet.cs, AllergyCommands):
//   - the seeded allergy list from 002_seed_reference_data.sql, sorted by name
//   - adding an allergy that exists (in any case — SQL Server's collation) returns the existing one
//   - a future birthday is a domain refusal ({ message }); a too-long name is model validation
//   - allergies on save replace the pet's list wholesale; unknown ids are refused
import { PetType } from '../generated/enums';
import { NotFoundError, ValidationError } from '../errors';
import type { Allergy, Pet, PetsPort, PetWrite } from '../ports';
import { todayDay } from './subscriptionModel';
import type { Seed } from './seed';

const SEEDED = [
  'Chicken', 'Beef', 'Lamb', 'Pork', 'Turkey', 'Duck', 'Fish', 'Salmon', 'Egg', 'Dairy',
  'Wheat', 'Corn', 'Soy', 'Grain', 'Gluten', 'Peanut', 'Potato', 'Pea', 'Yeast', 'Artificial preservatives',
];
// Chicken keeps the id the customer seed gives Duke's allergy.
export const seedAllergies = (): Allergy[] =>
  SEEDED.map((allergyName, i) => ({ id: `a11e0000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`, allergyName }));

const byName = (a: Allergy, b: Allergy) => a.allergyName.localeCompare(b.allergyName);

/** Whole years from a 'YYYY-MM-DD…' birthday to today, as the DTO's AgeYears computes it. */
function ageYears(birthday: string | null): number | null {
  if (!birthday) return null;
  const [by, bm, bd] = birthday.slice(0, 10).split('-').map(Number) as [number, number, number];
  const [ty, tm, td] = todayDay().slice(0, 10).split('-').map(Number) as [number, number, number];
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

export function createFakePets(db: Seed, wait: () => Promise<void>): PetsPort {
  const allergies = seedAllergies();

  const find = (id: string) => {
    const p = db.pets.find(x => x.id === id);
    if (!p) throw new NotFoundError(`Pet with ID '${id}' was not found.`);
    return p;
  };

  /** Model validation, then the domain's rules — in the order the API meets them. */
  const check = (body: PetWrite) => {
    if (!body.name?.trim()) throw new ValidationError('The Name field is required.', { name: ['The Name field is required.'] });
    if (body.name.length > 50) {
      const m = 'The field Name must be a string or array type with a maximum length of \'50\'.';
      throw new ValidationError(m, { name: [m] });
    }
    if (body.breed && body.breed.length > 100) {
      const m = 'The field Breed must be a string or array type with a maximum length of \'100\'.';
      throw new ValidationError(m, { breed: [m] });
    }
    const unknown = (body.allergyIds ?? []).filter(id => !allergies.some(a => a.id === id));
    if (unknown.length) throw new ValidationError(`Unknown allergy id(s): ${unknown.join(', ')}.`);
    if (body.birthday && body.birthday.slice(0, 10) > todayDay().slice(0, 10)) throw new ValidationError('Pet birthday cannot be in the future.');
  };

  const apply = (p: Pet, body: PetWrite) => {
    const picked = [...new Set(body.allergyIds ?? [])];
    Object.assign(p, {
      name: body.name.trim(), petType: body.petType, petTypeName: ['', 'Dog', 'Cat', 'Other'][body.petType] ?? null,
      birthday: body.birthday ? body.birthday.slice(0, 10) + 'T00:00:00Z' : null, ageYears: ageYears(body.birthday ?? null),
      breed: body.breed?.trim() || null, notes: body.notes?.trim() || null, pictureUrl: body.pictureUrl?.trim() || null,
      allergies: allergies.filter(a => picked.includes(a.id)).sort(byName), hasAllergies: picked.length > 0,
    });
  };

  return {
    async get(id) {
      await wait();
      return structuredClone(find(id));
    },

    async create(customerId, body) {
      await wait();
      if (!db.customers.some(c => c.id === customerId)) throw new NotFoundError(`Customer with ID '${customerId}' was not found.`);
      check(body);
      const p = {
        id: crypto.randomUUID(), customerId, isActive: true, createdAt: new Date().toISOString(), updatedAt: null, allergyIds: null,
        petType: PetType.Dog,
      } as unknown as Pet;
      apply(p, body);
      db.pets.push(p);
      return p.id;
    },

    async update(id, body) {
      await wait();
      const p = find(id);
      check(body);
      apply(p, body);
      p.updatedAt = new Date().toISOString();
    },

    async deactivate(id) {
      await wait();
      Object.assign(find(id), { isActive: false, updatedAt: new Date().toISOString() });
    },

    async reactivate(id) {
      await wait();
      Object.assign(find(id), { isActive: true, updatedAt: new Date().toISOString() });
    },

    async allergies() {
      await wait();
      return structuredClone([...allergies].sort(byName));
    },

    async addAllergy(allergyName) {
      await wait();
      const name = allergyName.trim();
      if (!name) throw new ValidationError('An allergy name is required.');
      if (name.length > 100) throw new ValidationError('Allergy name cannot exceed 100 characters.');
      const existing = allergies.find(a => a.allergyName.toLowerCase() === name.toLowerCase());
      if (existing) return existing.id;
      const created = { id: crypto.randomUUID(), allergyName: name };
      allergies.push(created);
      return created.id;
    },
  };
}
