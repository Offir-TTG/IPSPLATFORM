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
import { AlignLeft, ClipboardCheck, Code2, Download, Eye, EyeOff, FileText, HelpCircle, Link2, Presentation, Video } from 'lucide-react';
import { TopicBlock } from './topics/TopicBlock';
import { TopicEditDialog } from './dialogs/TopicEditDialog';
import type { LessonTopic, TopicContentType } from '@/types/lms';

interface LessonTopicsBuilderProps {
  lessonId: string;
  /** Kept for callers; the panel around the builder shows the title. */
  lessonTitle?: string;
  t: (key: string, fallback: string) => string;
  isRtl: boolean;
  direction: 'ltr' | 'rtl';
  /** Kept for callers; the panel around the builder has its own close button. */
  onClose?: () => void;
  /** Called with the items each time they load, so the lesson shows the right count. */
  onTopicsChange?: (items: { id: string; title: string; content_type: string }[]) => void;
}

export function LessonTopicsBuilder({
  lessonId,
  t,
  isRtl,
  direction,
  onTopicsChange,
}: LessonTopicsBuilderProps) {
  const [topics, setTopics] = useState<LessonTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [editingTopic, setEditingTopic] = useState<LessonTopic | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newTopicType, setNewTopicType] = useState<TopicContentType | null>(null);
  // A failed save or delete, shown above the list (no browser alert boxes).
  const [error, setError] = useState<string | null>(null);

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
        const items: LessonTopic[] = data.data || [];
        setTopics(items);
        onTopicsChange?.(items.map((x) => ({ id: x.id, title: x.title, content_type: x.content_type })));
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

  // The item waiting for "Yes, delete" (asked inside the panel).
  const [confirmDelete, setConfirmDelete] = useState<LessonTopic | null>(null);

  const handleDeleteTopic = async (topicId: string) => {
    setConfirmDelete(null);
    try {
      setSaving(true);
      const response = await fetch(`/api/lms/lesson-topics/${topicId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadTopics();
      } else {
        setError(t('lms.topics.delete_failed', 'Failed to delete topic'));
      }
    } catch (error) {
      console.error('Failed to delete topic:', error);
      setError(t('lms.topics.delete_failed', 'Failed to delete topic'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTopic = async (topicData: Partial<LessonTopic>) => {
    try {
      setSaving(true);
      setError(null);

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
      setError(t('lms.topics.save_failed', 'The content was not saved. Try again.'));
    } finally {
      setSaving(false);
    }
  };

  // Content types, each a tile with a picture. Quiz and assignment are not ready yet.
  const types: { type: TopicContentType | null; label: string; icon: typeof Video; tile: string }[] = [
    { type: 'video', label: t('lms.topics.video', 'Video'), icon: Video, tile: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
    { type: 'text', label: t('lms.topics.text', 'Text'), icon: AlignLeft, tile: 'bg-primary/10 text-primary' },
    { type: 'link', label: t('lms.topics.link', 'External Link'), icon: Link2, tile: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
    { type: 'pdf', label: t('lms.topics.pdf', 'PDF Document'), icon: FileText, tile: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' },
    { type: 'download', label: t('lms.topics.download', 'Downloadable File'), icon: Download, tile: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300' },
    { type: 'embed', label: t('lms.topics.embed', 'Embed Code'), icon: Code2, tile: 'bg-muted text-foreground/75' },
    { type: 'whiteboard', label: t('lms.topics.whiteboard', 'Whiteboard'), icon: Presentation, tile: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300' },
    { type: null, label: t('lms.topics.quiz', 'Quiz'), icon: HelpCircle, tile: 'bg-muted text-muted-foreground' },
    { type: null, label: t('lms.topics.assignment', 'Assignment'), icon: ClipboardCheck, tile: 'bg-muted text-muted-foreground' },
  ];

  if (showEditDialog) {
    return (
      <TopicEditDialog
        inline
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
    );
  }

  return (
    <div className="space-y-4" dir={direction}>
      {/* The lesson's title and the close button live in the panel around this. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold">
          {t('lms.topics.itemCount', '{n} items').replace('{n}', String(topics.length))}
        </span>
        {topics.length > 0 && (
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-semibold hover:bg-muted"
          >
            {previewMode ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            {previewMode ? t('lms.topics.edit_mode', 'Edit Mode') : t('lms.topics.viewAsStudent', 'View as client')}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      )}

      {confirmDelete && (
        <div role="alertdialog" aria-labelledby="topic-delete-h" className="rounded-xl border border-red-200 bg-red-50 p-3.5 dark:border-red-900 dark:bg-red-950/30">
          <p id="topic-delete-h" className="text-sm font-semibold text-red-900 dark:text-red-200">
            {t('lms.topics.confirmDeleteNamed', 'Delete "{title}"? This cannot be undone.').replace('{title}', confirmDelete.title)}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleDeleteTopic(confirmDelete.id)}
              disabled={saving}
              className="inline-flex min-h-[40px] items-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {t('lms.topics.yesDelete', 'Yes, delete')}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="inline-flex min-h-[40px] items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-muted"
            >
              {t('common.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {topics.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              {t('lms.topics.emptyPick', 'No content yet. Choose what to add below.')}
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={topics.map((x) => x.id)} strategy={verticalListSortingStrategy} disabled={previewMode}>
                <div className="space-y-2.5">
                  {topics.map((topic) => (
                    <TopicBlock
                      key={topic.id}
                      topic={topic}
                      previewMode={previewMode}
                      onEdit={() => handleEditTopic(topic)}
                      onDelete={() => setConfirmDelete(topic)}
                      t={t}
                      isRtl={isRtl}
                      direction={direction}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {!previewMode && (
            <section aria-labelledby="add-content-h">
              <h3 id="add-content-h" className="mb-2 text-sm font-bold text-primary [font-family:inherit]">
                {t('lms.topics.add_topic', 'Add content')}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {types.map(({ type, label, icon: Icon, tile }) => (
                  <button
                    key={label}
                    type="button"
                    disabled={!type || saving}
                    onClick={() => type && handleAddTopic(type)}
                    className="flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2 text-center text-[13px] font-semibold transition-colors hover:border-primary/50 hover:bg-primary/[0.03] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${tile}`} aria-hidden>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      {label}
                      {!type && <span className="block text-[11.5px] font-medium text-muted-foreground">{t('common.coming_soon', 'Coming soon')}</span>}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[13px] text-muted-foreground">
                {t('lms.topics.savedHint', 'Every change here is saved straight away. Drag an item to change the order.')}
              </p>
            </section>
          )}
        </>
      )}

    </div>
  );
}
