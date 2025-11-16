# Parenting School Platform

A **100% database-driven**, sophisticated online learning platform with no hardcoded content. Everything is controlled by admins through the database - from UI text to integrations to features.

## 🎯 Core Philosophy

### Zero Hardcoded Content
**NOTHING is hardcoded in the codebase.** Every piece of content, configuration, and feature is:
- ✅ Stored in the database
- ✅ Configurable by admins
- ✅ Translatable to unlimited languages
- ✅ Toggleable via feature flags
- ✅ Customizable without code changes

### Modern, Component-Based Architecture
Each system is built as an independent, configurable module:
- **LMS System** - Course management, lessons, progress tracking
- **Payment System** - Multiple processors (Stripe, PayPal, etc.)
- **Live Classes** - Zoom, Teams, or custom integrations
- **CRM Integration** - Keap, HubSpot, Salesforce
- **Email/SMS** - SendGrid, Twilio, or alternatives
- **Document Signing** - DocuSign, HelloSign, Adobe Sign

## 📋 Features

### 🌍 Multi-Language System
- Unlimited languages support (Hebrew, English, Spanish, etc.)
- RTL/LTR automatic direction switching
- Admin-managed translations
- AI-powered auto-translation
- JSON import/export for translations
- 5-minute server-side caching for performance

### 🎨 Dynamic Theming
- Admin-controlled color schemes
- Typography customization (fonts, sizes)
- Branding (logo, platform name)
- Border radius and spacing
- Real-time preview
- Persistent across sessions

### 👥 Role-Based Access
- **Admin**: Full platform control
- **Instructor**: Course and student management
- **Student**: Learning and progress tracking
- Dynamic navigation per role
- Customizable permissions

### 📚 LMS System (Learning Management)
- **Programs**: Multi-course learning paths
- **Courses**: Structured curriculum with modules
- **Lessons**: Individual learning units with:
  - Rich text content (TiptapJS)
  - Video lessons
  - Live sessions
  - Downloadable materials
  - Quizzes and assignments
- **Progress Tracking**: Student completion rates
- **Certificates**: Auto-generated upon completion
- **Recordings**: Automatic cloud recording and playback

### 💳 Payment System
- **Multiple Processors**:
  - Stripe (primary)
  - PayPal (coming soon)
  - Custom payment gateways
- **Payment Plans**:
  - One-time payments
  - Installments
  - Subscriptions
  - Payment schedules
- **Currency Support**: Multi-currency (ILS, USD, EUR, etc.)
- **Invoicing**: Auto-generated invoices
- **Refunds**: Admin-managed refund system

### 🎥 Live Classes Integration
- **Zoom Integration**:
  - Auto-create meetings
  - Join URLs for students
  - Start URLs for instructors
  - Automatic recording to cloud
  - Webhook integration for status updates
- **Alternative Providers** (extendable):
  - Microsoft Teams
  - Google Meet
  - Custom video solutions
- **Scheduling**: Calendar integration
- **Reminders**: Auto-notifications before class

### 📧 Communication System
- **Email** (SendGrid, Mailgun, SES):
  - Welcome emails
  - Password reset
  - Enrollment confirmations
  - Course updates
  - Payment receipts
- **SMS** (Twilio, Nexmo):
  - Class reminders
  - Payment notifications
  - Emergency alerts
- **In-App Notifications**:
  - Real-time updates
  - Unread indicators

### 🔗 CRM Integration
- **Keap/Infusionsoft**:
  - Contact sync
  - Tag management
  - Campaign triggers
  - Custom fields
- **Extensible for**:
  - HubSpot
  - Salesforce
  - ActiveCampaign
  - Custom CRM

### 📝 Document Management
- **DocuSign Integration**:
  - Enrollment agreements
  - Terms of service
  - Custom contracts
  - Template management
  - Webhook for signature status
- **Alternative Providers**:
  - HelloSign
  - Adobe Sign
  - PandaDoc

### 🚦 Feature Flags
- Enable/disable features without code deploy
- Role-based feature access
- A/B testing capabilities
- Gradual rollout support

## 🏗️ Tech Stack

### Core
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with RLS
- **Styling**: Tailwind CSS + CSS Variables
- **State Management**: React Context + Zustand

### UI/UX
- **Components**: Custom with shadcn/ui patterns
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **Rich Text**: TiptapJS
- **Date Handling**: date-fns
- **File Upload**: react-dropzone

