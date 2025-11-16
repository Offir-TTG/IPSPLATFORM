# LMS System - Complete Implementation Plan

## Overview

This document outlines the complete implementation plan for the IPS Platform Learning Management System (LMS). The LMS supports a hierarchical content structure with drag-and-drop canvas interface, bulk operations, Zoom integration, and full theme/audit support.

## System Architecture

### Content Hierarchy

```
Program
└── Course 1
    └── Module 1
        └── Lesson 1
            └── Topic 1 (Video)
            └── Topic 2 (Text)
            └── Topic 3 (Quiz)
        └── Lesson 2
    └── Module 2
└── Course 2
```

### User Roles

1. **Admin/Instructor** - Unified interface with full content authoring capabilities
2. **Student** - Learning interface with progress tracking

## Implementation Status

### ✅ Phase 1: Database Schema (COMPLETED)

**File**: [`src/lib/supabase/lms-schema.sql`](../src/lib/supabase/lms-schema.sql)

#### New Tables Created

| Table | Description | Key Features |
|-------|-------------|--------------|
| `modules` | Course organization layer | Drag-and-drop ordering, published status |
| `lesson_topics` | Granular content blocks | Multiple content types (video, text, quiz, etc.) |
| `user_progress` | Student progress tracking | Topic-level completion, time tracking |
| `assignments` | Assessment system | Quizzes, essays, projects, file uploads |
| `assignment_submissions` | Student submissions | Auto-grading, rubric-based grading |
| `certificates` | Achievement tracking | Auto-issuance on completion |
| `lesson_attendance` | Live session tracking | Zoom integration |
| `discussions` | Course forums | Threaded discussions, likes |
| `discussion_likes` | Discussion engagement | User likes tracking |
| `announcements` | Course notifications | Priority levels, expiration |

#### Existing Tables Modified

- `lessons` table:
  - Added `module_id` - Links lesson to module
  - Added `content_blocks` - JSONB for drag-and-drop canvas
  - Added `is_published` - Published status

#### Database Functions

1. **`calculate_course_progress(user_id, course_id)`**
   - Calculates percentage completion
   - Considers only required topics
   - Returns 0-100 integer

2. **`calculate_module_progress(user_id, module_id)`**
   - Module-level progress tracking
   - Same logic as course progress

3. **`auto_issue_certificate()`**
   - Trigger function on topic completion
   - Auto-generates certificate at 100% completion
   - Creates unique certificate number

#### Row Level Security (RLS)

All tables have comprehensive RLS policies:
- Tenant isolation enforced
- Admin/Instructor full access within tenant
- Student access limited to enrolled content
- Personal data (progress, submissions) protected

### ✅ Phase 2: Dependencies (COMPLETED)

#### Packages Installed

```json
{
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "@radix-ui/react-accordion": "^1.1.2",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-dropdown-menu": "^2.0.6",
  "@radix-ui/react-tabs": "^1.0.4",
  "@radix-ui/react-select": "^2.0.0",
  "@radix-ui/react-toast": "^1.1.5",
  "react-player": "^2.14.1"
}
```

### 🔄 Phase 3: UI Component Library (IN PROGRESS)

#### shadcn/ui Components Needed

Located at `src/components/ui/`:

1. **card.tsx** - Content containers
2. **dialog.tsx** - Modals and overlays
3. **dropdown-menu.tsx** - Dropdown menus
4. **tabs.tsx** - Tabbed interfaces
5. **accordion.tsx** - Collapsible sections
6. **select.tsx** - Dropdown selects
7. **toast.tsx** - Notifications
8. **input.tsx** - Form inputs
9. **textarea.tsx** - Text areas
10. **checkbox.tsx** - Checkboxes
11. **table.tsx** - Data tables with sorting

#### LMS-Specific Components

Located at `src/components/lms/`:

