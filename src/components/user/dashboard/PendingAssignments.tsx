'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, AlertCircle, Clock, CheckCircle2, Trophy, Flame } from 'lucide-react';
import type { PendingAssignment } from '@/hooks/useDashboard';
import { format, formatDistanceToNow, isPast, differenceInDays } from 'date-fns';
import { useUserLanguage } from '@/context/AppContext';

interface PendingAssignmentsProps {
  assignments: PendingAssignment[];
}

export function PendingAssignments({ assignments }: PendingAssignmentsProps) {
  const { t, direction } = useUserLanguage();
  const [activeTab, setActiveTab] = useState('all');

  // Categorize assignments
  const pendingAssignments = assignments.filter(a => a.status === 'pending' && !a.is_overdue);
  const overdueAssignments = assignments.filter(a => a.is_overdue);
  const submittedAssignments = assignments.filter(a => a.status === 'submitted');
  const gradedAssignments = assignments.filter(a => a.status === 'graded');

  const getUrgencyBadge = (dueDate: Date) => {
    const daysUntil = differenceInDays(dueDate, new Date());
    if (daysUntil <= 1) {
      return { label: t('user.dashboard.assignments.urgency.dueTomorrow', 'Due Tomorrow'), color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800', icon: Flame };
    } else if (daysUntil <= 3) {
      return { label: t('user.dashboard.assignments.urgency.dueSoon', 'Due Soon'), color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800', icon: Clock };
    }
    return null;
  };

  const renderAssignmentCard = (assignment: PendingAssignment, index: number) => {
    const dueDate = new Date(assignment.due_date);
    const isOverdue = assignment.is_overdue;
    const isSubmitted = assignment.status === 'submitted';
    const isGraded = assignment.status === 'graded';
    const urgency = !isOverdue && !isSubmitted ? getUrgencyBadge(dueDate) : null;

    return (
      <Card
        key={assignment.id}
        className={`group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 animate-fade-up ${
          isOverdue
            ? 'border-destructive/30 hover:border-destructive/50 bg-destructive/5'
            : 'hover:border-primary/20'
        }`}
        style={{
          animationDelay: `${index * 50}ms`,
        }}
      >
        <div className="flex flex-col sm:flex-row gap-4 p-6">
          {/* Left: Icon */}
          <div className="flex-shrink-0">
            <div
              className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                isOverdue
                  ? 'bg-destructive/10 border-2 border-destructive/20'
                  : isGraded
                  ? 'bg-green-50 dark:bg-green-500/10 border-2 border-green-200 dark:border-green-800'
                  : isSubmitted
                  ? 'bg-blue-50 dark:bg-blue-500/10 border-2 border-blue-200 dark:border-blue-800'
                  : 'bg-primary/10 border-2 border-primary/20'
              }`}
            >
              {isGraded ? (
                <Trophy className="h-7 w-7 text-green-600 dark:text-green-400" />
              ) : isSubmitted ? (
                <CheckCircle2 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              ) : isOverdue ? (
                <AlertCircle className="h-7 w-7 text-destructive" />
              ) : (
                <FileText className="h-7 w-7 text-primary" />
              )}
            </div>
          </div>

          {/* Middle: Assignment Details */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <div className="flex items-start gap-2 mb-2">
                <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors flex-1">
                  {assignment.title}
                </h3>
                {urgency && (
                  <Badge className={`${urgency.color} flex items-center gap-1 px-2 py-1 border`}>
                    <urgency.icon className="h-3 w-3" />
                    {urgency.label}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {assignment.course_name}
              </p>
            </div>

            {/* Assignment Info */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  isOverdue ? 'bg-destructive/10' : 'bg-blue-500/10'
                }`}>
                  <Calendar className={`h-4 w-4 ${
                    isOverdue ? 'text-destructive' : 'text-blue-600 dark:text-blue-400'
                  }`} />
                </div>
                <div>
                  <div className={`font-medium ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                    Due {format(dueDate, 'MMM d, h:mm a')}
                  </div>
                  {!isSubmitted && !isOverdue && (
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(dueDate, { addSuffix: true })}
                    </div>
                  )}
                </div>
              </div>

              <Badge
                variant={isGraded ? 'default' : isSubmitted ? 'secondary' : isOverdue ? 'destructive' : 'outline'}
                className="px-3 py-1"
              >
                {isGraded ? t('user.dashboard.assignments.status.graded', 'Graded') : isSubmitted ? t('user.dashboard.assignments.status.submitted', 'Submitted') : isOverdue ? t('user.dashboard.assignments.status.overdue', 'Overdue') : t('user.dashboard.assignments.status.pending', 'Pending')}
              </Badge>

              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Trophy className="h-4 w-4" />
                <span className="font-medium text-foreground">{assignment.max_score}</span>
                <span>{t('user.dashboard.assignments.points', 'points')}</span>
              </div>
            </div>
          </div>

          {/* Right: Action Button */}
          <div className="flex-shrink-0 flex items-center">
            <Link href={`/assignments/${assignment.id}`} className="w-full sm:w-auto">
              <Button
                className="w-full gap-2"
                size="lg"
                variant={isOverdue ? 'destructive' : isSubmitted || isGraded ? 'outline' : 'default'}
              >
                {isGraded ? t('user.dashboard.assignments.actions.viewResults', 'View Results') : isSubmitted ? t('user.dashboard.assignments.actions.viewSubmission', 'View Submission') : t('user.dashboard.assignments.actions.submitNow', 'Submit Now')}
                <span className="text-lg">→</span>
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  };

  if (assignments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t('user.dashboard.assignments.title', 'Assignments')}</h2>
          <Link href="/assignments">
            <Button variant="ghost" size="sm" className="gap-2">
              {t('user.dashboard.assignments.viewAll', 'View All')}
              <span className="text-lg">→</span>
            </Button>
          </Link>
        </div>
        <Card className="p-12 text-center border-2 border-dashed">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('user.dashboard.assignments.allCaughtUp', 'All caught up!')}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('user.dashboard.assignments.greatWork', 'Great work! No pending assignments.')}
          </p>
          <Button variant="outline" asChild>
            <Link href="/assignments">
              <FileText className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              {t('user.dashboard.assignments.viewAllAssignments', 'View All Assignments')}
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('user.dashboard.assignments.title', 'Assignments')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingAssignments.length} {t('user.dashboard.assignments.pendingCount', 'pending')} • {overdueAssignments.length} {t('user.dashboard.assignments.overdueCount', 'overdue')}
          </p>
        </div>
        <Link href="/assignments">
          <Button variant="ghost" size="sm" className="gap-2">
            {t('user.dashboard.assignments.viewAll', 'View All')}
            <span className="text-lg">→</span>
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1">
          <TabsTrigger value="all" className="flex items-center gap-2 py-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{t('user.dashboard.assignments.tabs.all', 'All')}</span>
            <Badge variant="secondary" className="ltr:ml-1 rtl:mr-1">{assignments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2 py-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">{t('user.dashboard.assignments.tabs.pending', 'Pending')}</span>
            {pendingAssignments.length > 0 && (
              <Badge variant="secondary" className="ltr:ml-1 rtl:mr-1">{pendingAssignments.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center gap-2 py-2">
            <AlertCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{t('user.dashboard.assignments.tabs.overdue', 'Overdue')}</span>
            {overdueAssignments.length > 0 && (
              <Badge variant="destructive" className="ltr:ml-1 rtl:mr-1">{overdueAssignments.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="submitted" className="flex items-center gap-2 py-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('user.dashboard.assignments.tabs.done', 'Done')}</span>
            {(submittedAssignments.length + gradedAssignments.length) > 0 && (
              <Badge variant="secondary" className="ltr:ml-1 rtl:mr-1">{submittedAssignments.length + gradedAssignments.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-4">
          {assignments.slice(0, 3).map((assignment, index) => renderAssignmentCard(assignment, index))}
        </TabsContent>

        <TabsContent value="pending" className="mt-6 space-y-4">
          {pendingAssignments.length === 0 ? (
            <Card className="p-8 text-center border-2 border-dashed">
              <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('user.dashboard.assignments.empty.noPending', 'No pending assignments')}</p>
            </Card>
          ) : (
            pendingAssignments.slice(0, 3).map((assignment, index) => renderAssignmentCard(assignment, index))
          )}
        </TabsContent>

        <TabsContent value="overdue" className="mt-6 space-y-4">
          {overdueAssignments.length === 0 ? (
            <Card className="p-8 text-center border-2 border-dashed">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
              <p className="text-sm text-muted-foreground">{t('user.dashboard.assignments.empty.noOverdue', 'No overdue assignments')}</p>
            </Card>
          ) : (
            overdueAssignments.slice(0, 3).map((assignment, index) => renderAssignmentCard(assignment, index))
          )}
        </TabsContent>

        <TabsContent value="submitted" className="mt-6 space-y-4">
          {(submittedAssignments.length + gradedAssignments.length) === 0 ? (
            <Card className="p-8 text-center border-2 border-dashed">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('user.dashboard.assignments.empty.noSubmitted', 'No submitted assignments yet')}</p>
            </Card>
          ) : (
            [...gradedAssignments, ...submittedAssignments].slice(0, 3).map((assignment, index) => renderAssignmentCard(assignment, index))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
