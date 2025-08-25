"use client"

import { useEffect, useState } from "react"
import { Check, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastProps {
  message: string
  type?: "success" | "error" | "info"
  duration?: number
  onClose?: () => void
}

export function Toast({
  message,
  type = "info",
  duration = 3000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const icons = {
    success: <Check className="h-4 w-4" />,
    error: <X className="h-4 w-4" />,
    info: <AlertCircle className="h-4 w-4" />,
  }

  const styles = {
    success:
      "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    error:
      "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  }

  return (
    <div className="animate-in slide-in-from-bottom-2 fixed bottom-4 right-4 z-50">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg",
          styles[type]
        )}
      >
        {icons[type]}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState<ToastProps | null>(null)

  const showToast = (props: ToastProps) => {
    setToast(props)
  }

  const hideToast = () => {
    setToast(null)
  }

  return {
    toast,
    showToast,
    hideToast,
    ToastComponent: toast ? <Toast {...toast} onClose={hideToast} /> : null,
  }
}
