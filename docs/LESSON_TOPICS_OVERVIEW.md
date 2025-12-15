# Lesson Topics Overview - All Content Types

## Summary

The LMS system supports **9 different content types** for lesson topics. Out of these:

✅ **7 are fully implemented** (Video, Text, Link, PDF, Download, Embed, Whiteboard)
⚠️ **2 are placeholders** (Quiz, Assignment - marked as "Coming Soon")

## Status of All Topic Types

### 1. ✅ Video Topic
**Status:** Fully functional
**Form:** [VideoTopicForm.tsx](../src/components/lms/forms/VideoTopicForm.tsx)
**Block:** [VideoTopicBlock.tsx](../src/components/lms/topics/VideoTopicBlock.tsx)

**Features:**
- YouTube and Vimeo URL support
- Auto-detects provider from URL
- Stores: `url`, `provider`

**Validation:**
- URL is required
- Must be a valid YouTube or Vimeo URL

**Potential Issues:** None detected

---

### 2. ✅ Text Topic (Rich Text Editor)
**Status:** Fully functional
**Form:** [TextTopicForm.tsx](../src/components/lms/forms/TextTopicForm.tsx)
**Block:** [TextTopicBlock.tsx](../src/components/lms/topics/TextTopicBlock.tsx)

**Features:**
- Rich text editor with formatting
- Dynamically imported to avoid SSR issues
- RTL support
- Stores: `html`, `plaintext` (for search)

**Validation:**
- Content (HTML) is required

**Potential Issues:** None detected

---

### 3. ✅ Link Topic
**Status:** Fully functional
**Form:** [LinkTopicForm.tsx](../src/components/lms/forms/LinkTopicForm.tsx)
**Block:** [LinkTopicBlock.tsx](../src/components/lms/topics/LinkTopicBlock.tsx)

**Features:**
- External URL linking
- Optional custom title
- Optional description
- "Open in new tab" toggle (default: true)
- Stores: `url`, `title`, `description`, `open_in_new_tab`

**Validation:**
- URL is required

**Potential Issues:** None detected

---

### 4. ✅ PDF Topic
**Status:** Fully functional
**Form:** [PdfTopicForm.tsx](../src/components/lms/forms/PdfTopicForm.tsx)
**Block:** [PdfTopicBlock.tsx](../src/components/lms/topics/PdfTopicBlock.tsx)

**Features:**
- PDF file upload to Supabase Storage
- File size limit: 50MB
- File type validation (PDF only)
- Displays filename and size
- Uses `uploadCourseMaterial()` from [materialStorage.ts](../src/lib/supabase/materialStorage.ts)
- Stores: `file_url`, `filename`, `size`

**Validation:**
- File must be PDF type (`application/pdf`)
- Max 50MB

**Potential Issues:**
- ⚠️ **Storage bucket dependency**: Requires `course-materials` bucket in Supabase Storage
- ⚠️ **Storage policies**: May need RLS policies configured on the bucket
- ⚠️ **Error handling**: Upload errors are caught but may need clearer user feedback

**Testing Needed:**
- [ ] Verify `course-materials` bucket exists in Supabase
- [ ] Check storage policies allow authenticated users to upload
- [ ] Test upload with various PDF sizes
- [ ] Test error scenarios (no auth, bucket missing, network error)

---

### 5. ✅ Download Topic
**Status:** Fully functional
**Form:** [DownloadTopicForm.tsx](../src/components/lms/forms/DownloadTopicForm.tsx)
**Block:** [DownloadTopicBlock.tsx](../src/components/lms/topics/DownloadTopicBlock.tsx)

**Features:**
- Any file type upload
- File size limit: 50MB
- Optional description field
- Uses `uploadCourseMaterial()` from [materialStorage.ts](../src/lib/supabase/materialStorage.ts)
- Stores: `file_url`, `filename`, `file_type`, `size`, `description`

**Validation:**
- Max 50MB file size

**Potential Issues:**
- ⚠️ **Same storage dependency as PDF**: Requires `course-materials` bucket
- ⚠️ **No file type restrictions**: Could allow malicious files (consider adding validation)
- ⚠️ **Error handling**: Same concerns as PDF upload

**Testing Needed:**
- [ ] Verify uploads work for various file types (ZIP, DOCX, XLSX, etc.)
- [ ] Test with malicious file types (EXE, BAT, etc.) - should these be blocked?
- [ ] Check file size validation works correctly

---

### 6. ✅ Embed Topic (iFrame)
**Status:** Fully functional
**Form:** [EmbedTopicForm.tsx](../src/components/lms/forms/EmbedTopicForm.tsx)
**Block:** [EmbedTopicBlock.tsx](../src/components/lms/topics/EmbedTopicBlock.tsx)

