'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
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
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => onEditName(section.id, e.target.value)}
                  className="px-2 py-1 border rounded text-lg font-semibold flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSaveEdit();
                    if (e.key === 'Escape') onCancelEdit();
                  }}
                />
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
}: {
  item: NavItem;
  sectionId: string;
  onToggleVisibility: (sectionId: string, itemId: string) => void;
  onEditName: (itemId: string, currentName: string) => void;
  editingItemId: string | null;
  editingName: string;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
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
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={editingName}
              onChange={(e) => onEditName(item.id, e.target.value)}
              className="px-2 py-1 border rounded font-medium flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
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
  const { t, language, clearTranslationCache } = useAdminLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<NavSection[]>([]);

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
        // Map loaded sections back to local state format with translations
        const loadedSections = data.data.sections.map((section: any) => ({
          id: section.id,
          title: t(section.translation_key, section.translation_key),
          translation_key: section.translation_key,
          visible: section.visible,
          order: section.order,
          items: section.items.map((item: any) => ({
            id: item.id,
            label: t(item.translation_key, item.translation_key),
            translation_key: item.translation_key,
            href: item.href,
            icon: item.icon,
            visible: item.visible,
            order: item.order
          }))
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

    try {
      // Update translation in database
      const response = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translation_key: editingTranslationKey,
          translation_value: editingName,
          language_code: language, // Update current admin language translation
          category: editingTranslationKey.split('.')[0],
          context: 'admin',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update translation');
      }

      // Clear translation cache to force reload of fresh translations
      clearTranslationCache();

      // Wait a bit for the cache to clear and reload
      await new Promise(resolve => setTimeout(resolve, 100));

      // Reload navigation config to get fresh translations
      await fetchNavigationConfig();

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

      // Collect all updates (sections + items) in the format API expects
      const updates: Array<{ id: string; is_active: boolean; order: number }> = [];

      // Add section updates
      sections.forEach(section => {
        updates.push({
          id: section.id,
          is_active: section.visible,
          order: section.order
        });

        // Add item updates
        section.items.forEach(item => {
          updates.push({
            id: item.id,
            is_active: item.visible,
            order: item.order
          });
        });
      });

      console.log('[Navigation Page] Sending', updates.length, 'updates');

      const response = await fetch('/api/admin/navigation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
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
      <div className="max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" suppressHydrationWarning>
              {t('navigation.title', 'Navigation Configuration')}
            </h1>
            <p className="text-muted-foreground mt-1" suppressHydrationWarning>
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

        {/* Navigation Sections */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSectionDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {sections.map((section, sectionIndex) => (
                <SortableSection
                  key={section.id}
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
                >
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleItemDragEnd(event, section.id)}
                  >
                    <SortableContext
                      items={section.items.map((i) => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {section.items.map((item) => (
                          <SortableItem
                            key={item.id}
                            item={item}
                            sectionId={section.id}
                            onToggleVisibility={toggleItemVisibility}
                            onEditName={handleEditItemName}
                            editingItemId={editingItemId}
                            editingName={editingName}
                            onSaveEdit={handleSaveEdit}
                            onCancelEdit={handleCancelEdit}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </SortableSection>
              ))}
            </div>
          </SortableContext>
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
