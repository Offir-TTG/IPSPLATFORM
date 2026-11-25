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
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';

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
// Drag and drop. Every row and every section card is a drop target, and
// where the pointer is on it decides the drop:
//   • item row, top part    → above that item
//   • item row, bottom part → below that item
//   • item row, middle      → becomes its sub-item (top-level rows only;
//                             the menu has two levels at most)
//   • section card (a dragged section) → above / below by its middle
//   • section card or empty section (a dragged item) → into that section
// A line shows where it will land, or an outline for "inside".
//
// Drop-target ids: row-{itemId}, sec-{sectionId}, section-empty-{sectionId}.
// ============================================================================

type DropPos = 'before' | 'after' | 'inside';
/** Where the dragged thing will land: next to / inside this item or section. */
type DropHint = { targetId: string; pos: DropPos } | null;

const ROW_PREFIX = 'row-';
const SEC_PREFIX = 'sec-';
const EMPTY_PREFIX = 'section-empty-';

/** Renumbers every level after a move. */
function renumber(sections: NavSection[]): NavSection[] {
  return reorderArray(sections).map((s) => ({
    ...s,
    items: reorderArray(s.items).map((i) => ({ ...i, children: reorderArray(i.children ?? []) })),
  }));
}

/** The tree after dropping `sourceId` at `hint`, or null when nothing changes. */
function applyDrop(sections: NavSection[], sourceId: string, hint: { targetId: string; pos: DropPos }): NavSection[] | null {
  if (hint.targetId === sourceId) return null;
  const sourceLoc = findInTree(sections, sourceId);
  if (!sourceLoc) return null;
  const { sections: next, removed } = removeFromTree(sections, sourceId);
  if (!removed) return null;

  if (sourceLoc.type === 'section') {
    const at = next.findIndex((s) => s.id === hint.targetId);
    if (at < 0) return null;
    next.splice(hint.pos === 'after' ? at + 1 : at, 0, removed as NavSection);
    return renumber(next);
  }

  const moved: NavItem = { ...(removed as NavItem), children: [...((removed as NavItem).children ?? [])] };
  const targetLoc = findInTree(next, hint.targetId);
  if (!targetLoc) return null;

  // A sub-item can't have sub-items of its own. When an item that has
  // some becomes a sub-item, they stay where it was.
  const becomesSub = targetLoc.type === 'sub' || (targetLoc.type === 'item' && hint.pos === 'inside');
  const leftBehind = becomesSub ? moved.children ?? [] : [];
  if (becomesSub) moved.children = [];

  if (targetLoc.type === 'section') {
    next[targetLoc.sectionIdx].items.push(moved);
  } else if (targetLoc.type === 'item') {
    const items = next[targetLoc.sectionIdx].items;
    if (hint.pos === 'inside') {
      const parent = items[targetLoc.itemIdx];
      parent.children = [...(parent.children ?? []), moved];
    } else {
      items.splice(hint.pos === 'after' ? targetLoc.itemIdx + 1 : targetLoc.itemIdx, 0, moved);
    }
  } else {
    const parent = next[targetLoc.sectionIdx].items[targetLoc.itemIdx];
    const kids = [...(parent.children ?? [])];
    kids.splice(hint.pos === 'after' ? targetLoc.subIdx + 1 : targetLoc.subIdx, 0, moved);
    parent.children = kids;
  }

  if (leftBehind.length && sourceLoc.type === 'item') {
    const home = next[sourceLoc.sectionIdx].items;
    home.splice(Math.min(sourceLoc.itemIdx, home.length), 0, ...leftBehind);
  }
  return renumber(next);
}

/** The line above or below a target while something is dragged over it. */
function DropLine({ pos }: { pos: DropPos | null | undefined }) {
  if (pos !== 'before' && pos !== 'after') return null;
  return (
    <span
      aria-hidden="true"
      className={[
        'pointer-events-none absolute inset-x-0 z-10 h-1 rounded-full bg-primary',
        pos === 'before' ? '-top-0.5' : '-bottom-0.5',
      ].join(' ')}
    />
  );
}

