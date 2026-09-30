// One write at a time on one record, for screens where many small edits hit the same aggregate
// (a subscription's items, rotations and schedule). Each write reloads and saves the whole record, so
// two in flight would 409 against each other; one shared mutation, and every control disabled while it
// runs, prevents that. A 409 that still happens (someone else) reloads and says so — never retried.
import { useIsMutating, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useState } from 'react';
import { ConflictError, errorMessage } from '../api/errors';
import { useToast } from './toast';

export type WriteOutcome = { ok: true } | { ok: false; conflict: boolean; message: string };

export interface WriteProblem {
  tone: 'warning' | 'danger';
  title: string;
  message: string;
}

export function useSerialWrites(options: { key: QueryKey; invalidate: QueryKey[]; noun: string }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [problem, setProblem] = useState<WriteProblem | null>(null);
  const mutationKey = ['serial-write', ...options.key];
  const busy = useIsMutating({ mutationKey }) > 0;
  const mutation = useMutation({
    mutationKey,
    mutationFn: (write: () => Promise<void>) => write(),
    onSettled: () => Promise.all(options.invalidate.map(queryKey => queryClient.invalidateQueries({ queryKey }))),
  });

  const run = async (write: () => Promise<void>, success?: { title: string; message?: string }): Promise<WriteOutcome> => {
    if (busy) return { ok: false, conflict: false, message: 'Wait for the last change to finish.' };
    setProblem(null);
    try {
      await mutation.mutateAsync(write);
      if (success) toast(success);
      return { ok: true };
    } catch (error) {
      const conflict = error instanceof ConflictError;
      const message = conflict
        ? `Someone else updated this ${options.noun} at the same moment, so your change wasn’t saved. It’s been reloaded below — check it, then make your change again.`
        : errorMessage(error);
      setProblem({ tone: conflict ? 'warning' : 'danger', title: conflict ? `This ${options.noun} just changed` : 'That didn’t go through', message });
      return { ok: false, conflict, message };
    }
  };

  return { run, busy, problem, clearProblem: () => setProblem(null) };
}
