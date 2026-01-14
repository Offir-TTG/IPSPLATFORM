'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TopicBlock } from './topics/TopicBlock';
import { TopicEditDialog } from './dialogs/TopicEditDialog';
import type { LessonTopic, TopicContentType } from '@/types/lms';

interface LessonTopicsBuilderProps {
  lessonId: string;
  lessonTitle?: string;
  t: (key: string, fallback: string) => string;
  isRtl: boolean;
  direction: 'ltr' | 'rtl';
  onClose?: () => void;
}

export function LessonTopicsBuilder({
  lessonId,
  lessonTitle,
  t,
  isRtl,
  direction,
  onClose,
}: LessonTopicsBuilderProps) {
  const [topics, setTopics] = useState<LessonTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [editingTopic, setEditingTopic] = useState<LessonTopic | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newTopicType, setNewTopicType] = useState<TopicContentType | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required to start drag (better for mobile)
      },
    })
  );

  // Load topics
  useEffect(() => {
    loadTopics();
  }, [lessonId]);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/lms/lesson-topics?lesson_id=${lessonId}`);
      const data = await response.json();

      if (data.success) {
        setTopics(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load lesson topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = topics.findIndex((t) => t.id === active.id);
      const newIndex = topics.findIndex((t) => t.id === over.id);

      const reorderedTopics = arrayMove(topics, oldIndex, newIndex);

      // Update order property
      const updatedTopics = reorderedTopics.map((topic, index) => ({
        ...topic,
        order: index,
      }));

      setTopics(updatedTopics);

      // Save new order to API
      try {
        await fetch('/api/lms/lesson-topics/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lesson_id: lessonId,
            topics: updatedTopics.map(t => ({ id: t.id, order: t.order })),
          }),
        });
      } catch (error) {
        console.error('Failed to reorder topics:', error);
        // Revert on error
        loadTopics();
      }
    }
  };

  const handleAddTopic = (contentType: TopicContentType) => {
    setNewTopicType(contentType);
    setEditingTopic(null);
    setShowEditDialog(true);
  };

  const handleEditTopic = (topic: LessonTopic) => {
    setEditingTopic(topic);
    setNewTopicType(null);
    setShowEditDialog(true);
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm(t('lms.topics.confirm_delete', 'Are you sure you want to delete this content block?'))) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/lms/lesson-topics/${topicId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadTopics();
      } else {
        alert(data.error || t('lms.topics.delete_failed', 'Failed to delete topic'));
      }
    } catch (error) {
      console.error('Failed to delete topic:', error);
      alert(t('lms.topics.delete_failed', 'Failed to delete topic'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTopic = async (topicData: Partial<LessonTopic>) => {
    try {
      setSaving(true);

      if (editingTopic) {
        // Update existing topic
        const response = await fetch(`/api/lms/lesson-topics/${editingTopic.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(topicData),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to update topic');
        }
      } else if (newTopicType) {
        // Create new topic
        const response = await fetch('/api/lms/lesson-topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lesson_id: lessonId,
            content_type: newTopicType,
            ...topicData,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to create topic');
        }
      }

      await loadTopics();
      setShowEditDialog(false);
      setEditingTopic(null);
      setNewTopicType(null);
    } catch (error) {
      console.error('Failed to save topic:', error);
      alert(error instanceof Error ? error.message : 'Failed to save topic');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full" dir={direction}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {lessonTitle || t('lms.topics.lesson_content', 'Lesson Content')}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('lms.topics.manage_content_blocks', 'Add and organize content blocks for this lesson')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? (
                <>
                  <EyeOff className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  {t('lms.topics.edit_mode', 'Edit Mode')}
                </>
              ) : (
                <>
                  <Eye className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  {t('lms.topics.preview_mode', 'Preview Mode')}
                </>
              )}
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                {t('common.close', 'Close')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Topics List */}
            {topics.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium mb-2">
                  {t('lms.topics.no_content', 'No content blocks yet')}
                </p>
                <p className="text-sm mb-4">
                  {t('lms.topics.add_first_block', 'Add your first content block to get started')}
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={topics.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                  disabled={previewMode}
                >
                  <div className="space-y-3">
                    {topics.map((topic) => (
                      <TopicBlock
                        key={topic.id}
                        topic={topic}
                        previewMode={previewMode}
                        onEdit={() => handleEditTopic(topic)}
                        onDelete={() => handleDeleteTopic(topic.id)}
                        t={t}
                        isRtl={isRtl}
                        direction={direction}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Add Topic Button */}
            {!previewMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full h-11 md:h-10">
                    <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                    {t('lms.topics.add_topic', 'Add Content Block')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRtl ? 'end' : 'start'} className="w-56">
                  <DropdownMenuItem onClick={() => handleAddTopic('video')}>
                    {t('lms.topics.video', 'Video')} (YouTube/Vimeo)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddTopic('text')}>
                    {t('lms.topics.text', 'Text')} (Rich Text)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddTopic('link')}>
                    {t('lms.topics.link', 'External Link')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddTopic('pdf')}>
                    {t('lms.topics.pdf', 'PDF Document')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddTopic('download')}>
                    {t('lms.topics.download', 'Downloadable File')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddTopic('embed')}>
                    {t('lms.topics.embed', 'Embed Code')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddTopic('whiteboard')}>
                    {t('lms.topics.whiteboard', 'Whiteboard')}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    {t('lms.topics.quiz', 'Quiz')} ({t('common.coming_soon', 'Coming Soon')})
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    {t('lms.topics.assignment', 'Assignment')} ({t('common.coming_soon', 'Coming Soon')})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      {showEditDialog && (
        <TopicEditDialog
          topic={editingTopic}
          contentType={newTopicType || editingTopic?.content_type}
          onSave={handleSaveTopic}
          onCancel={() => {
            setShowEditDialog(false);
            setEditingTopic(null);
            setNewTopicType(null);
          }}
          saving={saving}
          t={t}
          isRtl={isRtl}
          direction={direction}
        />
      )}
    </Card>
  );
}
