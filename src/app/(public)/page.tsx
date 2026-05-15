'use client';

export const dynamic = 'force-dynamic';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Users,
  Clock,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Award,
  Target,
  Lightbulb,
  HelpCircle,
  ChevronDown,
  Presentation,
  Compass,
} from 'lucide-react';
import Link from 'next/link';
import { useUserLanguage } from '@/context/AppContext';
import { PublicHeader } from '@/components/public/index';
import { PublicFooter } from '@/components/public/index';
import { BackToTop } from '@/components/public/BackToTop';
import { useEffect, useState } from 'react';

/** Public homepage for IPSPlatform. Product catalog moved to the
 *  IParentingSchool marketing site, so this page is institutional
 *  branding only — hero, stats, How-It-Works, accreditation, FAQ.
 *  "Browse courses" lives in the header (PublicHeader). */
export default function LandingPage() {
  const { t, direction } = useUserLanguage();
  const [mounted, setMounted] = useState(false);

  // Hydration guard — render nothing until mounted so the t() values
  // (which depend on client-side language detection) don't mismatch
  // the SSR output.
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir={direction} suppressHydrationWarning>
      {/* Navigation */}
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative mx-auto px-4 py-16 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                {t('public.hero.badge', 'Transform Your Learning Journey')}
              </span>
            </div>

            <h1 className="mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-6xl lg:text-7xl">
              {t('public.hero.title', 'Learn Without Limits')}
            </h1>

            <p className="text-xl text-muted-foreground md:text-2xl">
              {t('public.hero.subtitle', 'Access quality education from expert instructors. Start learning today.')}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground md:text-4xl">800+</div>
              <div className="mt-2 text-sm text-muted-foreground md:text-base">
                {t('public.stats.students', 'Students')}
              </div>
            </div>

            <div className="text-center">
              <div className="mb-2 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground md:text-4xl">100+</div>
              <div className="mt-2 text-sm text-muted-foreground md:text-base">
                {t('public.stats.courses', 'Courses')}
              </div>
            </div>

            <div className="text-center">
              <div className="mb-2 flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground md:text-4xl">30+</div>
              <div className="mt-2 text-sm text-muted-foreground md:text-base">
                {t('public.stats.instructors', 'Expert Instructors')}
              </div>
            </div>

            <div className="text-center">
              <div className="mb-2 flex items-center justify-center">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground md:text-4xl">10,000+</div>
              <div className="mt-2 text-sm text-muted-foreground md:text-base">
                {t('public.stats.hours', 'Learning Hours')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Learn With Us — cross-link to IParentingSchool ============
          Three cards pointing at the catalog surfaces that live on the
          marketing site. Programs → home anchor, Courses → /courses,
          Lectures → /lectures. Base URL from env so it's
          environment-configurable; the section silently doesn't render
          when the env var is missing (e.g. early dev setup).

          Copy is hardcoded bilingual because these new keys aren't yet
          in the DB-backed `t()` translation table. Once a DB row is
          added we can swap to `t('public.learnWithUs.…')` calls. */}
      <LearnWithUsSection isRtl={direction === 'rtl'} />

      {/* How It Works Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {t('howItWorks.badge', 'Simple Process')}
              </span>
            </div>
            <h2 className="text-4xl font-bold text-foreground md:text-5xl mb-4">
              {t('howItWorks.title', 'How It Works')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('howItWorks.subtitle', 'Start your learning journey in 4 simple steps')}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {/* Step 1 */}
            <Card className="relative p-6 text-center border-2 hover:border-primary transition-colors">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                1
              </div>
              <div className="mt-4 mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">
                {t('howItWorks.step1.title', 'Choose Your Program')}
              </h3>
              <p className="text-muted-foreground">
                {t('howItWorks.step1.description', 'Browse our programs and courses to find the perfect fit for your goals')}
              </p>
            </Card>

            {/* Step 2 */}
            <Card className="relative p-6 text-center border-2 hover:border-primary transition-colors">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                2
              </div>
              <div className="mt-4 mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">
                {t('howItWorks.step2.title', 'Enroll & Complete Profile')}
              </h3>
              <p className="text-muted-foreground">
                {t('howItWorks.step2.description', 'Sign up, complete your profile, and choose your payment plan')}
              </p>
            </Card>

            {/* Step 3 */}
            <Card className="relative p-6 text-center border-2 hover:border-primary transition-colors">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                3
              </div>
              <div className="mt-4 mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">
                {t('howItWorks.step3.title', 'Learn at Your Pace')}
              </h3>
              <p className="text-muted-foreground">
                {t('howItWorks.step3.description', 'Access lessons, participate in live sessions, and engage with the community')}
              </p>
            </Card>

            {/* Step 4 */}
            <Card className="relative p-6 text-center border-2 hover:border-primary transition-colors">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                4
              </div>
              <div className="mt-4 mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">
                {t('howItWorks.step4.title', 'Get Certified')}
              </h3>
              <p className="text-muted-foreground">
                {t('howItWorks.step4.description', 'Complete your program and receive your professional certification')}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Accreditation Section */}
      <section className="py-16 md:py-20 border-y bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {t('accreditation.badge', 'Accreditation')}
              </span>
            </div>
            <h2 className="text-4xl font-bold text-foreground md:text-5xl mb-6">
              {t('accreditation.title', 'Internationally Recognized Certification')}
            </h2>
            <p className="text-lg text-muted-foreground mb-12">
              {t('accreditation.description', 'Our programs are developed in partnership with leading academic institutions and professional organizations')}
            </p>

            <div className="grid gap-8 md:grid-cols-3 mb-12">
              <Card className="p-6 border-2">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  {t('accreditation.university.title', 'University Partnership')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('accreditation.university.description', 'Certified by University of Haifa Clinical Center')}
                </p>
              </Card>

              <Card className="p-6 border-2">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  {t('accreditation.adler.title', 'Adler Methodology')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('accreditation.adler.description', 'Based on Alfred Adler\'s proven approach to parent guidance')}
                </p>
              </Card>

              <Card className="p-6 border-2">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  {t('accreditation.professional.title', 'Professional Recognition')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('accreditation.professional.description', 'Recognized by professional parent guidance associations')}
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {t('faq.badge', 'FAQ')}
                </span>
              </div>
              <h2 className="text-4xl font-bold text-foreground md:text-5xl mb-4">
                {t('faq.title', 'Frequently Asked Questions')}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t('faq.subtitle', 'Everything you need to know about our programs')}
              </p>
            </div>

            <div className="space-y-4">
              <FAQItem
                question={t('faq.q1.question', 'How long are the programs?')}
                answer={t('faq.q1.answer', 'Program duration varies. Most of our comprehensive parent guidance programs run for 8-12 months, with flexible scheduling to accommodate your needs.')}
              />
              <FAQItem
                question={t('faq.q2.question', 'Are the sessions live or recorded?')}
                answer={t('faq.q2.answer', 'We offer both live online sessions and recorded content. Live sessions allow real-time interaction with instructors, while recordings enable you to learn at your own pace.')}
              />
              <FAQItem
                question={t('faq.q3.question', 'What certification will I receive?')}
                answer={t('faq.q3.answer', 'Upon successful completion, you will receive a professional certification recognized by the University of Haifa Clinical Center and professional parent guidance associations.')}
              />
              <FAQItem
                question={t('faq.q4.question', 'What are the payment options?')}
                answer={t('faq.q4.answer', 'We offer flexible payment plans including one-time payment, deposit with installments, and subscription options. Payment plans can be customized during enrollment.')}
              />
              <FAQItem
                question={t('faq.q5.question', 'Do I need prior experience?')}
                answer={t('faq.q5.answer', 'No prior experience is required for most programs. Our courses are designed for both beginners and those seeking to enhance their existing knowledge in parent guidance.')}
              />
              <FAQItem
                question={t('faq.q6.question', 'Can I access course materials after completion?')}
                answer={t('faq.q6.answer', 'Yes! Once enrolled, you maintain lifetime access to all course materials, allowing you to revisit content whenever needed.')}
              />
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">
                {t('faq.stillHaveQuestions', 'Still have questions?')}
              </p>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  {t('faq.contactUs', 'Contact Us')}
                  <ArrowRight className={`h-4 w-4 ${direction === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter />

      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <h3 className="font-semibold text-lg pr-4">{question}</h3>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-6 text-muted-foreground">
          <p>{answer}</p>
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// LearnWithUsSection — three-card cross-link to the IParentingSchool catalog
// ============================================================================

/** Single learning-track card. Renders inside LearnWithUsSection. */
function TrackCard({
  href,
  Icon,
  title,
  description,
  cta,
  isRtl,
}: {
  href: string;
  Icon: typeof GraduationCap;
  title: string;
  description: string;
  cta: string;
  isRtl: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <Card className="h-full p-6 md:p-8 border-2 hover:border-primary hover:shadow-lg transition-all">
        <div className="mb-5 flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Icon className="h-7 w-7" />
          </div>
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-center mb-3">
          {title}
        </h3>
        <p className="text-muted-foreground text-center leading-relaxed mb-5">
          {description}
        </p>
        <div className="flex justify-center text-primary font-semibold gap-1.5 items-center">
          <span>{cta}</span>
          <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''} group-hover:translate-x-1 transition-transform`} />
        </div>
      </Card>
    </a>
  );
}

