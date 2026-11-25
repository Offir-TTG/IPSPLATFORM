'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ImageIcon, Layers, MonitorPlay, Package, Presentation, Sparkles, Users, Wrench, type LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useToast } from '@/components/ui/use-toast';
import { useAdminLanguage } from '@/context/AppContext';
import { SaveBar, saveBarText, useLeaveGuard } from '@/components/admin/notifications/kit';
import { StepWizard, WizardField, useStepWizard } from '@/components/admin/wizard/StepWizard';
import { stripHtml } from '@/components/admin/programs/types';
import { OFFERED_COURSE_TYPES, COURSE_TYPE_FALLBACK, dayOf, loadCourseOptions, personName, type AdminCourse, type Option } from './types';

// Keep in step with /api/lms/courses/upload-image.
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const NONE = '_none';
// A new course has only its details; an existing one also has its structure and materials.
const NEW_STEPS = ['basics', 'about', 'program', 'schedule'] as const;
const EDIT_STEPS = ['basics', 'about', 'program', 'schedule', 'structure', 'materials', 'grades', 'attendance'] as const;
type Step = (typeof EDIT_STEPS)[number];

/**
 * The structure (builder) and materials steps, given by the course page; and
 * grades / attendance, given only when the course uses them (its switches).
 */
export interface CourseExtraSteps {
  structure: { label: string; node: ReactNode };
  materials: { label: string; node: ReactNode; action?: ReactNode };
  grades?: { label: string; node: ReactNode };
  attendance?: { label: string; node: ReactNode };
}

/** A picture for each kind of course, on its choice card. */
const TYPE_ICON: Record<string, LucideIcon> = {
  course: BookOpen,
  lecture: Presentation,
  workshop: Wrench,
  webinar: MonitorPlay,
  session: Users,
  session_pack: Layers,
  bundle: Package,
  custom: Sparkles,
};

interface FormState {
  title: string;
  course_type: string;
  description: string;
  image_url: string;
  is_standalone: boolean;
  program_id: string;
  instructor_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_published: boolean;
  uses_grades: boolean;
  uses_attendance: boolean;
}

function fromCourse(c: AdminCourse | null): FormState {
  return {
    title: c?.title ?? '',
    course_type: c?.course_type || 'course',
    description: c?.description ?? '',
    image_url: c?.image_url ?? '',
    is_standalone: c?.is_standalone ?? false,
    program_id: c?.program_id ?? '',
    instructor_id: c?.instructor_id ?? '',
    start_date: dayOf(c?.start_date),
    end_date: dayOf(c?.end_date),
    is_active: c?.is_active ?? true,
    is_published: c?.is_published ?? false,
    uses_grades: c?.uses_grades ?? true,
    uses_attendance: c?.uses_attendance ?? true,
  };
}

const normDescription = (html: string) => (stripHtml(html) === '' ? '' : html.trim());

