import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiter, RATE_LIMITS } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

// FAQ/Navigation patterns for common user queries
const FAQ_PATTERNS = [
  {
    keywords: ['profile', 'פרופיל', 'account', 'חשבון', 'settings', 'הגדרות', 'my account', 'החשבון שלי'],
    title: { en: 'My Profile', he: 'הפרופיל שלי' },
    description: { en: 'View and edit your profile, change password, update personal information', he: 'צפה וערוך את הפרופיל שלך, שנה סיסמה, עדכן מידע אישי' },
    url: '/profile',
    icon: 'user',
    category: 'navigation'
  },
  {
    keywords: ['invoice', 'חשבונית', 'חשבוניות', 'invoices', 'billing', 'חיוב', 'payment history', 'היסטוריית תשלומים'],
    title: { en: 'Invoices & Payments', he: 'חשבוניות ותשלומים' },
    description: { en: 'View your payment history, download invoices, manage billing information', he: 'צפה בהיסטוריית התשלומים שלך, הורד חשבוניות, נהל מידע חיוב' },
    url: '/payments',
    icon: 'receipt',
    category: 'billing'
  },
  {
    keywords: ['dashboard', 'לוח בקרה', 'home', 'בית', 'main', 'ראשי'],
    title: { en: 'Dashboard', he: 'לוח הבקרה' },
    description: { en: 'Go to your main dashboard with overview of courses and activities', he: 'עבור ללוח הבקרה הראשי עם סקירה של קורסים ופעילויות' },
    url: '/dashboard',
    icon: 'layout-dashboard',
    category: 'navigation'
  },
  {
    keywords: ['programs', 'תוכניות', 'program', 'תוכנית', 'my programs', 'התוכניות שלי'],
    title: { en: 'My Programs', he: 'התוכניות שלי' },
    description: { en: 'View all programs you are enrolled in', he: 'צפה בכל התוכניות שאתה רשום אליהן' },
    url: '/programs',
    icon: 'folders',
    category: 'education'
  },
  {
    keywords: ['courses', 'קורסים', 'course', 'קורס', 'my courses', 'הקורסים שלי', 'classes', 'שיעורים'],
    title: { en: 'My Courses', he: 'הקורסים שלי' },
    description: { en: 'View all courses you are enrolled in', he: 'צפה בכל הקורסים שאתה רשום אליהם' },
    url: '/courses',
    icon: 'book-open',
    category: 'education'
  },
  {
    keywords: ['help', 'עזרה', 'support', 'תמיכה', 'contact', 'צור קשר', 'assistance', 'סיוע'],
    title: { en: 'Help & Support', he: 'עזרה ותמיכה' },
    description: { en: 'Get help, contact support, view FAQ and documentation', he: 'קבל עזרה, צור קשר עם תמיכה, צפה בשאלות נפוצות ותיעוד' },
    url: '/help',
    icon: 'help-circle',
    category: 'support'
  },
  {
    keywords: ['notifications', 'התראות', 'alerts', 'עדכונים', 'updates'],
    title: { en: 'Notifications', he: 'התראות' },
    description: { en: 'View your notifications and alerts', he: 'צפה בהתראות והעדכונים שלך' },
    url: '/notifications',
    icon: 'bell',
    category: 'navigation'
  },
  {
    keywords: ['logout', 'התנתק', 'sign out', 'יציאה', 'exit'],
    title: { en: 'Sign Out', he: 'התנתקות' },
    description: { en: 'Sign out from your account', he: 'התנתק מהחשבון שלך' },
    url: '/logout',
    icon: 'log-out',
    category: 'navigation'
  },
  {
    keywords: ['password', 'סיסמה', 'change password', 'שינוי סיסמה', 'reset password', 'איפוס סיסמה'],
    title: { en: 'Change Password', he: 'שינוי סיסמה' },
    description: { en: 'Change your account password', he: 'שנה את סיסמת החשבון שלך' },
    url: '/profile?tab=security',
    icon: 'key',
    category: 'account'
  },
  {
    keywords: ['certificate', 'תעודה', 'certificates', 'תעודות', 'diploma', 'דיפלומה'],
    title: { en: 'My Certificates', he: 'התעודות שלי' },
    description: { en: 'View and download your certificates', he: 'צפה והורד את התעודות שלך' },
    url: '/certificates',
    icon: 'award',
    category: 'education'
  },
  {
    keywords: ['schedule', 'לוח זמנים', 'calendar', 'יומן', 'timetable', 'מערכת שעות'],
    title: { en: 'My Schedule', he: 'לוח הזמנים שלי' },
    description: { en: 'View your class schedule and upcoming lessons', he: 'צפה במערכת השעות והשיעורים הקרובים שלך' },
    url: '/schedule',
    icon: 'calendar',
    category: 'education'
  },
  {
    keywords: ['grades', 'ציונים', 'marks', 'scores', 'results', 'תוצאות'],
    title: { en: 'My Grades', he: 'הציונים שלי' },
    description: { en: 'View your grades and assessment results', he: 'צפה בציונים ובתוצאות ההערכה שלך' },
    url: '/grades',
    icon: 'chart-bar',
    category: 'education'
  },
  {
    keywords: ['recording', 'הקלטה', 'recordings', 'הקלטות', 'recorded', 'מוקלט', 'zoom recording', 'הקלטת zoom'],
    title: { en: 'Lesson Recordings', he: 'הקלטות שיעורים' },
    description: { en: 'View recordings of past lessons', he: 'צפה בהקלטות של שיעורים קודמים' },
    url: '/courses',
    icon: 'video',
    category: 'education'
  },
  {
    keywords: ['files', 'קבצים', 'materials', 'חומרים', 'documents', 'מסמכים', 'resources', 'משאבים'],
    title: { en: 'Course Materials', he: 'חומרי קורס' },
    description: { en: 'Access files, documents, and course materials', he: 'גישה לקבצים, מסמכים וחומרי קורס' },
    url: '/courses',
    icon: 'file-text',
    category: 'education'
  }
];

function searchFAQ(query: string, language: 'en' | 'he'): typeof FAQ_PATTERNS {
  const normalizedQuery = query.toLowerCase().trim();

  return FAQ_PATTERNS.filter(faq =>
    faq.keywords.some(keyword =>
      normalizedQuery.includes(keyword.toLowerCase()) ||
      keyword.toLowerCase().includes(normalizedQuery)
    )
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: prevent FAQ spam
    const rateLimitResult = await rateLimiter.limit(
      `chatbot_faq:${user.id}`,
      RATE_LIMITS.CHATBOT_FAQ.limit,
      RATE_LIMITS.CHATBOT_FAQ.windowMs
    );

    if (!rateLimitResult.success) {
      const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: resetIn },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const language = (searchParams.get('lang') || 'he') as 'en' | 'he';

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Query too short' }, { status: 400 });
    }

    const matches = searchFAQ(query, language);

    if (matches.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No FAQ matches found'
      });
    }

    // Format results to match the chatbot interface
    const results = matches.map(match => ({
      id: match.url,
      title: match.title[language],
      description: match.description[language],
      url: match.url,
      icon: match.icon,
      category: match.category
    }));

    return NextResponse.json({
      success: true,
      query,
      results,
      type: 'faq'
    });
  } catch (error) {
    console.error('FAQ API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
