-- How a notification appears in the client portal, chosen by the admin in
-- the New notification wizard. Every notification still goes into the
-- Notifications list and the bell count; this adds an extra way to show it:
--   list       only in the list (how every notification worked before)
--   toast      a small pop-up in the corner
--   top_bar    a bar above the portal header on every page
--   home_card  a card at the top of the home page
--   modal      a window in the middle of the screen
-- Closing a bar, card, window or pop-up marks it as read (notification_reads).
-- Existing notifications become 'list', so nothing changes for them.
-- Safe to run more than once.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS display_style text NOT NULL DEFAULT 'list';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_display_style_check'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_display_style_check
      CHECK (display_style IN ('list', 'toast', 'top_bar', 'home_card', 'modal'));
  END IF;
END $$;
