'use client';

/**
 * The frame of the portal's home page (option C): the top bar with the logo,
 * name and language, and the picture beside the form (on top on a phone).
 * The login page and the reset password page put their own form inside it,
 * so "Forgot password?" looks like the same page with a different form.
 *
 * The picture and words come from Settings → Login page in the admin.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Home } from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { DEFAULT_LOGIN_IMAGE, readLoginPage, type LoginPageContent } from '@/lib/portal/loginPage';

/** The form's box: a white sheet over the picture on a phone, a column beside it on a computer. */
export const LOGIN_PANEL =
  'relative z-[1] -mt-7 flex flex-1 flex-col gap-5 rounded-t-[28px] bg-white px-5 pb-6 pt-7 lg:mt-0 lg:w-[420px] lg:flex-none lg:justify-center lg:rounded-none lg:bg-transparent lg:p-0';

export const LOGIN_INPUT =
  'h-[52px] w-full rounded-xl border-[1.5px] border-[#e9e3f1] bg-white px-4 text-base text-[#221a2e] placeholder:text-[#a59cb8] focus:border-[#5b3a8e] focus:outline-none focus:ring-[3px] focus:ring-[#e4daf3]';

export const LOGIN_BUTTON =
  'h-[54px] rounded-xl bg-[#221a2e] text-lg font-bold text-white transition-colors hover:bg-[#3d2466] disabled:opacity-70';

export const LOGIN_TITLE = 'm-0 text-[30px] font-extrabold leading-tight text-[#221a2e] [font-family:inherit] lg:text-[44px]';

type Org = { name: string; logo_url: string | null; page: LoginPageContent };

// Kept between the login and reset pages, so moving between them shows the
// saved picture at once instead of the built-in one first. Also kept for the
// browser tab (sessionStorage), for a reload.
const STORE_KEY = 'ips_login_shell_v1';
let remembered: Org | null = null;

function readStored(): Org | null {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return { name: String(d.name ?? ''), logo_url: d.logo_url ?? null, page: readLoginPage(d.page) };
  } catch {
    return null;
  }
}

export function LoginShell({
  children,
}: {
  /** The form. Gets the saved login page content (null while loading) and the
   *  "To the website" link, which the form shows at its bottom on a phone. */
  children: (page: LoginPageContent | null, siteLink: ReactNode) => ReactNode;
}) {
  const { t, direction, language } = useUserLanguage();
  const [org, setOrg] = useState<Org | null>(remembered);
  // Nothing is shown until the saved picture, logo and words are known (or
  // could not be loaded), so the built-in ones never flash first.
  const [ready, setReady] = useState(remembered !== null);

  useEffect(() => {
    if (!remembered) {
      const stored = readStored();
      if (stored) {
        remembered = stored;
        setOrg(stored);
        setReady(true);
      }
    }
    fetch('/api/public/tenant')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.tenant) return;
        const next: Org = { name: d.tenant.name ?? '', logo_url: d.tenant.logo_url ?? null, page: readLoginPage(d.tenant.login_page) };
        remembered = next;
        try {
          sessionStorage.setItem(STORE_KEY, JSON.stringify(next));
        } catch {
          /* private mode: the in-memory copy still covers moving between pages */
        }
        setOrg(next);
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  const page = org?.page ?? null;
  const captionText = language === 'he' && page?.caption ? page.caption : t('auth.login.photoCaption', 'Everything you bought and signed up for, in one place');
  const imageUrl = page?.image_url || DEFAULT_LOGIN_IMAGE;
  const logo = org?.logo_url || '/IPS.png';
  const siteLink = page?.site_url ? (
    <a href={page.site_url} className="inline-flex min-h-[44px] items-center px-1 text-sm text-[#73698a] no-underline hover:text-[#221a2e]">
      {t('auth.login.toWebsite', 'To the website')}
    </a>
  ) : null;

  return (
    <div
      className={`flex min-h-screen flex-col bg-[#faf8fd] text-[#221a2e] transition-opacity duration-200 ${ready ? 'opacity-100' : 'opacity-0'}`}
      dir={direction}
    >
      {/* Top bar (computer). On a phone the logo and language sit on the picture. */}
      <header className="hidden items-center justify-between border-b border-[#e9e3f1] bg-white px-12 py-4 lg:flex">
        <div className="flex items-center gap-3">
          {ready && <img src={logo} alt="" className="h-11 w-10 object-contain" />}
          {org?.name && <span className="text-lg font-bold">{org.name}</span>}
        </div>
        <div className="flex items-center gap-6">
          {siteLink}
          <LanguageSwitcher context="user" />
        </div>
      </header>

      <main className="flex flex-1 flex-col lg:flex-row lg:items-stretch lg:gap-14 lg:px-12 lg:py-10">
        {children(page, siteLink)}

        {/* The picture: beside the form on a computer, on top on a phone. */}
        <figure className="relative order-first m-0 h-[260px] shrink-0 overflow-hidden bg-[#e9e3f1] lg:order-none lg:h-auto lg:min-h-[560px] lg:flex-1 lg:rounded-[28px]">
          {ready && <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover object-[55%_35%] lg:object-[50%_30%]" />}
          <div className="absolute inset-x-4 top-2 flex items-center justify-between gap-2 lg:hidden">
            <span className="flex min-w-0 items-center gap-2 rounded-full bg-white py-1.5 pe-3 ps-1.5">
              {ready && <img src={logo} alt="" className="h-[30px] w-7 shrink-0 object-contain" />}
              {org?.name && <span className="truncate text-sm font-bold">{org.name}</span>}
            </span>
            <span className="inline-flex shrink-0 items-center rounded-full bg-white px-1">
              <LanguageSwitcher context="user" />
            </span>
          </div>
          {captionText && (
            <figcaption className="absolute inset-x-6 bottom-6 hidden items-center gap-3.5 rounded-[18px] bg-white px-5 py-4 lg:flex">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f3edfa]">
                <Home className="h-[22px] w-[22px] text-[#5b3a8e]" aria-hidden />
              </span>
              <span className="text-base font-semibold">{captionText}</span>
            </figcaption>
          )}
        </figure>
      </main>
    </div>
  );
}
