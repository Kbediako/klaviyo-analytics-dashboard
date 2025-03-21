import * as React from "react";
import { useEffect, useState } from "react";

// Create a separate file for the JSX component
// This file will only contain the hook and types

const TOAST_TIMEOUT = 5000 // 5 seconds

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = React.useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substr(2, 9)
      setToasts((prev) => [...prev, { ...toast, id }])

      // Auto remove toast after duration
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, toast.duration || TOAST_TIMEOUT)
    },
    []
  )

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const value = React.useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
    }),
    [toasts, addToast, removeToast]
  )

  return { toasts, addToast, removeToast };
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Create a singleton instance for the toast functions
class ToastManager {
  private static instance: ToastManager;
  private addToastFn?: ((toast: Omit<Toast, "id">) => void);

  private constructor() {}

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  setAddToast(fn?: (toast: Omit<Toast, "id">) => void) {
    this.addToastFn = fn;
  }

  private showToast(props: Omit<Toast, "id" | "variant">, variant: Toast["variant"]) {
    if (!this.addToastFn) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn("Toast system not initialized");
      }
      return;
    }
    this.addToastFn({ ...props, variant });
  }

  default(props: Omit<Toast, "id" | "variant">) {
    this.showToast(props, "default");
  }

  destructive(props: Omit<Toast, "id" | "variant">) {
    this.showToast(props, "destructive");
  }
}

export const toast = ToastManager.getInstance();
