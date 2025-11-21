# Fix Supabase Schema Cache Error

## Error
`Could not find the 'duration_minutes' column of 'lessons' in the schema cache`

## Root Cause
The Supabase client's schema cache is out of sync with your actual database schema. The `lessons` table has a `duration` column (not `duration_minutes`), but the cache hasn't been updated.

## Solutions

### Option 1: Restart Supabase (Recommended)
```bash
npx supabase stop
npx supabase start
```

### Option 2: Reset Database
```bash
npx supabase db reset
```

### Option 3: Regenerate Types
```bash
npx supabase gen types typescript --local > src/types/supabase.ts
```

### Option 4: Clear Node Modules Cache
```bash
rm -rf node_modules/.cache
npm run dev
```

## Verification

After applying one of the solutions above, test the bulk lesson creation again. The error should be resolved.

## Schema Reference

### Lessons Table (Correct Schema)
- Column name: `duration` (INTEGER)
- Not: `duration_minutes`

### Zoom Sessions Table
- Column name: `duration_minutes` (INTEGER)

The mismatch was causing confusion in the schema cache.
