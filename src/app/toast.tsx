// App-wide toasts. For confirmations that need no decision ("Password changed"). Anything that needs
// the user to act — a 409, a declined card, an expired upstream token — belongs on the page, not here.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Toast, ToastStack, type StatusTone } from '../ui';

interface ToastInput {
  title: string;
  message?: string;
  tone?: StatusTone;
}

interface ToastEntry extends ToastInput {
  id: number;
}

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const dismiss = useCallback((id: number) => setToasts(t => t.filter(x => x.id !== id)), []);
  const show = useCallback((toast: ToastInput) => {
    const id = nextId++;
    setToasts(t => [...t, { ...toast, id }]);
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={useMemo(() => show, [show])}>
      {children}
      <ToastStack>
        {toasts.map(t => <Toast key={t.id} tone={t.tone ?? 'success'} title={t.title} message={t.message} onClose={() => dismiss(t.id)} />)}
      </ToastStack>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast must be used inside <ToastProvider>');
  return show;
}
