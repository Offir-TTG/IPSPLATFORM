'use client';

import { Card } from '@/components/ui/card';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Award,
  Calendar,
  Download,
  Filter,
  Activity,
  BookOpen,
  Video,
  Target,
} from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Reports</h1>
          <p className="text-muted-foreground mt-2">
            Track your progress and learning analytics
          </p>
        </div>
        <button
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingInlineStart: '1rem',
            paddingInlineEnd: '1rem',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            borderRadius: 'calc(var(--radius) * 1.5)',
            border: 'none',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            fontFamily: 'var(--font-family-primary)',
            fontWeight: 'var(--font-weight-medium)',
            transition: 'opacity 0.2s',
          }}
          className="hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Learning Time</p>
              <p className="text-2xl font-bold">24.5 hrs</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lessons Completed</p>
              <p className="text-2xl font-bold">42</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
              <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Certificates Earned</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
              <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold">92%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Learning Activity Chart */}
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Learning Activity</h3>
              <p className="text-sm text-muted-foreground">Last 7 days</p>
            </div>
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                paddingInlineStart: '0.75rem',
                paddingInlineEnd: '0.75rem',
                paddingTop: '0.375rem',
                paddingBottom: '0.375rem',
                backgroundColor: 'transparent',
                color: 'hsl(var(--foreground))',
                borderRadius: 'calc(var(--radius) * 1.5)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-medium)',
                transition: 'background-color 0.2s',
              }}
              className="hover:bg-accent"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
          <div className="flex h-64 items-end justify-between gap-2">
            {[60, 80, 45, 90, 70, 85, 75].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/50 transition-all hover:opacity-80"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-muted-foreground">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Course Progress */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Course Progress</h3>
            <p className="text-sm text-muted-foreground">Your active courses</p>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Advanced React Patterns', progress: 85, color: 'bg-blue-500' },
              { name: 'TypeScript Mastery', progress: 60, color: 'bg-purple-500' },
              { name: 'Node.js Backend Development', progress: 40, color: 'bg-green-500' },
              { name: 'UI/UX Design Fundamentals', progress: 25, color: 'bg-amber-500' },
            ].map((course, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{course.name}</span>
                  <span className="text-muted-foreground">{course.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${course.color} transition-all`}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Your latest learning milestones</p>
        </div>
        <div className="space-y-4">
          {[
            {
              icon: Award,
              title: 'Certificate Earned',
              description: 'React Advanced Patterns Certification',
              time: '2 hours ago',
              color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            },
            {
              icon: Video,
              title: 'Lesson Completed',
              description: 'TypeScript Generics Deep Dive',
              time: '5 hours ago',
              color: 'bg-green-500/10 text-green-600 dark:text-green-400',
            },
            {
              icon: Target,
              title: 'Milestone Reached',
              description: 'Completed 50% of Node.js Backend Development',
              time: '1 day ago',
              color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            },
            {
              icon: Activity,
              title: 'Quiz Passed',
              description: 'UI/UX Design Principles Quiz - Score: 95%',
              time: '2 days ago',
              color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
            },
          ].map((activity, i) => {
            const Icon = activity.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-accent"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${activity.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
