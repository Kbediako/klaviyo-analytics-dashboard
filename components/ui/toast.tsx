import * as React from "react";
import { Toast, toast, useToast } from "./use-toast";

interface ToastProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { ...toast, id }]);

      // Auto remove toast after duration
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration || 5000);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Initialize the toast manager with the addToast function
  React.useEffect(() => {
    toast.setAddToast(addToast);
    // Cleanup function should use undefined instead of null
    return () => toast.setAddToast(undefined);
  }, [addToast]);

  return (
    <>
      {children}
      {toasts.length > 0 && (
        <div
          className="fixed top-0 right-0 z-50 flex flex-col gap-2 w-full max-w-sm p-4 m-4"
          role="alert"
          aria-live="assertive"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`${
                toast.variant === "destructive"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
              } rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out`}
            >
              {toast.title && (
                <div className="font-semibold">{toast.title}</div>
              )}
              {toast.description && (
                <div className="text-sm mt-1">{toast.description}</div>
              )}
              <button
                onClick={() => removeToast(toast.id)}
                className="absolute top-1 right-1 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
