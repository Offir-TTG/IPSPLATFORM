'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ArrowLeft,
  Plus,
  Save,
  Eye,
  PlusCircle,
  BookOpen,
  GraduationCap,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAdminLanguage } from '@/context/AppContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Course {
  id: string;
  title: string;
  description: string | null;
  program_id: string;
  is_active: boolean;
}

interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order: number;
  is_published: boolean;
  is_optional: boolean;
  duration_minutes: number | null;
  lessons?: Lesson[];
  isExpanded?: boolean;
}

interface Lesson {
  id: string;
  module_id: string | null;
  course_id: string;
  title: string;
  description: string | null;
  order: number;
  duration_minutes: number | null;
  is_published: boolean;
  topics?: Topic[];
}

interface Topic {
  id: string;
  lesson_id: string;
  title: string;
  content_type: 'video' | 'text' | 'pdf' | 'quiz' | 'assignment' | 'link';
  order: number;
  duration_minutes: number;
  is_required: boolean;
}

// Sortable Module Component
function SortableModule({
  module,
  onToggleExpand,
  onAddLesson,
  onEdit,
  onDelete,
  onDeleteLesson
}: {
  module: Module;
  onToggleExpand: () => void;
  onAddLesson: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDeleteLesson: (lessonId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg bg-card ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto"
            onClick={onToggleExpand}
          >
            {module.isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 font-medium">{module.title}</span>
          <div className="flex items-center gap-2">
            {!module.is_published && (
              <Badge variant="outline" className="text-xs">
                Draft
              </Badge>
            )}
            {module.is_optional && (
              <Badge variant="secondary" className="text-xs">
                Optional
              </Badge>
            )}
            {module.duration_minutes && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {module.duration_minutes}m
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onAddLesson}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lesson
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Module
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Module
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {module.isExpanded && (
          <div className="ml-10 mt-3 space-y-2 border-l-2 border-muted pl-4">
            {module.lessons && module.lessons.length > 0 ? (
              module.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="group flex items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{lesson.title}</span>
                      {lesson.description && (
                        <p className="text-xs text-muted-foreground mt-1">{lesson.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {lesson.duration_minutes && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {lesson.duration_minutes}m
                      </div>
                    )}
                    {lesson.is_published && (
                      <Badge variant="outline" className="text-xs">Published</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      onClick={() => {
                        // TODO: Add edit lesson functionality
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={() => onDeleteLesson(lesson.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <GraduationCap className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No lessons yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => onAddLesson()}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add First Lesson
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CourseBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useAdminLanguage();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('structure');

  // Dialog states
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [showBulkModuleDialog, setShowBulkModuleDialog] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  // Form states
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    is_published: true,
    is_optional: false,
    duration_minutes: '',
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    duration_minutes: '',
    is_published: true,
  });

  const [bulkModuleForm, setBulkModuleForm] = useState({
    count: '5',
    titlePattern: 'Module {n}',
    startingOrder: 1,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadCourse();
  }, [params.id]);

  const loadCourse = async () => {
    try {
      setLoading(true);

      // Load course data
      const courseResponse = await fetch(`/api/lms/courses/${params.id}`);
      const courseData = await courseResponse.json();

      if (courseData.success) {
        setCourse(courseData.data);
      } else {
        // Fallback to mock data if API fails
        setCourse({
          id: params.id as string,
          title: 'Course',
          description: 'Course description',
          program_id: '',
          is_active: true,
        });
      }

      // Load modules for this course
      const modulesResponse = await fetch(`/api/lms/modules?course_id=${params.id}&include_lessons=true`);
      const modulesData = await modulesResponse.json();

      if (modulesData.success && modulesData.data) {
        setModules(modulesData.data.map((m: any) => ({ ...m, isExpanded: false })));
      } else {
        setModules([]);
      }
    } catch (error) {
      console.error('Failed to load course:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const activeIndex = modules.findIndex((m) => m.id === active.id);
    const overIndex = modules.findIndex((m) => m.id === over.id);

    if (activeIndex !== -1 && overIndex !== -1) {
      const newModules = arrayMove(modules, activeIndex, overIndex).map(
        (module, index) => ({ ...module, order: index })
      );
      setModules(newModules);

      // Save the new order to the API
      try {
        const response = await fetch('/api/lms/modules', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reorder',
            items: newModules.map(m => ({ id: m.id, order: m.order })),
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast({
            title: t('common.success', 'Success'),
            description: 'Module order updated',
          });
        }
      } catch (error) {
        console.error('Failed to save module order:', error);
        toast({
          title: t('common.warning', 'Warning'),
          description: 'Order updated locally only',
          variant: 'destructive',
        });
      }
    }

    setActiveId(null);
  };

  const toggleModuleExpansion = (moduleId: string) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? { ...module, isExpanded: !module.isExpanded }
          : module
      )
    );
  };

  const handleCreateModule = async () => {
    if (!moduleForm.title.trim()) {
      toast({
        title: t('common.error', 'Error'),
        description: t('lms.builder.title_required', 'Title is required'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      // Save to API
      const response = await fetch('/api/lms/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: params.id,
          title: moduleForm.title,
          description: moduleForm.description || null,
          order: modules.length,
          is_published: moduleForm.is_published,
          is_optional: moduleForm.is_optional,
          duration_minutes: moduleForm.duration_minutes ? parseInt(moduleForm.duration_minutes) : null,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Add the new module from API response
        const newModule = {
          ...result.data,
          lessons: [],
          isExpanded: false,
        };
        setModules([...modules, newModule]);

        toast({
          title: t('common.success', 'Success'),
          description: t('lms.builder.module_created', 'Module created successfully'),
        });
      } else {
        // If API fails, create locally for now
        const newModule: Module = {
          id: `module-${Date.now()}`,
          course_id: params.id as string,
          title: moduleForm.title,
          description: moduleForm.description || null,
          order: modules.length,
          is_published: moduleForm.is_published,
          is_optional: moduleForm.is_optional,
          duration_minutes: moduleForm.duration_minutes ? parseInt(moduleForm.duration_minutes) : null,
          lessons: [],
        };
        setModules([...modules, newModule]);

        toast({
          title: t('common.warning', 'Warning'),
          description: 'Module created locally (save to sync)',
          variant: 'destructive',
        });
      }

      setShowModuleDialog(false);
      setModuleForm({
        title: '',
        description: '',
        is_published: true,
        is_optional: false,
        duration_minutes: '',
      });
    } catch (error) {
      console.error('Failed to create module:', error);

      // Create locally on error
      const newModule: Module = {
        id: `module-${Date.now()}`,
        course_id: params.id as string,
        title: moduleForm.title,
        description: moduleForm.description || null,
        order: modules.length,
        is_published: moduleForm.is_published,
        is_optional: moduleForm.is_optional,
        duration_minutes: moduleForm.duration_minutes ? parseInt(moduleForm.duration_minutes) : null,
        lessons: [],
      };
      setModules([...modules, newModule]);

      setShowModuleDialog(false);
      setModuleForm({
        title: '',
        description: '',
        is_published: true,
        is_optional: false,
        duration_minutes: '',
      });

      toast({
        title: t('common.warning', 'Warning'),
        description: 'Module created locally (save to sync)',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module and all its lessons?')) {
      return;
    }

    try {
      const response = await fetch(`/api/lms/modules/${moduleId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setModules(modules.filter(m => m.id !== moduleId));
        toast({
          title: t('common.success', 'Success'),
          description: 'Module deleted successfully',
        });
      } else {
        toast({
          title: t('common.error', 'Error'),
          description: result.error || 'Failed to delete module',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete module:', error);
      toast({
        title: t('common.error', 'Error'),
        description: 'Failed to delete module',
        variant: 'destructive',
      });
    }
  };

  const handleCreateLesson = async () => {
    if (!lessonForm.title.trim() || !selectedModule) {
      toast({
        title: t('common.error', 'Error'),
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/lms/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: params.id,
          module_id: selectedModule.id,
          title: lessonForm.title,
          description: lessonForm.description || null,
          duration_minutes: lessonForm.duration_minutes ? parseInt(lessonForm.duration_minutes) : null,
          is_published: lessonForm.is_published,
          start_time: new Date().toISOString(), // Required by API
          order: selectedModule.lessons?.length || 0,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Add the new lesson to the module
        setModules(modules.map(m => {
          if (m.id === selectedModule.id) {
            return {
              ...m,
              lessons: [...(m.lessons || []), result.data],
            };
          }
          return m;
        }));

        setShowLessonDialog(false);
        setLessonForm({
          title: '',
          description: '',
          duration_minutes: '',
          is_published: true,
        });

        toast({
          title: t('common.success', 'Success'),
          description: 'Lesson created successfully',
        });
      } else {
        toast({
          title: t('common.error', 'Error'),
          description: result.error || 'Failed to create lesson',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to create lesson:', error);
      toast({
        title: t('common.error', 'Error'),
        description: 'Failed to create lesson',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLesson = async (lessonId: string, moduleId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      const response = await fetch(`/api/lms/lessons?id=${lessonId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setModules(modules.map(m => {
          if (m.id === moduleId) {
            return {
              ...m,
              lessons: m.lessons?.filter(l => l.id !== lessonId) || [],
            };
          }
          return m;
        }));

        toast({
          title: t('common.success', 'Success'),
          description: 'Lesson deleted successfully',
        });
      } else {
        toast({
          title: t('common.error', 'Error'),
          description: result.error || 'Failed to delete lesson',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      toast({
        title: t('common.error', 'Error'),
        description: 'Failed to delete lesson',
        variant: 'destructive',
      });
    }
  };

  const handleBulkCreateModules = async () => {
    const count = parseInt(bulkModuleForm.count);
    if (count < 1 || count > 20) {
      toast({
        title: t('common.error', 'Error'),
        description: t('lms.builder.invalid_count', 'Please enter a number between 1 and 20'),
        variant: 'destructive',
      });
      return;
    }

    const newModules: Module[] = [];
    for (let i = 1; i <= count; i++) {
      newModules.push({
        id: `module-${Date.now()}-${i}`,
        course_id: params.id as string,
        title: bulkModuleForm.titlePattern.replace('{n}', i.toString()),
        description: null,
        order: modules.length + i - 1,
        is_published: false,
        is_optional: false,
        duration_minutes: null,
        lessons: [],
      });
    }

    setModules([...modules, ...newModules]);
    setShowBulkModuleDialog(false);

    toast({
      title: t('common.success', 'Success'),
      description: t('lms.builder.modules_created', `${count} modules created successfully`),
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">
            {t('common.loading', 'Loading...')}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/lms/courses')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('lms.builder.back', 'Back')}
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{course?.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {t('lms.builder.title', 'Course Builder')} - Drag & Drop Canvas
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                {t('lms.builder.preview', 'Preview')}
              </Button>
              <Button size="sm">
                <Save className="mr-2 h-4 w-4" />
                {t('lms.builder.save', 'Save Changes')}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden px-6 py-4">
          <div className="flex gap-6 h-full">
            {/* Module Builder with Drag & Drop */}
            <div className="flex-1">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Course Structure</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowBulkModuleDialog(true)}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Bulk Add Modules
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setShowModuleDialog(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Module
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="overflow-y-auto">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={modules.map((m) => m.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {modules.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">No modules yet</p>
                            <p className="text-sm mb-4">
                              Start building your course by adding modules
                            </p>
                            <Button onClick={() => setShowModuleDialog(true)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Create Your First Module
                            </Button>
                          </div>
                        ) : (
                          modules.map((module) => (
                            <SortableModule
                              key={module.id}
                              module={module}
                              onToggleExpand={() => toggleModuleExpansion(module.id)}
                              onAddLesson={() => {
                                setSelectedModule(module);
                                setShowLessonDialog(true);
                              }}
                              onEdit={() => {
                                // TODO: Add edit module functionality
                                setSelectedModule(module);
                                setModuleForm({
                                  title: module.title,
                                  description: module.description || '',
                                  is_published: module.is_published,
                                  is_optional: module.is_optional,
                                  duration_minutes: module.duration_minutes?.toString() || '',
                                });
                                setShowModuleDialog(true);
                              }}
                              onDelete={() => handleDeleteModule(module.id)}
                              onDeleteLesson={(lessonId) => handleDeleteLesson(lessonId, module.id)}
                            />
                          ))
                        )}
                      </div>
                    </SortableContext>
                    <DragOverlay>
                      {activeId ? (
                        <div className="bg-card border rounded-lg p-3 shadow-lg opacity-90">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            {modules.find((m) => m.id === activeId)?.title}
                          </div>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </CardContent>
              </Card>
            </div>

            {/* Course Stats */}
            <div className="w-80">
              <Card>
                <CardHeader>
                  <CardTitle>Course Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold">{modules.length}</div>
                    <p className="text-sm text-muted-foreground">Total Modules</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Lessons</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {modules.reduce((acc, m) => acc + (m.duration_minutes || 0), 0)} min
                    </div>
                    <p className="text-sm text-muted-foreground">Total Duration</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {modules.filter((m) => m.is_published).length}/{modules.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Published Modules</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Module</DialogTitle>
            <DialogDescription>
              Add a new module to organize your course content
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Module Title</Label>
              <Input
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                placeholder="e.g., Introduction to HTML"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                rows={3}
                placeholder="Brief description of the module..."
              />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={moduleForm.duration_minutes}
                onChange={(e) => setModuleForm({ ...moduleForm, duration_minutes: e.target.value })}
                placeholder="60"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={moduleForm.is_published}
                  onCheckedChange={(checked) =>
                    setModuleForm({ ...moduleForm, is_published: checked })
                  }
                />
                <Label>Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={moduleForm.is_optional}
                  onCheckedChange={(checked) =>
                    setModuleForm({ ...moduleForm, is_optional: checked })
                  }
                />
                <Label>Optional</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModuleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateModule}>
              Create Module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lesson to {selectedModule?.title}</DialogTitle>
            <DialogDescription>
              Create a new lesson within this module
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Lesson Title</Label>
              <Input
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                placeholder="e.g., Introduction to Variables"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={lessonForm.description}
                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                rows={3}
                placeholder="What will students learn in this lesson?"
              />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={lessonForm.duration_minutes}
                onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })}
                placeholder="15"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={lessonForm.is_published}
                onCheckedChange={(checked) =>
                  setLessonForm({ ...lessonForm, is_published: checked })
                }
              />
              <Label>Publish immediately</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLessonDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLesson}>
              Add Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Module Dialog */}
      <Dialog open={showBulkModuleDialog} onOpenChange={setShowBulkModuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Create Modules</DialogTitle>
            <DialogDescription>
              Create multiple modules at once to quickly structure your course
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Number of Modules</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={bulkModuleForm.count}
                onChange={(e) => setBulkModuleForm({ ...bulkModuleForm, count: e.target.value })}
              />
            </div>
            <div>
              <Label>Title Pattern</Label>
              <Input
                value={bulkModuleForm.titlePattern}
                onChange={(e) =>
                  setBulkModuleForm({ ...bulkModuleForm, titlePattern: e.target.value })
                }
                placeholder="Module {n}"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Use {'{n}'} for the module number
              </p>
            </div>
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <div className="text-sm space-y-1">
                {Array.from({ length: Math.min(3, parseInt(bulkModuleForm.count) || 0) }).map(
                  (_, i) => (
                    <div key={i}>
                      • {bulkModuleForm.titlePattern.replace('{n}', (i + 1).toString())}
                    </div>
                  )
                )}
                {parseInt(bulkModuleForm.count) > 3 && (
                  <div className="text-muted-foreground">...</div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkModuleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkCreateModules}>
              Create {bulkModuleForm.count} Modules
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}