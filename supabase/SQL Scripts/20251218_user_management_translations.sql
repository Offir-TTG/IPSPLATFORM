-- ============================================================================
-- User Management Hebrew Translations
-- Created: 2024-12-18
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN

  -- Delete existing translations if they exist
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
    AND translation_key IN (
      'admin.users.access_required',
      'admin.users.title',
      'admin.users.subtitle',
      'admin.users.stats.total',
      'admin.users.stats.active',
      'admin.users.stats.inactive',
      'admin.users.stats.suspended',
      'admin.users.invite_user',
      'admin.users.pagination.showing',
      'admin.users.pagination.to',
      'admin.users.pagination.of',
      'admin.users.pagination.users',
      'admin.users.pagination.page',
      'admin.nav.users_access',
      'admin.nav.users',
      'admin.users.table.user',
      'admin.users.table.email',
      'admin.users.table.role',
      'admin.users.table.status',
      'admin.users.table.last_active',
      'admin.users.table.actions',
      'admin.users.actions.reset_password',
      'admin.users.actions.activate',
      'admin.users.actions.deactivate',
      'admin.users.empty.title',
      'admin.users.empty.description',
      'admin.users.filters.search_placeholder',
      'admin.users.filters.all_roles',
      'admin.users.filters.role_student',
      'admin.users.filters.role_instructor',
      'admin.users.filters.role_staff',
      'admin.users.filters.role_admin',
      'admin.users.filters.all_status',
      'admin.users.filters.status_active',
      'admin.users.filters.status_inactive',
      'admin.users.filters.status_suspended',
      'admin.users.filters.clear',
      'admin.users.roles.student',
      'admin.users.roles.instructor',
      'admin.users.roles.staff',
      'admin.users.roles.admin',
      'admin.users.roles.owner',
      'admin.users.roles.support',
      'admin.users.status.active',
      'admin.users.status.inactive',
      'admin.users.status.suspended',
      'admin.users.table.time.never',
      'admin.users.table.time.today',
      'admin.users.table.time.yesterday',
      'admin.users.table.time.days_ago',
      'admin.users.table.time.weeks_ago',
      'admin.users.table.time.months_ago',
      'admin.users.table.time.years_ago'
    );

  -- Insert English translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES

  -- Page headers
  (v_tenant_id, 'en', 'admin.users.access_required', 'Admin access required', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.title', 'User Management', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.subtitle', 'Manage users for', 'admin', NOW(), NOW()),

  -- Stats labels
  (v_tenant_id, 'en', 'admin.users.stats.total', 'Total Users', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.stats.active', 'Active', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.stats.inactive', 'Inactive', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.stats.suspended', 'Suspended', 'admin', NOW(), NOW()),

  -- Actions
  (v_tenant_id, 'en', 'admin.users.invite_user', 'Invite User', 'admin', NOW(), NOW()),

  -- Pagination
  (v_tenant_id, 'en', 'admin.users.pagination.showing', 'Showing', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.pagination.to', 'to', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.pagination.of', 'of', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.pagination.users', 'users', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.pagination.page', 'Page', 'admin', NOW(), NOW()),

  -- Navigation
  (v_tenant_id, 'en', 'admin.nav.users_access', 'Users & Access', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.nav.users', 'Users', 'admin', NOW(), NOW()),

  -- Table headers
  (v_tenant_id, 'en', 'admin.users.table.user', 'User', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.table.email', 'Email', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.table.role', 'Role', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.table.status', 'Status', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.table.last_active', 'Last Active', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.table.actions', 'Actions', 'admin', NOW(), NOW()),

  -- Table actions
  (v_tenant_id, 'en', 'admin.users.actions.reset_password', 'Reset Password', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.actions.activate', 'Activate', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.actions.deactivate', 'Deactivate', 'admin', NOW(), NOW()),

  -- Empty state
  (v_tenant_id, 'en', 'admin.users.empty.title', 'No users found', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.empty.description', 'Try adjusting your filters or invite new users to get started.', 'admin', NOW(), NOW()),

  -- Filters
  (v_tenant_id, 'en', 'admin.users.filters.search_placeholder', 'Search by name or email...', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.filters.all_roles', 'All Roles', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.filters.role_student', 'Student', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.filters.role_instructor', 'Instructor', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.filters.role_staff', 'Staff', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.filters.role_admin', 'Admin', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.filters.all_status', 'All Status', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.filters.status_active', 'Active', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.filters.status_inactive', 'Inactive', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.filters.status_suspended', 'Suspended', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.filters.clear', 'Clear Filters', 'admin', NOW(), NOW()),

  -- Role badges
  (v_tenant_id, 'en', 'admin.users.roles.student', 'Student', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.roles.instructor', 'Instructor', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.roles.staff', 'Staff', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.roles.admin', 'Admin', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.roles.owner', 'Owner', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.roles.support', 'Support', 'admin', NOW(), NOW()),

  -- Status badges
  (v_tenant_id, 'en', 'admin.users.status.active', 'Active', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.status.inactive', 'Inactive', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.status.suspended', 'Suspended', 'admin', NOW(), NOW()),

  -- Time labels
  (v_tenant_id, 'en', 'admin.users.table.time.never', 'Never', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.table.time.today', 'Today', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.table.time.yesterday', 'Yesterday', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.table.time.days_ago', '{{days}} days ago', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.table.time.weeks_ago', '{{weeks}} weeks ago', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.table.time.months_ago', '{{months}} months ago', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.users.table.time.years_ago', '{{years}} years ago', 'admin', NOW(), NOW()),

  -- Hebrew translations
  (v_tenant_id, 'he', 'admin.users.access_required', 'נדרש גישה כמנהל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.title', 'ניהול משתמשים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.subtitle', 'ניהול משתמשים עבור', 'admin', NOW(), NOW()),

  -- Stats labels
  (v_tenant_id, 'he', 'admin.users.stats.total', 'סה"כ משתמשים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.stats.active', 'פעיל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.stats.inactive', 'לא פעיל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.stats.suspended', 'הושהה', 'admin', NOW(), NOW()),

  -- Actions
  (v_tenant_id, 'he', 'admin.users.invite_user', 'הזמן משתמש', 'admin', NOW(), NOW()),

  -- Pagination
  (v_tenant_id, 'he', 'admin.users.pagination.showing', 'מציג', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.pagination.to', 'עד', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.pagination.of', 'מתוך', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.pagination.users', 'משתמשים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.pagination.page', 'עמוד', 'admin', NOW(), NOW()),

  -- Navigation
  (v_tenant_id, 'he', 'admin.nav.users_access', 'משתמשים וגישה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.nav.users', 'משתמשים', 'admin', NOW(), NOW()),

  -- Table headers
  (v_tenant_id, 'he', 'admin.users.table.user', 'משתמש', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.table.email', 'אימייל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.table.role', 'תפקיד', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.table.status', 'סטטוס', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.table.last_active', 'פעיל לאחרונה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.table.actions', 'פעולות', 'admin', NOW(), NOW()),

  -- Table actions
  (v_tenant_id, 'he', 'admin.users.actions.reset_password', 'איפוס סיסמה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.actions.activate', 'הפעל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.actions.deactivate', 'השבת', 'admin', NOW(), NOW()),

  -- Empty state
  (v_tenant_id, 'he', 'admin.users.empty.title', 'לא נמצאו משתמשים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.empty.description', 'נסה לשנות את המסננים או להזמין משתמשים חדשים כדי להתחיל.', 'admin', NOW(), NOW()),

  -- Filters
  (v_tenant_id, 'he', 'admin.users.filters.search_placeholder', 'חפש לפי שם או אימייל...', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.filters.all_roles', 'כל התפקידים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.filters.role_student', 'תלמיד', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.filters.role_instructor', 'מרצה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.filters.role_staff', 'צוות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.filters.role_admin', 'מנהל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.filters.all_status', 'כל הסטטוסים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.filters.status_active', 'פעיל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.filters.status_inactive', 'לא פעיל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.filters.status_suspended', 'מושהה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.filters.clear', 'נקה מסננים', 'admin', NOW(), NOW()),

  -- Role badges
  (v_tenant_id, 'he', 'admin.users.roles.student', 'תלמיד', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.roles.instructor', 'מרצה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.roles.staff', 'צוות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.roles.admin', 'מנהל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.roles.owner', 'בעלים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.roles.support', 'תמיכה', 'admin', NOW(), NOW()),

  -- Status badges
  (v_tenant_id, 'he', 'admin.users.status.active', 'פעיל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.status.inactive', 'לא פעיל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.status.suspended', 'מושהה', 'admin', NOW(), NOW()),

  -- Time labels
  (v_tenant_id, 'he', 'admin.users.table.time.never', 'אף פעם', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.table.time.today', 'היום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.table.time.yesterday', 'אתמול', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.table.time.days_ago', 'לפני {{days}} ימים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.table.time.weeks_ago', 'לפני {{weeks}} שבועות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.table.time.months_ago', 'לפני {{months}} חודשים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.users.table.time.years_ago', 'לפני {{years}} שנים', 'admin', NOW(), NOW());

  RAISE NOTICE 'User management translations inserted successfully';

END $$;
