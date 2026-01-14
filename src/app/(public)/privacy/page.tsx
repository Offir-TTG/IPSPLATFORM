'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useUserLanguage } from '@/context/AppContext';
import { PublicHeader } from '@/components/public';
import { PublicFooter } from '@/components/public';

export default function PrivacyPage() {
  const { direction } = useUserLanguage();

  useEffect(() => {
    // Load Termly script
    const script = document.createElement('script');
    script.id = 'termly-jssdk';
    script.src = 'https://app.termly.io/embed-policy.min.js';
    script.async = true;

    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode && !document.getElementById('termly-jssdk')) {
      firstScript.parentNode.insertBefore(script, firstScript);
    }

    return () => {
      // Cleanup script on unmount
      const existingScript = document.getElementById('termly-jssdk');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <PublicHeader />

      {/* Termly Embed Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div
              data-name="termly-embed"
              data-id="d7833c94-4904-49d2-8173-19115b8aea9b"
              data-type="iframe"
            />
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
