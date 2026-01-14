'use client';

import { useEffect, useRef, useState } from 'react';
import ZoomMtgEmbedded from '@zoom/meetingsdk/embedded';
import { supabase } from '@/lib/supabase/client';
import { useUserLanguage } from '@/context/AppContext';

interface ZoomMeetingSDKProps {
  meetingNumber: string;
  password?: string;
  role?: number; // 0 = participant, 1 = host
  onMeetingEnd?: () => void;
  onError?: (error: Error) => void;
}

export default function ZoomMeetingSDK({
  meetingNumber,
  password = '',
  role = 0,
  onMeetingEnd,
  onError,
}: ZoomMeetingSDKProps) {
  const { t } = useUserLanguage();
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const meetingSDKElement = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const clientRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
          setUserEmail(user.email || '');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const initializeMeeting = async () => {
      if (!userName || !userEmail) {
        return; // Wait for user data to be loaded
      }

      // Set a timeout to detect if meeting join is taking too long
      const joinTimeout = setTimeout(() => {
        setError('Connection timeout. Please check your internet connection and try again.');
        setIsLoading(false);
        onError?.(new Error('Meeting join timeout'));
      }, 60000); // 60 second timeout

      try {
        setIsLoading(true);
        setError(null);

        // Get signature from backend
        const response = await fetch('/api/zoom/signature', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meetingNumber,
            role,
          }),
        });

        if (!response.ok) {
          clearTimeout(joinTimeout);
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get Zoom signature');
        }

        const { signature, sdkKey } = await response.json();

        if (!signature || !sdkKey) {
          clearTimeout(joinTimeout);
          throw new Error('Invalid signature response');
        }

        // Initialize Zoom Meeting SDK
        console.log('[Zoom] Creating Zoom client...');
        const client = ZoomMtgEmbedded.createClient();
        clientRef.current = client;

        // Initialize the client
        console.log('[Zoom] Initializing Zoom SDK...');
        await client.init({
          zoomAppRoot: meetingSDKElement.current!,
          language: 'en-US',
          patchJsMedia: true,
          leaveOnPageUnload: true,
        });

        // Add event listener to track connection status
        client.on('connection-change', (payload: any) => {
          console.log('[Zoom] Connection status changed:', payload);
          if (payload.state === 'Connected') {
            console.log('[Zoom] Successfully connected to meeting');
            clearTimeout(joinTimeout);
            setIsLoading(false);
          }
        });

        // Join the meeting
        console.log('[Zoom] Joining meeting:', meetingNumber);
        await client.join({
          signature,
          sdkKey,
          meetingNumber,
          userName,
          userEmail,
          password,
          tk: '', // Leave empty if not using registration
        });

        console.log('[Zoom] Successfully joined meeting');
        clearTimeout(joinTimeout);
        setIsLoading(false);
      } catch (err) {
        clearTimeout(joinTimeout);
        console.error('[Zoom] Error initializing Zoom meeting:', err);
        console.error('[Zoom] Error details:', {
          meetingNumber,
          userName,
          userEmail,
          hasPassword: !!password,
          errorType: err instanceof Error ? err.constructor.name : typeof err,
          errorMessage: err instanceof Error ? err.message : String(err),
        });

        let errorMessage = 'Failed to initialize Zoom meeting';
        if (err instanceof Error) {
          // Provide more user-friendly error messages
          if (err.message.includes('Invalid signature')) {
            errorMessage = 'Invalid Zoom meeting credentials. Please contact support.';
          } else if (err.message.includes('Meeting not found') || err.message.includes('Invalid meeting')) {
            errorMessage = 'Meeting not found. The meeting may have ended or the ID is incorrect.';
          } else if (err.message.includes('not started') || err.message.includes('Meeting has not been started')) {
            errorMessage = t('user.courses.meetingNotStarted', 'This meeting has not started yet. Please wait for the host to start the meeting.');
          } else if (err.message.includes('timeout') || err.message.includes('connection')) {
            errorMessage = 'Connection timeout. Please check your internet connection and try again.';
          } else {
            errorMessage = err.message || 'An unexpected error occurred while joining the meeting.';
          }
        } else if (typeof err === 'object' && err !== null) {
          // Handle Zoom SDK error objects
          const zoomError = err as any;
          if (zoomError.type === 'JOIN_MEETING_FAILED') {
            if (zoomError.reason?.includes('not started') || zoomError.reason?.includes('not been started')) {
              errorMessage = t('user.courses.meetingNotStarted', 'This meeting has not started yet. Please wait for the host to start the meeting.');
            } else if (zoomError.reason?.includes('Invalid')) {
              errorMessage = 'Unable to join meeting. Please check the meeting ID and try again.';
            } else {
              errorMessage = zoomError.reason || 'Failed to join the meeting.';
            }
          }
        }

        setError(errorMessage);
        setIsLoading(false);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    };

    if (meetingNumber && userName && userEmail) {
      initializeMeeting();
    }

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        try {
          // Cleanup Zoom SDK
          ZoomMtgEmbedded.destroyClient();
        } catch (err) {
          console.error('Error cleaning up Zoom SDK:', err);
        }
      }
    };
  }, [meetingNumber, userName, userEmail, password, role, onError]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      // Enter fullscreen
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      } else if ((containerRef.current as any).msRequestFullscreen) {
        (containerRef.current as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
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
      setIsFullscreen(!!document.fullscreenElement);
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

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[600px]">
      {/* Fullscreen Toggle Button */}
      {!isLoading && !error && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-50 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg shadow-lg transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
      )}

      {/* Zoom Meeting Container - Always rendered so ref is available */}
      <div
        ref={meetingSDKElement}
        className="w-full h-full min-h-[600px] rounded-lg overflow-hidden"
        style={{ height: '100%', display: isLoading || error ? 'none' : 'block' }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Joining meeting...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
          <div className="text-center p-6 max-w-md">
            <div className="text-red-500 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Failed to Join Meeting</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
