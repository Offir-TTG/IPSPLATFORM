'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import DailyMeetingSDK from '@/components/daily/DailyMeetingSDK';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AdminDailyMeetingPage() {
  const params = useParams();
  const lessonId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simple loading timeout
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white">Loading meeting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <DailyMeetingSDK
          lessonId={lessonId}
          onError={(error) => {
            console.error('Meeting error:', error);
            setError(error.message);
          }}
        />

        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
