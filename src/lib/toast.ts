// A tiny notification store. Call `toast.success(...)` / `toast.error(...)`
// from anywhere; <Toaster /> (mounted once in main.tsx) renders them.
export type ToastTone = "success" | "error";
export type ToastItem = { id: number; tone: ToastTone; title: string; description?: string };

let items: ToastItem[] = [];
let counter = 0;
const listeners = new Set<() => void>();

const emit = () => {
  items = [...items];
  listeners.forEach((l) => l());
};

export function dismissToast(id: number) {
  items = items.filter((i) => i.id !== id);
  emit();
}

function show(tone: ToastTone, title: string, opts?: { description?: string; duration?: number }) {
  const id = ++counter;
  items = [...items, { id, tone, title, description: opts?.description }];
  emit();
  setTimeout(() => dismissToast(id), opts?.duration ?? (tone === "error" ? 6000 : 3500));
  return id;
}

export const toast = {
  success: (title: string, opts?: { description?: string; duration?: number }) => show("success", title, opts),
  error: (title: string, opts?: { description?: string; duration?: number }) => show("error", title, opts),
};

export const subscribeToasts = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getToasts = () => items;
