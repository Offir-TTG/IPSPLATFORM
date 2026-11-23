'use client';

import { useState } from 'react';
import dynamicImport from 'next/dynamic';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { SidePanel, panelPrimary, panelSecondary } from './SidePanel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Segmented, SwitchRow } from './pickers';
import type { Translate } from './types';

const RichTextEditor = dynamicImport(() => import('@/components/ui/rich-text-editor').then((m) => m.RichTextEditor), { ssr: false });

export interface ModuleFormState {
  title: string;
  description: string;
  is_published: boolean;
  is_optional: boolean;
}

export interface BulkModuleFormState {
  count: string;
  titlePattern: string;
  is_published: boolean;
  is_optional: boolean;
}

/** "Week {n}" → "Week 1", every {n}. */
export const fillPattern = (pattern: string, n: number) => pattern.replace(/\{n\}/g, String(n));

/**
 * One window to add modules: choose One module (name, description) or
 * Several (how many, a name pattern, and a preview of the names). Editing a
 * module uses the same window without the choice.
 */
export function AddModulesDialog({
  open,
  onClose,
  editing,
  form,
  setForm,
  bulk,
  setBulk,
  saving,
  onSaveOne,
  onSaveMany,
  t,
  direction,
  onAddLessons,
  onDelete,
  deleting,
}: {
  /** Editing only: add lessons to this module. */
  onAddLessons?: () => void;
  /** Editing only: opens the delete dialog, which asks what to do with the lessons. */
  onDelete?: () => void;
  deleting?: boolean;
  open: boolean;
  onClose: () => void;
  editing: boolean;
  form: ModuleFormState;
  setForm: (patch: Partial<ModuleFormState>) => void;
  bulk: BulkModuleFormState;
  setBulk: (patch: Partial<BulkModuleFormState>) => void;
  saving: boolean;
  onSaveOne: () => void;
  onSaveMany: () => void;
  t: Translate;
  direction: 'ltr' | 'rtl';
}) {
  const [mode, setMode] = useState<'one' | 'several'>('one');
  const [tried, setTried] = useState(false);
  const several = !editing && mode === 'several';
  const count = parseInt(bulk.count, 10);
  const titleMissing = !form.title.trim();
  const countBad = !Number.isFinite(count) || count < 1 || count > 20;
  const patternMissing = !bulk.titlePattern.trim();
  const names = Number.isFinite(count) && count > 0 ? Array.from({ length: Math.min(count, 20) }, (_, i) => fillPattern(bulk.titlePattern, i + 1)) : [];

  const save = () => {
    setTried(true);
    if (several) {
      if (countBad || patternMissing) return;
      onSaveMany();
    } else {
      if (titleMissing) return;
      onSaveOne();
    }
  };
  const close = () => {
    setTried(false);
    setMode('one');
    onClose();
  };
  const err = (show: boolean, text: string) => (show && tried ? <p className="text-[13px] font-medium text-red-600 dark:text-red-400">{text}</p> : null);

  return (
    <SidePanel
      open={open}
      onClose={close}
      busy={saving}
      title={editing ? t('lms.builder.edit_module', 'Edit Module') : t('admin.courses.builder.addModules', 'Add modules')}
      description={t('admin.courses.builder.moduleIntro', 'A module groups several lessons, for example "Week 1" or "Live lessons".')}
      top={
        editing ? (
          <div className="flex flex-wrap gap-2">
            {onAddLessons && (
              <button type="button" onClick={onAddLessons} className={panelSecondary}>
                <Plus className="h-4 w-4" aria-hidden />
                {t('admin.courses.builder.addLessons', 'Add lessons')}
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-card px-5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {t('lms.builder.delete_module', 'Delete Module')}
              </button>
            )}
          </div>
        ) : (
          <Segmented
            label={t('admin.courses.builder.howManyModules', 'How many modules')}
            value={mode}
            onChange={(v) => {
              setMode(v);
              setTried(false);
            }}
            options={[
              { value: 'one', label: t('admin.courses.builder.oneModule', 'One module') },
              { value: 'several', label: t('admin.courses.builder.severalModules', 'Several modules') },
            ]}
          />
        )
      }
      footer={
        <>
          <button type="button" onClick={save} disabled={saving} className={panelPrimary}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {editing
              ? t('lms.builder.update_module', 'Update Module')
              : several
                ? t('admin.courses.builder.addNModules', 'Add {n} modules').replace('{n}', String(Number.isFinite(count) ? count : 0))
                : t('lms.builder.add_module', 'Add Module')}
          </button>
          <button type="button" onClick={close} disabled={saving} className={panelSecondary}>
            {t('common.cancel', 'Cancel')}
          </button>
        </>
      }
    >
          <div className="space-y-4" dir={direction}>
            {several ? (
              <>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="mod-count">{t('admin.courses.builder.howManyShort', 'How many')} *</Label>
                    <Input id="mod-count" type="number" min={1} max={20} value={bulk.count} onChange={(e) => setBulk({ count: e.target.value })} className="text-center font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mod-pattern">{t('admin.courses.builder.modulesName', 'Name of the modules')} *</Label>
                    <Input id="mod-pattern" value={bulk.titlePattern} onChange={(e) => setBulk({ titlePattern: e.target.value })} />
                    <p className="text-xs text-muted-foreground">{t('admin.courses.builder.patternHint', '{n} becomes the number: Week 1, Week 2…')}</p>
                  </div>
                </div>
                {err(countBad, t('lms.builder.invalid_count', 'Please enter a number between 1 and 20'))}
                {err(patternMissing, t('admin.courses.builder.patternRequired', 'Write a name for the modules.'))}
                {names.length > 0 && !patternMissing && (
                  <div className="rounded-xl border border-border p-3">
                    <div className="mb-2 text-[13px] font-bold text-primary">{t('admin.courses.builder.willCreate', 'These will be created:')}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {names.map((n, i) => (
                        <span key={i} className="rounded-full bg-primary/10 px-2.5 py-1 text-sm">
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <SwitchRow
                  title={t('admin.courses.builder.visible', 'Visible to clients')}
                  hint={t('admin.courses.builder.visibleShort', 'Off = draft')}
                  checked={bulk.is_published}
                  onChange={(v) => setBulk({ is_published: v })}
                />
                <SwitchRow
                  title={t('lms.builder.optional', 'Optional')}
                  hint={t('lms.builder.optional_description', 'Clients can skip this module')}
                  checked={bulk.is_optional}
                  onChange={(v) => setBulk({ is_optional: v })}
                />
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="mod-title">{t('lms.builder.module_title', 'Module Title')} *</Label>
                  <Input
                    id="mod-title"
                    value={form.title}
                    onChange={(e) => setForm({ title: e.target.value })}
                    placeholder={t('lms.builder.module_title_placeholder', 'e.g., Introduction to Parenting')}
                    aria-invalid={tried && titleMissing}
                  />
                  {err(titleMissing, t('lms.builder.title_required', 'Title is required'))}
                </div>
                <div className="space-y-1.5">
                  <Label>{t('lms.builder.module_description', 'Description')}</Label>
                  <RichTextEditor
                    value={form.description}
                    onChange={(v: string) => setForm({ description: v })}
                    placeholder={t('lms.builder.module_description_placeholder', 'What will clients learn in this module?')}
                    dir={direction}
                  />
                </div>
                <SwitchRow
                  title={t('admin.courses.builder.visible', 'Visible to clients')}
                  hint={t('admin.courses.builder.visibleShort', 'Off = draft')}
                  checked={form.is_published}
                  onChange={(v) => setForm({ is_published: v })}
                />
                <SwitchRow
                  title={t('lms.builder.optional', 'Optional')}
                  hint={t('lms.builder.optional_description', 'Clients can skip this module')}
                  checked={form.is_optional}
                  onChange={(v) => setForm({ is_optional: v })}
                />
              </>
            )}
          </div>
    </SidePanel>
  );
}
