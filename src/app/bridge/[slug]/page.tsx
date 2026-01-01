'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/context/AppContext';

export default function InstructorBridgePage() {
  const params = useParams();
  const { t, direction, language, loading: translationsLoading } = useLanguage();
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error' | 'waiting'>('loading');
  const [message, setMessage] = useState('');
  const [nextLesson, setNextLesson] = useState<any>(null);

  // Debug logging
  useEffect(() => {
    console.log('[Bridge] Language:', language);
    console.log('[Bridge] Direction:', direction);
    console.log('[Bridge] Translations Loading:', translationsLoading);
    console.log('[Bridge] Translation for bridge.loading:', t('bridge.loading', 'Loading...'));
    console.log('[Bridge] Translation for bridge.checking_session:', t('bridge.checking_session', 'Checking for your live session'));

    // Check localStorage for cached translations
    if (typeof window !== 'undefined') {
      const cacheKey = `translations_user_${language}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          console.log('[Bridge] Cached translations found:', {
            version: parsedCache.version,
            age: Math.round((Date.now() - parsedCache.timestamp) / 1000 / 60) + ' minutes',
            keys: Object.keys(parsedCache.data).length,
            hasBridgeLoading: !!parsedCache.data['bridge.loading']
          });
        } catch (e) {
          console.error('[Bridge] Failed to parse cached translations:', e);
        }
      } else {
        console.log('[Bridge] No cached translations found');
      }
    }
  }, [language, direction, translationsLoading, t]);

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const slug = params.slug as string;
        const response = await fetch(`/api/bridge/${slug}`);
        const data = await response.json();

        if (data.success && data.redirect_url) {
          setStatus('redirecting');
          setMessage('Redirecting to your Zoom meeting...');

          // Log audit event
          if (data.lesson_id) {
            await fetch('/api/audit/bridge-access', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bridge_slug: slug,
                lesson_id: data.lesson_id,
                action: 'instructor_joined',
              }),
            }).catch(console.error);
          }

          // Redirect to Zoom
          window.location.href = data.redirect_url;
        } else {
          setStatus('waiting');
          setMessage(data.message || 'No active session right now');
          setNextLesson(data.next_lesson || null);
        }
      } catch (error) {
        setStatus('error');
        setMessage('Failed to load bridge link. Please contact support.');
        console.error('Bridge error:', error);
      }
    };

    checkAndRedirect();
  }, [params.slug]);

  // Show blank screen while translations are loading to prevent flash of English text
  if (translationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {status === 'loading' && (
          <div className="text-center" dir={direction}>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('bridge.loading', 'Loading...')}</h2>
            <p className="text-gray-600">{t('bridge.checking_session', 'Checking for your live session')}</p>
          </div>
        )}

        {status === 'redirecting' && (
          <div className="text-center" dir={direction}>
            <div className="animate-pulse rounded-full h-16 w-16 bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('bridge.session_found', 'Session Found!')}</h2>
            <p className="text-gray-600">{t('bridge.redirecting', 'Redirecting to your Zoom meeting...')}</p>
          </div>
        )}

        {status === 'waiting' && (
          <div className="text-center" dir={direction}>
            <div className="rounded-full h-16 w-16 bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('bridge.no_active_session', 'No Active Session')}</h2>
            <p className="text-gray-600 mb-4">{t('bridge.no_active_session_message', 'No active session right now')}</p>

            {nextLesson && (
              <div className="bg-blue-50 rounded-lg p-4 mt-4">
                <p className="text-sm font-medium text-blue-900 mb-1">{t('bridge.next_session', 'Your next session:')}</p>
                <p className="text-lg font-semibold text-blue-700">{nextLesson.title}</p>
                <p className="text-sm text-blue-600 mt-1">
                  {new Date(nextLesson.start_time).toLocaleString(language === 'he' ? 'he-IL' : 'en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}

            <div className="mt-6 text-sm text-gray-500">
              <p>{t('bridge.use_same_link', 'Please use this same link when it is time for your session.')}</p>
              <p className="mt-2">{t('bridge.bookmark_page', 'You can bookmark this page for easy access.')}</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center" dir={direction}>
            <div className="rounded-full h-16 w-16 bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('bridge.error', 'Error')}</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {t('bridge.try_again', 'Try Again')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
