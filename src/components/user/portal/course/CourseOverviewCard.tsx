'use client';

import { BookOpen, Clock, Download, FileText, PlayCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useUserLanguage } from '@/context/AppContext';
import type { CourseData } from './courseModel';

/** The course overview card, kept exactly as it was on the old course page. */
export function CourseOverviewCard({ statistics }: { statistics: CourseData['statistics'] }) {
  const { t } = useUserLanguage();
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 border-b">
        <h3 className="font-bold text-lg">{t('user.courses.statistics.title', 'Course Overview')}</h3>
      </div>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/50 ltr:border-l-4 rtl:border-r-4 border-blue-500">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600 text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-blue-900">{t('user.courses.statistics.students', 'Clients')}</span>
            </div>
            <span className="text-xl font-bold text-blue-600">{statistics?.enrolled_students || 0}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100/50 ltr:border-l-4 rtl:border-r-4 border-purple-500">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-600 text-white">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-purple-900">{t('user.courses.statistics.modules', 'Modules')}</span>
            </div>
            <span className="text-xl font-bold text-purple-600">{statistics?.total_modules || 0}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100/50 ltr:border-l-4 rtl:border-r-4 border-green-500">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-600 text-white">
                <PlayCircle className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-green-900">{t('user.courses.statistics.lessons', 'Lessons')}</span>
            </div>
            <span className="text-xl font-bold text-green-600">{statistics?.total_lessons || 0}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100/50 ltr:border-l-4 rtl:border-r-4 border-orange-500">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-600 text-white">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-orange-900">{t('user.courses.statistics.topics', 'Topics')}</span>
            </div>
            <span className="text-xl font-bold text-orange-600">{statistics?.total_topics || 0}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-pink-50 to-pink-100/50 ltr:border-l-4 rtl:border-r-4 border-pink-500">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-600 text-white">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-pink-900">{t('user.courses.statistics.studyTime', 'Study Time')}</span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xl font-bold text-pink-600">
                {Math.round((statistics?.total_study_time || 0) / 60)} {t('user.courses.statistics.hours', 'h')}
              </span>
              <span className="text-xs text-pink-600/70">
                {Math.round((statistics?.total_study_time || 0) / 45)} {t('user.courses.statistics.academicHours', 'academic hrs')}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-indigo-100/50 ltr:border-l-4 rtl:border-r-4 border-indigo-500">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-600 text-white">
                <Download className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-indigo-900">{t('user.courses.statistics.materials', 'Materials')}</span>
            </div>
            <span className="text-xl font-bold text-indigo-600">{statistics?.materials_count || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
