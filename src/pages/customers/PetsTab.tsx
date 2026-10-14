// A customer's pets (PAGES.md §3) — nested under the customer, no standalone list. Add, edit, take off
// the list and restore. Allergies are what staff check before a protein goes in a box, so they're the
// loudest thing on each card.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage, ValidationError } from '../../api/errors';
import { PetType } from '../../api/generated/enums';
import type { CustomerDetail, Pet } from '../../api/ports';
import { LoadError } from '../../app/LoadError';
import { useToast } from '../../app/toast';
import { useGuardedSave } from '../../app/useGuardedSave';
import { todayIso, toApiDay } from '../../lib/dates';
import { formatDay } from '../../lib/format';
import { Can, useApi } from '../../session/SessionProvider';
import { Alert, Badge, Button, Card, Chip, Dialog, DropdownMenu, Icon, Input, Select, Textarea, buttonClass } from '../../ui';
import { AllergyPicker } from './AllergyPicker';
import { customerKeys } from './keys';

const petsKey = (customerId: string, includeInactive: boolean) => [...customerKeys.pets(customerId), includeInactive] as const;

export function PetsTab({ customer }: { customer: CustomerDetail }) {
  const api = useApi();
  const [showPast, setShowPast] = useState(false);
  const [editing, setEditing] = useState<Pet | 'new' | null>(null);
  const [removing, setRemoving] = useState<Pet | null>(null);
  const { data: pets, error, refetch } = useQuery({
    queryKey: petsKey(customer.id, showPast),
    queryFn: () => api.customers.pets(customer.id, showPast),
    placeholderData: showPast ? undefined : customer.pets,
  });
  const canChange = customer.isActive;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Chip selected={showPast} onClick={() => setShowPast(!showPast)}>Show past pets</Chip>
        <div style={{ flex: 1 }} />
        <Can call="POST /api/customers/{customerId}/pets">
          <Button size="sm" variant="secondary" iconLeft="plus" onClick={() => setEditing('new')} disabled={!canChange}>Add pet</Button>
        </Can>
      </div>
      {error ? <LoadError error={error} onRetry={() => refetch()} what="the pets" />
        : !pets ? <p style={{ margin: 0, color: 'var(--text-muted)' }}>Loading…</p>
        : !pets.length ? <Card><p style={{ margin: 0, color: 'var(--text-muted)' }}>No pets on file{showPast ? ', past or present' : ''}.</p></Card>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {pets.map(p => <PetCard key={p.id} pet={p} canChange={canChange} onEdit={() => setEditing(p)} onRemove={() => setRemoving(p)} />)}
          </div>
        )}
      {editing ? <PetDialog customer={customer} pet={editing === 'new' ? null : editing} onClose={() => setEditing(null)} /> : null}
      {removing ? <RemovePetDialog pet={removing} onClose={() => setRemoving(null)} /> : null}
    </div>
  );
}

