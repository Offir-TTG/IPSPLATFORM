# Grading System UI - User Guide

## Overview

The grading system is now fully functional with a complete UI! You can manage grading scales and grade ranges entirely through the admin interface.

## ✅ What's Working

### 1. Grading Scales Management (`/admin/grading/scales`)

**Features:**
- ✅ **View all grading scales** - See all your scales in a list with status badges
- ✅ **Create new scales** - Click "Create Scale" button to add a new grading scale
- ✅ **Edit scales** - Click the Edit button on any scale to modify its details
- ✅ **Set default scale** - Mark one scale as default for new courses
- ✅ **Activate/deactivate scales** - Toggle scale status
- ✅ **Navigate to grade ranges** - Click on any scale card to manage its grade ranges
- ✅ **RTL support** - Full Hebrew/RTL language support
- ✅ **Hover effects** - Cards highlight on hover with smooth transitions

**Scale Properties:**
- **Name** - Descriptive name (e.g., "Standard Letter Grade (A-F)")
- **Description** - Optional description
- **Type** - Letter, Numeric, Pass/Fail, or Custom
- **Default** - Mark as default scale for new courses
- **Active** - Enable or disable the scale

### 2. Grade Ranges Management (`/admin/grading/scales/[id]`)

**Features:**
- ✅ **View scale details** - See scale info and all its grade ranges
- ✅ **Add grade ranges** - Click "Add Grade Range" to create new ranges
- ✅ **Edit grade ranges** - Modify existing ranges
- ✅ **Delete grade ranges** - Remove ranges you don't need
- ✅ **Visual grade display** - Colored cards showing each grade with its range
- ✅ **Sortable ranges** - Automatically sorted by display order

**Grade Range Properties:**
- **Grade Label** - The letter or label (e.g., "A", "B+", "Pass")
- **Min Percentage** - Minimum percentage for this grade (0-100)
- **Max Percentage** - Maximum percentage for this grade (0-100)
- **GPA Value** - Optional GPA value (0-4.0)
- **Display Order** - Order in which grades appear
- **Color** - Hex color code for visual display
- **Passing Grade** - Whether this grade is passing or failing

## 🚀 How to Use

### Creating Your First Grading Scale

1. **Navigate to Grading**
   - Click "Grading" in the admin sidebar under "Learning"

2. **Create a New Scale**
   - Click "Create Scale" button
   - Fill in the form:
     - Name: e.g., "Standard Letter Grade (A-F)"
     - Description: Optional description
     - Scale Type: Choose Letter, Numeric, Pass/Fail, or Custom
     - Set as Default: Toggle if this should be the default
     - Active: Toggle to make it active
   - Click "Create"

3. **Add Grade Ranges**
   - Click on the newly created scale card
   - Click "Add Grade Range"
   - Fill in the grade details:
     - Grade Label: e.g., "A"
     - Min %: e.g., 90
     - Max %: e.g., 100
     - GPA Value: e.g., 4.0
     - Display Order: e.g., 1
     - Color: Pick a color or enter hex code
     - Passing Grade: Toggle on/off
   - Click "Create"
   - Repeat for all grade ranges you want

### Example: Creating an A-F Grading Scale

Here's how to create a standard A-F scale with grade ranges:

