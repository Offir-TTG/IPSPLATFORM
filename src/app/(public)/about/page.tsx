'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useUserLanguage } from '@/context/AppContext';
import { PublicHeader } from '@/components/public/index';
import { PublicFooter } from '@/components/public/index';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Users, BookOpen, Award, Target, Building2 } from 'lucide-react';

export default function AboutPage() {
  const { t, direction } = useUserLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <PublicHeader />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            {/* Hero */}
            <div className="mb-12 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="mb-4 text-4xl font-bold text-foreground">
                {mounted ? t('about.title', 'About the International Parenting School') : 'About the International Parenting School'}
              </h1>
            </div>

            {/* Main Introduction */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {mounted ? t('about.intro', 'The International Parenting School is an online institution specializing in parenting, family relationships, and training professionals to work with parents and families. The school operates in Israel and worldwide, offering professional, knowledge-based solutions to two complementary audiences: parents seeking guidance and support in their parenting journey, and professionals interested in training, enrichment, and professional development in the field of parenting.') : 'The International Parenting School is an online institution specializing in parenting, family relationships, and training professionals to work with parents and families. The school operates in Israel and worldwide, offering professional, knowledge-based solutions to two complementary audiences: parents seeking guidance and support in their parenting journey, and professionals interested in training, enrichment, and professional development in the field of parenting.'}
                </p>
              </CardContent>
            </Card>

            {/* Sections Grid */}
            <div className="space-y-8">
              {/* Parent Support */}
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center gap-3">
                    <Users className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">
                      {mounted ? t('about.parents.title', 'Guidance and Support for Parents') : 'Guidance and Support for Parents'}
                    </h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {mounted ? t('about.parents.content', 'The school accompanies parents in dealing with the challenges of modern parenting, while strengthening balanced family functioning, mutual communication, and cooperation between parents and their children. The parent programs are based on the principles of Adlerian psychology according to Alfred Adler, and are built from the real needs of families for professional, focused, and applicable guidance that enables practical and sustainable change in daily life. Learning combines theoretical knowledge, practical tools, practice, ongoing monitoring, and feedback - until achieving real results.') : 'The school accompanies parents in dealing with the challenges of modern parenting, while strengthening balanced family functioning, mutual communication, and cooperation between parents and their children. The parent programs are based on the principles of Adlerian psychology according to Alfred Adler, and are built from the real needs of families for professional, focused, and applicable guidance that enables practical and sustainable change in daily life. Learning combines theoretical knowledge, practical tools, practice, ongoing monitoring, and feedback - until achieving real results.'}
                  </p>
                </CardContent>
              </Card>

              {/* Professional Training */}
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center gap-3">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">
                      {mounted ? t('about.professionals.title', 'Training and Professional Development for Professionals') : 'Training and Professional Development for Professionals'}
                    </h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {mounted ? t('about.professionals.content', 'Concurrently, the school operates training and enrichment programs for professionals working with parents and families - therapists, counselors, educators, and other therapeutic roles. These programs are based on deep theoretical knowledge, practical experience, and a high standard of training, while relying on the psychological approach of Alfred Adler. The training process includes development of professional skills, expansion of the toolkit, professional guidance, and implementation in fieldwork.') : 'Concurrently, the school operates training and enrichment programs for professionals working with parents and families - therapists, counselors, educators, and other therapeutic roles. These programs are based on deep theoretical knowledge, practical experience, and a high standard of training, while relying on the psychological approach of Alfred Adler. The training process includes development of professional skills, expansion of the toolkit, professional guidance, and implementation in fieldwork.'}
                  </p>
                </CardContent>
              </Card>

              {/* Academic Collaboration */}
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">
                      {mounted ? t('about.collaboration.title', 'Academic Collaboration with the University of Haifa') : 'Academic Collaboration with the University of Haifa'}
                    </h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {mounted ? t('about.collaboration.content', 'The parent educator training programs of the International Parenting School operate within the Continuing Education Unit of the University of Haifa, in full academic collaboration. Program graduates are entitled to a Parent Educator Certificate in the Alfred Adler approach, awarded jointly by the University of Haifa and the International Parenting School. This collaboration ensures a high academic standard, professional recognition, and practical training adapted to field needs and practical work with parents and families.') : 'The parent educator training programs of the International Parenting School operate within the Continuing Education Unit of the University of Haifa, in full academic collaboration. Program graduates are entitled to a Parent Educator Certificate in the Alfred Adler approach, awarded jointly by the University of Haifa and the International Parenting School. This collaboration ensures a high academic standard, professional recognition, and practical training adapted to field needs and practical work with parents and families.'}
                  </p>
                </CardContent>
              </Card>

              {/* Vision */}
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center gap-3">
                    <Target className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">
                      {mounted ? t('about.vision.title', 'Our Vision') : 'Our Vision'}
                    </h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {mounted ? t('about.vision.content', 'The vision of the International Parenting School is to promote beneficial parenting and strengthen the quality of training and professional work with parents and families, through a combination of theoretical knowledge, practical application, and human values, according to the conception of Alfred Adler, and from a commitment to excellence and long-term impact.') : 'The vision of the International Parenting School is to promote beneficial parenting and strengthen the quality of training and professional work with parents and families, through a combination of theoretical knowledge, practical application, and human values, according to the conception of Alfred Adler, and from a commitment to excellence and long-term impact.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