/** "Learn With Us" — three cards linking out to the IParentingSchool
 *  marketing site (programs / courses / lectures). Hebrew + English
 *  copy lives inline (not in the DB translation table) so the section
 *  works out of the box; migrate to `t()` once the keys exist server-side. */
function LearnWithUsSection({ isRtl }: { isRtl: boolean }) {
  const base = process.env.NEXT_PUBLIC_IPARENTING_URL;
  if (!base) return null;

  const copy = isRtl
    ? {
        badge: 'מה ללמוד אצלנו',
        title: 'התחילו את מסע הלמידה שלכם',
        subtitle:
          'בחרו את המסלול שמתאים לכם — מתוכניות לימוד מקיפות ועד הרצאות וסדנאות בודדות.',
        programs: {
          title: 'תוכניות לימוד',
          description:
            'מסלולי לימוד מובנים בליווי אקדמי, לאנשי מקצוע ולמדריכי הורים בכל שלבי הקריירה.',
          cta: 'לתוכניות הלימוד',
        },
        courses: {
          title: 'קורסים',
          description:
            'קורסים פרטניים להעמקה בתחומים ספציפיים — הורות אדלריאנית, ADHD, ויסות חושי ועוד.',
          cta: 'לכל הקורסים',
        },
        lectures: {
          title: 'הרצאות וסדנאות',
          description:
            'מפגשים חד-פעמיים — הרצאות מבוא, סדנאות מעשיות וכנסים מקצועיים פתוחים להורים ולמטפלים.',
          cta: 'להרצאות ולסדנאות',
        },
      }
    : {
        badge: 'Learn With Us',
        title: 'Start Your Learning Journey',
        subtitle:
          'Pick the path that fits — from full study programs to individual lectures and workshops.',
        programs: {
          title: 'Study Programs',
          description:
            'Structured learning paths with academic backing, for professionals and parent coaches at every career stage.',
          cta: 'View Programs',
        },
        courses: {
          title: 'Courses',
          description:
            'Individual courses for deep-dives into specific topics — Adlerian parenting, ADHD, sensory regulation, and more.',
          cta: 'View Courses',
        },
        lectures: {
          title: 'Lectures & Workshops',
          description:
            'One-off sessions — intro talks, hands-on workshops, and professional conferences open to parents and clinicians.',
          cta: 'View Lectures & Workshops',
        },
      };

  return (
    <section className="py-16 md:py-20" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
            <Compass className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{copy.badge}</span>
          </div>
          <h2 className="text-4xl font-bold text-foreground md:text-5xl mb-4">
            {copy.title}
          </h2>
          <p className="text-lg text-muted-foreground">{copy.subtitle}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          <TrackCard
            href={`${base}/#programs`}
            Icon={GraduationCap}
            title={copy.programs.title}
            description={copy.programs.description}
            cta={copy.programs.cta}
            isRtl={isRtl}
          />
          <TrackCard
            href={`${base}/courses`}
            Icon={BookOpen}
            title={copy.courses.title}
            description={copy.courses.description}
            cta={copy.courses.cta}
            isRtl={isRtl}
          />
          <TrackCard
            href={`${base}/lectures`}
            Icon={Presentation}
            title={copy.lectures.title}
            description={copy.lectures.description}
            cta={copy.lectures.cta}
            isRtl={isRtl}
          />
        </div>
      </div>
    </section>
  );
}