### Integrations
- **Payments**: Stripe SDK
- **Video**: Zoom Meeting SDK
- **Signatures**: DocuSign eSignature API
- **CRM**: Keap REST API
- **Email**: SendGrid API
- **SMS**: Twilio API
- **Job Queue**: BullMQ + Redis

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── admin/               # Admin-only endpoints
│   │   │   ├── languages/       # Language management
│   │   │   ├── translations/    # Translation CRUD + AI
│   │   │   └── theme/           # Theme settings
│   │   ├── auth/                # Authentication
│   │   ├── translations/        # Public translations (cached)
│   │   └── health/              # System health check
│   ├── (auth)/                  # Auth pages (login, signup)
│   ├── student/                 # Student dashboard
│   ├── instructor/              # Instructor dashboard
│   └── admin/                   # Admin dashboard
├── components/
│   ├── ui/                      # Base UI components
│   ├── layout/                  # Layout components
│   └── LanguageSwitcher.tsx     # Dynamic language selector
├── context/
│   ├── LanguageContext.tsx      # Multi-language system
│   └── ThemeContext.tsx         # Theme management
├── lib/
│   ├── supabase/
│   │   ├── server.ts           # Server-side client
│   │   ├── client.ts           # Client-side client
│   │   ├── schema.sql          # Main database schema
│   │   ├── languages-schema.sql # Language system schema
│   │   ├── platform-config-schema.sql # Configuration schema
│   │   └── seed-data.sql       # Initial data
│   └── integrations/           # Integration clients
│       ├── zoom.ts
│       ├── stripe.ts
│       ├── docusign.ts
│       ├── keap.ts
│       ├── sendgrid.ts
│       └── twilio.ts
└── types/                       # TypeScript definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- (Optional) Integration service accounts

### Installation

1. **Clone and Install**:
   ```bash
   git clone <repository>
   cd IPSPlatform
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env.local
   ```

   Fill in required variables:
   ```env
   # Supabase (Required)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Optional Integrations
   ZOOM_API_KEY=
   ZOOM_API_SECRET=
   STRIPE_SECRET_KEY=
   STRIPE_PUBLISHABLE_KEY=
   DOCUSIGN_INTEGRATION_KEY=
   KEAP_API_KEY=
   SENDGRID_API_KEY=
   TWILIO_ACCOUNT_SID=
   TWILIO_AUTH_TOKEN=
   ```

3. **Database Setup** (Run in Supabase SQL Editor):
   ```sql
   -- 1. Core schema
   -- Run: src/lib/supabase/schema.sql

   -- 2. Language system
   -- Run: src/lib/supabase/languages-schema.sql

   -- 3. Platform configuration
   -- Run: src/lib/supabase/platform-config-schema.sql

   -- 4. Seed initial data
   -- Run: src/lib/supabase/seed-data.sql
   ```

4. **Start Development**:
   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000)

5. **Create Admin Account**:
   - Go to `/signup` and create an account
   - In Supabase Table Editor → `users` table
   - Change your `role` from `'student'` to `'admin'`
   - Refresh and you'll have admin access

## 📖 Development Guidelines

### 🚫 Never Hardcode

**NEVER** hardcode in components:
```tsx
❌ BAD:
<h1>Welcome to Parenting School</h1>
<button>Sign Up</button>

✅ GOOD:
const { t } = useLanguage();
<h1>{t('home.hero.title')}</h1>
<button>{t('auth.signup.button')}</button>
```

### 🌍 Adding Content and New Components

**⚠️ CRITICAL: When adding new components, pages, or features, you MUST add translations to the database for ALL supported languages.**

**1. Create Translation SQL File**:
Create a new SQL file for your component translations (e.g., `src/lib/supabase/my-component-translations.sql`):

