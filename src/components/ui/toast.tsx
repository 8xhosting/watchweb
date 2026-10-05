"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

/**
 * Full-bleed viewport — toasts span the entire screen width edge-to-edge
 * (no left/right padding), stacked from the top like a mobile app.
 */
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed left-0 top-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-1.5 p-0 pt-2",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

/**
 * Neon-glass toast (per the reference design):
 * dark glass card, 1px neon border + outer glow, circular gradient icon
 * (rendered by the Toaster), depleting progress bar along the bottom edge.
 * default  -> success  (emerald)
 * destructive -> error (red)
 * warning  -> amber,  info -> blue
 */
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border py-3 pl-3 pr-2 backdrop-blur-xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
  {
    variants: {
      variant: {
        default:
          "border-emerald-400/40 bg-[#06130D]/[0.92] text-emerald-50 shadow-[0_10px_34px_-8px_rgba(0,0,0,0.75),0_0_26px_-6px_rgba(0,208,132,0.55),inset_0_1px_0_rgba(255,255,255,0.07)]",
        destructive:
          "border-red-500/45 bg-[#170A0C]/[0.92] text-red-50 shadow-[0_10px_34px_-8px_rgba(0,0,0,0.75),0_0_26px_-6px_rgba(239,68,68,0.6),inset_0_1px_0_rgba(255,255,255,0.07)]",
        warning:
          "border-amber-400/45 bg-[#181206]/[0.92] text-amber-50 shadow-[0_10px_34px_-8px_rgba(0,0,0,0.75),0_0_26px_-6px_rgba(245,158,11,0.55),inset_0_1px_0_rgba(255,255,255,0.07)]",
        info: "border-blue-400/45 bg-[#0A1220]/[0.92] text-blue-50 shadow-[0_10px_34px_-8px_rgba(0,0,0,0.75),0_0_26px_-6px_rgba(59,130,246,0.55),inset_0_1px_0_rgba(255,255,255,0.07)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
  VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/[0.06] px-3 text-[12.5px] font-semibold text-white transition-colors hover:bg-white/[0.12] focus:outline-none focus:ring-1 focus:ring-white/40 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "relative grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/45 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-1 focus:ring-white/30",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-[13.5px] font-bold leading-tight text-white", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-[12.5px] leading-snug text-white/70", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
