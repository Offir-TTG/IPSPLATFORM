'use client';

import * as React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHelpContext } from '@/context/HelpContext';
import { useAdminLanguage } from '@/context/AppContext';

/**
 * (?) button rendered in the admin layout header. Opens the help drawer
 * with whichever article slug is currently registered by the active
 * page via `useHelp()`. Falls back to the "Browse all topics" view if
 * no page has registered a slug.
 *
 * Keep this purely a trigger — the drawer itself lives in HelpDrawer
 * mounted once per layout.
 */
export function HelpButton({ className }: { className?: string }) {
  const { openDrawer } = useHelpContext();
  const { t } = useAdminLanguage();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => openDrawer()}
      className={className}
      aria-label={t('admin.help.openLabel', 'Open help')}
      title={t('admin.help.openLabel', 'Open help')}
    >
      <HelpCircle className="h-5 w-5" />
    </Button>
  );
}
