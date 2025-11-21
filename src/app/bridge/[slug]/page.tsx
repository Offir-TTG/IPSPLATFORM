'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function InstructorBridgePage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error' | 'waiting'>('loading');
  const [message, setMessage] = useState('');
  const [nextLesson, setNextLesson] = useState<any>(null);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading...</h2>
            <p className="text-gray-600">Checking for your live session</p>
          </div>
        )}

        {status === 'redirecting' && (
          <div className="text-center">
            <div className="animate-pulse rounded-full h-16 w-16 bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Session Found!</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'waiting' && (
          <div className="text-center">
            <div className="rounded-full h-16 w-16 bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Active Session</h2>
            <p className="text-gray-600 mb-4">{message}</p>

            {nextLesson && (
              <div className="bg-blue-50 rounded-lg p-4 mt-4">
                <p className="text-sm font-medium text-blue-900 mb-1">Your next session:</p>
                <p className="text-lg font-semibold text-blue-700">{nextLesson.title}</p>
                <p className="text-sm text-blue-600 mt-1">
                  {new Date(nextLesson.start_time).toLocaleString('en-US', {
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
              <p>Please use this same link when it is time for your session.</p>
              <p className="mt-2">You can bookmark this page for easy access.</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="rounded-full h-16 w-16 bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
