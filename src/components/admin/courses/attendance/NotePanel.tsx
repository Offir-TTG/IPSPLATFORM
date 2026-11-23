'use client';

import { useEffect, useState } from 'react';
import { useAdminLanguage } from '@/context/AppContext';
import { SidePanel, panelPrimary, panelSecondary } from '@/components/admin/courses/builder/SidePanel';

/** The note for one client in one meeting, written in a side panel. Saved with the page's Save bar. */
export function NotePanel({
  open,
  clientName,
  meetingText,
  value,
  hasStatus,
  onDone,
  onClose,
}: {
  open: boolean;
  clientName: string;
  meetingText: string;
  value: string;
  /** A note is kept only together with a status. */
  hasStatus: boolean;
  onDone: (value: string) => void;
  onClose: () => void;
}) {
  const { t } = useAdminLanguage();
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={t('admin.attendanceTab.note.title', 'Note for {name}').replace('{name}', clientName)}
      description={meetingText}
      footer={
        <>
          <button type="button" className={panelPrimary} onClick={() => onDone(draft.trim())}>
            {t('admin.attendanceTab.note.done', 'Done')}
          </button>
          <button type="button" className={panelSecondary} onClick={onClose}>
            {t('admin.attendanceTab.note.cancel', 'Cancel')}
          </button>
        </>
      }
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">{t('admin.attendanceTab.note.label', 'Note')}</span>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={6}
          autoFocus
          placeholder={t('admin.attendanceTab.note.placeholder', 'For example: left early, called ahead')}
          className="w-full rounded-lg border border-border bg-card p-3 text-base outline-none focus:border-primary"
        />
      </label>
      <p className="mt-2 text-sm text-muted-foreground">
        {hasStatus
          ? t('admin.attendanceTab.note.savedWithBar', 'The note is saved when you press Save at the bottom of the page.')
          : t('admin.attendanceTab.note.needsStatus', 'Choose a status for this client too: a note is saved only together with a status.')}
      </p>
    </SidePanel>
  );
}