**Features:**
- iFrame embed code support
- Custom width/height (optional)
- Supports: YouTube, Vimeo, Google Docs, Microsoft Forms, Miro, Figma, Canva
- Stores: `embed_code`, `width`, `height`

**Validation:**
- Embed code is required

**Potential Issues:**
- ⚠️ **XSS Risk**: No sanitization on embed code - relies on browser CSP
- ⚠️ **Domain whitelist**: Mentions allowed domains but doesn't enforce in code
- ⚠️ **Security concern**: Users could embed malicious iframes

**Recommendations:**
- Implement server-side validation to extract `src` from iframe
- Whitelist allowed domains (youtube.com, vimeo.com, etc.)
- Sanitize/validate iframe code before saving

**Testing Needed:**
- [ ] Test with allowed domains (YouTube, Google Docs, etc.)
- [ ] Try embedding from disallowed domain - should it be blocked?
- [ ] Check for XSS vulnerabilities

---

### 7. ✅ Whiteboard Topic (Tldraw v4)
**Status:** Fully functional
**Form:** [WhiteboardTopicForm.tsx](../src/components/lms/forms/WhiteboardTopicForm.tsx)
**Block:** [WhiteboardTopicBlock.tsx](../src/components/lms/topics/WhiteboardTopicBlock.tsx)

**Features:**
- Interactive whiteboard using Tldraw v4
- Save/load snapshots
- Clear whiteboard functionality
- Auto-save info (UI indicates 30 seconds)
- View-only mode for students
- Export to SVG/PNG
- Stores: `snapshot`, `version`, `allow_collaboration`, `last_modified_by`, `last_modified_at`, `collaborators`

**Validation:**
- No specific validation (can save empty whiteboard)

**Potential Issues:**
- ⚠️ **Auto-save not implemented**: UI says "Auto-saves every 30 seconds" but no auto-save logic found
- ℹ️ **Collaboration feature**: `allow_collaboration` field exists but real-time collaboration not implemented
- ℹ️ **Large snapshots**: Tldraw snapshots can be large - may need size limits

**Recommendations:**
- Implement the 30-second auto-save mentioned in UI
- Consider compression for large whiteboard snapshots
- Document that collaboration is a future feature

**Testing Needed:**
- [ ] Verify whiteboard saves and loads correctly
- [ ] Test clear functionality
- [ ] Test export to SVG/PNG
- [ ] Check snapshot size for complex drawings

---

### 8. ⚠️ Quiz Topic
**Status:** Not implemented (Coming Soon)
**Form:** Not created
**Block:** Shows placeholder message

**Current Display:**
```
Quiz content (Coming Soon)
```

**Missing:**
- Quiz form component
- Quiz block component
- Quiz content type definition
- Question/answer data structure

---

### 9. ⚠️ Assignment Topic
**Status:** Not implemented (Coming Soon)
**Form:** Not created
**Block:** Shows placeholder message

**Current Display:**
```
Assignment content (Coming Soon)
```

**Missing:**
- Assignment form component
- Assignment block component
- Assignment content type definition
- Submission/grading system

---

## Database Schema Validation

The `lesson_topics` table has a CHECK constraint on `content_type`:

```sql
CHECK (content_type IN (
  'video', 'text', 'pdf', 'quiz', 'assignment',
  'link', 'embed', 'download', 'whiteboard'
))
```

**Status:** ✅ All 9 types are allowed in the database

**Files Updated:**
- [src/lib/supabase/lms-schema.sql](../src/lib/supabase/lms-schema.sql) - Line 70
- [supabase/SQL Scripts/APPLY_LMS_SCHEMA.sql](../supabase/SQL Scripts/APPLY_LMS_SCHEMA.sql) - Line 76
- [src/app/api/lms/lesson-topics/route.ts](../src/app/api/lms/lesson-topics/route.ts) - Line 124

---

## API Validation

The POST endpoint validates content types:

```typescript
const validContentTypes = [
  'video', 'text', 'pdf', 'quiz', 'assignment',
  'link', 'embed', 'download', 'whiteboard'
];
```

**Status:** ✅ All 9 types are allowed in the API

---

## Common Issues to Check

### Storage-Related Issues (PDF & Download Topics)

**Symptom:** Upload fails with error like:
- "Storage bucket 'course-materials' not found"
- "Permission denied. Please check storage policies."
- "Authentication required. Please log in again."

**Cause:** Missing Supabase Storage configuration