```sql
-- Translation keys for My New Component
INSERT INTO public.translation_keys (key, category, description) VALUES
  ('myComponent.title', 'myComponent', 'Component title'),
  ('myComponent.subtitle', 'myComponent', 'Component subtitle'),
  ('myComponent.button.save', 'myComponent', 'Save button text'),
  ('myComponent.button.cancel', 'myComponent', 'Cancel button text'),
  ('myComponent.form.name', 'myComponent', 'Name field label'),
  ('myComponent.form.nameHint', 'myComponent', 'Name field hint'),
  ('myComponent.error.required', 'myComponent', 'Required field error'),
  ('myComponent.success.saved', 'myComponent', 'Success message')
ON CONFLICT (key) DO NOTHING;

-- Add translations for ALL languages (Hebrew + English minimum)
INSERT INTO public.translations (language_code, translation_key, translation_value, category) VALUES
  -- Hebrew
  ('he', 'myComponent.title', 'כותרת הרכיב', 'myComponent'),
  ('he', 'myComponent.subtitle', 'תת כותרת', 'myComponent'),
  ('he', 'myComponent.button.save', 'שמור', 'myComponent'),
  ('he', 'myComponent.button.cancel', 'ביטול', 'myComponent'),
  ('he', 'myComponent.form.name', 'שם', 'myComponent'),
  ('he', 'myComponent.form.nameHint', 'הזן את השם שלך', 'myComponent'),
  ('he', 'myComponent.error.required', 'שדה חובה', 'myComponent'),
  ('he', 'myComponent.success.saved', 'נשמר בהצלחה', 'myComponent'),

  -- English
  ('en', 'myComponent.title', 'Component Title', 'myComponent'),
  ('en', 'myComponent.subtitle', 'Subtitle', 'myComponent'),
  ('en', 'myComponent.button.save', 'Save', 'myComponent'),
  ('en', 'myComponent.button.cancel', 'Cancel', 'myComponent'),
  ('en', 'myComponent.form.name', 'Name', 'myComponent'),
  ('en', 'myComponent.form.nameHint', 'Enter your name', 'myComponent'),
  ('en', 'myComponent.error.required', 'This field is required', 'myComponent'),
  ('en', 'myComponent.success.saved', 'Saved successfully', 'myComponent')
ON CONFLICT (language_code, translation_key) DO NOTHING;
```

**2. Run SQL File in Supabase**:
- Open Supabase SQL Editor
- Run your translation SQL file
- Verify translations are added to `translation_keys` and `translations` tables

**3. Use in Component**:
```tsx
import { useLanguage } from '@/context/LanguageContext';

export function MyComponent() {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t('myComponent.title')}</h1>
      <p>{t('myComponent.subtitle')}</p>
      <button>{t('myComponent.button.save')}</button>
      <button>{t('myComponent.button.cancel')}</button>
    </div>
  );
}
```

**⚠️ IMPORTANT RULES:**
1. **NEVER hardcode text** - Every single piece of text must use `t()` function
2. **Add ALL languages** - Include translations for Hebrew, English, and any other active languages
3. **Use descriptive keys** - Use dot notation like `component.section.element`
4. **Include fallbacks** - Always provide fallback text: `t('key', 'Fallback Text')`
5. **Run SQL first** - Add translations to database BEFORE using them in components
6. **Test all languages** - Switch to each language and verify all text displays correctly

**Checklist for New Components:**
- [ ] Created translation SQL file with all keys
- [ ] Added Hebrew translations for ALL text
- [ ] Added English translations for ALL text
- [ ] Added translations for any other active languages
- [ ] Ran SQL file in Supabase
- [ ] Used `t()` function for ALL text in component
- [ ] Tested component in Hebrew (RTL)
- [ ] Tested component in English (LTR)
- [ ] Verified no hardcoded text remains
- [ ] Cleared translation cache if needed (`POST /api/translations`)

### 🔌 Adding Integrations

**1. Create Integration Client** (`src/lib/integrations/provider.ts`):
```typescript
export class ProviderClient {
  constructor(private apiKey: string) {}

  async someAction(params: any) {
    // Implementation
  }
}
```

**2. Register in Database**:
```sql
INSERT INTO integrations (
  integration_key,
  integration_name,
  is_enabled,
  credentials,
  settings
) VALUES (
  'provider',
  'Provider Name',
  false,
  '{"api_key": ""}',
  '{"timeout": 30000}'
);
```

**3. Create API Route** (`src/app/api/provider/route.ts`):
```typescript
import { ProviderClient } from '@/lib/integrations/provider';

export async function POST(request: Request) {
  // Fetch integration config from database
  const { data: config } = await supabase
    .from('integrations')
    .select('*')
    .eq('integration_key', 'provider')
    .single();

  if (!config?.is_enabled) {
    return NextResponse.json({ error: 'Integration disabled' }, { status: 403 });
  }

  const client = new ProviderClient(config.credentials.api_key);
  // Use client...
}
```

