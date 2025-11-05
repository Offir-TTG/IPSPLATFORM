-- Platform Configuration Schema
-- Everything configurable, nothing hardcoded

-- Platform settings table (key-value store for global settings)
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json', 'color', 'file')),
  category TEXT NOT NULL, -- 'branding', 'theme', 'features', 'integrations', 'email', 'sms'
  label TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE, -- If true, accessible without authentication
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Navigation menu items (dynamic menu structure)
CREATE TABLE public.navigation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES public.navigation_items(id) ON DELETE CASCADE,
  translation_key TEXT NOT NULL, -- Reference to translation key
  icon TEXT, -- Lucide icon name
  href TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  roles TEXT[] DEFAULT ARRAY['student', 'instructor', 'admin'], -- Which roles can see this
  is_active BOOLEAN DEFAULT TRUE,
  is_external BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page content (CMS-like system for dynamic pages)
CREATE TABLE public.page_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  translation_key_prefix TEXT NOT NULL, -- e.g., 'pages.home'
  layout TEXT NOT NULL DEFAULT 'default', -- 'default', 'centered', 'wide', 'landing'
  meta_title_key TEXT,
  meta_description_key TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  require_auth BOOLEAN DEFAULT FALSE,
  allowed_roles TEXT[] DEFAULT ARRAY['student', 'instructor', 'admin'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page sections (blocks within pages)
CREATE TABLE public.page_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES public.page_content(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL, -- 'hero', 'features', 'cta', 'content', 'cards', 'testimonials'
  translation_key_prefix TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  settings JSONB DEFAULT '{}', -- Section-specific settings (colors, layout, etc.)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email templates (dynamic email content)
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key TEXT UNIQUE NOT NULL, -- 'welcome', 'reset-password', 'enrollment-confirmation'
  subject_translation_key TEXT NOT NULL,
  body_translation_key TEXT NOT NULL,
  variables JSONB DEFAULT '[]', -- Available variables like {{user_name}}, {{course_name}}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form fields (dynamic forms)
CREATE TABLE public.form_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_key TEXT NOT NULL, -- 'signup', 'contact', 'enrollment'
  field_key TEXT NOT NULL,
  label_translation_key TEXT NOT NULL,
  placeholder_translation_key TEXT,
  field_type TEXT NOT NULL, -- 'text', 'email', 'password', 'number', 'tel', 'textarea', 'select', 'checkbox'
  validation_rules JSONB DEFAULT '{}', -- {required: true, minLength: 8, pattern: '...'}
  options JSONB DEFAULT '[]', -- For select/checkbox fields
  "order" INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(form_key, field_key)
);

-- Feature flags (enable/disable features dynamically)
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  roles TEXT[] DEFAULT ARRAY['admin'], -- Which roles have access when enabled
  settings JSONB DEFAULT '{}', -- Feature-specific configuration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integrations configuration
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_key TEXT UNIQUE NOT NULL, -- 'zoom', 'stripe', 'docusign', 'sendgrid', 'twilio'
  integration_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  credentials JSONB DEFAULT '{}', -- Encrypted credentials
  settings JSONB DEFAULT '{}', -- Integration-specific settings
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_platform_settings_category ON public.platform_settings(category);
CREATE INDEX idx_platform_settings_public ON public.platform_settings(is_public);
CREATE INDEX idx_navigation_items_parent ON public.navigation_items(parent_id);
CREATE INDEX idx_navigation_items_order ON public.navigation_items("order");
CREATE INDEX idx_page_content_slug ON public.page_content(slug);
CREATE INDEX idx_page_sections_page ON public.page_sections(page_id);
CREATE INDEX idx_page_sections_order ON public.page_sections("order");
CREATE INDEX idx_form_fields_form ON public.form_fields(form_key);
CREATE INDEX idx_form_fields_order ON public.form_fields("order");

-- Row Level Security (RLS) Policies
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Public settings can be viewed by everyone
CREATE POLICY "Everyone can view public settings" ON public.platform_settings
  FOR SELECT
  USING (is_public = true);

-- Admins can manage all settings
CREATE POLICY "Admins can manage settings" ON public.platform_settings
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Navigation items - visible based on roles
CREATE POLICY "Users can view navigation based on role" ON public.navigation_items
  FOR SELECT
  USING (
    is_active = true AND
    (roles && ARRAY[auth.jwt() ->> 'role']::TEXT[] OR roles IS NULL)
  );

CREATE POLICY "Admins can manage navigation" ON public.navigation_items
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Page content - visible based on publication and auth
CREATE POLICY "Users can view published pages" ON public.page_content
  FOR SELECT
  USING (
    is_published = true AND
    (
      require_auth = false OR
      (require_auth = true AND auth.uid() IS NOT NULL AND
       (allowed_roles && ARRAY[auth.jwt() ->> 'role']::TEXT[] OR allowed_roles IS NULL))
    )
  );

CREATE POLICY "Admins can manage pages" ON public.page_content
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Page sections - visible through parent page
CREATE POLICY "Users can view page sections" ON public.page_sections
  FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.page_content
      WHERE id = page_sections.page_id
      AND is_published = true
    )
  );

CREATE POLICY "Admins can manage page sections" ON public.page_sections
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Email templates - admin only
CREATE POLICY "Admins can manage email templates" ON public.email_templates
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Form fields - public read, admin write
CREATE POLICY "Everyone can view form fields" ON public.form_fields
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage form fields" ON public.form_fields
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Feature flags - role-based access
CREATE POLICY "Users can view feature flags for their role" ON public.feature_flags
  FOR SELECT
  USING (
    is_enabled = true AND
    (roles && ARRAY[auth.jwt() ->> 'role']::TEXT[] OR roles IS NULL)
  );

CREATE POLICY "Admins can manage feature flags" ON public.feature_flags
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Integrations - admin only
CREATE POLICY "Admins can manage integrations" ON public.integrations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Triggers for updated_at
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_navigation_items_updated_at BEFORE UPDATE ON public.navigation_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_content_updated_at BEFORE UPDATE ON public.page_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_sections_updated_at BEFORE UPDATE ON public.page_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_fields_updated_at BEFORE UPDATE ON public.form_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
