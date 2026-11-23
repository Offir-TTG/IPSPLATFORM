'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useToast } from '@/components/ui/use-toast';
import { useAdminLanguage } from '@/context/AppContext';
import { SaveBar, saveBarText, useLeaveGuard } from '@/components/admin/notifications/kit';
import { StepWizard, WizardField, useStepWizard } from '@/components/admin/wizard/StepWizard';
import { stripHtml, type Program } from './types';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
// With courses and students (given by the page) the wizard has five steps, new or not.
const DETAIL_STEPS = ['basics', 'about', 'settings'] as const;
const ALL_STEPS = ['basics', 'about', 'courses', 'students', 'settings'] as const;
type Step = (typeof ALL_STEPS)[number];

/** The courses and students steps, given by the program page. */
export interface ProgramExtraSteps {
  courses: { label: string; node: ReactNode };
  students: { label: string; node: ReactNode };
  /** A new program: saves the courses and students chosen in the wizard; returns how many failed. */
  afterCreate?: (program: Program) => Promise<number>;
}

interface FormState {
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
  duration_weeks: string;
  max_students: string;
}

function fromProgram(p: Program | null): FormState {
  return {
    name: p?.name ?? '',
    description: p?.description ?? '',
    image_url: p?.image_url ?? '',
    is_active: p?.is_active ?? true,
    duration_weeks: p?.duration_weeks != null ? String(p.duration_weeks) : '',
    max_students: p?.max_students != null ? String(p.max_students) : '',
  };
}

/** An empty editor ("<p></p>") counts as no description. */
const normDescription = (html: string) => (stripHtml(html) === '' ? '' : html.trim());

/** A whole number from 1 up, or empty. */
const isCount = (v: string) => v.trim() === '' || /^[1-9]\d*$/.test(v.trim());

/**
 * A program's details, step by step (name and picture, description, size
 * and status), on the program page's Settings tab and on the New program
 * page. Continue stops on a missing or wrong field, with the reason in red.
 * Saving is in the standard floating Save/Discard bar. A new picture is
 * uploaded before saving, and the old one is deleted only after the program
 * points at the new one, so a failed upload loses nothing.
 */
