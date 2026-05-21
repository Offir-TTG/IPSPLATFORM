'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Pure-CSS layout switch for wide tables that need a card-based view on
 * narrow viewports. Both slots render into the DOM and Tailwind's `md`
 * breakpoint (768px) toggles visibility — no JS state, no hydration
 * mismatch, no window resize listener.
 *
 *   <ResponsiveTable>
 *     <ResponsiveTable.Desktop>
 *       <table>…full desktop markup, unchanged…</table>
 *     </ResponsiveTable.Desktop>
 *     <ResponsiveTable.Mobile className="space-y-3">
 *       {rows.map(row => <Card key={row.id}>…</Card>)}
 *     </ResponsiveTable.Mobile>
 *   </ResponsiveTable>
 *
 * Desktop slot is invisible below 768px, mobile slot is invisible at or
 * above. Wrap once per page — never nest. Sticky positioning, scroll
 * containers, and event handlers all live inside the slot children, so
 * existing tables can be wrapped without any other markup change.
 */
const Root = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('w-full', className)} {...props}>
      {children}
    </div>
  ),
);
Root.displayName = 'ResponsiveTable';

const Desktop = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('hidden md:block', className)} {...props}>
      {children}
    </div>
  ),
);
Desktop.displayName = 'ResponsiveTable.Desktop';

const Mobile = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('md:hidden', className)} {...props}>
      {children}
    </div>
  ),
);
Mobile.displayName = 'ResponsiveTable.Mobile';

type ResponsiveTableComponent = typeof Root & {
  Desktop: typeof Desktop;
  Mobile: typeof Mobile;
};

const ResponsiveTable = Root as ResponsiveTableComponent;
ResponsiveTable.Desktop = Desktop;
ResponsiveTable.Mobile = Mobile;

export { ResponsiveTable };
