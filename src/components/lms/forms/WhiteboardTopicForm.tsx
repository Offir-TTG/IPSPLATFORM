'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import type { WhiteboardContent } from '@/types/lms';

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

interface WhiteboardTopicFormProps {
  content: any;
  onChange: (content: any) => void;
  error?: string;
  t: (key: string, fallback: string) => string;
}

export function WhiteboardTopicForm({ content, onChange, error, t }: WhiteboardTopicFormProps) {
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const editorRef = useRef<any>(null);

  // Initialize content if empty
  useEffect(() => {
    if (!content?.version) {
      onChange({
        snapshot: null,
        version: 1,
        allow_collaboration: false,
      });
    }
  }, []);

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
    setEditorLoaded(true);

    // Load existing snapshot if available
    if (content?.snapshot) {
      try {
        // Tldraw v4 API
        if (editor.store?.loadSnapshot) {
          editor.store.loadSnapshot(content.snapshot);
        }
      } catch (err) {
        console.error('Failed to load whiteboard snapshot:', err);
      }
    }
  };

  const handleSave = () => {
    if (!editorRef.current) return;

    try {
      // Tldraw v4 API - get snapshot
      const snapshot = editorRef.current.store?.getSnapshot?.() ||
                      editorRef.current.getSnapshot?.() ||
                      null;

      if (snapshot) {
        onChange({
          ...content,
          snapshot,
          version: (content?.version || 0) + 1,
          last_modified_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed to save whiteboard:', err);
    }
  };

  const handleClear = () => {
    if (!editorRef.current) return;

    try {
      // Tldraw v4 API - delete all shapes
      const editor = editorRef.current;
      const allShapeIds = editor.getCurrentPageShapeIds?.() ||
                         Array.from(editor.getCurrentPageShapes?.() || []).map((s: any) => s.id);

      if (allShapeIds && allShapeIds.length > 0) {
        editor.deleteShapes?.(allShapeIds) || editor.deleteShapes?.(Array.from(allShapeIds));
      }

      onChange({
        ...content,
        snapshot: null,
        version: (content?.version || 0) + 1,
        last_modified_at: new Date().toISOString(),
      });
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Failed to clear whiteboard:', err);
    }
  };

  const handleCollaborationToggle = (checked: boolean) => {
    onChange({
      ...content,
      allow_collaboration: checked,
    });
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!editorLoaded) return;

    const interval = setInterval(() => {
      handleSave();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [editorLoaded, content]);

  return (
    <div className="space-y-4">
      {/* Collaboration Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
        <div className="space-y-0.5">
          <Label htmlFor="allow-collaboration">
            {t('lms.topics.allow_collaboration', 'Allow Student Collaboration')}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t('lms.topics.allow_collaboration_desc', 'Let students draw together in real-time')}
          </p>
        </div>
        <Switch
          id="allow-collaboration"
          checked={content?.allow_collaboration || false}
          onCheckedChange={handleCollaborationToggle}
        />
      </div>

      {/* Whiteboard Editor */}
      <div className="space-y-2">
        <Label>
          {t('lms.topics.whiteboard_title', 'Whiteboard')}
        </Label>

        <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
          <Tldraw
            onMount={handleEditorMount}
            autoFocus={false}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <p className="text-xs text-muted-foreground">
          {t('lms.topics.whiteboard_description', 'Create an interactive whiteboard for students')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={!editorLoaded}
        >
          {t('common.save', 'Save')}
        </Button>

        {!showClearConfirm ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
            disabled={!editorLoaded}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('lms.topics.clear_whiteboard', 'Clear Whiteboard')}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-destructive">
              {t('lms.topics.clear_whiteboard_confirm', 'Are you sure? This will erase all content.')}
            </span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleClear}
            >
              {t('common.yes', 'Yes')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowClearConfirm(false)}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {t('lms.topics.auto_save_info', 'Auto-saves every 30 seconds')}
      </p>
    </div>
  );
}
