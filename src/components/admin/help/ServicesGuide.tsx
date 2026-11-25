'use client';

/**
 * "Which service should I create?" A user manual in a dialog: for each of our
 * services (program, standalone course, lecture, club, bundle, personal
 * guidance) what to build, in what order, what to choose at each step, what
 * the client sees and how payment works. Opened from the compass icon in the
 * admin header and from the Help drawer (approved mockup).
 */

import { useState } from 'react';
import Link from 'next/link';
import { Compass, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAdminLanguage } from '@/context/AppContext';
import { useHelpContext } from '@/context/HelpContext';
import { GUIDE_SERVICES, type GuideText } from './servicesGuideContent';

const K = 'admin.servicesGuide.';

/** The header icon. */
export function ServicesGuideButton({ className }: { className?: string }) {
  const { openGuide } = useHelpContext();
  const { t } = useAdminLanguage();
  const label = t(`${K}open`, 'Which service should I create?');
  return (
    <Button variant="ghost" size="icon" onClick={openGuide} className={className} aria-label={label} title={label}>
      <Compass className="h-5 w-5" />
    </Button>
  );
}

/** The dialog, mounted once in the admin layout. */
export function ServicesGuide() {
  const { guideOpen, closeGuide } = useHelpContext();
  const { t, direction } = useAdminLanguage();
  const [picked, setPicked] = useState(GUIDE_SERVICES[0].id);
  const tx = (g: GuideText) => t(g.key, g.en);
  const cur = GUIDE_SERVICES.find((s) => s.id === picked) ?? GUIDE_SERVICES[0];
  const tip = tx(cur.tip);

  return (
    <Dialog open={guideOpen} onOpenChange={(open) => !open && closeGuide()}>
      <DialogContent
        dir={direction}
        className="flex h-[90dvh] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:rounded-3xl"
      >
        <header className="shrink-0 border-b border-border px-5 pb-4 pt-5 pe-12 sm:px-7">
          <DialogTitle className="text-xl font-extrabold [font-family:inherit] sm:text-2xl">{t(`${K}open`, 'Which service should I create?')}</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground sm:text-[15px]">
            {t(`${K}subtitle`, 'A short guide for each service: what to build, in what order, what to choose at each step, and what the client sees.')}
          </DialogDescription>
        </header>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* The services: a column on a computer, a row of pills on a phone. */}
          <nav
            aria-label={t(`${K}servicesLabel`, 'Services')}
            className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-border bg-muted/40 p-2.5 md:w-[270px] md:flex-col md:overflow-y-auto md:border-b-0 md:border-e md:p-3.5"
          >
            {GUIDE_SERVICES.map((s, i) => {
              const on = s.id === cur.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPicked(s.id)}
                  className={`flex min-h-[44px] shrink-0 items-start gap-3 rounded-xl border-2 p-2.5 text-start transition-colors md:w-full md:p-3 ${
                    on ? 'border-primary bg-card' : 'border-transparent hover:bg-card/70'
                  }`}
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[13px] font-extrabold ${
                      on ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="whitespace-nowrap text-[15px] font-bold md:whitespace-normal">{tx(s.name)}</span>
                    <span className="hidden text-[13px] leading-snug text-muted-foreground md:block">{tx(s.tagline)}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-5 sm:p-7 lg:flex-row">
            <article className="flex min-w-0 flex-1 flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="self-start rounded-full bg-primary/10 px-2.5 py-1 text-[13px] font-bold text-primary">{tx(cur.name)}</span>
                <h3 className="text-xl font-extrabold [font-family:inherit]">{tx(cur.tagline)}</h3>
                <p className="text-[15px] leading-relaxed text-foreground/80">
                  <b>{t(`${K}whenLead`, 'Right for you when')}</b>
                  {tx(cur.when)}
                </p>
              </div>

              <h4 className="text-[15px] font-bold text-muted-foreground">{t(`${K}stepsTitle`, 'What to build, in order')}</h4>
              <ol className="flex flex-col gap-3">
                {cur.steps.map((st, i) => (
                  <li key={st.title.key} className="flex gap-3.5 rounded-2xl border border-border p-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-[15px] font-extrabold text-primary-foreground">
                      {i + 1}
                    </span>
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold">{tx(st.title)}</span>
                        <span className="rounded-lg bg-muted px-2 py-0.5 text-xs font-semibold text-foreground/75">{tx(st.where)}</span>
                      </div>
                      <span className="text-sm leading-relaxed text-foreground/80">{tx(st.choose)}</span>
                    </div>
                  </li>
                ))}
              </ol>

              {tip && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                  <b>{t(`${K}note`, 'Note:')} </b>
                  {tip}
                </p>
              )}
            </article>

            <aside className="flex shrink-0 flex-col gap-4 lg:w-[290px]">
              <div className="flex flex-col gap-2.5">
                <h4 className="text-[15px] font-bold text-muted-foreground">{t(`${K}clientSees`, 'What the client sees in the portal')}</h4>
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="flex h-[88px] items-start gap-1.5 p-3" style={{ background: cur.cover }}>
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">{tx(cur.kicker)}</span>
                    {cur.badge && (
                      <span className="rounded-full bg-[#e3f4ea] px-2.5 py-0.5 text-xs font-bold text-[#1f6b3f]">{tx(cur.badge)}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 px-4 py-3.5">
                    <span className="text-base font-extrabold">{tx(cur.cardTitle)}</span>
                    <span className="text-[13px] text-muted-foreground">{tx(cur.cardLine)}</span>
                    {cur.progress != null && (
                      <span className="block h-1.5 overflow-hidden rounded-full bg-primary/10">
                        <span className="block h-full rounded-full bg-primary" style={{ width: `${cur.progress}%` }} />
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-foreground/80">{tx(cur.sees)}</p>
              </div>

              <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-muted/40 p-4">
                <span className="flex items-center gap-2 text-[15px] font-bold">
                  <CreditCard className="h-[18px] w-[18px] text-primary" aria-hidden />
                  {t(`${K}howPay`, 'How payment works')}
                </span>
                <span className="text-sm leading-relaxed text-foreground/80">{tx(cur.pay)}</span>
              </div>
            </aside>
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3.5 sm:px-7">
          <span className="text-sm text-muted-foreground">
            {t(`${K}firstStep`, 'First step:')} <b className="text-foreground">{tx(cur.first)}</b>
          </span>
          <Link
            href={cur.href}
            onClick={closeGuide}
            className="inline-flex min-h-[46px] items-center rounded-xl bg-primary px-5 text-[15px] font-bold text-primary-foreground no-underline hover:bg-primary/90"
          >
            {tx(cur.cta)}
          </Link>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
