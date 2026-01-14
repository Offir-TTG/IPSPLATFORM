'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, Users } from 'lucide-react';
import type { LessonTopic, WhiteboardContent } from '@/types/lms';

// Dynamically import Tldraw to avoid SSR issues
const Tldraw = dynamic(
  async () => {
    const module = await import('tldraw');
    return module.Tldraw;
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[500px] border rounded-lg bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

interface WhiteboardTopicBlockProps {
  topic: LessonTopic;
  t: (key: string, fallback: string) => string;
  isRtl: boolean;
  mode?: 'view' | 'collaborate'; // view = read-only, collaborate = editable
}

export function WhiteboardTopicBlock({ topic, t, isRtl, mode = 'view' }: WhiteboardTopicBlockProps) {
  const content = topic.content as WhiteboardContent;
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [collaborators, setCollaborators] = useState<number>(0);
  const editorRef = useRef<any>(null);

  const isCollaborative = mode === 'collaborate' && content.allow_collaboration;
  const isReadOnly = mode === 'view' || !content.allow_collaboration;

  if (!content?.snapshot) {
    return (
      <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/30">
        {t('lms.topics.no_whiteboard_content', 'Whiteboard is empty')}
      </div>
    );
  }

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
    setEditorLoaded(true);

    // Load snapshot
    try {
      if (content.snapshot && editor.store?.loadSnapshot) {
        editor.store.loadSnapshot(content.snapshot);
      }
    } catch (err) {
      console.error('Failed to load whiteboard snapshot:', err);
    }
  };

  const handleExport = async () => {
    if (!editorRef.current) return;

    try {
      const editor = editorRef.current;

      // Tldraw v4 API - export to blob
      const blob = await editor.getSvgString?.(
        Array.from(editor.getCurrentPageShapeIds?.() || []),
        { background: true }
      );

      if (blob) {
        // Convert SVG string to blob and download
        const svgBlob = new Blob([blob.svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${topic.title || 'whiteboard'}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export whiteboard:', err);
      // Fallback: try to save as screenshot
      try {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${topic.title || 'whiteboard'}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          });
        }
      } catch (fallbackErr) {
        console.error('Fallback export also failed:', fallbackErr);
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Header with Mode Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCollaborative ? (
            <Badge variant="default" className="text-xs bg-green-600">
              <Users className={`h-3 w-3 ${isRtl ? 'ml-1' : 'mr-1'}`} />
              {t('lms.topics.whiteboard_collaborative', 'Collaborative')}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              {t('lms.topics.whiteboard_read_only', 'View Only')}
            </Badge>
          )}

          {collaborators > 0 && (
            <span className="text-xs text-muted-foreground">
              {t('lms.topics.active_collaborators', '{count} viewing').replace(
                '{count}',
                collaborators.toString()
              )}
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={!editorLoaded}
        >
          <Download className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
          {t('lms.topics.export_whiteboard', 'Export as Image')}
        </Button>
      </div>

      {/* Whiteboard Viewer/Editor */}
      <div
        className="border rounded-lg overflow-hidden"
        style={{ height: '500px' }}
      >
        <Tldraw
          onMount={handleEditorMount}
          autoFocus={false}
        />
      </div>

      {isCollaborative && (
        <p className="text-xs text-muted-foreground">
          {t(
            'lms.topics.collaboration_enabled_info',
            'You can draw and collaborate with other students in real-time'
          )}
        </p>
      )}
    </div>
  );
}
