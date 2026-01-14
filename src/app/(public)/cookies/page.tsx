'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useUserLanguage } from '@/context/AppContext';
import { PublicHeader } from '@/components/public/index';
import { PublicFooter } from '@/components/public/index';

export default function CookiesPage() {
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
              data-id="3e7f0bd1-d0ca-4011-afe1-b9c59ec48b3c"
              data-type="iframe"
            />
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