/** The drag handle: a big enough target for a mouse or a finger. */
function DragHandle({ attributes, listeners, label, large }: {
  attributes: React.HTMLAttributes<HTMLElement>;
  listeners: Record<string, unknown> | undefined;
  label: string;
  large?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="-m-1 grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted-foreground cursor-grab touch-none hover:bg-muted hover:text-foreground active:cursor-grabbing"
      {...attributes}
      {...(listeners as React.HTMLAttributes<HTMLButtonElement>)}
    >
      <GripVertical className={large ? 'h-5 w-5' : 'h-4 w-4'} />
    </button>
  );
}

function EmptySectionZone({ sectionId, t }: { sectionId: string; t: (k: string, f?: string) => string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${EMPTY_PREFIX}${sectionId}` });
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

// One item row (top-level or sub-item). Drag it by the handle; it is also
// a drop target for other items (see the top of this section).
function DraggableItemRow({
  item,
  sectionId,
  hint,
  dragLabel,
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
  /** Where a dragged item would land relative to this row, if over it. */
  hint: DropPos | null;
  dragLabel: string;
  onToggleVisibility: (sectionId: string, itemId: string) => void;
  onEditName: (itemId: string, currentName: string) => void;
  editingItemId: string | null;
  editingName: string;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  editingInHint?: string;
}) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id: item.id });
  // The drop target includes the small space around the row, so there is
  // no dead gap between two rows.
  const { setNodeRef: setDropRef } = useDroppable({ id: `${ROW_PREFIX}${item.id}` });

  const isEditing = editingItemId === item.id;

  return (
    <div ref={setDropRef} className="relative py-0.5">
      <DropLine pos={hint} />
      <div
        ref={setDragRef}
        style={{ opacity: isDragging ? 0.4 : 1 }}
        className={[
          'flex items-center justify-between gap-2 p-3 border rounded-lg bg-background transition-colors',
          hint === 'inside' ? 'ring-2 ring-primary bg-primary/5 border-primary' : '',
        ].join(' ')}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <DragHandle attributes={attributes} listeners={listeners} label={dragLabel} />
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
            <div className="flex items-center gap-2 min-w-0">
              <div className="min-w-0">
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground truncate">{item.href}</p>
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
    </div>
  );
}

// A section card. Drag it by the handle in its header; it is also a drop
// target for other sections (above / below) and for items (into it).
function SortableSection({
  section,
  hint,
  dragLabel,
  onToggleVisibility,
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
  /** Where a dragged section (or item) would land relative to this card. */
  hint: DropPos | null;
  dragLabel: string;
  onToggleVisibility: (id: string) => void;
  onEditName: (id: string, currentName: string) => void;
  editingSectionId: string | null;
  editingName: string;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  children: React.ReactNode;
  t: (key: string, fallback: string) => string;
  editingInHint?: string;
}) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id: section.id });
  const { setNodeRef: setDropRef } = useDroppable({ id: `${SEC_PREFIX}${section.id}` });

  const isEditing = editingSectionId === section.id;

  return (
    <div ref={setDropRef} className="relative py-1">
      <DropLine pos={hint} />
      <Card
        ref={setDragRef}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        className={hint === 'inside' ? 'ring-2 ring-primary' : undefined}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <DragHandle attributes={attributes} listeners={listeners} label={dragLabel} large />
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
                  <Button variant="ghost" size="sm" onClick={onSaveEdit} className="h-8 w-8 p-0">
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onCancelEdit} className="h-8 w-8 p-0">
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
  const dragLabel = t('navigation.dragToMove', 'Drag to move');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<NavSection[]>([]);
  // Track which item is currently being dragged so DragOverlay can
  // render a clone that follows the cursor — without this the drag
  // feels broken because nothing visibly moves.
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  // Where the dragged row or section will land (drives the line / outline).
  const [dropHint, setDropHint] = useState<DropHint>(null);
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
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
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
        // The settings screens are cards on the Settings page, so the menu
        // has one link to it.
        { id: 'settings_hub', label: t('admin.nav.settings_hub', 'Settings'), href: '/admin/settings', visible: true, order: 1 }
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
    'settings_hub': 'admin.nav.settings_hub',
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

  /** Applies `change` to the item with this id, at any depth (items and
   *  their sub-items). */
  const mapItemById = (items: NavItem[], itemId: string, change: (item: NavItem) => NavItem): NavItem[] =>
    items.map((i) =>
      i.id === itemId
        ? change(i)
        : i.children?.length
          ? { ...i, children: mapItemById(i.children, itemId, change) }
          : i,
    );

  const toggleItemVisibility = (sectionId: string, itemId: string) => {
    setSections(sections.map(s =>
      s.id === sectionId
        ? { ...s, items: mapItemById(s.items, itemId, (i) => ({ ...i, visible: !i.visible })) }
        : s
    ));
  };


  // Edit handlers
  const handleEditSectionName = (sectionId: string, name: string) => {
    setEditingSectionId(sectionId);
    setEditingItemId(null);
    setEditingName(name);
    setEditingTranslationKey('');
    const section = sections.find(s => s.id === sectionId);
    if (section?.translation_key) {
      setEditingTranslationKey(section.translation_key);
    }
  };

  const handleEditItemName = (itemId: string, name: string) => {
    setEditingItemId(itemId);
    setEditingName(name);
    // Find the item (or sub-item) and get its translation key. Cleared
    // first so a key left from an earlier edit can't be saved by mistake.
    setEditingTranslationKey(findItemById(itemId)?.translation_key ?? '');
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim()) {
      toast.error(t('navigation.nameRequired', 'Type a name before saving'));
      return;
    }
    if (!editingTranslationKey) {
      toast.error(t('navigation.updateError', 'Failed to update name'));
      return;
    }

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
          translation_value: savedName.trim(),
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
            return { ...section, title: savedName.trim() };
          }
          if (savedItemId) {
            return {
              ...section,
              items: mapItemById(section.items, savedItemId, (item) => ({ ...item, label: savedName.trim() })),
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

  /** Look up an item (sub-item too) by id, for the drag preview and the
   *  rename. */
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

  const isSectionId = (id: string) => sections.some((s) => s.id === id);

  /** The targets a drag may use. A section only goes next to another
   *  section; an item goes on a row, an empty section or a section card,
   *  never onto itself or one of its own sub-items. Rows win over the card
   *  around them. */
  const collisionDetection: CollisionDetection = (args) => {
    const activeId = String(args.active.id);
    const draggingSection = isSectionId(activeId);
    const own = new Set<string>([`${ROW_PREFIX}${activeId}`]);
    if (!draggingSection) {
      for (const child of findItemById(activeId)?.children ?? []) own.add(`${ROW_PREFIX}${child.id}`);
    }
    const rank = (id: string) => (id.startsWith(ROW_PREFIX) ? 0 : id.startsWith(EMPTY_PREFIX) ? 1 : 2);
    return pointerWithin(args)
      .filter((c) => {
        const id = String(c.id);
        if (own.has(id)) return false;
        return draggingSection ? id.startsWith(SEC_PREFIX) : true;
      })
      .sort((a, b) => rank(String(a.id)) - rank(String(b.id)));
  };

  /** Works out the drop line / outline from where the pointer is. */
  const updateDropHint = (event: DragMoveEvent | DragOverEvent) => {
    const over = event.over;
    if (!over) {
      setDropHint(null);
      return;
    }
    const overId = String(over.id);
    const activeId = String(event.active.id);
    const start = event.activatorEvent as PointerEvent;
    const y = (typeof start.clientY === 'number' ? start.clientY : over.rect.top) + event.delta.y;
    const rel = (y - over.rect.top) / Math.max(1, over.rect.height);

    let next: DropHint = null;
    if (overId.startsWith(SEC_PREFIX)) {
      const secId = overId.slice(SEC_PREFIX.length);
      next = isSectionId(activeId)
        ? { targetId: secId, pos: rel < 0.5 ? 'before' : 'after' }
        : { targetId: secId, pos: 'inside' };
    } else if (overId.startsWith(EMPTY_PREFIX)) {
      next = { targetId: overId.slice(EMPTY_PREFIX.length), pos: 'inside' };
    } else if (overId.startsWith(ROW_PREFIX)) {
      const targetId = overId.slice(ROW_PREFIX.length);
      // Only a top-level item can take sub-items.
      const canNest = findInTree(sections, targetId)?.type === 'item';
      const pos: DropPos = canNest
        ? rel < 0.3 ? 'before' : rel > 0.7 ? 'after' : 'inside'
        : rel < 0.5 ? 'before' : 'after';
      next = { targetId, pos };
    }
    setDropHint((prev) => (prev?.targetId === next?.targetId && prev?.pos === next?.pos ? prev : next));
  };

  const handleTreeDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    setDropHint(null);
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

  /** Drops where the line / outline showed. Changes are kept on screen
   *  and saved with Save Changes, as before. */
  const handleTreeDragEnd = (event: DragEndEvent) => {
    const hint = dropHint;
    setActiveDragId(null);
    setDropHint(null);
    if (!hint || !event.over) return;
    const sourceId = String(event.active.id);
    setSections((prev) => applyDrop(prev, sourceId, hint) ?? prev);
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

        {/* Navigation tree — one DndContext for sections, items and
            sub-items. See "Drag and drop" at the top of the file for how
            a drop position is chosen. */}
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleTreeDragStart}
          onDragMove={updateDropHint}
          onDragOver={updateDropHint}
          onDragEnd={handleTreeDragEnd}
          onDragCancel={() => {
            setActiveDragId(null);
            setDropHint(null);
          }}
        >
          <div className="space-y-2">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                hint={dropHint?.targetId === section.id ? dropHint.pos : null}
                dragLabel={dragLabel}
                onToggleVisibility={toggleSectionVisibility}
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
                  <div>
                    {section.items.map((item) => (
                      <div key={item.id}>
                        <DraggableItemRow
                          item={item}
                          sectionId={section.id}
                          hint={dropHint?.targetId === item.id ? dropHint.pos : null}
                          dragLabel={dragLabel}
                          onToggleVisibility={toggleItemVisibility}
                          onEditName={handleEditItemName}
                          editingItemId={editingItemId}
                          editingName={editingName}
                          onSaveEdit={handleSaveEdit}
                          onCancelEdit={handleCancelEdit}
                          editingInHint={editingInHint}
                        />
                        {/* Sub-items, indented under their parent. */}
                        {item.children && item.children.length > 0 && (
                          <div className="ltr:ml-8 rtl:mr-8 ltr:border-l-2 rtl:border-r-2 border-border ltr:pl-3 rtl:pr-3">
                            {item.children.map((child) => (
                              <DraggableItemRow
                                key={child.id}
                                item={child}
                                sectionId={section.id}
                                hint={dropHint?.targetId === child.id ? dropHint.pos : null}
                                dragLabel={dragLabel}
                                onToggleVisibility={toggleItemVisibility}
                                onEditName={handleEditItemName}
                                editingItemId={editingItemId}
                                editingName={editingName}
                                onSaveEdit={handleSaveEdit}
                                onCancelEdit={handleCancelEdit}
                                editingInHint={editingInHint}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SortableSection>
            ))}
          </div>

          {/* A copy of the dragged row or section follows the pointer. */}
          <DragOverlay dropAnimation={null}>
            {activeDragId
              ? (() => {
                  const section = sections.find((s) => s.id === activeDragId);
                  if (section) {
                    return (
                      <div className="flex items-center gap-3 p-4 border rounded-lg bg-card shadow-lg ring-2 ring-primary cursor-grabbing">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                        <p className="text-lg font-semibold">{section.title}</p>
                      </div>
                    );
                  }
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