function SwitchRow({ id, title, hint, checked, onChange }: { id: string; title: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block font-semibold">{title}</span>
        <span className="block text-[13px] text-muted-foreground">{hint}</span>
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/**
 * A course's details, step by step (name and type, picture and description,
 * program and instructor, dates and status), on the course page's Settings
 * tab and on the New course page. Continue stops on a missing or wrong
 * field, with the reason in red. Saving is in the floating Save/Discard
 * bar. A new picture is uploaded before saving, and the old one is deleted
 * only after the course points at the new one.
 */
export function CourseSettingsForm({
  course,
  onSaved,
  extra,
  initialStep,
  programExtra,
}: {
  course: AdminCourse | null;
  onSaved?: (c: AdminCourse) => void;
  extra?: CourseExtraSteps;
  initialStep?: string | null;
  /** Shown under the program and instructor fields (the course page puts the instructor link here). */
  programExtra?: ReactNode;
}) {
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const isNew = !course;
  const text = saveBarText(t);

  const [saved, setSaved] = useState<FormState>(() => fromCourse(course));
  const [form, setForm] = useState<FormState>(() => fromCourse(course));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(course?.image_url ?? null);
  const [saving, setSaving] = useState(false);
  const [programs, setPrograms] = useState<Option[]>([]);
  const [instructors, setInstructors] = useState<Option[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  // The same rules the server checks on save, step by step.
  const check = (s: Step): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 'basics') {
      if (!form.title.trim()) e.title = t('lms.courses.error.title_required', 'Course title is required');
      if (!form.course_type) e.course_type = t('admin.courses.form.typeRequired', 'Choose a type');
    }
    if (s === 'program' && !form.is_standalone && !form.program_id) {
      e.program_id = t('lms.courses.error.program_required', 'Program is required for non-standalone courses');
    }
    if (s === 'schedule') {
      if (!form.start_date) e.start_date = t('lms.courses.error.start_date_required', 'Start date is required');
      if (form.start_date && form.end_date && form.end_date < form.start_date) e.end_date = t('lms.courses.error.end_date_invalid', 'End date must be after start date');
    }
    return e;
  };
  const steps: readonly Step[] =
    course && extra ? EDIT_STEPS.filter((s) => (s !== 'grades' || !!extra.grades) && (s !== 'attendance' || !!extra.attendance)) : NEW_STEPS;
  const w = useStepWizard(steps, check, initialStep);
  const errors = w.errors;

  useEffect(() => {
    void loadCourseOptions().then((o) => {
      setPrograms(o.programs);
      setInstructors(o.instructors);
    });
  }, []);


  // The course's current program / instructor stay choosable even when the
  // lists don't include them (e.g. an inactive program, an admin as instructor).
  const programOptions = useMemo(() => {
    const list = [...programs];
    if (course?.program_id && !list.some((p) => p.id === course.program_id)) list.unshift({ id: course.program_id, label: course.program?.name || course.program_id });
    return list;
  }, [programs, course]);
  const instructorOptions = useMemo(() => {
    const list = [...instructors];
    if (course?.instructor_id && !list.some((p) => p.id === course.instructor_id)) list.unshift({ id: course.instructor_id, label: personName(course.instructor) || course.instructor_id });
    return list;
  }, [instructors, course]);

  const dirty = useMemo(
    () =>
      !!imageFile ||
      (Object.keys(form) as (keyof FormState)[]).some((k) =>
        k === 'description' ? normDescription(form.description) !== normDescription(saved.description) : form[k] !== saved[k],
      ),
    [form, saved, imageFile],
  );
  // A different course resets the form; new data for the same course (the
  // builder reloads it, Publish changes it) only replaces fields that weren't changed.
  const lastId = useRef(course?.id);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => {
    if (lastId.current === course?.id && dirtyRef.current) return;
    lastId.current = course?.id;
    const next = fromCourse(course);
    setSaved(next);
    setForm(next);
    setImageFile(null);
    setImagePreview(course?.image_url ?? null);
    w.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course]);

  const guard = useLeaveGuard(isNew ? !!(form.title.trim() || normDescription(form.description) || form.start_date || imageFile) : dirty, text.leave);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    w.clearError(key);
  };

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      w.setErrors((x) => ({ ...x, image: t('admin.courses.form.imageType', 'Choose a PNG, JPG, GIF or WEBP picture.') }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      w.setErrors((x) => ({ ...x, image: t('admin.courses.form.imageSize', 'This picture is larger than 20MB. Choose a smaller one.') }));
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

  const uploadImage = async (file: File, courseId: string): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('courseId', courseId);
    const res = await fetch('/api/lms/courses/upload-image', { method: 'POST', body: fd });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.success || !result.url) throw new Error(result.error || t('admin.courses.form.imageUploadError', 'The picture was not uploaded'));
    return result.url;
  };

  const errorText = (code: string | undefined, fallback: string) => (code && code.includes('.') && !code.includes(' ') ? t(code, fallback) : code || fallback);

  // A new course is created once. Opening its page can take a while, so a
  // second click on Create (or Enter) only opens it again, never creates a
  // second course; `busy` also stops a fast double click.
  const createdId = useRef<string | null>(null);
  const busy = useRef(false);

  const save = async () => {
    if (!course && createdId.current) {
      router.replace(`/admin/lms/courses/${createdId.current}?step=structure`);
      return;
    }
    if (busy.current) return;
    if (!w.checkAll()) return;
    busy.current = true;
    let leaving = false;
    setSaving(true);
    const body = {
      title: form.title.trim(),
      course_type: form.course_type,
      description: normDescription(form.description) || null,
      is_standalone: form.is_standalone,
      program_id: form.is_standalone ? null : form.program_id || null,
      instructor_id: form.instructor_id || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      is_active: form.is_active,
      is_published: form.is_published,
      // Sent only when changed: the columns may not exist before their SQL runs.
      ...(form.uses_grades !== (course?.uses_grades ?? true) ? { uses_grades: form.uses_grades } : {}),
      ...(form.uses_attendance !== (course?.uses_attendance ?? true) ? { uses_attendance: form.uses_attendance } : {}),
    };
    try {
      if (!course) {
        // New: create, then add the picture (it needs the course's id).
        const res = await fetch('/api/lms/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, instructor_id: body.instructor_id || undefined, image_url: null }),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok || !result.success) throw new Error(errorText(result.error, t('lms.courses.error.create_failed', 'Failed to create course')));
        const id = result.data.id as string;
        createdId.current = id;
        // Creating takes the basic fields only; switches turned off are saved right after.
        const features = {
          ...('uses_grades' in body ? { uses_grades: (body as any).uses_grades } : {}),
          ...('uses_attendance' in body ? { uses_attendance: (body as any).uses_attendance } : {}),
        };
        if (Object.keys(features).length) {
          await fetch(`/api/lms/courses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(features) });
        }
        if (imageFile) {
          try {
            const url = await uploadImage(imageFile, id);
            await fetch(`/api/lms/courses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image_url: url }) });
          } catch {
            toast({ title: t('common.error', 'Error'), description: t('admin.courses.form.createdNoImage', 'The course was created, but the picture was not uploaded. Add it again in Settings.'), variant: 'destructive' });
          }
        }
        toast({ title: t('common.success', 'Success'), description: t('lms.msg.create_success', 'Created successfully') });
        guard.allowLeave();
        // Stays "saving" until the course page opens.
        leaving = true;
        router.replace(`/admin/lms/courses/${id}?step=structure`);
        return;
      }

      // Editing: upload first; if it fails nothing is saved or deleted.
      let imageUrl: string | null = form.image_url || null;
      if (imageFile) {
        try {
          imageUrl = await uploadImage(imageFile, course.id);
        } catch (err) {
          w.fail('about', { image: err instanceof Error ? err.message : t('admin.courses.form.imageUploadError', 'The picture was not uploaded') });
          throw err;
        }
      }
      const res = await fetch(`/api/lms/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, image_url: imageUrl }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success) throw new Error(errorText(result.error, t('lms.courses.error.update_failed', 'Failed to update course')));

      // Only now remove the picture the course no longer uses.
      if (course.image_url && course.image_url !== imageUrl) {
        void fetch('/api/lms/courses/upload-image', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: course.image_url }),
        }).catch(() => undefined);
      }
      toast({ title: t('common.success', 'Success'), description: t('lms.msg.update_success', 'Updated successfully') });
      const program = programOptions.find((p) => p.id === result.data.program_id);
      const instructor = instructorOptions.find((p) => p.id === result.data.instructor_id);
      const next = fromCourse({ ...course, ...result.data });
      setSaved(next);
      setForm(next);
      setImageFile(null);
      setImagePreview(result.data.image_url ?? null);
      onSaved?.({
        ...course,
        ...result.data,
        program: program ? { id: program.id, name: program.label } : null,
        instructor: instructor ? { id: instructor.id, first_name: instructor.label, last_name: '', email: '' } : null,
      });
    } catch (error) {
      toast({
        title: t('common.error', 'Error'),
        description: error instanceof Error ? error.message : t('lms.courses.error.update_failed', 'Failed to update course'),
        variant: 'destructive',
      });
    } finally {
      busy.current = false;
      if (!leaving) setSaving(false);
    }
  };

  const typeLabel = (type: string) => t(`lms.course.type_${type}`, COURSE_TYPE_FALLBACK[type as keyof typeof COURSE_TYPE_FALLBACK] ?? type);
  const errBorder = (k: string) => (errors[k] ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20' : '');
  const labels: Record<Step, string> = {
    basics: t('admin.courses.wizard.stepBasics', 'Name and type'),
    about: t('admin.courses.wizard.stepAbout', 'Picture and description'),
    program: t('admin.courses.wizard.stepProgram', 'Program and instructor'),
    schedule: t('admin.courses.wizard.stepSchedule', 'Dates and status'),
    structure: extra?.structure.label ?? '',
    materials: extra?.materials.label ?? '',
    grades: extra?.grades?.label ?? '',
    attendance: extra?.attendance?.label ?? '',
  };
  const leads: Record<Step, string> = {
    basics: t('admin.courses.wizard.leadBasics', 'What the course is called, and what kind it is.'),
    about: t('admin.courses.wizard.leadAbout', 'The picture and text clients see.'),
    program: t('admin.courses.wizard.leadProgram', 'Which program it belongs to, and who teaches it.'),
    schedule: t('admin.courses.wizard.leadSchedule', 'When it runs, and whether clients can see it.'),
    structure: t('admin.courses.wizard.leadStructure', 'Modules and lessons. Changes here are saved straight away.'),
    materials: t('admin.courses.wizard.leadMaterials', 'Files for the course. Changes here are saved straight away.'),
    grades: t('admin.courses.wizard.leadGrades', "Assignments and each client's grades."),
    attendance: t('admin.courses.wizard.leadAttendance', 'Who came to each meeting, and the summary.'),
  };

  return (
    <div dir={direction}>
      <StepWizard steps={steps} step={w.step} labels={labels} onGo={w.go} blocked={w.blocked} title={labels[w.step]} lead={leads[w.step]} titleAction={w.step === 'materials' ? extra?.materials.action : undefined}>
        {w.step === 'basics' && (
          <>
            <WizardField label={t('lms.courses.course_title', 'Course Title')} required error={errors.title} htmlFor="course-title">
              <Input id="course-title" value={form.title} onChange={(e) => set('title', e.target.value)} dir={direction} aria-invalid={!!errors.title} className={`h-11 ${errBorder('title')}`} />
            </WizardField>
            <WizardField label={t('lms.course.type_label', 'Course Type')} required error={errors.course_type}>
              <div role="radiogroup" className="grid grid-cols-2 gap-2 sm:max-w-md">
                {/* Course or lecture. A course saved earlier with another type
                    keeps it as a choice, so editing it changes nothing. */}
                {[...OFFERED_COURSE_TYPES, ...((OFFERED_COURSE_TYPES as readonly string[]).includes(saved.course_type) ? [] : [saved.course_type])].map((type) => {
                  const on = form.course_type === type;
                  const Icon = TYPE_ICON[type] ?? BookOpen;
                  return (
                    <button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => set('course_type', type)}
                      className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                        on ? 'border-2 border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted'
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${on ? 'text-primary' : 'text-muted-foreground'}`} aria-hidden />
                      {typeLabel(type)}
                    </button>
                  );
                })}
              </div>
            </WizardField>
          </>
        )}

        {w.step === 'about' && (
          <>
            <WizardField label={t('lms.courses.image', 'Course Image')} error={errors.image} hint={t('admin.courses.form.imageHint', 'PNG, JPG, GIF or WEBP, up to 20MB.')}>
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] p-3">
                <span className="grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary/10 text-primary">
                  {imagePreview ? <img src={imagePreview} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-7 w-7" aria-hidden />}
                </span>
                <div className="flex flex-wrap items-center gap-x-4">
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
            <WizardField label={t('lms.courses.description', 'Description')}>
              <RichTextEditor value={form.description} onChange={(v) => set('description', v)} placeholder={t('lms.courses.description_placeholder', 'Course description...')} dir={direction} />
            </WizardField>
          </>
        )}

        {w.step === 'program' && (
          <>
            {/* Program: cards, the first one being "Standalone" (not in a program) */}
            <WizardField label={t('lms.courses.program', 'Program')} required error={errors.program_id}>
              <ChoiceCards
                label={t('lms.courses.program', 'Program')}
                searchLabel={t('admin.courses.form.searchProgram', 'Search a program')}
                noMatch={t('admin.courses.form.noProgramMatch', 'No program matches')}
                value={form.is_standalone ? STANDALONE : form.program_id}
                invalid={!!errors.program_id}
                onChange={(v) => {
                  if (v === STANDALONE) {
                    set('is_standalone', true);
                    set('program_id', '');
                  } else {
                    set('is_standalone', false);
                    set('program_id', v);
                  }
                }}
                options={[
                  {
                    value: STANDALONE,
                    label: t('admin.courses.form.standalone', 'Standalone course'),
                    hint: t('admin.courses.form.standaloneHint', 'Not part of a program'),
                    icon: <Sparkles className="h-5 w-5" aria-hidden />,
                    pinned: true,
                  },
                  ...programOptions.map((p) => ({ value: p.id, label: p.label, icon: <Layers className="h-5 w-5" aria-hidden /> })),
                ]}
                empty={programOptions.length === 0 ? t('admin.courses.form.noPrograms', 'No programs yet') : undefined}
              />
            </WizardField>

            {/* Instructor: people cards, the first one being "No instructor" */}
            <WizardField label={t('lms.courses.instructor', 'Instructor')} hint={isNew ? t('admin.courses.form.instructorNewHint', 'Empty = you') : undefined}>
              <ChoiceCards
                label={t('lms.courses.instructor', 'Instructor')}
                searchLabel={t('admin.courses.form.searchInstructor', 'Search an instructor')}
                noMatch={t('admin.courses.form.noInstructorMatch', 'No instructor matches')}
                value={form.instructor_id || NONE}
                onChange={(v) => set('instructor_id', v === NONE ? '' : v)}
                options={[
                  {
                    value: NONE,
                    label: t('admin.courses.form.noInstructor', 'No instructor'),
                    icon: <Users className="h-5 w-5" aria-hidden />,
                    pinned: true,
                  },
                  ...instructorOptions.map((p) => ({ value: p.id, label: p.label, icon: <Initials name={p.label} /> })),
                ]}
              />
            </WizardField>
            {programExtra}
          </>
        )}

        {w.step === 'structure' && extra?.structure.node}
        {w.step === 'materials' && extra?.materials.node}
        {w.step === 'grades' && extra?.grades?.node}
        {w.step === 'attendance' && extra?.attendance?.node}

        {w.step === 'schedule' && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <WizardField label={t('lms.courses.start_date', 'Start Date')} required error={errors.start_date} htmlFor="course-start">
                <Input id="course-start" type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} aria-invalid={!!errors.start_date} className={`h-11 ${errBorder('start_date')}`} />
              </WizardField>
              <WizardField label={t('lms.courses.end_date', 'End Date')} error={errors.end_date} htmlFor="course-end">
                <Input id="course-end" type="date" value={form.end_date} min={form.start_date || undefined} onChange={(e) => set('end_date', e.target.value)} aria-invalid={!!errors.end_date} className={`h-11 ${errBorder('end_date')}`} />
              </WizardField>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SwitchRow id="course-active" title={t('lms.courses.active', 'Active')} hint={t('admin.courses.form.activeHint', 'An inactive course is not offered')} checked={form.is_active} onChange={(v) => set('is_active', v)} />
              <SwitchRow id="course-published" title={t('lms.course.published', 'Published')} hint={t('admin.courses.form.publishedHint', 'Clients can see it')} checked={form.is_published} onChange={(v) => set('is_published', v)} />
              {/* A parents' club, for example, turns these off: the portal then shows no grades or attendance. */}
              <SwitchRow id="course-grades" title={t('admin.courses.form.usesGrades', 'Grades')} hint={t('admin.courses.form.usesGradesHint', 'Clients see their grades in the portal')} checked={form.uses_grades} onChange={(v) => set('uses_grades', v)} />
              <SwitchRow id="course-attendance" title={t('admin.courses.form.usesAttendance', 'Attendance')} hint={t('admin.courses.form.usesAttendanceHint', 'Clients see their attendance in the portal')} checked={form.uses_attendance} onChange={(v) => set('uses_attendance', v)} />
            </div>
          </>
        )}
      </StepWizard>

      <div className="h-20" aria-hidden />
      <SaveBar
        isNew={isNew}
        dirty={dirty}
        saving={saving}
        onSave={() => void save()}
        onDiscard={discard}
        cancelHref="/admin/lms/courses"
        saveLabel={isNew ? t('common.create', 'Create') : t('common.save', 'Save')}
        text={text.bar}
      />
      {guard.dialog}
    </div>
  );
}

