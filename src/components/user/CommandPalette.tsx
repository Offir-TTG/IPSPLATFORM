'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Home,
  MessageCircle,
  GraduationCap,
  Video,
  Calendar,
  Bell,
  User,
  CalendarCheck,
  CreditCard,
  Search,
} from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NavItem {
  id: string;
  title: string;
  path: string;
  icon: any;
  group: 'navigation' | 'profile';
}

interface Enrollment {
  id: string;
  courseId: string | null;
  programId: string | null;
  title: string;
  type: 'course' | 'program';
}

type SearchItem = (NavItem | Enrollment) & { searchType: 'nav' | 'enrollment' };

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { t } = useUserLanguage();
  const [search, setSearch] = useState('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define navigation items
  const navItems: NavItem[] = useMemo(() => [
    { id: 'dashboard', title: t('user.commandPalette.dashboard', 'Dashboard'), path: '/dashboard', icon: Home, group: 'navigation' },
    { id: 'programs', title: t('user.commandPalette.myPrograms', 'My Programs'), path: '/programs', icon: GraduationCap, group: 'navigation' },
    { id: 'courses', title: t('user.commandPalette.myCourses', 'My Courses'), path: '/courses', icon: Video, group: 'navigation' },
    { id: 'calendar', title: t('user.commandPalette.calendar', 'Calendar'), path: '/calendar', icon: Calendar, group: 'navigation' },
    { id: 'notifications', title: t('user.commandPalette.notifications', 'Notifications'), path: '/notifications', icon: Bell, group: 'navigation' },
    { id: 'attendance', title: t('user.commandPalette.attendance', 'Attendance'), path: '/attendance', icon: CalendarCheck, group: 'navigation' },
    { id: 'payments', title: t('user.commandPalette.payments', 'Payments'), path: '/payments', icon: CreditCard, group: 'navigation' },
    { id: 'profile', title: t('user.commandPalette.profile', 'Profile'), path: '/profile', icon: User, group: 'profile' },
  ], [t]);

  // Combine all searchable items
  const allItems: SearchItem[] = useMemo(() => [
    ...navItems.map(item => ({ ...item, searchType: 'nav' as const })),
    ...enrollments.map(item => ({ ...item, searchType: 'enrollment' as const }))
  ], [navItems, enrollments]);

  // Fuse.js search
  const fuse = useMemo(() => new Fuse(allItems, {
    keys: ['title'],
    threshold: 0.3,
    ignoreLocation: true,
  }), [allItems]);

  // Filtered results with deduplication
  const filteredItems = useMemo(() => {
    const items = !search.trim()
      ? allItems
      : fuse.search(search).map(result => result.item);

    // Remove duplicates by id
    const seen = new Set<string>();
    return items.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [search, fuse, allItems]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // Fetch enrollments
  useEffect(() => {
    async function fetchEnrollments() {
      if (!open) return;

      setLoading(true);
      try {
        const [coursesRes, programsRes] = await Promise.all([
          fetch('/api/user/courses'),
          fetch('/api/user/programs')
        ]);

        const coursesData = await coursesRes.json();
        const programsData = await programsRes.json();

        const enrollmentsList: Enrollment[] = [];

        if (coursesData.success && coursesData.data) {
          coursesData.data.forEach((course: any) => {
            enrollmentsList.push({
              id: course.id || course.course_id,
              courseId: course.course_id || course.id,
              programId: null,
              title: course.course_name || course.title,
              type: 'course'
            });
          });
        }

        if (programsData.success && programsData.data) {
          programsData.data.forEach((program: any) => {
            enrollmentsList.push({
              id: program.id || program.program_id,
              courseId: null,
              programId: program.program_id || program.id,
              title: program.name || program.title,
              type: 'program'
            });
          });
        }

        setEnrollments(enrollmentsList);
      } catch (error) {
        console.error('Error fetching enrollments:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEnrollments();
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filteredItems[selectedIndex];
        if (item) handleSelect(item);
      } else if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredItems, selectedIndex]);

  const handleSelect = (item: SearchItem) => {
    onOpenChange(false);
    setSearch('');

    if (item.searchType === 'nav') {
      const navItem = item as NavItem;
      router.push(navItem.path);
    } else {
      const enrollment = item as Enrollment;
      if (enrollment.type === 'course' && enrollment.courseId) {
        router.push(`/courses/${enrollment.courseId}`);
      } else if (enrollment.type === 'program') {
        router.push('/programs');
      }
    }
  };

  const getIcon = (item: SearchItem) => {
    if (item.searchType === 'nav') {
      return (item as NavItem).icon;
    }
    return (item as Enrollment).type === 'program' ? GraduationCap : Video;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) setSearch('');
    }}>
      <DialogContent className="overflow-hidden p-0 max-w-2xl">
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="flex items-center border-b px-3">
            <Search className="ltr:mr-2 rtl:ml-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('user.commandPalette.placeholder', 'Type a command or search...')}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {filteredItems.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {t('user.commandPalette.noResults', 'No results found.')}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredItems.map((item, index) => {
                  const Icon = getIcon(item);
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer transition-colors text-start",
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
