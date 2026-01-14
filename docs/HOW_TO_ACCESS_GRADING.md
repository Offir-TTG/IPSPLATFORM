# How to Access the Grading System

## Quick Access Guide

### Option 1: From Course Page (RECOMMENDED)
1. **Navigate to any course**:
   - Go to `/admin/lms/courses`
   - Click on any course

2. **Click the "Grading" button**:
   - Look for the "Grading" button in the header (next to Preview and Publish)
   - Icon: Award/Trophy 🏆
   - This takes you directly to Grade Categories for that course

### Option 2: Direct URL
- **Grade Categories**: `/admin/lms/courses/[courseId]/grading/categories`
- **Grading Scales**: `/admin/grading/scales`

Replace `[courseId]` with your actual course ID.

## Navigation Flow

```
Course List (/admin/lms/courses)
    ↓
Click on a Course
    ↓
Course Builder Page
    ↓
Click "Grading" Button (in header)
    ↓
Grade Categories Page ✨
```

## What You Can Do Now

### 1. Set Up Grading Scales (Global)
**URL**: `/admin/grading/scales`

Create reusable grading scales like:
- **Standard A-F Letter Grades**
  - A: 90-100%
  - B: 80-89%
  - C: 70-79%
  - D: 60-69%
  - F: 0-59%

- **Pass/Fail**
  - Pass: 60-100%
  - Fail: 0-59%

- **Numeric**
  - 90-100
  - 80-89
  - etc.

### 2. Set Up Grade Categories (Per Course)
**URL**: `/admin/lms/courses/[courseId]/grading/categories`

**From Course Page**:
1. Open any course
2. Click the **"Grading"** button in the header
3. You'll see the Grade Categories page

**Create weighted categories**:
- **Homework**: 20% (drop 2 lowest)
- **Quizzes**: 15% (drop 1 lowest)
- **Midterm Exam**: 25%
- **Final Exam**: 40%

**Total must equal 100%**

## Visual Guide

### Course Header - Where to Find the Button

```
┌─────────────────────────────────────────────────────────┐
│ ← Back    Course Title [Published]                      │
│                                                          │
│           [Grading] [Preview] [Publish]  ← Click here!  │
└─────────────────────────────────────────────────────────┘
```

### Grade Categories Page

```
┌─────────────────────────────────────────────────────────┐
│ ← Back    Grade Categories                              │
│                                           [Add Category] │
├─────────────────────────────────────────────────────────┤
│ Total Weight: 100% ✓                                    │
├─────────────────────────────────────────────────────────┤
│ ▌ Homework             20%    Drop 2 lowest [Edit] [X]  │
│ ▌ Quizzes              15%    Drop 1 lowest [Edit] [X]  │
│ ▌ Midterm Exam         25%                 [Edit] [X]  │
│ ▌ Final Exam           40%                 [Edit] [X]  │
└─────────────────────────────────────────────────────────┘
```

## Features Available Now

### ✅ Grading Scales
- [x] Create/Edit/Delete scales
- [x] Define grade ranges with colors
- [x] Set GPA values
- [x] Mark passing grades
- [x] Set default scale

### ✅ Grade Categories
- [x] Create/Edit/Delete categories
- [x] Set weight (percentage)
- [x] Weight validation (total ≤ 100%)
- [x] Drop lowest scores
- [x] Color coding
- [x] Display order

### 🚧 Coming Soon
- [ ] Grade Items (assignments, quizzes)
- [ ] Gradebook (grade students)
- [ ] Student view
- [ ] Reports & analytics

## Keyboard Shortcuts & Tips

### Quick Navigation
- From any course → Click "Grading" button
- From grading categories → Click "← Back" to return to course

### Best Practices
1. **Start with Grading Scales**:
   - Create 1-2 standard scales first
   - Use across multiple courses

2. **Set Up Categories Early**:
   - Before creating assignments
   - Plan your weight distribution
   - Example: Skills (50%), Projects (30%), Participation (20%)

3. **Use Drop Lowest**:
   - Homework category: drop 1-2 lowest
   - Gives students flexibility
   - Accounts for missed assignments

4. **Keep Total at 100%**:
   - System validates this automatically
   - Red warning if you exceed 100%

## Example Workflow

### Scenario: Setting up a new course

**Step 1**: Create/Select Grading Scale
```
1. Go to /admin/grading/scales
2. Either use existing or create new
3. Example: "Standard A-F"
```

**Step 2**: Open Your Course
```
1. Go to /admin/lms/courses
2. Click on your course
```

**Step 3**: Click "Grading" Button
```
1. In course header, click "Grading"
2. Opens Grade Categories page
```

**Step 4**: Add Categories
```
1. Click "Add Category"
2. Name: "Homework"
3. Weight: 20%
4. Drop lowest: 2
5. Color: Blue
6. Click "Create"

Repeat for:
- Quizzes (15%)
- Midterm (25%)
- Final (40%)
```

**Step 5**: Verify Total
```
Check: Total Weight = 100% ✓
```

Done! Your course is ready for grading.

## Troubleshooting

### "I don't see the Grading button"
- Make sure you're on a course detail page (not the course list)
- Look in the header next to "Preview" and "Publish"
- If still missing, refresh the page

### "Total weight exceeds 100%"
- Edit categories and reduce weights
- System shows warning and new total as you edit

### "Can't delete a category"
- Category might have grade items assigned
- Delete or reassign grade items first
- (This feature coming in next phase)

## What's Next?

After setting up categories, you'll be able to:
1. **Create Grade Items** - Individual assignments within categories
2. **Grade Students** - Enter scores in a gradebook
3. **View Reports** - See grade distributions and statistics

The foundation is complete - grading scales and categories are working!

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify you're logged in as admin
3. Ensure course exists in database
4. Check that SQL migrations ran successfully

---

**Quick Links**:
- [GRADING_SYSTEM_PROGRESS.md](GRADING_SYSTEM_PROGRESS.md) - Full system documentation
- [GRADING_SYSTEM_IMPLEMENTATION_PLAN.md](GRADING_SYSTEM_IMPLEMENTATION_PLAN.md) - Development roadmap
- [GRADING_SYSTEM_UI_GUIDE.md](GRADING_SYSTEM_UI_GUIDE.md) - Original grading scales guide
