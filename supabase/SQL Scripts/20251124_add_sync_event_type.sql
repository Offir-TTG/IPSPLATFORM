-- Migration: Add 'SYNC' to valid event types in audit_events table
-- This allows logging of synchronization events (e.g., Keap CRM sync)

-- Drop the existing constraint
ALTER TABLE public.audit_events
DROP CONSTRAINT IF EXISTS valid_event_type;

-- Add the new constraint with 'SYNC' included
ALTER TABLE public.audit_events
ADD CONSTRAINT valid_event_type
CHECK (event_type IN (
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'EXPORT',
  'IMPORT',
  'ACCESS',
  'MODIFY',
  'EXECUTE',
  'SHARE',
  'CONSENT',
  'SYNC'  -- Added for synchronization operations
));
