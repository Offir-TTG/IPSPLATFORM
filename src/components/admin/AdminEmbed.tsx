'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Marks admin content shown inside another admin page (for example, a course's
 * grade or attendance pages inside the course builder's tabs). AdminLayout
 * then draws only the content, not a second side menu and top bar.
 */
const EmbedContext = createContext(false);

export function AdminEmbed({ children }: { children: ReactNode }) {
  return <EmbedContext.Provider value={true}>{children}</EmbedContext.Provider>;
}

/** True inside <AdminEmbed>. */
export function useAdminEmbedded(): boolean {
  return useContext(EmbedContext);
}