**Step 1: Create the Scale**
- Name: "Standard Letter Grade (A-F)"
- Type: Letter
- Default: Yes (if it's your first)
- Active: Yes

**Step 2: Add Grade Ranges** (in order)

| Grade | Min % | Max % | GPA | Order | Color | Passing |
|-------|-------|-------|-----|-------|-------|---------|
| A+ | 97 | 100 | 4.0 | 1 | #4CAF50 | Yes |
| A | 93 | 96.99 | 4.0 | 2 | #4CAF50 | Yes |
| A- | 90 | 92.99 | 3.7 | 3 | #8BC34A | Yes |
| B+ | 87 | 89.99 | 3.3 | 4 | #8BC34A | Yes |
| B | 83 | 86.99 | 3.0 | 5 | #CDDC39 | Yes |
| B- | 80 | 82.99 | 2.7 | 6 | #CDDC39 | Yes |
| C+ | 77 | 79.99 | 2.3 | 7 | #FFEB3B | Yes |
| C | 73 | 76.99 | 2.0 | 8 | #FFEB3B | Yes |
| C- | 70 | 72.99 | 1.7 | 9 | #FFC107 | Yes |
| D+ | 67 | 69.99 | 1.3 | 10 | #FF9800 | Yes |
| D | 63 | 66.99 | 1.0 | 11 | #FF9800 | Yes |
| D- | 60 | 62.99 | 0.7 | 12 | #FF5722 | Yes |
| F | 0 | 59.99 | 0.0 | 13 | #F44336 | No |

### Creating a Pass/Fail Scale

**Step 1: Create the Scale**
- Name: "Pass/Fail"
- Type: Pass/Fail
- Active: Yes

**Step 2: Add Two Grade Ranges**

| Grade | Min % | Max % | GPA | Order | Color | Passing |
|-------|-------|-------|-----|-------|-------|---------|
| Pass | 60 | 100 | - | 1 | #4CAF50 | Yes |
| Fail | 0 | 59.99 | - | 2 | #F44336 | No |

## 🎨 RTL (Hebrew) Support

The entire grading system UI supports RTL languages:
- ✅ Badges flow right-to-left
- ✅ Icons positioned correctly (chevrons rotate)
- ✅ Text alignment adjusts automatically
- ✅ Button spacing uses correct margins

## 📱 Responsive Design

- ✅ Mobile-friendly layout
- ✅ Grade ranges grid adapts to screen size
- ✅ Touch-friendly buttons
- ✅ Smooth hover states

## 🔒 Security

- ✅ Row Level Security (RLS) policies enforced
- ✅ Admin and Super Admin roles can manage scales
- ✅ Tenant isolation - you only see your tenant's scales
- ✅ Permission checks on all API endpoints

## 🧭 Navigation

```
Admin Dashboard
└── Grading (in sidebar)
    └── Grading Scales (list view)
        └── Click on any scale
            └── Grade Ranges (detail view)
```

## 🎯 Next Steps

After setting up your grading scales, you can:

1. **Assign scales to courses**
   - Go to course settings
   - Select a grading scale
   - Set up grade categories (Homework, Exams, etc.)

2. **Create grade categories**
   - Define categories like "Homework 20%", "Exams 50%", etc.
   - Set weights for each category
   - Configure drop lowest scores

3. **Start grading**
   - Grade student assignments
   - System automatically calculates final grades
   - Track student GPA

## 🐛 Troubleshooting

**Can't create a scale?**
- Make sure you ran the RLS policy fix SQL
- Check that you're logged in as an admin
- Verify the grading_scales table exists

**Grade ranges not showing?**
- Make sure you clicked on a scale to enter the detail view
- Check that grade_ranges table has RLS policies
- Verify you created the ranges for the correct scale

**Edit button not working?**
- Should work now! Click the Edit icon on any scale
- Dialog opens with pre-filled data
- Make changes and click "Update"

## 📚 Files Created

### UI Pages
- `/src/app/admin/grading/scales/page.tsx` - Grading scales list
- `/src/app/admin/grading/scales/[id]/page.tsx` - Grade ranges detail

### API Routes
- `/src/app/api/admin/grading/scales/route.ts` - List & create scales
- `/src/app/api/admin/grading/scales/[id]/route.ts` - Get, update, delete scale
- `/src/app/api/admin/grading/scales/[id]/ranges/route.ts` - List & create ranges
- `/src/app/api/admin/grading/scales/[id]/ranges/[rangeId]/route.ts` - Update & delete range

### Database
- `run-this-sql.sql` - Complete schema (8 tables)
- `fix-grading-rls-policies.sql` - Fixed RLS policies
- `supabase/SQL Scripts/20251215_grading_translations.sql` - All UI translations

## 💡 Tips

1. **Start with one scale** - Create your default scale first
2. **Add all grade ranges** - Complete the scale before using it
3. **Use consistent colors** - Green for good grades, red for failing
4. **Set display order** - Controls how grades appear in dropdowns
5. **Mark passing grades** - Important for tracking student progress
6. **Test with sample data** - Create a few test grades to verify your scale works

## ✨ Features Coming Soon

- Bulk import grade ranges from templates
- Copy existing scales
- Preview how grades will look
- Grade distribution analytics
- Export/import scales between tenants
