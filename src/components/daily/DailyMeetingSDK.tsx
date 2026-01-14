'use client';

import { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { Maximize2, Minimize2, AlertCircle, RefreshCw } from 'lucide-react';

interface DailyMeetingSDKProps {
  lessonId: string;
  onError?: (error: Error) => void;
}

// Global instance tracking (React Strict Mode mitigation)
let globalCallFrame: any = null;
let isCreating = false;

export default function DailyMeetingSDK({ lessonId, onError }: DailyMeetingSDKProps) {
  const callFrame = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [userName, setUserName] = useState('');
  const initAttempted = useRef(false);

  const initializeMeeting = async () => {
    // Prevent duplicate initialization attempts (React Strict Mode)
    if (isCreating) {
      console.log('[Daily.co] Already creating an instance, skipping...');
      return;
    }

    // If we already have a valid instance, reuse it
    if (globalCallFrame && callFrame.current === globalCallFrame) {
      console.log('[Daily.co] Reusing existing instance');
      setIsLoading(false);
      return;
    }

    try {
      isCreating = true;
      setIsLoading(true);
      setError(null);

      // Cleanup any existing global instance first
      if (globalCallFrame) {
        console.log('[Daily.co] Destroying previous global instance...');
        try {
          await globalCallFrame.destroy();
        } catch (e) {
          console.log('[Daily.co] Error destroying global instance:', e);
        }
        globalCallFrame = null;
      }

      // Small delay to ensure previous instance is fully destroyed
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('[Daily.co] Fetching meeting token...');

      // Get token from API (automatic role assignment happens here)
      const response = await fetch('/api/daily/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get meeting token');
      }

      const { token, roomUrl, isOwner: ownerStatus, userName: displayName } = await response.json();

      setIsOwner(ownerStatus);
      setUserName(displayName);

      console.log('[Daily.co] Token received. Role:', ownerStatus ? 'Owner/Instructor' : 'Participant/Student');

      // Create Daily call frame and store in both local and global refs
      callFrame.current = DailyIframe.createFrame(containerRef.current!, {
        showLeaveButton: true,
        showFullscreenButton: false, // We'll use our custom button
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '8px',
          minHeight: '600px',
        }
      });
      globalCallFrame = callFrame.current;

      // Set up event listeners
      callFrame.current
        .on('joined-meeting', () => {
          console.log('[Daily.co] Successfully joined meeting');
          setIsLoading(false);
        })
        .on('left-meeting', () => {
          console.log('[Daily.co] Left meeting');
        })
        .on('error', (e: any) => {
          console.error('[Daily.co] Meeting error:', e);
          setError(e.errorMsg || 'An error occurred during the meeting');
          setIsLoading(false);
        });

      // Join with token (role is embedded in token)
      console.log('[Daily.co] Joining meeting...');
      await callFrame.current.join({
        url: roomUrl,
        token: token,
      });

    } catch (err) {
      console.error('[Daily.co] Initialization error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to join meeting';
      setError(errorMessage);
      setIsLoading(false);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      isCreating = false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // Only initialize once per component lifecycle
      if (isMounted && !initAttempted.current) {
        initAttempted.current = true;
        await initializeMeeting();
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      initAttempted.current = false;

      // Only destroy if this is our instance
      if (callFrame.current && globalCallFrame === callFrame.current) {
        try {
          console.log('[Daily.co] Cleaning up on unmount...');
          callFrame.current.destroy();
          globalCallFrame = null;
        } catch (e) {
          console.log('[Daily.co] Cleanup error (can be ignored):', e);
        }
      }
      callFrame.current = null;
    };
  }, [lessonId]);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      } else if ((containerRef.current as any).msRequestFullscreen) {
        (containerRef.current as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleRetry = () => {
    setError(null);
    initializeMeeting();
  };

  return (
    <div ref={containerRef} className="relative w-full rounded-lg overflow-hidden bg-gray-900" style={{ minHeight: '600px' }}>
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Connecting to meeting...</p>
            {userName && (
              <p className="text-gray-400 text-sm mt-2">
                Joining as: <span className="font-semibold">{userName}</span>
                {isOwner && <span className="ml-2 text-green-400">(Host)</span>}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center p-6 max-w-md">
            <div className="text-red-500 mb-4">
              <AlertCircle className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Unable to Join Meeting</h3>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Toggle Button */}
      {!isLoading && !error && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-20 bg-gray-800/80 hover:bg-gray-700/80 text-white p-2 rounded-lg transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5" />
          ) : (
            <Maximize2 className="w-5 h-5" />
          )}
        </button>
      )}

      {/* Role Badge */}
      {!isLoading && !error && isOwner && (
        <div className="absolute top-4 left-4 z-20 bg-green-600/90 text-white px-3 py-1 rounded-full text-sm font-semibold">
          Host
        </div>
      )}
    </div>
  );
}
