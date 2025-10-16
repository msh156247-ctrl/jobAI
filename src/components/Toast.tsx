'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const newToast: Toast = { id, type, message }

    setToasts((prev) => [...prev, newToast])

    // 3초 후 자동 제거
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => {
          const Icon =
            toast.type === 'success'
              ? CheckCircle
              : toast.type === 'error'
              ? AlertCircle
              : toast.type === 'warning'
              ? AlertTriangle
              : Info

          const bgColor =
            toast.type === 'success'
              ? 'bg-green-50 border-green-200'
              : toast.type === 'error'
              ? 'bg-red-50 border-red-200'
              : toast.type === 'warning'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-blue-50 border-blue-200'

          const textColor =
            toast.type === 'success'
              ? 'text-green-800'
              : toast.type === 'error'
              ? 'text-red-800'
              : toast.type === 'warning'
              ? 'text-yellow-800'
              : 'text-blue-800'

          const iconColor =
            toast.type === 'success'
              ? 'text-green-600'
              : toast.type === 'error'
              ? 'text-red-600'
              : toast.type === 'warning'
              ? 'text-yellow-600'
              : 'text-blue-600'

          return (
            <div
              key={toast.id}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border ${bgColor} ${textColor} min-w-[300px] max-w-md animate-slide-in`}
            >
              <Icon className={iconColor} size={20} />
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 hover:opacity-70"
              >
                <X size={18} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}