1. **DraggableList.tsx** - Reusable sortable list with @dnd-kit
2. **ContentCanvas.tsx** - Visual drag-and-drop content builder
3. **BulkItemCreator.tsx** - Bulk creation modal (add 10 lessons at once)
4. **CourseHierarchyTree.tsx** - Collapsible course structure tree
5. **ModuleCard.tsx** - Module display card with actions
6. **LessonCard.tsx** - Lesson display card
7. **TopicBuilder.tsx** - Topic creation interface
8. **VideoPlayer.tsx** - Video playback with progress tracking
9. **RichContentEditor.tsx** - TipTap wrapper
10. **ProgressIndicator.tsx** - Visual progress display
11. **AssignmentGrader.tsx** - Grading interface
12. **QuizBuilder.tsx** - Quiz creation tool
13. **CertificateTemplate.tsx** - Certificate display
14. **ZoomMeetingCard.tsx** - Zoom meeting info card

### 📋 Phase 4: TypeScript Types (PENDING)

#### File: `src/types/lms.ts`

Key interfaces to create:

```typescript
export interface Module {
  id: string;
  tenant_id: string;
  course_id: string;
  title: string;
  description: string | null;
  order: number;
  is_published: boolean;
  is_optional: boolean;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
  lessons?: Lesson[];
}

export interface LessonTopic {
  id: string;
  tenant_id: string;
  lesson_id: string;
  title: string;
  content_type: TopicContentType;
  content: Record<string, any>;
  order: number;
  duration_minutes: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  tenant_id: string;
  user_id: string;
  lesson_id: string | null;
  topic_id: string | null;
  enrollment_id: string;
  status: ProgressStatus;
  progress_percentage: number;
  time_spent_seconds: number;
  started_at: string | null;
  completed_at: string | null;
  last_accessed_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Additional interfaces for:
// - Assignment
// - AssignmentSubmission
// - Certificate
// - LessonAttendance
// - Discussion
// - Announcement
```

### 📋 Phase 5: Service Layer (PENDING)

#### Location: `src/lib/lms/`

Service files to create:

1. **courseService.ts** - Course CRUD operations
2. **moduleService.ts** - Module operations + bulk create
3. **lessonService.ts** - Lesson operations + bulk create
4. **topicService.ts** - Topic operations
5. **progressService.ts** - Progress tracking
6. **assignmentService.ts** - Assignment and grading
7. **zoomService.ts** - Zoom integration
8. **certificateService.ts** - Certificate generation

### 📋 Phase 6: API Routes (PENDING)

#### Admin/Instructor APIs

**Programs** - `src/app/api/lms/programs/`
- `POST /api/lms/programs` - Create program
- `GET /api/lms/programs` - List programs
- `GET /api/lms/programs/[id]` - Get program
- `PATCH /api/lms/programs/[id]` - Update program
- `DELETE /api/lms/programs/[id]` - Delete program

**Courses** - `src/app/api/lms/courses/`
- `POST /api/lms/courses` - Create course
- `POST /api/lms/courses/bulk` - Bulk create courses
- `GET /api/lms/courses` - List courses
- `GET /api/lms/courses/[id]` - Get course with hierarchy
- `PATCH /api/lms/courses/[id]` - Update course
- `DELETE /api/lms/courses/[id]` - Delete course
- `POST /api/lms/courses/[id]/duplicate` - Duplicate course
- `POST /api/lms/courses/[id]/publish` - Publish course

**Modules** - `src/app/api/lms/modules/`
- `POST /api/lms/modules` - Create module
- `POST /api/lms/modules/bulk` - **Bulk create modules (10 at once)**
- `GET /api/lms/modules/[id]` - Get module
- `PATCH /api/lms/modules/[id]` - Update module
- `DELETE /api/lms/modules/[id]` - Delete module
- `POST /api/lms/modules/reorder` - Reorder modules

**Lessons** - `src/app/api/lms/lessons/`
- `POST /api/lms/lessons` - Create lesson
- `POST /api/lms/lessons/bulk` - **Bulk create lessons (10 at once)**
- `GET /api/lms/lessons/[id]` - Get lesson with topics
- `PATCH /api/lms/lessons/[id]` - Update lesson
- `DELETE /api/lms/lessons/[id]` - Delete lesson
- `POST /api/lms/lessons/reorder` - Reorder lessons
- `POST /api/lms/lessons/[id]/duplicate` - Duplicate lesson

