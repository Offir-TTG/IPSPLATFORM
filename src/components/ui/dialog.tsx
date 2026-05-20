import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    dir?: 'ltr' | 'rtl'
  }
>(({ className, children, dir, ...props }, ref) => {
  const isRtl = dir === 'rtl'

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        dir={dir}
        className={cn(
          // Layout: `flex flex-col` so DialogHeader/DialogBody/DialogFooter
          // can each control shrink/grow. Capped at 90vh with overflow-hidden
          // so the scroll boundary lives on DialogBody instead of the root.
          // Existing dialogs without DialogBody render the same as before
          // (gap-4 spacing preserved, content fits within 90vh without
          // scroll). Tall dialogs should wrap their middle content in
          // <DialogBody> to get a frozen header + scrollable body + frozen
          // footer.
          //
          // Callers that need to override (legacy `overflow-y-auto` on the
          // root) can still pass that via `className` — it'll win against
          // these defaults via `cn`'s tailwind-merge.
          "fixed left-[50%] top-[50%] z-50 flex flex-col w-full max-w-lg max-h-[90vh] overflow-hidden translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
        {/* Close button is a sibling of DialogBody, so it stays at the
            top corner of the DialogContent box regardless of how the
            body scrolls. z-20 keeps it above any sticky header decoration. */}
        <DialogPrimitive.Close className={cn(
          "absolute top-4 z-20 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
          isRtl ? "left-4" : "right-4"
        )}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      // `shrink-0` so the header stays at its natural height when the
      // DialogContent is `flex flex-col` — i.e., it's frozen at top
      // while DialogBody flex-grows and scrolls.
      "flex flex-col space-y-1.5 text-center sm:text-start shrink-0",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

/**
 * Scrollable body slot. Use this for the middle content of a tall
 * dialog so the header and footer stay frozen while the body scrolls.
 *
 *   <DialogContent>
 *     <DialogHeader>…</DialogHeader>
 *     <DialogBody>… long content …</DialogBody>
 *     <DialogFooter>…</DialogFooter>
 *   </DialogContent>
 *
 * Negative margins + restored padding let the body extend to the
 * dialog edges (so a long scroll doesn't leave dead gutters) while
 * the content sits at the same indent as the header/footer.
 */
const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex-1 overflow-y-auto -mx-6 px-6 min-h-0",
      className
    )}
    {...props}
  />
)
DialogBody.displayName = "DialogBody"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      // `shrink-0` matches DialogHeader — keeps the footer pinned to
      // the bottom of the DialogContent flex column.
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
