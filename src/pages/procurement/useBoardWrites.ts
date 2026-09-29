// Writes from the procurement board. Several rows go through the bulk endpoint in ONE request — the API
// applies them with one save per delivery, so adjacent rows of the same delivery cannot 409 against each
// other the way per-line calls in a loop do (PAGES.md §6). A single row uses the per-line endpoint.
// One board request in flight at a time.
//
// The bulk result is a 200 even when some rows fail; the failures are kept as a list for the user to
// act on, with the API's reasons (written for staff).
import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ConflictError, errorMessage } from '../../api/errors';
import type { LineAction, ProcurementDecision, ProcurementResult } from '../../api/ports';
import { useToast } from '../../app/toast';
import { useApi } from '../../session/SessionProvider';
import { customerKeys } from '../customers/keys';
import { deliveryKeys } from '../deliveries/keys';
import type { WriteOutcome } from '../deliveries/useDeliveryWrites';
import { procurementKeys } from './keys';

/** Who and what a decision was about, so a failure can be named without another read. */
export interface RowLabel {
  customerName: string;
  productName: string;
}

export interface BatchOutcome {
  what: string;
  applied: number;
  failures: Array<RowLabel & { reason: string }>;
}

export function useBoardWrites() {
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [outcome, setOutcome] = useState<BatchOutcome | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const mutationKey = ['procurement-write'];
  const busy = useIsMutating({ mutationKey }) > 0;
  const mutation = useMutation({
    mutationKey,
    mutationFn: (write: () => Promise<unknown>) => write(),
    onSettled: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all }),
      queryClient.invalidateQueries({ queryKey: customerKeys.all }),
    ]),
  });

  /** Several rows, one request. `labels` is keyed by lineId. */
  const runBatch = async (what: string, decisions: ProcurementDecision[], labels: Map<string, RowLabel>): Promise<boolean> => {
    if (busy || decisions.length === 0) return false;
    setProblem(null);
    setOutcome(null);
    try {
      const result = (await mutation.mutateAsync(() => api.procurement.apply(decisions))) as ProcurementResult;
      const failures = result.results
        .filter(r => !r.applied)
        .map(r => ({ ...(labels.get(r.lineId) ?? { customerName: 'A delivery', productName: 'a line' }), reason: r.reason ?? 'Not applied.' }));
      const applied = result.appliedCount ?? result.results.filter(r => r.applied).length;
      if (failures.length) setOutcome({ what, applied, failures });
      else toast({ title: what, message: `${applied} ${applied === 1 ? 'line' : 'lines'} updated.` });
      return true;
    } catch (error) {
      // Only a malformed batch is refused whole (empty, a repeated line, over 500).
      setProblem(errorMessage(error));
      return false;
    }
  };

  /** One row, through the per-line endpoint. */
  const runSingle = async (deliveryId: string, lineId: string, action: LineAction, label: RowLabel): Promise<WriteOutcome> => {
    if (busy) return { ok: false, conflict: false, message: 'Wait for the last change to finish.' };
    setProblem(null);
    setOutcome(null);
    try {
      await mutation.mutateAsync(() => api.deliveries.lineAction(deliveryId, lineId, action));
      toast({ title: `${label.productName} updated`, message: label.customerName });
      return { ok: true };
    } catch (error) {
      const conflict = error instanceof ConflictError;
      const message = conflict
        ? `${label.customerName}’s delivery changed at the same moment, so that wasn’t saved. The board has been reloaded — check the row and try again.`
        : errorMessage(error);
      if (conflict) setProblem(message);
      return { ok: false, conflict, message };
    }
  };

  return { runBatch, runSingle, busy, outcome, problem, dismiss: () => { setOutcome(null); setProblem(null); } };
}