/** The program card that means "not in a program". */
const STANDALONE = '_standalone';

/** A round badge with a person's initials. */
function Initials({ name }: { name: string }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return <span className="text-sm font-bold">{letters || '?'}</span>;
}

/**
 * Pick one, as cards instead of a dropdown: an icon, the name, and an optional
 * hint. Long lists get a search box; pinned cards (like "Standalone") always show.
 */
function ChoiceCards({
  label,
  searchLabel,
  noMatch,
  value,
  onChange,
  options,
  invalid,
  empty,
}: {
  label: string;
  searchLabel: string;
  noMatch: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; hint?: string; icon: ReactNode; pinned?: boolean }[];
  invalid?: boolean;
  empty?: string;
}) {
  const [query, setQuery] = useState('');
  const searchable = options.filter((o) => !o.pinned).length > 6;
  const q = query.trim().toLowerCase();
  const shown = options.filter((o) => o.pinned || o.value === value || !q || o.label.toLowerCase().includes(q));
  return (
    <div className="space-y-2.5">
      {searchable && (
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchLabel} aria-label={searchLabel} className="h-11" />
      )}
      <div role="radiogroup" aria-label={label} aria-invalid={invalid || undefined} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={`flex min-h-[64px] items-center gap-3 rounded-xl border px-3 py-2.5 text-start transition-colors ${
                on ? 'border-2 border-primary bg-primary/5' : invalid ? 'border-red-300 hover:bg-muted dark:border-red-800' : 'border-border hover:bg-muted'
              }`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${on ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>{o.icon}</span>
              <span className="min-w-0">
                <span className={`block text-sm font-semibold [overflow-wrap:anywhere] ${on ? 'text-primary' : ''}`}>{o.label}</span>
                {o.hint && <span className="block text-[12.5px] text-muted-foreground">{o.hint}</span>}
              </span>
            </button>
          );
        })}
      </div>
      {empty && <p className="text-sm text-muted-foreground">{empty}</p>}
      {q && shown.every((o) => o.pinned || o.value === value) && <p className="text-sm text-muted-foreground">{noMatch}</p>}
    </div>
  );
}
