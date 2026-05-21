'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { useHelp } from '@/hooks/useHelp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import {
  Navigation,
  GripVertical,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  visible: boolean;
  order: number;
  /** Optional for back-compat with hard-coded fallback navs that
   *  pre-date the nested model. The tree helpers + render path
   *  default to [] whenever this is missing. Two-level cap enforced —
   *  a child here cannot have its own children rendered. */
  children?: NavItem[];
  translation_key?: string;
}

interface NavSection {
  id: string;
  title: string;
  visible: boolean;
  order: number;
  items: NavItem[];
  translation_key?: string;
}

// ============================================================================
// Tree helpers — pure functions that the drag-end reducer uses to mutate
// the nested sections/items/sub-items tree without losing immutability.
// ============================================================================

type TreeLocation =
  | { type: 'section'; sectionIdx: number }
  | { type: 'item'; sectionIdx: number; itemIdx: number }
  | { type: 'sub'; sectionIdx: number; itemIdx: number; subIdx: number };

function findInTree(sections: NavSection[], id: string): TreeLocation | null {
  for (let s = 0; s < sections.length; s++) {
    if (sections[s].id === id) return { type: 'section', sectionIdx: s };
    for (let i = 0; i < sections[s].items.length; i++) {
      if (sections[s].items[i].id === id) {
        return { type: 'item', sectionIdx: s, itemIdx: i };
      }
      const children = sections[s].items[i].children ?? [];
      for (let sub = 0; sub < children.length; sub++) {
        if (children[sub].id === id) {
          return { type: 'sub', sectionIdx: s, itemIdx: i, subIdx: sub };
        }
      }
    }
  }
  return null;
}

/** Deep-ish clone of the tree so callers can mutate the returned array
 *  without leaking through to React state. We only clone the levels we
 *  might modify (sections, items, children arrays) — leaf NavItem
 *  fields aren't touched so the references stay cheap. */
function cloneTree(sections: NavSection[]): NavSection[] {
  return sections.map((s) => ({
    ...s,
    items: s.items.map((i) => ({
      ...i,
      children: [...(i.children ?? [])],
    })),
  }));
}

function reorderArray<T extends { order: number }>(items: T[]): T[] {
  return items.map((it, idx) => ({ ...it, order: idx + 1 }));
}

/** Remove an item (or sub-item) from the tree and return both the new
 *  tree and the extracted node. Sections themselves are also extractable
 *  (used when reordering sections). */
function removeFromTree(
  sections: NavSection[],
  id: string,
): { sections: NavSection[]; removed: NavSection | NavItem | null; loc: TreeLocation | null } {
  const loc = findInTree(sections, id);
  if (!loc) return { sections, removed: null, loc: null };
  const next = cloneTree(sections);
  if (loc.type === 'section') {
    const [removed] = next.splice(loc.sectionIdx, 1);
    return { sections: next, removed, loc };
  }
  if (loc.type === 'item') {
    const [removed] = next[loc.sectionIdx].items.splice(loc.itemIdx, 1);
    return { sections: next, removed, loc };
  }
  // sub — children is guaranteed non-null after cloneTree(); the `!`
  // tells TS this (the NavItem type marks it optional for back-compat).
  const [removed] = next[loc.sectionIdx].items[loc.itemIdx].children!.splice(
    loc.subIdx,
    1,
  );
  return { sections: next, removed, loc };
}

// ============================================================================
// Drop targets — drop-on-row to nest, gap-between-rows to reorder.
//
// Drop-target ID grammar (parsed by handleTreeDragEnd):
//   nest-{itemId}           — drop on a top-level item row → become its child
//   gap-section-{secId}-{i} — drop in gap among section's items at index i
//   gap-subs-{itemId}-{i}   — drop in gap among sub-items at index i
//   section-empty-{secId}   — drop on empty section body
//   gap-root-{i}            — drop in gap among sections at index i
// ============================================================================

function NestZone({ id, children, disabled }: {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      className={[
        'rounded-lg transition-colors',
        isOver ? 'ring-2 ring-primary bg-primary/5' : '',
      ].join(' ')}
    >
      {children}
    </div>
  );
}

