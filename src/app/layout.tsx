import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { Toaster } from 'sonner';

const heebo = Heebo({ subsets: ['hebrew', 'latin'], weight: ['300', '400', '500', '600', '700'] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'פלטפורמת בית הספר להורות | Parenting School Platform',
  description: 'פלטפורמה מקוונת לחינוך הורי | Online parenting education platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Helper to get cookie value
                  function getCookie(name) {
                    var value = '; ' + document.cookie;
                    var parts = value.split('; ' + name + '=');
                    if (parts.length === 2) return parts.pop().split(';').shift();
                    return null;
                  }

                  // Set language and direction
                  var pathname = window.location.pathname;
                  var cookieLang = getCookie('user_language');
                  var userLangStored = localStorage.getItem('user_language');
                  var adminLangStored = localStorage.getItem('admin_language');

                  // Public pages (signup, login, reset-password, verify-email) should always be LTR/English
                  var publicPages = ['/signup', '/login', '/reset-password', '/verify-email'];
                  var isPublicPage = publicPages.some(function(page) { return pathname.startsWith(page); });

                  var isAdminPage = pathname.startsWith('/admin');

                  // Force English (LTR) for public pages
                  var lang;
                  if (isPublicPage) {
                    lang = 'en';
                  } else if (isAdminPage) {
                    lang = adminLangStored || cookieLang || userLangStored || 'he';
                  } else {
                    // Check cookie first (set by server), then localStorage
                    lang = (cookieLang && cookieLang !== 'auto') ? cookieLang : (userLangStored || adminLangStored || 'he');
                  }

                  var rtlLanguages = ['he', 'ar', 'fa', 'ur', 'yi'];
                  var dir = rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
                  document.documentElement.lang = lang;
                  document.documentElement.dir = dir;

                  // Load cached theme to prevent flash
                  var cachedTheme = localStorage.getItem('cached_theme');
                  if (cachedTheme) {
                    try {
                      var theme = JSON.parse(cachedTheme);
                      var root = document.documentElement;

                      // Check if user prefers dark mode
                      var themePreference = localStorage.getItem('theme') || 'system';
                      var isDark = themePreference === 'dark' ||
                                   (themePreference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

                      // Add dark class if needed
                      if (isDark) {
                        root.classList.add('dark');
                      }

                      // Apply base theme CSS variables immediately (light mode first)
                      if (theme.light_primary) root.style.setProperty('--primary', theme.light_primary);
                      if (theme.light_background) root.style.setProperty('--background', theme.light_background);
                      if (theme.light_foreground) root.style.setProperty('--foreground', theme.light_foreground);
                      if (theme.light_card) root.style.setProperty('--card', theme.light_card);
                      if (theme.light_border) root.style.setProperty('--border', theme.light_border);
                      if (theme.light_text_body) root.style.setProperty('--text-body', theme.light_text_body);
                      if (theme.light_text_heading) root.style.setProperty('--text-heading', theme.light_text_heading);
                      if (theme.font_size_base) root.style.setProperty('--font-size-base', theme.font_size_base);
                      if (theme.font_family_primary) root.style.setProperty('--font-family-primary', theme.font_family_primary);

                      // If dark mode, override with dark colors
                      if (isDark) {
                        if (theme.dark_primary) root.style.setProperty('--primary', theme.dark_primary);
                        if (theme.dark_background) root.style.setProperty('--background', theme.dark_background);
                        if (theme.dark_foreground) root.style.setProperty('--foreground', theme.dark_foreground);
                        if (theme.dark_card) root.style.setProperty('--card', theme.dark_card);
                        if (theme.dark_border) root.style.setProperty('--border', theme.dark_border);
                        if (theme.dark_text_body) root.style.setProperty('--text-body', theme.dark_text_body);
                        if (theme.dark_text_heading) root.style.setProperty('--text-heading', theme.dark_text_heading);
                        if (theme.dark_card_foreground) root.style.setProperty('--card-foreground', theme.dark_card_foreground);
                        if (theme.dark_popover) root.style.setProperty('--popover', theme.dark_popover);
                        if (theme.dark_popover_foreground) root.style.setProperty('--popover-foreground', theme.dark_popover_foreground);
                        if (theme.dark_primary_foreground) root.style.setProperty('--primary-foreground', theme.dark_primary_foreground);
                        if (theme.dark_secondary) root.style.setProperty('--secondary', theme.dark_secondary);
                        if (theme.dark_secondary_foreground) root.style.setProperty('--secondary-foreground', theme.dark_secondary_foreground);
                        if (theme.dark_muted) root.style.setProperty('--muted', theme.dark_muted);
                        if (theme.dark_muted_foreground) root.style.setProperty('--muted-foreground', theme.dark_muted_foreground);
                        if (theme.dark_accent) root.style.setProperty('--accent', theme.dark_accent);
                        if (theme.dark_accent_foreground) root.style.setProperty('--accent-foreground', theme.dark_accent_foreground);
                        if (theme.dark_input) root.style.setProperty('--input', theme.dark_input);
                        if (theme.dark_ring) root.style.setProperty('--ring', theme.dark_ring);
                        if (theme.dark_text_muted) root.style.setProperty('--text-muted', theme.dark_text_muted);
                        if (theme.dark_text_link) root.style.setProperty('--text-link', theme.dark_text_link);
                      }
                    } catch (e) {
                      console.error('[THEME CACHE] Parse error:', e);
                    }
                  }
                } catch (e) {
                  console.error('[INLINE SCRIPT] Error:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={heebo.className} suppressHydrationWarning>
        <QueryProvider>
          <AppProvider>
            <ThemeProvider>
              {children}
              <Toaster position="top-right" richColors />
            </ThemeProvider>
          </AppProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
