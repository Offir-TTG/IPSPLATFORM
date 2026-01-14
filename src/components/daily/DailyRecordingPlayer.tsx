'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface DailyRecordingPlayerProps {
  recordingUrl: string;
  lessonTitle?: string;
  onError?: (error: Error) => void;
}

export default function DailyRecordingPlayer({
  recordingUrl,
  lessonTitle,
  onError,
}: DailyRecordingPlayerProps) {
  const { t } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadRecording = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Daily.co recordings can be direct video URLs or share URLs
        if (recordingUrl.includes('.mp4') || recordingUrl.startsWith('http')) {
          // Direct URL - use it directly
          setVideoUrl(recordingUrl);
          setIsLoading(false);
        } else {
          // Treat as direct URL
          setVideoUrl(recordingUrl);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading recording:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load recording';
        setError(errorMessage);
        setIsLoading(false);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    };

    if (recordingUrl) {
      loadRecording();
    }
  }, [recordingUrl, onError]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-900 rounded-lg">
        <div className="text-center p-6">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Recording</h3>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading recording...</p>
        </div>
      </div>
    );
  }

  // Check if this is a Daily.co share URL (iframe) or direct MP4
  const isDailyShareUrl = videoUrl?.includes('daily.co/') && !videoUrl?.includes('.mp4');

  return (
    <div className="w-full">
      {/* Daily.co recording player */}
      <div className="relative w-full rounded-lg overflow-hidden bg-black">
        {isDailyShareUrl ? (
          // Use iframe for Daily.co share URLs
          <iframe
            src={videoUrl!}
            className="w-full"
            style={{ minHeight: '500px', height: '600px', border: 'none' }}
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        ) : (
          // Use video tag for direct MP4 URLs
          <video
            controls
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full"
            style={{ maxHeight: '600px' }}
            poster={`https://via.placeholder.com/1280x720/1a1a1a/ffffff?text=${encodeURIComponent(lessonTitle || 'Recording')}`}
          >
            <source src={videoUrl!} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      {/* Info message for Daily.co recordings */}
      {isDailyShareUrl && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {t('user.courses.recordingHostedOnDaily', 'This recording is hosted on Daily.co. If you cannot view it, please contact support.', 'user')}
          </p>
        </div>
      )}
    </div>
  );
}
