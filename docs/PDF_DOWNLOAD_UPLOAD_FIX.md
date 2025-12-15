# PDF & Download Upload Button Fix

## Issue

When clicking "Select PDF File" or "Select File" buttons in the PDF and Download topic forms, the file dialog would not open.

## Root Cause

The Button component was using the `asChild` prop incorrectly:

```tsx
// ❌ BROKEN - asChild with span doesn't trigger click
<label htmlFor="pdf-upload">
  <Button asChild>
    <span>
      <Upload className="h-4 w-4 mr-2" />
      Select PDF File
    </span>
  </Button>
</label>
```

**Problem:** The `asChild` prop makes the Button delegate all props to its child element. When the child is a `<span>`, it can't receive click events properly through the label's `htmlFor` attribute.

## Solution

Changed to use an `onClick` handler that programmatically clicks the hidden input:

```tsx
// ✅ FIXED - Direct onClick handler
<Button
  type="button"
  variant="outline"
  className="w-full"
  disabled={uploading}
  onClick={() => document.getElementById('pdf-upload')?.click()}
>
  <Upload className="h-4 w-4 mr-2" />
  {uploading ? 'Uploading...' : 'Select PDF File'}
</Button>
```

## Files Fixed

1. **PDF Topic Form:** [src/components/lms/forms/PdfTopicForm.tsx](../src/components/lms/forms/PdfTopicForm.tsx) (Line 97-106)
2. **Download Topic Form:** [src/components/lms/forms/DownloadTopicForm.tsx](../src/components/lms/forms/DownloadTopicForm.tsx) (Line 104-113)

## Changes Made

### Before (Lines 97-110 in PdfTopicForm.tsx):
```tsx
<label htmlFor="pdf-upload">
  <Button
    type="button"
    variant="outline"
    className="w-full"
    disabled={uploading}
    asChild
  >
    <span>
      <Upload className="h-4 w-4 mr-2" />
      {uploading ? t('common.uploading', 'Uploading...') : t('lms.topics.select_pdf', 'Select PDF File')}
    </span>
  </Button>
</label>
```

### After (Lines 97-106 in PdfTopicForm.tsx):
```tsx
<Button
  type="button"
  variant="outline"
  className="w-full"
  disabled={uploading}
  onClick={() => document.getElementById('pdf-upload')?.click()}
>
  <Upload className="h-4 w-4 mr-2" />
  {uploading ? t('common.uploading', 'Uploading...') : t('lms.topics.select_pdf', 'Select PDF File')}
</Button>
```

## Testing

After this fix:

✅ **PDF Topic:**
- Click "Select PDF File" button → File dialog opens
- Select a PDF → Upload starts
- Progress indicator shows "Uploading..."
- Success → PDF details displayed

✅ **Download Topic:**
- Click "Select File" button → File dialog opens
- Select any file type → Upload starts
- Progress indicator shows "Uploading..."
- Success → File details displayed

## Why This Approach Works

1. **Hidden Input:** The actual `<input type="file">` is hidden with `className="hidden"`
2. **Button Click:** When the Button is clicked, it programmatically triggers `input.click()`
3. **File Dialog:** The browser opens the native file selection dialog
4. **OnChange:** When a file is selected, the `onChange` handler fires with the selected file
5. **Upload:** The file is uploaded to Supabase Storage

## Related Issues

This fix also resolves:
- File dialog not responding to click
- Button appearing clickable but doing nothing
- Console errors about event handlers

## Status

✅ **Fixed** - PDF and Download file selection now working correctly