**Topics** - `src/app/api/lms/topics/`
- `POST /api/lms/topics` - Create topic
- `POST /api/lms/topics/bulk` - Bulk create topics
- `GET /api/lms/topics/[id]` - Get topic
- `PATCH /api/lms/topics/[id]` - Update topic
- `DELETE /api/lms/topics/[id]` - Delete topic
- `POST /api/lms/topics/reorder` - Reorder topics

#### Student APIs

**Enrollment** - `src/app/api/student/`
- `POST /api/student/enroll` - Enroll in course
- `GET /api/student/enrollments` - My enrollments
- `DELETE /api/student/enrollments/[id]` - Unenroll

**Learning** - `src/app/api/student/`
- `GET /api/student/courses` - Available courses
- `GET /api/student/courses/[id]` - Course content
- `POST /api/student/progress` - Update progress
- `GET /api/student/progress` - My progress

**Assignments** - `src/app/api/student/`
- `GET /api/student/assignments` - My assignments
- `POST /api/student/assignments/[id]/submit` - Submit assignment
- `GET /api/student/submissions` - My submissions

#### Zoom Integration APIs

**Zoom** - `src/app/api/zoom/`
- `POST /api/zoom/meetings` - Create Zoom meeting
- `GET /api/zoom/meetings/[id]` - Get meeting details
- `PATCH /api/zoom/meetings/[id]` - Update meeting
- `DELETE /api/zoom/meetings/[id]` - Delete meeting
- `GET /api/zoom/recordings/[id]` - Get recording
- `POST /api/zoom/recordings/[id]/download` - Download to storage

### 📋 Phase 7: Admin/Instructor Interface (PENDING)

#### Program Management

**`/admin/lms/programs/page.tsx`** - Program list
- Table view with search/filter
- Create, edit, delete actions
- View courses in program

**`/admin/lms/programs/create/page.tsx`** - Create program
- Form with validation
- Pricing configuration
- DocuSign template selection

**`/admin/lms/programs/[id]/page.tsx`** - Edit program
- Update program details
- View associated courses

#### Course Builder

**`/admin/lms/courses/page.tsx`** - Course list
- Grid/List view toggle
- Filter by program, instructor, status
- Bulk actions (publish, archive)

**`/admin/lms/courses/create/page.tsx`** - Create course wizard
- Step 1: Basic info
- Step 2: Settings
- Step 3: Initial module setup

**`/admin/lms/courses/[id]/page.tsx`** - **Main course builder**

Layout:
- **Left sidebar**: Module/Lesson tree (drag-and-drop)
- **Center**: Content editor
- **Right sidebar**: Settings, preview

Features:
1. Drag-and-drop module organization
2. Bulk operations ("Add 10 Modules", "Add 10 Lessons")
3. Module management (inline edit, publish, reorder)
4. Lesson management (edit, add topics, Zoom, materials)
5. Publish/Preview

#### Lesson Editor

**`/admin/lms/lessons/[id]/page.tsx`** - Lesson editor

Canvas-style interface:
- Drag-and-drop topic blocks
- Topic types: video, text, PDF, quiz, assignment, embed, link
- Bulk topic creation
- Zoom integration
- Materials management
- Preview mode

#### Additional Pages

- `/admin/lms/library/page.tsx` - Content library (templates, media)
- `/admin/lms/students/page.tsx` - Student roster
- `/admin/lms/students/[id]/page.tsx` - Student detail
- `/admin/lms/grading/page.tsx` - Grading dashboard
- `/admin/lms/grading/[submissionId]/page.tsx` - Grade submission

### 📋 Phase 8: Student Interface (PENDING)

#### Course Catalog

**`/student/catalog/page.tsx`** - Browse courses
- Grid view with thumbnails
- Search and filters
- Enroll button

#### My Courses

**`/student/courses/page.tsx`** - My enrolled courses
- Active/Completed courses
- Progress indicators
- Continue learning button

#### Course Player

**`/student/courses/[id]/page.tsx`** - Course overview
- Course description
- Module list with progress
- Announcements

