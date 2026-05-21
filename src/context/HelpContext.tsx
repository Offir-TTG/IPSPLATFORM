'use client';

import * as React from 'react';

/**
 * In-app help system state.
 *
 * Pattern:
 *  1. Admin pages call `useHelp('grading-scales')` in a useEffect, which
 *     calls `setPageSlug` to register the page's default help article.
 *  2. The (?) button in AdminLayout calls `openDrawer()` to show the
 *     drawer with whichever article is currently registered.
 *  3. Inside the drawer, the user can navigate to related articles via
 *     `setActiveSlug(slug)` — this overrides the page slug only while
 *     the drawer is open; navigating to another admin page resets it.
 *
 * Why a context: the drawer needs to live in AdminLayout (so it floats
 * across all admin pages), but the slug is set by individual pages
 * deep in the tree. Context bridges that gap without prop-drilling.
 */

interface HelpContextValue {
  /** Slug declared by the current page via useHelp(). Null = no page-default. */
  pageSlug: string | null;
  setPageSlug: (slug: string | null) => void;

  /** Slug currently displayed in the drawer. Defaults to pageSlug when opened. */
  activeSlug: string | null;
  setActiveSlug: (slug: string | null) => void;

  isOpen: boolean;
  openDrawer: (slug?: string) => void;
  closeDrawer: () => void;
}

const HelpContext = React.createContext<HelpContextValue | null>(null);

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [pageSlug, setPageSlug] = React.useState<string | null>(null);
  const [activeSlug, setActiveSlug] = React.useState<string | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const openDrawer = React.useCallback((slug?: string) => {
    setActiveSlug(slug ?? pageSlug ?? null);
    setIsOpen(true);
  }, [pageSlug]);

  const closeDrawer = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const value: HelpContextValue = {
    pageSlug,
    setPageSlug,
    activeSlug,
    setActiveSlug,
    isOpen,
    openDrawer,
    closeDrawer,
  };

  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
}

export function useHelpContext(): HelpContextValue {
  const ctx = React.useContext(HelpContext);
  if (!ctx) {
    throw new Error('useHelpContext must be used inside <HelpProvider>');
  }
  return ctx;
}
