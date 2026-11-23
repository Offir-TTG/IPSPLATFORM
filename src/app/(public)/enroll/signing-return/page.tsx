'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/AppContext';

/**
 * DocuSign sends the signer here after signing in the wizard's dialog (or the
 * new-window fallback), adding ?event=signing_complete|cancel|decline|... .
 * This page only passes that result to the wizard on our own site; the
 * wizard then checks the real status with DocuSign before moving on.
 */
export default function SigningReturnPage() {
  const { t } = useLanguage();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const event = new URLSearchParams(window.location.search).get('event') || 'unknown';
    const message = { source: 'ips-docusign', event };
    const origin = window.location.origin;
    try {
      // This page may load inside DocuSign's own frames: tell the top page
      // (the wizard) and the direct parent; only our own origin receives it.
      if (window.top && window.top !== window) window.top.postMessage(message, origin);
      if (window.parent && window.parent !== window && window.parent !== window.top) window.parent.postMessage(message, origin);
      if (window.opener) {
        window.opener.postMessage(message, origin);
        window.close();
      }
    } catch {
      // Nothing to tell: the wizard also checks the status when it's reopened.
    }
    setDone(true);
  }, []);

  return (
    <div style={{ padding: 24, textAlign: 'center', fontFamily: 'inherit' }}>
      <p suppressHydrationWarning>
        {done
          ? t('enrollment.wizard.signature.returned', 'Thank you. You can go back to the enrollment.')
          : t('enrollment.wizard.signature.returning', 'One moment...')}
      </p>
    </div>
  );
}