**`/student/courses/[id]/learn/page.tsx`** - **Learning interface**

Layout:
- **Left sidebar**: Module/Lesson navigator
- **Center**: Content player (video, text, quiz, etc.)
- **Right sidebar**: Notes, resources

Features:
1. Content rendering (video, text, PDF, quiz, assignment)
2. Navigation (Next/Previous, Jump to topic)
3. Progress tracking (auto-save, mark complete)
4. Interactive elements (quizzes, assignments, Zoom)
5. Personal notes

#### Additional Pages

- `/student/assignments/page.tsx` - My assignments
- `/student/assignments/[id]/page.tsx` - Take assignment
- `/student/progress/page.tsx` - Learning progress dashboard
- `/student/certificates/page.tsx` - My certificates

### 📋 Phase 9: Drag-and-Drop Implementation (PENDING)

#### Using @dnd-kit

**Draggable items:**
1. Modules within course (vertical reorder)
2. Lessons between modules (cross-container)
3. Topics within lesson (vertical reorder)

**Implementation pattern:**
```typescript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function CourseBuilder() {
  const handleDragEnd = (event: DragEndEvent) => {
    // Update order in database
    // Update local state
  };

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <SortableContext items={modules} strategy={verticalListSortingStrategy}>
        {modules.map(module => (
          <DraggableModule key={module.id} module={module} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

**Smart features:**
- Auto-save on drag
- Visual feedback (drag handles, drop zones)
- RTL support (Hebrew interface)

### 📋 Phase 10: Zoom Integration (PENDING)

#### Automatic Meeting Creation

1. Lesson created with start_time → Auto-create Zoom meeting
2. Store meeting_id, join_url, start_url in lessons table
3. Send meeting details to instructor
4. Display in lesson editor

#### Student Join Flow

1. Student navigates to lesson at scheduled time
2. "Join Live Class" button appears
3. Click → Open Zoom meeting
4. Track attendance via Zoom API

#### Recording Management

1. Cron job checks for completed meetings
2. Fetch recordings from Zoom API
3. Download to Supabase Storage
4. Save URL to recordings table
5. Display in lesson player

### 📋 Phase 11: Bulk Operations (PENDING)

#### Bulk Module Creation

Modal interface:
- Input: Number of modules (e.g., 10)
- Naming pattern: "Module {n}" or custom
- Auto-increment order
- Preview before create
- Submit → Create all in transaction

#### Bulk Lesson Creation

Smart features:
- Input: Number of lessons
- Naming: "Lesson {n}: {topic}"
- Duration: Same for all or incremental
- Zoom: Auto-create meetings with intervals
- Module assignment

#### Bulk Topic Creation

Use case: Add 5 video topics to lesson
- Upload multiple videos
- Auto-generate topics
- Set duration from metadata

### 📋 Phase 12: Theme & Internationalization (PENDING)

#### LMS Translations

Add to `translations` table with context='lms':

```sql
INSERT INTO translations (key, language_code, value, context) VALUES
  ('lms.programs.title', 'en', 'Programs', 'lms'),
  ('lms.programs.title', 'he', 'תוכניות', 'lms'),
  ('lms.courses.create', 'en', 'Create Course', 'lms'),
  ('lms.courses.create', 'he', 'צור קורס', 'lms'),
  -- ... (add all LMS UI text)
