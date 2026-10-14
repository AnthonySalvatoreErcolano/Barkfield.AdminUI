// Pick a pet's allergies from the shared list, and add to that list inline when it's missing one — never
// free text on the pet, so "chicken" and "Chicken " don't become two allergies nobody can search.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '../../api/errors';
import { useApi, useSession } from '../../session/SessionProvider';
import { Button, Chip, Input } from '../../ui';

export const allergyKeys = { all: ['allergies'] as const };

export function AllergyPicker({ selected, onChange, disabled }: { selected: string[]; onChange: (ids: string[]) => void; disabled?: boolean }) {
  const api = useApi();
  const { canCall } = useSession();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const { data: allergies = [], error } = useQuery({ queryKey: allergyKeys.all, queryFn: () => api.pets.allergies(), staleTime: 5 * 60_000 });

  const term = text.trim().toLowerCase();
  const nameOf = (id: string) => allergies.find(a => a.id === id)?.allergyName ?? '…';
  const matches = term ? allergies.filter(a => a.allergyName.toLowerCase().includes(term) && !selected.includes(a.id)).slice(0, 8) : [];
  const exact = allergies.find(a => a.allergyName.toLowerCase() === term);
  const pick = (id: string) => { onChange([...new Set([...selected, id])]); setText(''); };

  const add = useMutation({
    // Returns the existing allergy if the name is already there, in any case.
    mutationFn: () => api.pets.addAllergy(text.trim()),
    onSuccess: async id => {
      await queryClient.invalidateQueries({ queryKey: allergyKeys.all });
      pick(id);
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="br-field__label">Allergies</span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 30, alignItems: 'center' }}>
        {selected.length
          ? selected.map(id => <Chip key={id} selected onRemove={disabled ? undefined : () => onChange(selected.filter(x => x !== id))}>{nameOf(id)}</Chip>)
          : <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>None — most pets have none.</span>}
      </div>
      {!disabled ? (
        <>
          <Input aria-label="Find an allergy" size="sm" iconLeft="search" placeholder="Type to find an allergy" value={text}
            onChange={e => setText(e.target.value)} maxLength={100}
            onKeyDown={e => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              if (exact) pick(exact.id);
              else if (matches.length === 1) pick(matches[0]!.id);
            }} />
          {term ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {matches.map(a => <Chip key={a.id} onClick={() => pick(a.id)} icon="plus">{a.allergyName}</Chip>)}
              {/* Only once nothing matches, so a half-typed "chi" doesn't become a shared allergy. */}
              {!exact && !matches.length && canCall('POST /api/allergies') ? (
                <Button size="sm" variant="ghost" iconLeft="plus" onClick={() => add.mutate()} disabled={add.isPending}>
                  {add.isPending ? 'Adding…' : `Add “${text.trim()}” to the list`}
                </Button>
              ) : null}
              {exact && selected.includes(exact.id) ? <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Already picked.</span> : null}
            </div>
          ) : null}
          {add.error ? <span role="alert" style={{ color: 'var(--status-danger-fg)', fontSize: 13.5 }}>{errorMessage(add.error)}</span> : null}
          {error ? <span role="alert" style={{ color: 'var(--status-danger-fg)', fontSize: 13.5 }}>Couldn’t load the allergy list.</span> : null}
        </>
      ) : null}
    </div>
  );
}
