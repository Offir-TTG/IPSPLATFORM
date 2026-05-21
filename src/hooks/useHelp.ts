'use client';

import { useEffect } from 'react';
import { useHelpContext } from '@/context/HelpContext';

/**
 * Declare the help article slug for the current admin page.
 *
 * Usage at the top of an admin page component:
 *   useHelp('grading-scales');
 *
 * Effect: when the user clicks the (?) icon in the admin header on this
 * page, the help drawer opens with the 'grading-scales' article (in
 * the active UI locale). Navigating away clears the slug so a different
 * page can register its own.
 *
 * Pass `null` to explicitly opt out (the (?) button will still work and
 * open a generic "Browse all topics" view).
 */
export function useHelp(slug: string | null): void {
  const { setPageSlug } = useHelpContext();

  useEffect(() => {
    setPageSlug(slug);
    return () => setPageSlug(null);
  }, [slug, setPageSlug]);
}
