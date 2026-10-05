"use client"

import { AlertTriangle, Check, Info, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

const DEFAULT_TOAST_MS = 5000

/** circular gradient icon badge per variant (neon-glass reference design) */
const ICON_BADGE: Record<string, { Icon: typeof Check; ring: string }> = {
  default: {
    Icon: Check,
    ring: "bg-gradient-to-b from-[#2BF5A6] to-[#00B978] text-[#04120C] shadow-[0_0_18px_-2px_rgba(0,208,132,0.75)]",
  },
  destructive: {
    Icon: X,
    ring: "bg-gradient-to-b from-[#F87171] to-[#DC2626] text-white shadow-[0_0_18px_-2px_rgba(239,68,68,0.8)]",
  },
  warning: {
    Icon: AlertTriangle,
    ring: "bg-gradient-to-b from-[#FBBF24] to-[#D97706] text-white shadow-[0_0_18px_-2px_rgba(245,158,11,0.8)]",
  },
  info: {
    Icon: Info,
    ring: "bg-gradient-to-b from-[#60A5FA] to-[#2563EB] text-white shadow-[0_0_18px_-2px_rgba(59,130,246,0.8)]",
  },
}

/** depleting progress-bar fill per variant */
const PROGRESS_FILL: Record<string, string> = {
  default: "bg-[#00D084] shadow-[0_0_10px_rgba(0,208,132,0.9)]",
  destructive: "bg-[#EF4444] shadow-[0_0_10px_rgba(239,68,68,0.9)]",
  warning: "bg-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.9)]",
  info: "bg-[#3B82F6] shadow-[0_0_10px_rgba(59,130,246,0.9)]",
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={DEFAULT_TOAST_MS}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const variant = props.variant ?? "default"
        const badge = ICON_BADGE[variant] ?? ICON_BADGE.default
        const fill = PROGRESS_FILL[variant] ?? PROGRESS_FILL.default
        const duration =
          typeof props.duration === "number" ? props.duration : DEFAULT_TOAST_MS
        const { Icon } = badge
        return (
          <Toast key={id} {...props}>
            <span
              aria-hidden="true"
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ring-1 ring-white/25 ${badge.ring}`}
            >
              <Icon className="h-5 w-5" strokeWidth={2.5} />
            </span>

            <div className="grid min-w-0 flex-1 gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />

            {/* lifetime progress bar along the bottom edge */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-white/10"
            >
              <span
                className={`wp-toast-progress block h-full w-full ${fill}`}
                style={{ animationDuration: `${duration}ms` }}
              />
            </span>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