### 🎨 Component Architecture

**Create Modular, Configurable Components**:

```tsx
// ❌ BAD: Hardcoded, inflexible
export function PaymentForm() {
  return (
    <form>
      <input type="text" placeholder="Credit Card" />
      <button>Pay $99</button>
    </form>
  );
}

// ✅ GOOD: Dynamic, database-driven
export function PaymentForm({ programId }: { programId: string }) {
  const { t } = useLanguage();
  const [program, setProgram] = useState(null);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    // Load program details from database
    loadProgram(programId);
    // Load form fields from database
    loadFormFields('payment');
  }, [programId]);

  return (
    <form>
      {fields.map(field => (
        <FormField
          key={field.id}
          label={t(field.label_translation_key)}
          type={field.field_type}
          validation={field.validation_rules}
        />
      ))}
      <button>
        {t('payment.submit', `Pay ${program?.price}`)}
      </button>
    </form>
  );
}
```

### 🚦 Using Feature Flags

```tsx
const [features, setFeatures] = useState({});

useEffect(() => {
  // Load feature flags
  fetch('/api/features').then(res => res.json()).then(setFeatures);
}, []);

// Conditionally render based on flags
{features.live_classes && (
  <LiveClassScheduler />
)}

{features.ai_translation && (
  <AutoTranslateButton />
)}
```

### 📱 RTL/LTR Support

**Always use logical properties**:
```tsx
// ❌ BAD: Assumes LTR
<div className="ml-4 pl-2 text-left">

// ✅ GOOD: Works for both RTL and LTR
<div className="ms-4 ps-2 text-start">

// ✅ GOOD: Use gap instead of space
<div className="flex gap-4"> {/* Not space-x-4 */}
```

## 🔧 Advanced Configuration

### Adding a New Language

See [SETUP.md](SETUP.md) for detailed instructions.

**Quick Start**:
```bash
# Via API
POST /api/admin/languages
{
  "code": "es",
  "name": "Spanish",
  "native_name": "Español",
  "direction": "ltr"
}

# Auto-translate from existing language
POST /api/admin/translations/auto-translate
{
  "source_language": "en",
  "target_language": "es"
}
```

### Configuring Payment Processor

```sql
-- Enable Stripe
UPDATE integrations
SET
  is_enabled = true,
  credentials = jsonb_set(
    credentials,
    '{secret_key}',
    '"sk_live_..."'
  )
WHERE integration_key = 'stripe';

-- Configure payment settings
UPDATE platform_settings
SET setting_value = '"ILS"'
WHERE setting_key = 'payments.currency';
```

### Customizing Email Templates

```sql
-- Create template
INSERT INTO email_templates (
  template_key,
  subject_translation_key,
  body_translation_key,
  variables
) VALUES (
  'welcome',
  'email.welcome.subject',
  'email.welcome.body',
  '["user_name", "platform_name", "login_url"]'
);

-- Add translations
INSERT INTO translations (language_code, translation_key, translation_value)
VALUES
  ('he', 'email.welcome.subject', 'ברוכים הבאים ל-{{platform_name}}!', 'email'),
  ('he', 'email.welcome.body', 'שלום {{user_name}}...', 'email');
```

## 🔐 Security Best Practices

- ✅ All API keys stored in environment variables or encrypted in database
- ✅ Row Level Security (RLS) on all tables
- ✅ Admin-only endpoints protected
- ✅ Input validation with Zod
- ✅ CSRF protection
- ✅ Rate limiting on API routes
- ✅ Secure session management

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables
Set all environment variables in your hosting platform:
- Supabase credentials
- Integration API keys
- Redis URL (for BullMQ)

## 📚 Documentation

- [SETUP.md](SETUP.md) - Detailed setup and configuration guide
- [API Documentation](docs/API.md) - Coming soon
- [Component Library](docs/COMPONENTS.md) - Coming soon
- [Integration Guide](docs/INTEGRATIONS.md) - Coming soon

## 🤝 Contributing

This is a private platform. For internal development:

1. **Never commit** API keys or credentials
2. **Always use** translation keys for text
3. **Test** in both Hebrew (RTL) and English (LTR)
4. **Document** new features and configurations
5. **Use** feature flags for new functionality

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## 📄 License

Private - All rights reserved

---

Built with ❤️ using Next.js, Supabase, and a completely database-driven architecture.
