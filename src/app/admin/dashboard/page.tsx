'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Users, BookOpen, DollarSign, TrendingUp, Video, Calendar } from 'lucide-react';
import Link from 'next/link';

const mockData = {
  stats: {
    totalUsers: 1,
    totalCourses: 0,
    totalRevenue: 0,
    activeStudents: 0,
    activeInstructors: 0,
    upcomingLessons: 0,
  },
  recentEnrollments: [],
  topCourses: [],
};

export default function AdminDashboardPage() {
  const { t } = useAdminLanguage();

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {t('admin.dashboard.title', 'Admin Dashboard')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.dashboard.subtitle', 'Platform overview and management')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t('admin.stats.totalUsers', 'Total Users')}
              </p>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{mockData.stats.totalUsers}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {mockData.stats.activeStudents} {t('admin.stats.students', 'students')}, {mockData.stats.activeInstructors} {t('admin.stats.instructors', 'instructors')}
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t('admin.stats.totalCourses', 'Total Courses')}
              </p>
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{mockData.stats.totalCourses}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('admin.stats.noCourses', 'No courses yet')}
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t('admin.stats.totalRevenue', 'Total Revenue')}
              </p>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">
              ₪{mockData.stats.totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('admin.stats.noRevenue', 'No revenue yet')}
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t('admin.stats.upcomingLessons', 'Upcoming Lessons')}
              </p>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{mockData.stats.upcomingLessons}</p>
          </div>
        </div>

        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-2">
            {t('admin.welcome.title', 'Welcome to Your Platform')}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t('admin.welcome.subtitle', 'Start by configuring your platform settings, adding languages, and creating your first program.')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/config/languages"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {t('admin.welcome.configLanguages', 'Configure Languages')}
            </Link>
            <Link
              href="/admin/config/settings"
              className="px-4 py-2 bg-card border rounded-md hover:bg-accent transition-colors"
            >
              {t('admin.welcome.platformSettings', 'Platform Settings')}
            </Link>
            <Link
              href="/admin/settings"
              className="px-4 py-2 bg-card border rounded-md hover:bg-accent transition-colors"
            >
              {t('admin.welcome.customizeTheme', 'Customize Theme')}
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">
            {t('admin.quickActions.title', 'Quick Actions')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/config/languages"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-muted transition-colors group"
            >
              <Video className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-center">
                {t('admin.quickActions.languages', 'Manage Languages')}
              </span>
            </Link>
            <Link
              href="/admin/config/translations"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-muted transition-colors group"
            >
              <BookOpen className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-center">
                {t('admin.quickActions.translations', 'Edit Translations')}
              </span>
            </Link>
            <Link
              href="/admin/config/integrations"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-muted transition-colors group"
            >
              <Users className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-center">
                {t('admin.quickActions.integrations', 'Setup Integrations')}
              </span>
            </Link>
            <Link
              href="/admin/config/features"
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-muted transition-colors group"
            >
              <TrendingUp className="h-8 w-8 mb-2 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-center">
                {t('admin.quickActions.features', 'Feature Flags')}
              </span>
            </Link>
          </div>
        </div>

        {/* Configuration Checklist */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">
            {t('admin.checklist.title', 'Setup Checklist')}
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium">{t('admin.checklist.database', 'Database Setup')}</p>
                <p className="text-sm text-muted-foreground">{t('admin.checklist.databaseDesc', 'All tables created successfully')}</p>
              </div>
            </div>

            <Link href="/admin/config/languages" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors">
              <div className="h-6 w-6 rounded-full border-2 border-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t('admin.checklist.languages', 'Configure Languages')}</p>
                <p className="text-sm text-muted-foreground">{t('admin.checklist.languagesDesc', 'Add or manage platform languages')}</p>
              </div>
            </Link>

            <Link href="/admin/config/integrations" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors">
              <div className="h-6 w-6 rounded-full border-2 border-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t('admin.checklist.integrations', 'Setup Integrations')}</p>
                <p className="text-sm text-muted-foreground">{t('admin.checklist.integrationsDesc', 'Configure Zoom, Stripe, and other services')}</p>
              </div>
            </Link>

            <Link href="/admin/programs" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors">
              <div className="h-6 w-6 rounded-full border-2 border-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{t('admin.checklist.programs', 'Create First Program')}</p>
                <p className="text-sm text-muted-foreground">{t('admin.checklist.programsDesc', 'Start building your course catalog')}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
