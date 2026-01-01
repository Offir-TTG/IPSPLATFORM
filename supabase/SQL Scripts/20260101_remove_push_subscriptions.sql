-- ============================================================================
-- REMOVE PUSH SUBSCRIPTIONS TABLE
-- ============================================================================
-- Date: 2026-01-01
-- Purpose: Remove push notification functionality (no longer needed)
-- ============================================================================

-- Drop policies
DROP POLICY IF EXISTS "Admins can view all push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON push_subscriptions;

-- Drop trigger
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;

-- Drop functions
DROP FUNCTION IF EXISTS update_push_subscription_updated_at();
DROP FUNCTION IF EXISTS cleanup_inactive_push_subscriptions();

-- Drop table
DROP TABLE IF EXISTS push_subscriptions CASCADE;