**Fix:**
1. Create `course-materials` bucket in Supabase Dashboard
2. Add storage policies:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload course materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-materials');

-- Allow public read access
CREATE POLICY "Public can view course materials"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-materials');

-- Allow users to delete their uploads
CREATE POLICY "Users can delete their uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'course-materials');
```

### Session/Auth Issues

**Symptom:** "Authentication required. Please log in again."

**Cause:** Expired or missing auth session

**Solution:** The `uploadCourseMaterial()` function already handles session refresh:
```typescript
if (!activeSession) {
  const { data: refreshData } = await supabase.auth.refreshSession();
  activeSession = refreshData.session;
}
```

---

## Translation Keys Used

All topic types use translation keys. Key patterns:

- `lms.topics.add_{type}` - Add button labels
- `lms.topics.{type}_*` - Type-specific labels
- `lms.topics.{field}_required` - Validation messages
- `common.*` - Shared labels (Save, Cancel, Optional, etc.)

**Recommendation:** Run translation scripts to ensure all keys are in the database:
- [scripts/apply-mobile-translations.ts](../scripts/apply-mobile-translations.ts)
- [scripts/apply-edit-content-translations.ts](../scripts/apply-edit-content-translations.ts)
- [scripts/apply-whiteboard-translations.ts](../scripts/apply-whiteboard-translations.ts)

---

## Testing Checklist

### PDF Topic Testing
- [ ] Upload small PDF (< 1MB) ✓ Should work
- [ ] Upload large PDF (40MB) ✓ Should work
- [ ] Upload too large PDF (> 50MB) ✗ Should show error
- [ ] Upload non-PDF file ✗ Should show error
- [ ] Upload without auth ✗ Should show error
- [ ] Remove uploaded PDF ✓ Should clear form
- [ ] Edit existing PDF topic ✓ Should show current PDF
- [ ] Save topic with PDF ✓ Should create topic record

### Download Topic Testing
- [ ] Upload various file types (ZIP, DOCX, XLSX, PNG) ✓ Should work
- [ ] Upload large file (40MB) ✓ Should work
- [ ] Upload too large (> 50MB) ✗ Should show error
- [ ] Add description ✓ Should save with file
- [ ] Remove file but keep description ✓ Should work

### Embed Topic Testing
- [ ] Embed YouTube video ✓ Should render
- [ ] Embed Google Docs ✓ Should render
- [ ] Embed from unknown domain ⚠️ Should consider blocking
- [ ] Set custom width/height ✓ Should apply
- [ ] Try malicious iframe (javascript:) ⚠️ Security test

### Whiteboard Topic Testing
- [ ] Create new whiteboard ✓ Should show blank canvas
- [ ] Draw shapes and save ✓ Should persist
- [ ] Load existing whiteboard ✓ Should show saved content
- [ ] Clear whiteboard ✓ Should reset to blank
- [ ] Export whiteboard ✓ Should download SVG/PNG
- [ ] View-only mode ✓ Should prevent editing

### Video, Text, Link Topics
- [ ] All these should work as they have simpler implementations

---

## Priority Issues

### High Priority
1. ✅ **Fixed:** PDF upload requires storage bucket and policies
2. ✅ **Fixed:** tenant_id missing in INSERT (now included)
3. ✅ **Fixed:** RLS policies for lesson_topics table (now created)
4. ⚠️ **Pending:** Whiteboard auto-save not implemented (UI misleading)

### Medium Priority
5. ⚠️ **Pending:** Embed topic XSS/security validation
6. ⚠️ **Pending:** Download topic file type restrictions
7. ℹ️ **Future:** Quiz and Assignment topics not implemented

### Low Priority
8. ℹ️ **Future:** Whiteboard collaboration feature
9. ℹ️ **Future:** Whiteboard snapshot compression

---

## Recommended Next Steps

1. **Test PDF uploads** - Verify storage bucket exists and policies are correct
2. **Test Download uploads** - Same storage requirements as PDF
3. **Security review** - Check embed topic for XSS vulnerabilities
4. **Implement auto-save** - Add 30-second interval save for whiteboard
5. **Plan Quiz/Assignment** - Design data structures and UI for these features
6. **Add file type restrictions** - Prevent malicious file uploads in Download topic

---

## Related Documentation

- [Lesson Topics Fix](./LESSON_TOPICS_FIX.md) - Fixing RLS and tenant_id issues
- [Mobile Optimization - Course Builder](./MOBILE_OPTIMIZATION_COURSE_BUILDER.md)
- [Mobile Optimization - Public Course Page](./MOBILE_OPTIMIZATION_PUBLIC_COURSE_PAGE.md)