;
```

#### Theme Support

Use existing CSS variable system:
```tsx
<div style={{
  backgroundColor: 'hsl(var(--card))',
  color: 'hsl(var(--card-foreground))'
}}>
```

#### RTL Testing

- Test drag-and-drop in RTL mode
- Ensure proper alignment
- Icon flipping for directional indicators

## File Structure

```
src/
├── app/
│   ├── admin/lms/
│   │   ├── programs/
│   │   │   ├── page.tsx
│   │   │   ├── create/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── courses/
│   │   │   ├── page.tsx
│   │   │   ├── create/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx (MAIN BUILDER)
│   │   │       └── settings/page.tsx
│   │   ├── lessons/[id]/page.tsx
│   │   ├── library/page.tsx
│   │   ├── students/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── grading/
│   │       ├── page.tsx
│   │       └── [submissionId]/page.tsx
│   ├── student/
│   │   ├── catalog/page.tsx
│   │   ├── courses/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── learn/page.tsx (PLAYER)
│   │   ├── assignments/
│   │   ├── progress/page.tsx
│   │   └── certificates/page.tsx
│   └── api/lms/
│       ├── programs/
│       ├── courses/
│       ├── modules/
│       ├── lessons/
│       ├── topics/
│       ├── assignments/
│       ├── student/
│       └── zoom/
├── components/
│   ├── ui/ (shadcn components)
│   └── lms/ (LMS-specific components)
├── lib/
│   ├── lms/ (service layer)
│   └── supabase/
│       └── lms-schema.sql
└── types/
    └── lms.ts
```

## Implementation Timeline

### Week 1 (Days 1-5)
- ✅ **Day 1-2:** Database schema, RLS policies, functions
- ✅ **Day 2:** Install dependencies
- 🔄 **Day 2-3:** Create UI components
- **Day 3:** TypeScript types, service layer
- **Day 4-5:** Core API routes

### Week 2 (Days 6-10)
- **Day 6:** Complete API routes
- **Day 7-8:** Admin program/course management
- **Day 9-10:** Course builder with drag-and-drop
- **Day 10:** Lesson editor

### Week 3 (Days 11-15)
- **Day 11:** Bulk operations
- **Day 12:** Student catalog and player
- **Day 12-13:** Zoom integration
- **Day 13:** Grading, certificates
- **Day 14-15:** Testing, bug fixes, polish

## Key Features

### ✅ Hierarchical Content Structure
- Programs → Courses → Modules → Lessons → Topics
- Flexible organization

### ⏳ Drag-and-Drop Canvas (Pending)
- Visual course builder
- Reorder modules, lessons, topics
- Auto-save on drop

### ⏳ Smart Bulk Operations (Pending)
- "Add 10 Lessons" in one click
- Template-based creation
- Preview before creating

### ⏳ Zoom Integration (Pending)
- Auto-create meetings
- Join URLs for students
- Recording auto-fetch and storage

### ⏳ Progress Tracking (Pending)
- Real-time progress calculation
- Topic-level completion
- Auto-certificate issuance

### ✅ Multi-tenancy Support
- Complete tenant isolation
- RLS enforcement

### ✅ Audit Trail Integration
- All LMS actions logged
- FERPA/COPPA compliant

### ⏳ Theme & Internationalization (Pending)
- Dynamic theming
- Multi-language support (EN, HE, ES)
- RTL support

## Next Steps

1. ✅ Create database schema file
2. ✅ Install npm packages
3. 🔄 Create implementation plan documentation
4. ⏳ Create shadcn/ui components
5. ⏳ Create LMS-specific components
6. ⏳ Create TypeScript types
7. ⏳ Create service layer
8. ⏳ Build API routes
9. ⏳ Build admin interface
10. ⏳ Build student interface

## Running the Schema

To apply the LMS schema to your Supabase database:

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `src/lib/supabase/lms-schema.sql`
3. Paste and execute
4. Verify all tables created successfully
5. Check RLS policies are active

## Success Criteria

- [ ] Admin can create Program with 10 courses in bulk
- [ ] Admin can create Course with 20 modules + 100 lessons using bulk operations
- [ ] Drag-and-drop to reorder entire course structure
- [ ] Zoom meetings auto-created for all scheduled lessons
- [ ] Student can enroll, complete course, earn certificate
- [ ] All actions logged in audit trail
- [ ] Works in Hebrew (RTL) and English (LTR)
- [ ] Theme-compliant UI throughout
- [ ] Multi-tenant isolation verified

## Support

For questions or issues, contact the development team or refer to:
- Supabase Documentation: https://supabase.com/docs
- Next.js Documentation: https://nextjs.org/docs
- @dnd-kit Documentation: https://docs.dndkit.com

---

**Document Version:** 1.0
**Last Updated:** 2025-01-13
**Status:** Implementation in Progress