function PetCard({ pet, canChange, onEdit, onRemove }: { pet: Pet; canChange: boolean; onEdit: () => void; onRemove: () => void }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const restore = useMutation({
    mutationFn: () => api.pets.reactivate(pet.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast({ title: `${pet.name} is back on the list` });
    },
    onError: err => toast({ tone: 'danger', title: 'Couldn’t restore', message: errorMessage(err) }),
  });
  const summary = [pet.breed, pet.petType === PetType.Dog ? null : pet.petTypeName, pet.ageYears != null ? `${pet.ageYears} yrs` : null].filter(Boolean).join(' · ');

  return (
    <Card tone="cream" title={<span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>{pet.name}{!pet.isActive ? <Badge tone="neutral">Past</Badge> : null}</span>}
      actions={canChange ? <Can call="PUT /api/pets/{petId}">
        {pet.isActive ? (
          <DropdownMenu align="right" triggerLabel={`Actions for ${pet.name}`}
            trigger={<span className={buttonClass('ghost', 'sm')}><Icon name="ellipsis" size={16} /></span>}
            items={[
              { label: 'Edit', icon: 'pencil', onSelect: onEdit },
              { label: 'Take off the list…', icon: 'x', danger: true, onSelect: onRemove },
            ]} />
        ) : <Button size="sm" variant="ghost" onClick={() => restore.mutate()} disabled={restore.isPending}>{restore.isPending ? 'Restoring…' : 'Restore'}</Button>}
      </Can> : null}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: pet.isActive ? 1 : 0.7 }}>
        {pet.pictureUrl ? <img src={pet.pictureUrl} alt={pet.name} style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} onError={e => { e.currentTarget.style.display = 'none'; }} /> : null}
        {summary ? <div style={{ fontSize: 14.5, color: 'var(--ink-700)' }}>{summary}</div> : null}
        {pet.allergies.length ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }} aria-label={`${pet.name}’s allergies`}>
            <Badge tone="danger" dot>Allergic to</Badge>
            {pet.allergies.map(a => <Chip key={a.id} variant="tag" size="sm">{a.allergyName}</Chip>)}
          </div>
        ) : <div style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>No allergies</div>}
        {pet.notes ? <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{pet.notes}</div> : null}
        {pet.birthday ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Birthday {formatDay(pet.birthday, 'long')}</div> : null}
      </div>
    </Card>
  );
}

type PetFormValues = { name: string; petType: string; breed: string; birthday: string; notes: string; pictureUrl: string; allergyIds: string };

const toForm = (p: Pet | null): PetFormValues => ({
  name: p?.name ?? '', petType: String(p?.petType ?? PetType.Dog), breed: p?.breed ?? '', birthday: p?.birthday?.slice(0, 10) ?? '',
  notes: p?.notes ?? '', pictureUrl: p?.pictureUrl ?? '', allergyIds: [...(p?.allergies.map(a => a.id) ?? [])].sort().join(','),
});
const idsOf = (v: PetFormValues) => (v.allergyIds ? v.allergyIds.split(',') : []);
const toRequest = (v: PetFormValues) => ({
  name: v.name.trim(), petType: Number(v.petType) as PetType, breed: v.breed.trim() || null, notes: v.notes.trim() || null,
  pictureUrl: v.pictureUrl.trim() || null, birthday: v.birthday ? toApiDay(v.birthday) : null, allergyIds: idsOf(v),
});

