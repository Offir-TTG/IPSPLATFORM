"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

/**
 * Underline variant of TabsList — GitHub / Linear / Vercel style.
 * Pairs with `UnderlineTabsTrigger` (the trigger draws the active
 * indicator). The list provides the bottom rail; the active trigger's
 * 2px primary border overlays the rail via `-mb-px`.
 *
 * Mobile: wrap in `overflow-x-auto` at the call site if you expect more
 * tabs than the viewport can fit, or rely on natural flow for ≤4 short
 * labels.
 */
const UnderlineTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "bg-transparent p-0 h-auto rounded-none gap-6 flex-nowrap justify-start w-full border-b border-border",
      className
    )}
    {...props}
  />
))
UnderlineTabsList.displayName = "UnderlineTabsList"

/**
 * Underline tab trigger. Active state: bolder text + 2px primary
 * underline (overlays the parent list's border via -mb-px). The `group`
 * class lets a `<CountBadge>` child react to the active state via
 * `group-data-[state=active]:` Tailwind variants.
 */
const UnderlineTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "group relative inline-flex items-center gap-2 px-1 py-3 text-sm font-medium",
      "text-muted-foreground transition-colors whitespace-nowrap",
      "border-b-2 border-transparent -mb-px",
      "hover:text-foreground",
      "focus-visible:outline-none focus-visible:text-foreground",
      "data-[state=active]:text-foreground data-[state=active]:font-semibold",
      "data-[state=active]:border-primary",
      "rounded-none shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none",
      className,
    )}
    {...props}
  />
))
UnderlineTabsTrigger.displayName = "UnderlineTabsTrigger"

/**
 * Count chip designed to sit inside an `UnderlineTabsTrigger`. Reacts
 * to the parent trigger's `data-state=active` via group-data variants
 * (the trigger carries the `group` class). Used for unread / queued /
 * filtered counts next to the tab label.
 *
 * `tone="alert"` recolors the inactive chip in destructive tones —
 * useful for "unread" badges where the count itself should grab the
 * eye even when its tab isn't active.
 */
const TabCountBadge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    n: number
    tone?: "default" | "alert"
  }
>(({ className, n, tone = "default", ...props }, ref) => {
  const inactive =
    tone === "alert"
      ? "bg-destructive/10 text-destructive"
      : "bg-muted text-muted-foreground"
  return (
    <span
      ref={ref}
      className={cn(
        "text-xs font-medium px-1.5 py-0.5 rounded-md tabular-nums transition-colors",
        inactive,
        "group-data-[state=active]:bg-primary/10 group-data-[state=active]:text-primary",
        className,
      )}
      {...props}
    >
      {n}
    </span>
  )
})
TabCountBadge.displayName = "TabCountBadge"

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  UnderlineTabsList,
  UnderlineTabsTrigger,
  TabCountBadge,
}