function GapZone({ id, isDragActive }: { id: string; isDragActive: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  // Stay invisible when nothing's being dragged so the layout reads
  // cleanly; expand to a real, hittable hover band as soon as a drag
  // starts. When the cursor is actually over the gap, fill it solid.
  return (
    <div
      ref={setNodeRef}
      className={[
        'transition-all rounded-full',
        !isDragActive
          ? 'h-0 my-0'
          : isOver
            ? 'h-3 my-1.5 bg-primary'
            : 'h-2 my-1 bg-primary/15 border border-dashed border-primary/40',
      ].join(' ')}
      aria-hidden="true"
    />
  );
}

function EmptySectionZone({ sectionId, t }: { sectionId: string; t: (k: string, f?: string) => string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `section-empty-${sectionId}` });
  return (
    <div
      ref={setNodeRef}
      className={[
        'p-4 border-2 border-dashed rounded-lg text-sm text-center transition-colors',
        isOver
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border text-muted-foreground',
      ].join(' ')}
      suppressHydrationWarning
    >
      {t('navigation.emptyDropZone', 'Drop an item here')}
    </div>
  );
}

// Draggable item row (replaces SortableItem's drag mechanics). The row
// itself is also a drop target — `nest-{id}` — for top-level items, so
// dragging another item ONTO this row makes that item a child.
// Sub-items don't accept nest drops (2-level cap), but they're still
// drag sources.
function DraggableItemRow({
  item,
  sectionId,
  parentItemId,
  onToggleVisibility,
  onEditName,
  editingItemId,
  editingName,
  onSaveEdit,
  onCancelEdit,
  editingInHint,
}: {
  item: NavItem;
  sectionId: string;
  /** When set, this row is a SUB-item under that parent item. */
  parentItemId?: string;
  onToggleVisibility: (sectionId: string, itemId: string) => void;
  onEditName: (itemId: string, currentName: string) => void;
  editingItemId: string | null;
  editingName: string;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  editingInHint?: string;
}) {
  const isSubItem = !!parentItemId;
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } =
    useDraggable({ id: item.id });
  // Only top-level items can BE a nest target (a sub-item can't accept
  // children because of the 2-level cap).
  const { setNodeRef: setNestRef, isOver: isNestOver } = useDroppable({
    id: `nest-${item.id}`,
    disabled: isSubItem,
  });

  const isEditing = editingItemId === item.id;

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        if (!isSubItem) setNestRef(node);
      }}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className={[
        'flex items-center justify-between p-3 border rounded-lg bg-background transition-colors',
        isNestOver ? 'ring-2 ring-primary bg-primary/5 border-primary' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 flex-1">
        <div
          className="cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <input
              type="text"
              value={editingName}
              onChange={(e) => onEditName(item.id, e.target.value)}
              className="px-2 py-1 border rounded font-medium flex-1 min-w-0"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            {editingInHint && (
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded whitespace-nowrap">
                {editingInHint}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={onSaveEdit} className="h-8 w-8 p-0">
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancelEdit} className="h-8 w-8 p-0">
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.href}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditName(item.id, item.label)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleVisibility(sectionId, item.id)}
        >
          {item.visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

// Sortable Section Component
function SortableSection({
  section,
  sectionIndex,
  sectionsLength,
  onToggleVisibility,
  onMoveSection,
  onEditName,
  editingSectionId,
  editingName,
  onSaveEdit,
  onCancelEdit,
  children,
  t,
  editingInHint,
}: {
  section: NavSection;
  sectionIndex: number;
  sectionsLength: number;
  onToggleVisibility: (id: string) => void;
  onMoveSection: (id: string, direction: 'up' | 'down') => void;
  onEditName: (id: string, currentName: string) => void;
  editingSectionId: string | null;
  editingName: string;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  children: React.ReactNode;
  t: (key: string, fallback: string) => string;
  editingInHint?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = editingSectionId === section.id;

  return (
    <Card ref={setNodeRef} style={style}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div
              className="cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => onEditName(section.id, e.target.value)}
                  className="px-2 py-1 border rounded text-lg font-semibold flex-1 min-w-0"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSaveEdit();
                    if (e.key === 'Escape') onCancelEdit();
                  }}
                />
                {editingInHint && (
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded whitespace-nowrap">
                    {editingInHint}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSaveEdit}
                  className="h-8 w-8 p-0"
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancelEdit}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <>
                <CardTitle>{section.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditName(section.id, section.title)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={section.visible}
              onCheckedChange={() => onToggleVisibility(section.id)}
            />
            <span className="text-sm text-muted-foreground" suppressHydrationWarning>
              {section.visible ? t('navigation.visible', 'Visible') : t('navigation.hidden', 'Hidden')}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// Sortable Item Component
function SortableItem({
  item,
  sectionId,
  onToggleVisibility,
  onEditName,
  editingItemId,
  editingName,
  onSaveEdit,
  onCancelEdit,
  editingInHint,
}: {
  item: NavItem;
  sectionId: string;
  onToggleVisibility: (sectionId: string, itemId: string) => void;
  onEditName: (itemId: string, currentName: string) => void;
  editingItemId: string | null;
  editingName: string;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  editingInHint?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = editingItemId === item.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 border rounded-lg bg-background"
    >
      <div className="flex items-center gap-3 flex-1">
        <div
          className="cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <input
              type="text"
              value={editingName}
              onChange={(e) => onEditName(item.id, e.target.value)}
              className="px-2 py-1 border rounded font-medium flex-1 min-w-0"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            {editingInHint && (
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded whitespace-nowrap">
                {editingInHint}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSaveEdit}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelEdit}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.href}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditName(item.id, item.label)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleVisibility(sectionId, item.id)}
        >
          {item.visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default function NavigationPage() {
  useHelp('config-navigation');
  const { t, language, availableLanguages, clearTranslationCache } = useAdminLanguage();

  // Human-readable label for the language being edited — shown next to the
  // edit input so the admin clearly sees "Editing in עברית" / "English"
  // and doesn't expect the other language to update too.
  const currentLanguageLabel =
    availableLanguages.find((l) => l.code === language)?.native_name
    || language.toUpperCase();
  const editingInHint = t('navigation.editingIn', 'עריכה ב-{lang}').replace('{lang}', currentLanguageLabel);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<NavSection[]>([]);
  // Track which item is currently being dragged so DragOverlay can
  // render a clone that follows the cursor — without this the drag
  // feels broken because nothing visibly moves.
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  // Section IDs that the admin wants deleted on next save. We hold
  // them client-side until Save Changes commits both deletes and
  // updates in one API round-trip. Section is only deleteable when
  // its items list is empty.
  const [pendingSectionDeletes, setPendingSectionDeletes] = useState<string[]>([]);

  // Edit state
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingTranslationKey, setEditingTranslationKey] = useState('');

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Navigation structure with translation keys (for reference, not used directly)
  const getNavSections = (): NavSection[] => [
    {
      id: 'overview',
      title: t('admin.nav.overview', 'Overview'),
      visible: true,
      order: 1,
      items: [
        { id: 'dashboard', label: t('admin.nav.dashboard', 'Dashboard'), href: '/admin/dashboard', visible: true, order: 1 }
      ]
    },
    {
      id: 'learning',
      title: t('admin.nav.learning', 'Learning'),
      visible: true,
      order: 2,
      items: [
        { id: 'programs', label: t('admin.nav.lms_programs', 'Programs'), href: '/admin/lms/programs', visible: true, order: 1 },
        { id: 'courses', label: t('admin.nav.lms_courses', 'Courses'), href: '/admin/lms/courses', visible: true, order: 2 },
        { id: 'enrollments', label: t('admin.nav.enrollments', 'Enrollments'), href: '/admin/enrollments', visible: true, order: 3 },
        { id: 'grading', label: t('admin.nav.grading', 'Grading'), href: '/admin/grading/scales', visible: true, order: 4 }
      ]
    },
    {
      id: 'users',
      title: t('admin.nav.users_access', 'Users & Access'),
      visible: true,
      order: 3,
      items: [
        { id: 'users', label: t('admin.nav.users', 'Users'), href: '/admin/settings/users', visible: true, order: 1 }
      ]
    },
    {
      id: 'configuration',
      title: t('admin.nav.configuration', 'Configuration'),
      visible: true,
      order: 4,
      items: [
        { id: 'languages', label: t('admin.nav.languages', 'Languages'), href: '/admin/config/languages', visible: true, order: 1 },
        { id: 'translations', label: t('admin.nav.translations', 'Translations'), href: '/admin/config/translations', visible: true, order: 2 },
        { id: 'settings', label: t('admin.nav.settings', 'Settings'), href: '/admin/config/settings', visible: true, order: 3 },
        { id: 'theme', label: t('admin.nav.theme', 'Theme'), href: '/admin/settings/theme', visible: true, order: 4 },
        { id: 'features', label: t('admin.nav.features', 'Features'), href: '/admin/config/features', visible: true, order: 5 },
        { id: 'integrations', label: t('admin.nav.integrations', 'Integrations'), href: '/admin/config/integrations', visible: true, order: 6 },
        { id: 'emails', label: t('admin.nav.emails', 'Emails'), href: '/admin/emails', visible: true, order: 7 }
      ]
    },
    {
      id: 'business',
      title: t('admin.nav.business', 'Business'),
      visible: true,
      order: 5,
      items: [
        { id: 'payments', label: t('admin.nav.payments', 'Payments'), href: '/admin/payments', visible: true, order: 1 }
      ]
    },
    {
      id: 'security',
      title: t('admin.nav.security', 'Security'),
      visible: true,
      order: 6,
      items: [
        { id: 'audit', label: t('admin.nav.audit', 'Audit Log'), href: '/admin/audit', visible: true, order: 1 }
      ]
    }
  ];

  useEffect(() => {
    console.log('[Navigation Page] Component mounted, fetching config...');
    fetchNavigationConfig();
  }, []);

  const fetchNavigationConfig = async () => {
    try {
      setLoading(true);
      console.log('[Navigation Page] Fetching navigation config...');
      const response = await fetch('/api/admin/navigation');
      const data = await response.json();

      console.log('[Navigation Page] API response:', data);
      console.log('[Navigation Page] Sections count:', data.data?.sections?.length || 0);

      if (data.success && data.data.sections) {
        // Map loaded sections back to local state format with translations.
        // Each item carries its own `children` (sub-items) — these are
        // nested 1 level deep (max 2 levels total: section → item → sub).
        const mapItem = (item: any): NavItem => ({
          id: item.id,
          label: t(item.translation_key, item.translation_key),
          translation_key: item.translation_key,
          href: item.href,
          icon: item.icon,
          visible: item.visible,
          order: item.order,
          children: Array.isArray(item.children) ? item.children.map(mapItem) : [],
        });
        const loadedSections = data.data.sections.map((section: any) => ({
          id: section.id,
          title: t(section.translation_key, section.translation_key),
          translation_key: section.translation_key,
          visible: section.visible,
          order: section.order,
          items: section.items.map(mapItem),
        }));
        console.log('[Navigation Page] Mapped sections:', loadedSections);
        setSections(loadedSections);
      } else {
        console.warn('[Navigation Page] No sections data received');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching navigation:', error);
      toast.error(t('navigation.loadError', 'Failed to load navigation config'));
      setLoading(false);
    }
  };

  // Nav key mapping (same as in AdminLayout)
  const navKeyMap: Record<string, string> = {
    'overview': 'admin.nav.overview',
    'learning': 'admin.nav.learning',
    'users': 'admin.nav.users_access',
    'configuration': 'admin.nav.configuration',
    'business': 'admin.nav.business',
    'security': 'admin.nav.security',
    'dashboard': 'admin.nav.dashboard',
    'programs': 'admin.nav.lms_programs',
    'courses': 'admin.nav.lms_courses',
    'enrollments': 'admin.nav.enrollments',
    'grading': 'admin.nav.grading',
    'organization': 'admin.nav.organization',
    'languages': 'admin.nav.languages',
    'translations': 'admin.nav.translations',
    'settings': 'admin.nav.settings',
    'theme': 'admin.nav.theme',
    'features': 'admin.nav.features',
    'integrations': 'admin.nav.integrations',
    'navigation': 'admin.nav.navigation',
    'emails': 'admin.nav.emails',
    'payments': 'admin.nav.payments',
    'audit': 'admin.nav.audit',
  };

  const toggleSectionVisibility = (sectionId: string) => {
    setSections(sections.map(s =>
      s.id === sectionId ? { ...s, visible: !s.visible } : s
    ));
  };

  const toggleItemVisibility = (sectionId: string, itemId: string) => {
    setSections(sections.map(s =>
      s.id === sectionId
        ? {
            ...s,
            items: s.items.map(i =>
              i.id === itemId ? { ...i, visible: !i.visible } : i
            )
          }
        : s
    ));
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === sectionId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    ) {
      return;
    }

    const newSections = [...sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];

    // Update order values
    newSections.forEach((s, i) => {
      s.order = i + 1;
    });

    setSections(newSections);
  };

  // Handle section drag end
  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const newSections = arrayMove(sections, oldIndex, newIndex);

      // Update order values
      newSections.forEach((s, i) => {
        s.order = i + 1;
      });

      setSections(newSections);
    }
  };

  // Handle item drag end within a section
  const handleItemDragEnd = (event: DragEndEvent, sectionId: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((prevSections) =>
        prevSections.map((section) => {
          if (section.id !== sectionId) return section;

          const oldIndex = section.items.findIndex((item) => item.id === active.id);
          const newIndex = section.items.findIndex((item) => item.id === over.id);

          const newItems = arrayMove(section.items, oldIndex, newIndex);

          // Update order values
          newItems.forEach((item, i) => {
            item.order = i + 1;
          });

          return { ...section, items: newItems };
        })
      );
    }
  };

  // Edit handlers
  const handleEditSectionName = (sectionId: string, name: string) => {
    setEditingSectionId(sectionId);
    setEditingName(name);
    const section = sections.find(s => s.id === sectionId);
    if (section?.translation_key) {
      setEditingTranslationKey(section.translation_key);
    }
  };

  const handleEditItemName = (itemId: string, name: string) => {
    setEditingItemId(itemId);
    setEditingName(name);
    // Find the item and get its translation key
    for (const section of sections) {
      const item = section.items.find(i => i.id === itemId);
      if (item?.translation_key) {
        setEditingTranslationKey(item.translation_key);
        break;
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTranslationKey || !editingName) return;

    // Snapshot what we're editing — handleCancelEdit() resets these and
    // we want the optimistic update + the API call to use the same values.
    const savedSectionId = editingSectionId;
    const savedItemId = editingItemId;
    const savedName = editingName;
    const savedKey = editingTranslationKey;

    try {
      // Update translation in database
      const response = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translation_key: savedKey,
          translation_value: savedName,
          language_code: language, // current admin language only — see note below
          category: savedKey.split('.')[0],
          context: 'admin',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update translation');
      }

      // Optimistic local update so the UI reflects the new label
      // immediately. The previous flow relied on `clearTranslationCache()`
      // followed by a 100ms sleep + `fetchNavigationConfig()` which uses
      // `t()` to resolve labels — that's racy because the translation
      // re-fetch is asynchronous and the page often rendered with stale
      // strings. Updating the local `sections` state directly removes the
      // dependency on the translation cache for this view.
      setSections((prev) =>
        prev.map((section) => {
          if (savedSectionId && !savedItemId && section.id === savedSectionId) {
            return { ...section, label: savedName };
          }
          if (savedItemId) {
            return {
              ...section,
              items: section.items.map((item) =>
                item.id === savedItemId ? { ...item, label: savedName } : item
              ),
            };
          }
          return section;
        })
      );

      // Still bust the translation cache so other consumers (admin
      // sidebar in the layout, other open tabs) pick up the new value
      // on their next read. Don't await — we no longer need the result.
      clearTranslationCache();

      toast.success(t('navigation.nameUpdated', 'Name updated successfully'));
      handleCancelEdit();
    } catch (error) {
      console.error('Error updating translation:', error);
      toast.error(t('navigation.updateError', 'Failed to update name'));
    }
  };

  const handleCancelEdit = () => {
    setEditingSectionId(null);
    setEditingItemId(null);
    setEditingName('');
    setEditingTranslationKey('');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('[Navigation Page] Starting save...');

      // Collect all updates (sections + items + sub-items) in the
      // format API expects. parent_id ties each item back to its
      // section/parent so the hierarchy survives the save round-trip.
      const updates: Array<{
        id: string;
        is_active: boolean;
        order: number;
        parent_id?: string | null;
      }> = [];

      // Add section updates (sections have parent_id = null on the DB
      // side; we don't include parent_id here to leave it untouched).
      sections.forEach(section => {
        updates.push({
          id: section.id,
          is_active: section.visible,
          order: section.order,
        });

        // Top-level items: parent is the section.
        section.items.forEach(item => {
          updates.push({
            id: item.id,
            is_active: item.visible,
            order: item.order,
            parent_id: section.id,
          });

          // Sub-items: parent is the item.
          (item.children || []).forEach(child => {
            updates.push({
              id: child.id,
              is_active: child.visible,
              order: child.order,
              parent_id: item.id,
            });
          });
        });
      });

      console.log(
        '[Navigation Page] Sending',
        updates.length,
        'updates and',
        pendingSectionDeletes.length,
        'deletes',
      );

      const response = await fetch('/api/admin/navigation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates,
          // The API treats `deletes` as a list of navigation_items.id
          // values to remove BEFORE applying updates. Only empty
          // sections reach here (UI gates the delete button).
          deletes: pendingSectionDeletes,
        }),
      });

      const data = await response.json();
      console.log('[Navigation Page] Save response:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save navigation config');
      }

      toast.success(t('navigation.saveSuccess', 'Navigation config updated successfully'));

      // Reload the page to apply changes to the sidebar after a delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('[Navigation Page] Error saving navigation:', error);
      toast.error(t('navigation.saveError', 'Failed to save navigation config'));
    } finally {
      setSaving(false);
    }
  };

  /**
   * Unified drag-end handler for the whole nav tree.
   *
   * Source can be a section, a top-level item, or a sub-item.
   * Target ID grammar (see drop-target components above):
   *   nest-{itemId}             → become child of that top-level item
   *   gap-section-{secId}-{i}   → insert at position i among section items
   *   gap-subs-{itemId}-{i}     → insert at position i among sub-items
   *   gap-root-{i}              → insert at position i among sections
   *   section-empty-{secId}     → append to an empty section
   *
   * Enforces the 2-level cap: if a top-level item with children is
   * nested into another item, its children are promoted back to
   * siblings of their original position so we never end up with a
   * 3rd level. Sections themselves can only be reordered, never
   * nested.
   */
  /** Look up an item (sub-item too) by id, so DragOverlay can render
   *  a faithful clone of the row being dragged. Returns null for
   *  section drags (we don't render an overlay for those since the
   *  whole section card visibly transforms via useSortable). */
  const findItemById = (id: string): NavItem | null => {
    for (const section of sections) {
      for (const item of section.items) {
        if (item.id === id) return item;
        for (const child of item.children ?? []) {
          if (child.id === id) return child;
        }
      }
    }
    return null;
  };

  const handleTreeDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  /** Mark a section for deletion on next save. Only legal when the
   *  section has no items (the UI gates this). The section vanishes
   *  from local state immediately; the API DELETE happens on Save. */
  const handleDeleteSection = (sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    setPendingSectionDeletes((prev) =>
      prev.includes(sectionId) ? prev : [...prev, sectionId],
    );
  };

  const handleTreeDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null); // clear overlay regardless of outcome

    const sourceId = event.active.id;
    const overId = event.over?.id;
    if (!overId || sourceId === overId) return;
    if (typeof sourceId !== 'string' || typeof overId !== 'string') return;

    const sourceLoc = findInTree(sections, sourceId);
    if (!sourceLoc) return;

    // Section source: only handle reorder among sections.
    if (sourceLoc.type === 'section') {
      if (!overId.startsWith('gap-root-')) return;
      const targetIdx = parseInt(overId.slice('gap-root-'.length), 10);
      if (Number.isNaN(targetIdx)) return;
      const next = cloneTree(sections);
      const [moved] = next.splice(sourceLoc.sectionIdx, 1);
      // Account for the removal shifting indices.
      const insertAt = targetIdx > sourceLoc.sectionIdx ? targetIdx - 1 : targetIdx;
      next.splice(insertAt, 0, moved);
      setSections(reorderArray(next));
      return;
    }

    // Item or sub-item source: pull from tree, then insert at target.
    // (The `section` case bailed above, so sourceLoc.type is now
    // narrowed to 'item' | 'sub'.)
    const { sections: withoutSource, removed } = removeFromTree(sections, sourceId);
    if (!removed) return;
    const removedItem = removed as NavItem;
    if (!removedItem.children) removedItem.children = [];

    // Helper to insert a list of "promoted" children back at the
    // source's original position. Used when a top-level item that
    // had sub-items gets nested — its sub-items can't follow it
    // (would create a 3rd level) so they stay where they were.
    const promotedChildren =
      sourceLoc.type === 'item' && removedItem.children.length > 0
        ? removedItem.children
        : [];
    if (promotedChildren.length > 0) {
      removedItem.children = [];
    }

    // --- nest-{itemId}: source becomes child of target item -------
    if (overId.startsWith('nest-')) {
      const targetItemId = overId.slice('nest-'.length);
      if (targetItemId === sourceId) return; // can't nest into self
      const targetLoc = findInTree(withoutSource, targetItemId);
      if (!targetLoc || targetLoc.type !== 'item') return;

      const next = cloneTree(withoutSource);
      next[targetLoc.sectionIdx].items[targetLoc.itemIdx].children!.push(removedItem);
      next[targetLoc.sectionIdx].items[targetLoc.itemIdx].children = reorderArray(
        next[targetLoc.sectionIdx].items[targetLoc.itemIdx].children!,
      );
      // Re-add promoted children where the source used to live.
      if (promotedChildren.length > 0 && sourceLoc.type === 'item') {
        next[sourceLoc.sectionIdx].items.splice(sourceLoc.itemIdx, 0, ...promotedChildren);
        next[sourceLoc.sectionIdx].items = reorderArray(next[sourceLoc.sectionIdx].items);
      }
      setSections(next);
      return;
    }

    // --- gap-section-{secId}-{i}: insert among top-level items ----
    if (overId.startsWith('gap-section-')) {
      const rest = overId.slice('gap-section-'.length);
      const lastDash = rest.lastIndexOf('-');
      const secId = rest.slice(0, lastDash);
      const idx = parseInt(rest.slice(lastDash + 1), 10);
      if (Number.isNaN(idx)) return;
      const targetSecIdx = withoutSource.findIndex((s) => s.id === secId);
      if (targetSecIdx < 0) return;

      const next = cloneTree(withoutSource);
      next[targetSecIdx].items.splice(idx, 0, removedItem);
      next[targetSecIdx].items = reorderArray(next[targetSecIdx].items);
      if (promotedChildren.length > 0 && sourceLoc.type === 'item') {
        // Source was an item that had children — drop those children
        // at the section level where source used to be.
        next[sourceLoc.sectionIdx].items.push(...promotedChildren);
        next[sourceLoc.sectionIdx].items = reorderArray(next[sourceLoc.sectionIdx].items);
      }
      setSections(next);
      return;
    }

    // --- gap-subs-{itemId}-{i}: insert among sub-items of itemId --
    if (overId.startsWith('gap-subs-')) {
      const rest = overId.slice('gap-subs-'.length);
      const lastDash = rest.lastIndexOf('-');
      const parentItemId = rest.slice(0, lastDash);
      const idx = parseInt(rest.slice(lastDash + 1), 10);
      if (Number.isNaN(idx)) return;
      if (parentItemId === sourceId) return; // can't put inside self
      const parentLoc = findInTree(withoutSource, parentItemId);
      if (!parentLoc || parentLoc.type !== 'item') return;

      const next = cloneTree(withoutSource);
      next[parentLoc.sectionIdx].items[parentLoc.itemIdx].children!.splice(idx, 0, removedItem);
      next[parentLoc.sectionIdx].items[parentLoc.itemIdx].children = reorderArray(
        next[parentLoc.sectionIdx].items[parentLoc.itemIdx].children!,
      );
      if (promotedChildren.length > 0 && sourceLoc.type === 'item') {
        next[sourceLoc.sectionIdx].items.push(...promotedChildren);
        next[sourceLoc.sectionIdx].items = reorderArray(next[sourceLoc.sectionIdx].items);
      }
      setSections(next);
      return;
    }

    // --- section-empty-{secId}: append to empty section -----------
    if (overId.startsWith('section-empty-')) {
      const secId = overId.slice('section-empty-'.length);
      const targetSecIdx = withoutSource.findIndex((s) => s.id === secId);
      if (targetSecIdx < 0) return;

      const next = cloneTree(withoutSource);
      next[targetSecIdx].items.push(removedItem);
      next[targetSecIdx].items = reorderArray(next[targetSecIdx].items);
      if (promotedChildren.length > 0 && sourceLoc.type === 'item') {
        next[sourceLoc.sectionIdx].items.push(...promotedChildren);
        next[sourceLoc.sectionIdx].items = reorderArray(next[sourceLoc.sectionIdx].items);
      }
      setSections(next);
      return;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-6 p-4 md:p-0">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold" suppressHydrationWarning>
              {t('navigation.title', 'Navigation Configuration')}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base" suppressHydrationWarning>
              {t('navigation.subtitle', 'Customize the admin sidebar navigation')}
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />}
            <span suppressHydrationWarning>
              {t('common.saveChanges', 'Save Changes')}
            </span>
          </Button>
        </div>

        {/* Navigation tree — single DndContext spans the whole tree.
            • Drag an item over another item's row → it becomes that
              item's child (nest).
            • Drag an item into a gap between rows → it lands at that
              position (reorder / section-move).
            • Drag a section into a gap between sections → section
              reorder.
            Collision uses `pointerWithin` because the nest-target
            (whole row) and gap-zones share screen space — pointerWithin
            picks whichever the cursor is actually inside. */}
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleTreeDragStart}
          onDragEnd={handleTreeDragEnd}
          onDragCancel={() => setActiveDragId(null)}
        >
          {/* SortableContext for sections provides the context that
              SortableSection's `useSortable` hook still needs (it
              renders the drag-handle attributes and transform). Drop
              logic is handled by handleTreeDragEnd, not by the
              sortable's default behavior. */}
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
          <div className="space-y-4">
            {sections.map((section, sectionIndex) => (
              <div key={section.id}>
                <GapZone id={`gap-root-${sectionIndex}`} isDragActive={!!activeDragId} />
                <SortableSection
                  section={section}
                  sectionIndex={sectionIndex}
                  sectionsLength={sections.length}
                  onToggleVisibility={toggleSectionVisibility}
                  onMoveSection={moveSection}
                  onEditName={handleEditSectionName}
                  editingSectionId={editingSectionId}
                  editingName={editingName}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  t={t}
                  editingInHint={editingInHint}
                >
                  {section.items.length === 0 ? (
                    <div className="space-y-2">
                      <EmptySectionZone sectionId={section.id} t={t} />
                      {/* Empty sections can be deleted outright — the
                          actual DELETE is queued and runs on Save Changes.
                          We only show this for empty sections so the
                          admin can't accidentally wipe a populated one. */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSection(section.id)}
                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                        <span suppressHydrationWarning>
                          {t('navigation.deleteCategory', 'Delete category')}
                        </span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <GapZone id={`gap-section-${section.id}-0`} isDragActive={!!activeDragId} />
                      {section.items.map((item, itemIndex) => (
                        <div key={item.id}>
                          {/* DraggableItemRow wires its own `useDroppable`
                              with id `nest-{item.id}` — no outer wrapper
                              needed (would conflict with duplicate IDs). */}
                          <DraggableItemRow
                            item={item}
                            sectionId={section.id}
                            onToggleVisibility={toggleItemVisibility}
                            onEditName={handleEditItemName}
                            editingItemId={editingItemId}
                            editingName={editingName}
                            onSaveEdit={handleSaveEdit}
                            onCancelEdit={handleCancelEdit}
                            editingInHint={editingInHint}
                          />
                          {/* Sub-items: rendered indented under their
                              parent, with their own gap drop zones for
                              reordering and re-parenting. */}
                          {item.children && item.children.length > 0 && (
                            <div className="mt-1 ltr:ml-8 rtl:mr-8 ltr:border-l-2 rtl:border-r-2 border-border ltr:pl-3 rtl:pr-3">
                              <GapZone id={`gap-subs-${item.id}-0`} isDragActive={!!activeDragId} />
                              {item.children.map((child, childIdx) => (
                                <div key={child.id}>
                                  <DraggableItemRow
                                    item={child}
                                    sectionId={section.id}
                                    parentItemId={item.id}
                                    onToggleVisibility={toggleItemVisibility}
                                    onEditName={handleEditItemName}
                                    editingItemId={editingItemId}
                                    editingName={editingName}
                                    onSaveEdit={handleSaveEdit}
                                    onCancelEdit={handleCancelEdit}
                                    editingInHint={editingInHint}
                                  />
                                  <GapZone id={`gap-subs-${item.id}-${childIdx + 1}`} isDragActive={!!activeDragId} />
                                </div>
                              ))}
                            </div>
                          )}
                          <GapZone id={`gap-section-${section.id}-${itemIndex + 1}`} isDragActive={!!activeDragId} />
                        </div>
                      ))}
                    </div>
                  )}
                </SortableSection>
              </div>
            ))}
            <GapZone id={`gap-root-${sections.length}`} isDragActive={!!activeDragId} />
          </div>
          </SortableContext>

          {/* DragOverlay: a styled clone of the dragged row follows the
              cursor. Without this the original element just fades to
              opacity 0.4 and the user can't tell where the drag is —
              the most common cause of "feels broken". */}
          <DragOverlay dropAnimation={null}>
            {activeDragId
              ? (() => {
                  const item = findItemById(activeDragId);
                  if (!item) return null;
                  return (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-card shadow-lg ring-2 ring-primary cursor-grabbing">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.href}
                        </p>
                      </div>
                    </div>
                  );
                })()
              : null}
          </DragOverlay>
        </DndContext>

        {/* Info Card */}
        <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              <span suppressHydrationWarning>
                {t('navigation.info.title', 'Navigation Configuration')}
              </span>
            </CardTitle>
            <CardDescription className="text-blue-800 dark:text-blue-200" suppressHydrationWarning>
              {t('navigation.info.description', 'Configure the order and visibility of navigation items in the admin sidebar. Changes will apply immediately after saving.')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </AdminLayout>
  );
}