function validate(v: PetFormValues): Partial<Record<keyof PetFormValues, string>> {
  const e: Partial<Record<keyof PetFormValues, string>> = {};
  if (!v.name.trim()) e.name = 'Enter a name.';
  else if (v.name.trim().length > 50) e.name = 'Keep this under 50 characters.';
  if (v.breed.trim().length > 100) e.breed = 'Keep this under 100 characters.';
  if (v.birthday && v.birthday > todayIso()) e.birthday = 'A birthday can’t be in the future.';
  if (v.pictureUrl.trim() && !/^https?:\/\//i.test(v.pictureUrl.trim())) e.pictureUrl = 'A link starting with https://';
  else if (v.pictureUrl.trim().length > 500) e.pictureUrl = 'Keep this under 500 characters.';
  return e;
}

const LABELS: Record<keyof PetFormValues, string> = { name: 'Name', petType: 'Type', breed: 'Breed', birthday: 'Birthday', notes: 'Notes', pictureUrl: 'Photo link', allergyIds: 'Allergies' };

function PetDialog({ customer, pet, onClose }: { customer: CustomerDetail; pet: Pet | null; onClose: () => void }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const initial = toForm(pet);
  const [values, setValues] = useState(initial);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const { submit, notice } = useGuardedSave({
    initial,
    reread: async () => toForm(await api.pets.get(pet!.id)),
    save: v => api.pets.update(pet!.id, toRequest(v)),
  });
  const errors = tried ? validate(values) : {};
  const set = (key: keyof PetFormValues) => (e: { target: { value: string } }) => setValues({ ...values, [key]: e.target.value });
  const err = (key: keyof PetFormValues) => serverErrors[key]?.[0] ?? errors[key];
  const hint = (key: keyof PetFormValues, fallback?: string) => (notice?.changedByOthers.includes(key) ? 'Just changed by someone else.' : fallback);

  const save = async () => {
    setTried(true);
    if (Object.keys(validate(values)).length) return;
    setBusy(true);
    setFormError(null);
    setServerErrors({});
    try {
      if (pet) {
        const outcome = await submit(values);
        if (outcome.status === 'stale') { setValues(outcome.merged); return; }
      } else {
        await api.pets.create(customer.id, toRequest(values));
      }
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast({ title: pet ? `${values.name.trim()} saved` : `${values.name.trim()} added` });
      onClose();
    } catch (e) {
      if (e instanceof ValidationError && Object.keys(e.fieldErrors).length) setServerErrors(e.fieldErrors);
      else if (e instanceof ValidationError && /birthday/i.test(e.message)) setServerErrors({ birthday: [e.message] });
      else setFormError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open size="md" onClose={busy ? undefined : onClose} title={pet ? `Edit ${pet.name}` : `Add a pet for ${customer.firstName}`}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" form="pet-form" disabled={busy}>{busy ? 'Saving…' : pet ? 'Save changes' : 'Add pet'}</Button>
      </>}>
      <form id="pet-form" noValidate onSubmit={e => { e.preventDefault(); void save(); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {notice ? (
          <Alert tone="warning" title="This pet changed while you were editing">
            {notice.message}
            {notice.changedByOthers.length ? <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{notice.changedByOthers.map(k => <li key={k}>{LABELS[k]}</li>)}</ul> : null}
          </Alert>
        ) : null}
        {formError ? <Alert tone="danger">{formError}</Alert> : null}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
          <Input label="Name" value={values.name} onChange={set('name')} autoComplete="off" error={err('name')} hint={hint('name')} />
          <Select label="Type" value={values.petType} onChange={set('petType')} hint={hint('petType')}
            options={[{ value: String(PetType.Dog), label: 'Dog' }, { value: String(PetType.Cat), label: 'Cat' }, { value: String(PetType.Other), label: 'Other' }]} />
          <Input label="Breed" value={values.breed} onChange={set('breed')} autoComplete="off" error={err('breed')} hint={hint('breed')} />
          <Input label="Birthday" type="date" max={todayIso()} value={values.birthday} onChange={set('birthday')} error={err('birthday')} hint={hint('birthday', 'Optional — a rough date is fine.')} />
        </div>
        <AllergyPicker selected={idsOf(values)} onChange={ids => setValues({ ...values, allergyIds: [...ids].sort().join(',') })} />
        {notice?.changedByOthers.includes('allergyIds') ? <span style={{ fontSize: 13.5, color: 'var(--status-warning-fg)' }}>Allergies were just changed by someone else — check them.</span> : null}
        <Textarea label="Notes" rows={3} value={values.notes} onChange={set('notes')} hint={hint('notes', 'Anything packing should know — picky eater, sensitive stomach.')} />
        <Input label="Photo link" value={values.pictureUrl} onChange={set('pictureUrl')} placeholder="https://…" autoComplete="off" error={err('pictureUrl')} hint={hint('pictureUrl', 'Optional. A link to a photo already online.')} />
      </form>
    </Dialog>
  );
}

function RemovePetDialog({ pet, onClose }: { pet: Pet; onClose: () => void }) {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: () => api.pets.deactivate(pet.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast({ title: `${pet.name} taken off the list`, message: 'Find them under “Show past pets” to restore.' });
      onClose();
    },
  });
  return (
    <Dialog open size="sm" onClose={remove.isPending ? undefined : onClose} title={`Take ${pet.name} off the list?`}
      description="For a pet that’s passed away or been rehomed. Their record is kept, and you can restore it."
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={remove.isPending}>Keep</Button>
        <Button variant="danger" onClick={() => remove.mutate()} disabled={remove.isPending}>{remove.isPending ? 'Saving…' : 'Take off the list'}</Button>
      </>}>
      {remove.error ? <Alert tone="danger">{errorMessage(remove.error)}</Alert> : null}
    </Dialog>
  );
}