export function ProgramSettingsForm({
  program,
  onSaved,
  extra,
  initialStep,
}: {
  program: Program | null;
  onSaved?: (p: Program) => void;
  extra?: ProgramExtraSteps;
  initialStep?: string | null;
}) {
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const isNew = !program;
  const text = saveBarText(t);

  const [saved, setSaved] = useState<FormState>(() => fromProgram(program));
  const [form, setForm] = useState<FormState>(() => fromProgram(program));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(program?.image_url ?? null);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const check = (s: Step): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 'basics' && !form.name.trim()) e.name = t('lms.programs.error.name_required', 'Program name is required');
    if (s === 'settings') {
      const msg = t('admin.programs.form.wholeNumber', 'Enter a whole number from 1 up, or leave it empty.');
      if (!isCount(form.duration_weeks)) e.duration_weeks = msg;
      if (!isCount(form.max_students)) e.max_students = msg;
    }
    return e;
  };
  const steps: readonly Step[] = extra ? ALL_STEPS : DETAIL_STEPS;
  const w = useStepWizard(steps, check, initialStep);
  const errors = w.errors;


  const dirty = useMemo(
    () =>
      !!imageFile ||
      form.name !== saved.name ||
      normDescription(form.description) !== normDescription(saved.description) ||
      form.image_url !== saved.image_url ||
      form.is_active !== saved.is_active ||
      form.duration_weeks.trim() !== saved.duration_weeks.trim() ||
      form.max_students.trim() !== saved.max_students.trim(),
    [form, saved, imageFile],
  );
  // A different program resets the form; new data for the same program
  // (after saving, or a reload) only replaces fields that weren't changed.
  const lastId = useRef(program?.id);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => {
    if (lastId.current === program?.id && dirtyRef.current) return;
    lastId.current = program?.id;
    const next = fromProgram(program);
    setSaved(next);
    setForm(next);
    setImageFile(null);
    setImagePreview(program?.image_url ?? null);
    w.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program]);

  const guard = useLeaveGuard(isNew ? hasAnything(form, imageFile) : dirty, text.leave);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    w.clearError(key);
  };

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      w.setErrors((x) => ({ ...x, image: t('admin.programs.form.imageType', 'Choose a PNG, JPG, GIF or WEBP picture.') }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      w.setErrors((x) => ({ ...x, image: t('admin.programs.form.imageSize', 'This picture is larger than 5MB. Choose a smaller one.') }));
      return;
    }
    w.clearError('image');
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    set('image_url', '');
  };

  const discard = () => {
    setForm(saved);
    setImageFile(null);
    setImagePreview(saved.image_url || null);
    w.reset();
  };

  const save = async () => {
    if (!w.checkAll()) return;
    setSaving(true);
    try {
      // 1. Upload the new picture first; if it fails, nothing is saved or deleted.
      let imageUrl: string | null = form.image_url || null;
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        if (program) fd.append('programId', program.id);
        const up = await fetch('/api/programs/upload-image', { method: 'POST', body: fd });
        const upResult = await up.json().catch(() => ({}));
        if (!up.ok || !upResult.success || !upResult.url) {
          const msg = upResult.error || t('lms.programs.image_upload_error', 'Failed to upload image');
          w.fail('basics', { image: msg });
          throw new Error(msg);
        }
        imageUrl = upResult.url;
      }

      // 2. Save the program.
      const body = {
        name: form.name.trim(),
        description: normDescription(form.description) || null,
        image_url: imageUrl,
        is_active: form.is_active,
        duration_weeks: form.duration_weeks.trim() ? parseInt(form.duration_weeks, 10) : null,
        max_students: form.max_students.trim() ? parseInt(form.max_students, 10) : null,
      };
      const res = await fetch(program ? `/api/programs/${program.id}` : '/api/programs', {
        method: program ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success) {
        throw new Error(result.error || (program ? t('lms.programs.update_error', 'Failed to update program') : t('lms.programs.create_error', 'Failed to create program')));
      }

      // 3. Only now remove the picture the program no longer uses.
      const oldUrl = program?.image_url;
      if (oldUrl && oldUrl !== imageUrl) {
        void fetch('/api/programs/upload-image', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: oldUrl }),
        }).catch(() => undefined);
      }

      const savedProgram: Program = { ...(program ?? {}), ...result.data };
      toast({
        title: t('common.success', 'Success'),
        description: program ? t('lms.programs.updated', 'Program updated successfully') : t('lms.programs.created', 'Program created successfully'),
      });
      if (!program) {
        // Then the courses and students chosen in the wizard.
        const failed = extra?.afterCreate ? await extra.afterCreate(savedProgram) : 0;
        if (failed > 0) {
          toast({
            title: t('common.error', 'Error'),
            description: t('admin.programs.wizard.partlySaved', 'The program was created, but {n} courses or clients were not added. Check them in the program.').replace('{n}', String(failed)),
            variant: 'destructive',
          });
        }
        guard.allowLeave();
        router.replace(`/admin/lms/programs/${savedProgram.id}?step=${w.step}`);
        return;
      }
      const next = fromProgram(savedProgram);
      setSaved(next);
      setForm(next);
      setImageFile(null);
      setImagePreview(savedProgram.image_url ?? null);
      onSaved?.(savedProgram);
    } catch (error) {
      toast({
        title: t('common.error', 'Error'),
        description: error instanceof Error ? error.message : t('lms.programs.update_error', 'Failed to update program'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const labels: Record<Step, string> = {
    basics: t('admin.programs.wizard.stepBasics', 'Name and picture'),
    about: t('admin.programs.wizard.stepAbout', 'Description'),
    courses: extra?.courses.label ?? '',
    students: extra?.students.label ?? '',
    settings: t('admin.programs.wizard.stepSettings', 'Size and status'),
  };
  const leads: Record<Step, string> = {
    basics: t('admin.programs.wizard.leadBasics', 'The name and picture clients see.'),
    about: t('admin.programs.wizard.leadAbout', 'What the program is about and who it is for.'),
    courses: isNew
      ? t('admin.programs.wizard.leadCoursesNew', 'The courses in the program, in order. They are added when you create the program.')
      : t('admin.programs.wizard.leadCourses', 'The courses in the program, in order. Changes here are saved straight away.'),
    students: isNew
      ? t('admin.programs.wizard.leadStudentsNew', 'Who to enroll. They are enrolled when you create the program.')
      : t('admin.programs.wizard.leadStudents', 'Who is enrolled. Changes here are saved straight away.'),
    settings: t('admin.programs.wizard.leadSettings', 'How long it runs, how many places, and whether it is offered.'),
  };
  const errBorder = (k: string) => (errors[k] ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20' : '');

  return (
    <div dir={direction}>
      <StepWizard steps={steps} step={w.step} labels={labels} onGo={w.go} blocked={w.blocked} title={labels[w.step]} lead={leads[w.step]}>
        {w.step === 'basics' && (
          <>
            <WizardField label={t('lms.programs.name', 'Program Name')} required error={errors.name} htmlFor="program-name">
              <Input
                id="program-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder={t('lms.programs.name_placeholder', 'e.g., Full Stack Development')}
                dir={direction}
                aria-invalid={!!errors.name}
                className={`h-11 ${errBorder('name')}`}
              />
            </WizardField>
            <WizardField label={t('lms.programs.image', 'Program Image')} error={errors.image} hint={t('admin.programs.form.imageHint', 'PNG, JPG, GIF or WEBP, up to 5MB.')}>
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] p-3">
                <span className="grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary/10 text-primary">
                  {imagePreview ? <img src={imagePreview} alt={t('lms.programs.image_preview', 'Program preview')} className="h-full w-full object-cover" /> : <ImageIcon className="h-7 w-7" aria-hidden />}
                </span>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <button type="button" onClick={() => fileInput.current?.click()} className="min-h-[44px] text-sm font-semibold text-primary hover:underline">
                    {imagePreview ? t('admin.programs.form.replaceImage', 'Replace picture') : t('admin.programs.form.addImage', 'Add a picture')}
                  </button>
                  {imagePreview && (
                    <button type="button" onClick={removeImage} className="min-h-[44px] text-sm font-semibold text-red-600 hover:underline">
                      {t('admin.programs.form.removeImage', 'Remove')}
                    </button>
                  )}
                </div>
                <input ref={fileInput} type="file" accept={IMAGE_TYPES.join(',')} onChange={pickImage} className="hidden" />
              </div>
            </WizardField>
          </>
        )}

        {w.step === 'about' && (
          <WizardField label={t('lms.programs.description', 'Description')}>
            <RichTextEditor
              value={form.description}
              onChange={(content) => set('description', content)}
              placeholder={t('lms.programs.description_placeholder', 'Program description...')}
              dir={direction}
            />
          </WizardField>
        )}

        {w.step === 'courses' && extra?.courses.node}
        {w.step === 'students' && extra?.students.node}

        {w.step === 'settings' && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <WizardField label={t('lms.programs.duration', 'Duration (weeks)')} error={errors.duration_weeks} htmlFor="program-weeks">
                <Input
                  id="program-weeks"
                  inputMode="numeric"
                  value={form.duration_weeks}
                  onChange={(e) => set('duration_weeks', e.target.value)}
                  placeholder="12"
                  dir="ltr"
                  aria-invalid={!!errors.duration_weeks}
                  className={`h-11 ${errBorder('duration_weeks')}`}
                />
              </WizardField>
              <WizardField
                label={t('lms.programs.max_students', 'Max Clients')}
                error={errors.max_students}
                hint={t('admin.programs.form.maxHint', 'Empty = no limit')}
                htmlFor="program-max"
              >
                <Input
                  id="program-max"
                  inputMode="numeric"
                  value={form.max_students}
                  onChange={(e) => set('max_students', e.target.value)}
                  placeholder="30"
                  dir="ltr"
                  aria-invalid={!!errors.max_students}
                  className={`h-11 ${errBorder('max_students')}`}
                />
              </WizardField>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
              <label htmlFor="program-active" className="cursor-pointer">
                <span className="block font-semibold">{t('lms.programs.is_active', 'Active')}</span>
                <span className="block text-[13px] text-muted-foreground">{t('admin.programs.form.activeHint', 'An inactive program is not offered to new clients')}</span>
              </label>
              <Switch id="program-active" checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
            </div>
          </>
        )}
      </StepWizard>

      {/* Room so the floating bar never covers the step's buttons */}
      <div className="h-20" aria-hidden />
      <SaveBar
        isNew={isNew}
        dirty={dirty}
        saving={saving}
        onSave={() => void save()}
        onDiscard={discard}
        cancelHref="/admin/lms/programs"
        saveLabel={isNew ? t('common.create', 'Create') : t('common.save', 'Save')}
        text={text.bar}
      />
      {guard.dialog}
    </div>
  );
}

function hasAnything(f: FormState, file: File | null) {
  return !!(f.name.trim() || normDescription(f.description) || f.duration_weeks.trim() || f.max_students.trim() || file);
}
