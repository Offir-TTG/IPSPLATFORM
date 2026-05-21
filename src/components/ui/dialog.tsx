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
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        dir={dir}
        className={cn(
          // Layout: `flex flex-col` so DialogHeader/DialogBody/DialogFooter
          // can each control shrink/grow.
          //
          // `overflow-y-auto` on the root is the SAFE default — if a dialog
          // doesn't wrap its middle in <DialogBody>, the whole dialog scrolls
          // (header + content + footer together) instead of having its
          // bottom clipped. Dialogs that DO use <DialogBody> still get the
          // frozen header/footer behavior because DialogBody is
          // `flex-1 min-h-0 overflow-y-auto` — once its parent's max-height
          // is reached, the inner body scrolls and the root has nothing
          // left to overflow.
          //
          // `max-h-[90dvh]` uses dynamic viewport height so when the soft
          // keyboard opens on mobile, the dialog shrinks instead of being
          // pushed off-screen. dvh has Safari 15.4+ / Chrome 108+ support.
          //
          // `w-[calc(100%-2rem)] sm:w-full` keeps a 1rem gap from each
          // viewport edge on mobile while letting desktop max-w-* utilities
          // behave exactly as before.
          "fixed left-[50%] top-[50%] z-50 flex flex-col w-[calc(100%-2rem)] sm:w-full max-w-lg max-h-[90dvh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
        {/* Close button is a sibling of DialogBody, so it stays at the
            top corner of the DialogContent box regardless of how the
            body scrolls. z-20 keeps it above any sticky header decoration.
            `end-4` is a CSS logical property — auto-flips to the correct
            side based on the document's `dir` attribute, so callers no
            longer need to pass a `dir` prop on every Dialog. */}
        <DialogPrimitive.Close className="absolute top-4 end-4 z-20 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
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
