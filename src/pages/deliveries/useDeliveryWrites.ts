// Every write on one delivery goes through here, one at a time. Each per-line endpoint loads the whole
// delivery, changes one thing and saves with the revision bumped, so two requests in flight on the
// same delivery 409 against each other even when only one person is clicking (PAGES.md §6). One shared
// mutation, and every control disabled while it runs, means that cannot happen from this screen.
//
// A 409 that does happen (someone else, a webhook) reloads the delivery and says so. Never retried.
import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ConflictError, errorMessage } from '../../api/errors';
import { useToast } from '../../app/toast';
import { customerKeys } from '../customers/keys';
import { deliveryKeys } from './keys';

export interface WriteProblem {
  tone: 'warning' | 'danger';
  title: string;
  message: string;
}

export type WriteOutcome = { ok: true } | { ok: false; conflict: boolean; message: string };

export function useDeliveryWrites(deliveryId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [problem, setProblem] = useState<WriteProblem | null>(null);
  const mutationKey = ['delivery-write', deliveryId];
  const busy = useIsMutating({ mutationKey }) > 0;
  const mutation = useMutation({
    mutationKey,
    mutationFn: (write: () => Promise<void>) => write(),
    onSettled: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all }),
      queryClient.invalidateQueries({ queryKey: customerKeys.all }),
    ]),
  });

  /**
   * Run one write. Resolves with the outcome instead of throwing, so a dialog can keep a validation
   * message to itself; a conflict is also shown on the page, over the reloaded delivery.
   */
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
        ? 'Someone else updated this delivery at the same moment, so your change wasn’t saved. It’s been reloaded below — check it, then make your change again.'
        : errorMessage(error);
      setProblem({ tone: conflict ? 'warning' : 'danger', title: conflict ? 'This delivery just changed' : 'That didn’t go through', message });
      return { ok: false, conflict, message };
    }
  };

  return { run, busy, problem, clearProblem: () => setProblem(null) };
}
